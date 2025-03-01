-- Add phone_number column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update RLS policies if needed
-- No RLS policies need to be updated for this change

-- Add comment to the column
COMMENT ON COLUMN courses.phone_number IS 'Phone number for the golf course'; 