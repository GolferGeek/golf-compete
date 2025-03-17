-- Migration to ensure the profile table has support for quick notes
-- Version: 2024-08-05

-- First, make sure the metadata column exists (if not already created)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE profiles ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add a comment to document the structure
COMMENT ON COLUMN profiles.metadata IS 
'JSONB field for storing profile metadata, including:
- quick_notes: Array of user notes not tied to specific rounds
  [
    {
      "id": "1628374590123",         -- Timestamp-based ID
      "note": "The note content",     -- Actual note text
      "category": "general",          -- Note category (optional)
      "created_at": "2023-08-05..."   -- ISO date string
    },
    ...
  ]
';

-- Create an index on the metadata->quick_notes field for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_quick_notes ON profiles USING GIN ((metadata->'quick_notes'));

-- Add example of creating and retrieving quick notes (commented out, for documentation)
/*
-- Add a quick note to a profile:
UPDATE profiles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{quick_notes}',
  COALESCE(metadata->'quick_notes', '[]'::jsonb) || 
  jsonb_build_array(
    jsonb_build_object(
      'id', to_char(extract(epoch from now()) * 1000, 'FM999999999999'),
      'note', 'Example quick note',
      'category', 'general',
      'created_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  )
)
WHERE id = 'user_id_here';

-- Get all quick notes for a profile:
SELECT metadata->'quick_notes' AS quick_notes FROM profiles WHERE id = 'user_id_here';
*/ 