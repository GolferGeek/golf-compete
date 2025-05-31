-- Migration: Add handicap column to bags table
-- Date: 2025-06-01
-- Description: Add handicap column to support handicap tracking per bag/club setup
-- Version: 1.0.0

-- Add handicap column to bags table
ALTER TABLE bags ADD COLUMN IF NOT EXISTS handicap DECIMAL(4,1) CHECK (handicap >= 0 AND handicap <= 54);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bags_handicap ON bags(handicap);

-- Add comment for documentation
COMMENT ON COLUMN bags.handicap IS 'Handicap associated with this specific bag/club setup';

-- Migration completed successfully 