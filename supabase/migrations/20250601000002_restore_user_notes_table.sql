-- Migration: Restore user_notes table structure for API compatibility
-- Date: 2025-06-01
-- Description: Restore user_notes table to match existing API expectations
-- Version: 1.0.0

-- Step 1: Create user_notes table with expected structure (if notes table exists, migrate data)
-- First check if notes table exists and backup its data
CREATE TABLE IF NOT EXISTS notes_migration_backup AS SELECT * FROM notes WHERE EXISTS (SELECT 1 FROM notes LIMIT 1);

-- Drop notes table if it exists (we'll restore user_notes instead)
DROP TABLE IF EXISTS notes CASCADE;

-- Create user_notes table with the structure expected by our APIs
CREATE TABLE IF NOT EXISTS user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
    hole_number INTEGER CHECK (hole_number > 0 AND hole_number <= 18),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'added' CHECK (status IN ('added', 'working_on', 'implemented')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 2: Migrate data from notes_migration_backup if it exists
INSERT INTO user_notes (id, profile_id, note_text, category, round_id, hole_number, tags, created_at, updated_at)
SELECT 
    id,
    user_id as profile_id,
    note_text,
    COALESCE(category, 'general'),
    round_id,
    hole_number,
    COALESCE(tags, '{}'),
    created_at,
    updated_at
FROM notes_migration_backup
WHERE EXISTS (SELECT 1 FROM notes_migration_backup LIMIT 1)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Try to restore data from user_notes_backup if it exists and is more recent
INSERT INTO user_notes (id, profile_id, note_text, category, round_id, hole_number, tags, metadata, status, created_at, updated_at)
SELECT 
    id,
    profile_id,
    note_text,
    category,
    round_id,
    hole_number,
    tags,
    COALESCE(metadata, '{}'),
    COALESCE(status, 'added'),
    created_at,
    updated_at
FROM user_notes_backup
WHERE EXISTS (SELECT 1 FROM user_notes_backup LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM user_notes WHERE user_notes.id = user_notes_backup.id);

-- Step 4: Enable Row Level Security
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies (if not exists)
DO $$ BEGIN
    CREATE POLICY "user_notes_select_policy"
      ON user_notes FOR SELECT
      TO authenticated
      USING (auth.uid() = profile_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "user_notes_insert_policy"
      ON user_notes FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = profile_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "user_notes_update_policy"
      ON user_notes FOR UPDATE
      TO authenticated
      USING (auth.uid() = profile_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "user_notes_delete_policy"
      ON user_notes FOR DELETE
      TO authenticated
      USING (auth.uid() = profile_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notes_profile_id ON user_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_round_id ON user_notes(round_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_category ON user_notes(category);
CREATE INDEX IF NOT EXISTS idx_user_notes_created_at ON user_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notes_status ON user_notes(status);
CREATE INDEX IF NOT EXISTS idx_user_notes_tags ON user_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_notes_metadata ON user_notes USING GIN(metadata);

-- Step 7: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_notes_updated_at ON user_notes;
CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON user_notes
FOR EACH ROW
EXECUTE FUNCTION update_user_notes_updated_at();

-- Step 8: Add comments for documentation
COMMENT ON TABLE user_notes IS 'Unified table for all user golf notes, whether tied to rounds, holes, or general notes';
COMMENT ON COLUMN user_notes.note_text IS 'The actual note content entered by the user';
COMMENT ON COLUMN user_notes.category IS 'General category for the note (e.g., technique, equipment, course-condition)';
COMMENT ON COLUMN user_notes.round_id IS 'Optional reference to a specific round, NULL for general notes';
COMMENT ON COLUMN user_notes.hole_number IS 'Optional reference to a specific hole number, NULL for general notes';
COMMENT ON COLUMN user_notes.tags IS 'Array of tags for additional categorization and searching';
COMMENT ON COLUMN user_notes.metadata IS 'JSON field for any additional structured data related to the note';
COMMENT ON COLUMN user_notes.status IS 'Status of the note: added (default), working_on, or implemented';

-- Clean up backup table
DROP TABLE IF EXISTS notes_migration_backup;

-- Migration completed successfully
-- user_notes table restored with full API compatibility 