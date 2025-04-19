-- Migration to create a unified user_notes table and remove round_notes
-- Version: 2024-03-19

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

-- Drop old round_notes table
DROP TABLE IF EXISTS round_notes; 