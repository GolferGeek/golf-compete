-- Add country column to courses table
-- This ensures we have a country field for all courses for international support

-- Add the column if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA';

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN courses.country IS 'Country where the golf course is located'; 