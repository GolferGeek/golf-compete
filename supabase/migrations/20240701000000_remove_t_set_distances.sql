-- Migration to remove tee_set_lengths table and T set distances
-- This migration removes the tee_set_lengths table which is no longer needed
-- It also adds a notes field to the holes table for additional information

-- First, delete any tee sets with name containing 'T set' or 'T-set'
DELETE FROM tee_sets 
WHERE name ILIKE '%T set%' OR name ILIKE '%T-set%';

-- Drop any policies on the tee_set_lengths table
DROP POLICY IF EXISTS "Enable read access for all users" ON tee_set_lengths;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tee_set_lengths;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON tee_set_lengths;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON tee_set_lengths;

-- Drop the table
DROP TABLE IF EXISTS tee_set_lengths;

-- Add a notes field to the holes table
ALTER TABLE holes ADD COLUMN IF NOT EXISTS notes TEXT;
COMMENT ON COLUMN holes.notes IS 'Additional notes or information about the hole';

-- Update the holes table to remove any references to tee_set_lengths
COMMENT ON TABLE holes IS 'Holes for golf courses. Note: tee_set_lengths table was removed in migration 20240701000000.';

-- Add a comment to document this change
COMMENT ON TABLE tee_sets IS 'Stores information about different tee sets (colors) for golf courses. T set distances have been removed as they are no longer needed.'; 