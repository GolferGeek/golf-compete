-- Drop both existing foreign key constraints if they exist
ALTER TABLE tee_sets
DROP CONSTRAINT IF EXISTS tee_sets_course_id_courses_id_fk;

ALTER TABLE tee_sets
DROP CONSTRAINT IF EXISTS tee_sets_course_id_fkey;

-- Re-create the first foreign key constraint with ON DELETE CASCADE
ALTER TABLE tee_sets
ADD CONSTRAINT tee_sets_course_id_courses_id_fk
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE;

-- Re-create the second foreign key constraint with ON DELETE CASCADE
ALTER TABLE tee_sets
ADD CONSTRAINT tee_sets_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE;

-- Add comments to explain the changes
COMMENT ON CONSTRAINT tee_sets_course_id_courses_id_fk ON tee_sets IS 'Foreign key to courses table with cascading delete';
COMMENT ON CONSTRAINT tee_sets_course_id_fkey ON tee_sets IS 'Foreign key to courses table with cascading delete'; 