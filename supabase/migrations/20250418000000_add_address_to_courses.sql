-- Add address column to courses table
-- This adds missing address field that was referenced in the TypeScript interface but missing in the database

-- Add the column if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS address TEXT;

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN courses.address IS 'Street address of the golf course'; 