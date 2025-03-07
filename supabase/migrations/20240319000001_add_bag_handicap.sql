-- Add handicap column to bags table
ALTER TABLE bags
ADD COLUMN handicap DECIMAL(3,1);

-- Add comment to explain the column
COMMENT ON COLUMN bags.handicap IS 'The current handicap for this bag of clubs'; 