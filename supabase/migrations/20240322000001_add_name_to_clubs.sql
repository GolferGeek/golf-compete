-- Add name column to clubs table
ALTER TABLE clubs ADD COLUMN name TEXT;

-- Update existing clubs to have a name based on brand and model
UPDATE clubs SET name = CONCAT(brand, ' ', model);

-- Make name column required after setting initial values
ALTER TABLE clubs ALTER COLUMN name SET NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN clubs.name IS 'Display name for the club'; 