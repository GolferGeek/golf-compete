-- Add multiple_clubs_sets flag to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS multiple_clubs_sets BOOLEAN DEFAULT FALSE;

-- Update the column comment
COMMENT ON COLUMN profiles.multiple_clubs_sets IS 'Flag indicating if the user carries multiple sets of clubs'; 