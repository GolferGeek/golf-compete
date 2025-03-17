-- Migration to create a unified user_notes table for all golf notes
-- Version: 2024-08-05

-- Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
  hole_number INTEGER CHECK (hole_number > 0 AND hole_number <= 18),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  
  -- Metadata for additional flexibility
  tags TEXT[] DEFAULT '{}'::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notes_profile_id ON user_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_round_id ON user_notes(round_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_category ON user_notes(category);
CREATE INDEX IF NOT EXISTS idx_user_notes_created_at ON user_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notes_tags ON user_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_notes_metadata ON user_notes USING GIN(metadata);

-- Add comments for documentation
COMMENT ON TABLE user_notes IS 'Unified table for all user golf notes, whether tied to rounds, holes, or general notes';
COMMENT ON COLUMN user_notes.note_text IS 'The actual note content entered by the user';
COMMENT ON COLUMN user_notes.category IS 'General category for the note (e.g., technique, equipment, course-condition)';
COMMENT ON COLUMN user_notes.round_id IS 'Optional reference to a specific round, NULL for general notes';
COMMENT ON COLUMN user_notes.hole_number IS 'Optional reference to a specific hole number, NULL for general notes';
COMMENT ON COLUMN user_notes.tags IS 'Array of tags for additional categorization and searching';
COMMENT ON COLUMN user_notes.metadata IS 'JSON field for any additional structured data related to the note';

-- Enable Row Level Security
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for data access
CREATE POLICY user_notes_select_policy 
  ON user_notes 
  FOR SELECT 
  USING (profile_id = auth.uid());

CREATE POLICY user_notes_insert_policy 
  ON user_notes 
  FOR INSERT 
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY user_notes_update_policy 
  ON user_notes 
  FOR UPDATE 
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY user_notes_delete_policy 
  ON user_notes 
  FOR DELETE 
  USING (profile_id = auth.uid());

-- Migrate existing notes from other tables
DO $$
DECLARE
  hole_notes_count INTEGER := 0;
  round_notes_count INTEGER := 0;
  quick_notes_count INTEGER := 0;
  migrated_hole_notes INTEGER := 0;
  migrated_round_notes INTEGER := 0;
  migrated_quick_notes INTEGER := 0;
BEGIN
  -- Check if hole_notes table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hole_notes') THEN
    -- Count existing hole notes
    SELECT COUNT(*) INTO hole_notes_count FROM hole_notes;
    
    -- Migrate hole notes to user_notes table
    INSERT INTO user_notes (profile_id, note_text, round_id, hole_number, created_at, category)
    SELECT 
      r.profile_id,
      hn.note AS note_text,
      hn.round_id,
      hn.hole_number,
      hn.created_at,
      'hole-note' AS category
    FROM hole_notes hn
    JOIN rounds r ON hn.round_id = r.id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_notes un 
      WHERE un.round_id = hn.round_id 
        AND un.hole_number = hn.hole_number
        AND un.note_text = hn.note
    );
    
    GET DIAGNOSTICS migrated_hole_notes = ROW_COUNT;
    RAISE NOTICE 'Migrated % of % hole notes', migrated_hole_notes, hole_notes_count;
  END IF;
  
  -- Check if round_notes table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'round_notes') THEN
    -- Count existing round notes
    SELECT COUNT(*) INTO round_notes_count FROM round_notes;
    
    -- Migrate round notes to user_notes table
    INSERT INTO user_notes (profile_id, note_text, round_id, created_at, category)
    SELECT 
      rn.profile_id,
      rn.note AS note_text,
      rn.round_id,
      rn.created_at,
      COALESCE(rn.category, 'round-note') AS category
    FROM round_notes rn
    WHERE NOT EXISTS (
      SELECT 1 FROM user_notes un 
      WHERE un.round_id = rn.round_id 
        AND un.note_text = rn.note
        AND un.profile_id = rn.profile_id
    );
    
    GET DIAGNOSTICS migrated_round_notes = ROW_COUNT;
    RAISE NOTICE 'Migrated % of % round notes', migrated_round_notes, round_notes_count;
  END IF;
  
  -- Migrate quick notes from profile metadata to user_notes table
  WITH quick_notes AS (
    SELECT 
      p.id AS profile_id,
      qn->>'note' AS note_text,
      qn->>'category' AS category,
      (qn->>'created_at')::TIMESTAMPTZ AS created_at
    FROM profiles p,
    jsonb_array_elements(CASE WHEN p.metadata->'quick_notes' IS NULL THEN '[]'::jsonb ELSE p.metadata->'quick_notes' END) AS qn
    WHERE qn->>'note' IS NOT NULL
  )
  SELECT COUNT(*) INTO quick_notes_count FROM quick_notes;
  
  INSERT INTO user_notes (profile_id, note_text, category, created_at)
  WITH quick_notes AS (
    SELECT 
      p.id AS profile_id,
      qn->>'note' AS note_text,
      qn->>'category' AS category,
      (qn->>'created_at')::TIMESTAMPTZ AS created_at
    FROM profiles p,
    jsonb_array_elements(CASE WHEN p.metadata->'quick_notes' IS NULL THEN '[]'::jsonb ELSE p.metadata->'quick_notes' END) AS qn
  )
  SELECT 
    profile_id,
    note_text,
    COALESCE(category, 'quick-note'),
    COALESCE(created_at, now())
  FROM quick_notes qn
  WHERE note_text IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_notes un 
    WHERE un.profile_id = qn.profile_id 
      AND un.note_text = qn.note_text
  );
  
  GET DIAGNOSTICS migrated_quick_notes = ROW_COUNT;
  RAISE NOTICE 'Migrated % of % quick notes', migrated_quick_notes, quick_notes_count;
  
  -- Clean up profile metadata quick_notes after migration
  IF migrated_quick_notes > 0 THEN
    UPDATE profiles
    SET metadata = metadata - 'quick_notes'
    WHERE metadata ? 'quick_notes';
    
    RAISE NOTICE 'Removed quick_notes from profile metadata';
  END IF;
END $$;

-- Drop old note tables now that data is migrated
DO $$
BEGIN
  -- Drop hole_notes table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hole_notes') THEN
    DROP TABLE hole_notes;
    RAISE NOTICE 'Dropped hole_notes table';
  END IF;
  
  -- Drop round_notes table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'round_notes') THEN
    DROP TABLE round_notes;
    RAISE NOTICE 'Dropped round_notes table';
  END IF;
END $$; 