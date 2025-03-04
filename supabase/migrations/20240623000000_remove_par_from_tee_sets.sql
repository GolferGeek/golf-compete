-- Migration to remove the "par" column from the tee_sets table
-- Par is a property of the course or individual holes, not tee sets

-- First make sure we have a course-level par field to store this information
ALTER TABLE courses ADD COLUMN IF NOT EXISTS par INTEGER DEFAULT 72 NOT NULL;

-- Comment on the course par field
COMMENT ON COLUMN courses.par IS 'The standard par value for the entire course';

-- Now remove the par column from tee_sets
ALTER TABLE tee_sets DROP COLUMN par;

-- Update the table comment to reflect the change
COMMENT ON TABLE tee_sets IS 'Stores information about different tee sets (colors) for golf courses. The par column was removed as par is a property of the course or individual holes, not tee sets.'; 