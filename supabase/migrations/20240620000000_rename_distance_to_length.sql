-- Rename the 'distance' column to 'length' in the tee_set_distances table
ALTER TABLE tee_set_distances RENAME COLUMN distance TO length;

-- Update the comment on the column to reflect the new name
COMMENT ON COLUMN tee_set_distances.length IS 'Length in yards from the tee to the hole'; 