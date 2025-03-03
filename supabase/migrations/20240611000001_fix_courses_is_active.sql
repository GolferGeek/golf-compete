-- Fix is_active column in courses table
-- This migration ensures the is_active column exists in the courses table

-- Add is_active column to courses table if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update any existing courses to have is_active set to true
UPDATE courses SET is_active = TRUE WHERE is_active IS NULL;

-- Add comment to the column
COMMENT ON COLUMN courses.is_active IS 'Indicates if the course is active and should be shown in event creation'; 