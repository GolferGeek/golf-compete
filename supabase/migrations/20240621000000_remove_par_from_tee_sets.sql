-- This migration addresses the column naming inconsistency between "distance" and "length"
-- for tee sets in the database. It ensures the "par" column is not null and adds
-- a default value for the "distance" column.

-- Make par column nullable to avoid breaking existing code
ALTER TABLE tee_sets ALTER COLUMN par SET DEFAULT 72;
ALTER TABLE tee_sets ALTER COLUMN par SET NOT NULL;

-- Set default value for distance column
ALTER TABLE tee_sets ALTER COLUMN distance SET DEFAULT 0;
ALTER TABLE tee_sets ALTER COLUMN distance SET NOT NULL;

-- Add comments to clarify the purpose of these columns
COMMENT ON TABLE tee_sets IS 'Stores information about different tee sets (colors) for golf courses';
COMMENT ON COLUMN tee_sets.par IS 'The par value for the entire course from this tee set';
COMMENT ON COLUMN tee_sets.distance IS 'The total length/distance of the course from this tee set. Note: Consider renaming to "length" in future for consistency with other tables.';

-- In a future migration, after all code is updated, we can completely remove the par column:
-- ALTER TABLE tee_sets DROP COLUMN par; 