-- Add created_by column to courses table to track which profile created each course
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add a foreign key constraint to link to the profiles table
ALTER TABLE courses 
  ADD CONSTRAINT courses_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN courses.created_by IS 'Profile ID of the user who created this course'; 