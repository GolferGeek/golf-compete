-- Rename the 'tee_set_distances' table to 'tee_set_lengths'
ALTER TABLE tee_set_distances RENAME TO tee_set_lengths;

-- Update comments on the table
COMMENT ON TABLE tee_set_lengths IS 'Lengths from each tee set to each hole';

-- Update foreign key constraints
ALTER INDEX IF EXISTS idx_tee_set_distances_tee_set_id RENAME TO idx_tee_set_lengths_tee_set_id;
ALTER INDEX IF EXISTS idx_tee_set_distances_hole_id RENAME TO idx_tee_set_lengths_hole_id;

-- Update RLS policies (drop and recreate with new table name)
DROP POLICY IF EXISTS "Enable read access for all users" ON tee_set_lengths;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tee_set_lengths;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON tee_set_lengths;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON tee_set_lengths;

CREATE POLICY "Enable read access for all users"
ON tee_set_lengths FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON tee_set_lengths FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only"
ON tee_set_lengths FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only"
ON tee_set_lengths FOR DELETE
USING (auth.role() = 'authenticated'); 