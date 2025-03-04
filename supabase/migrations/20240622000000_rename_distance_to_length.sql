-- Migration to rename the "distance" column to "length" in the tee_sets table
-- This ensures consistency with other tables that use "length" for similar measurements

-- Rename the column
ALTER TABLE tee_sets RENAME COLUMN distance TO length;

-- Update the comment to reflect the new column name
COMMENT ON COLUMN tee_sets.length IS 'The total length of the course from this tee set in yards.';

-- Add a note about the migration in the table comment
COMMENT ON TABLE tee_sets IS 'Stores information about different tee sets (colors) for golf courses. Column "distance" was renamed to "length" for consistency.'; 