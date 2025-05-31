-- Migration: Restore Original Bags System
-- Date: 2025-06-01
-- Description: Revert bag_setups back to original bags system while keeping other simplifications
-- Version: 1.0.2 - Restore bags, handle existing tables

-- Step 1: Drop the bag_setups table we created
DROP TABLE IF EXISTS bag_setups CASCADE;

-- Step 2: Check and create missing equipment tables

-- Create enum for club types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE club_type AS ENUM (
      'driver',
      'wood', 
      'hybrid',
      'iron',
      'wedge',
      'putter'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create clubs table if it doesn't exist
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  type club_type NOT NULL,
  loft DECIMAL(4,1),
  shaft_flex TEXT,
  shaft_length DECIMAL(4,1),
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bags table if it doesn't exist (original structure)
CREATE TABLE IF NOT EXISTS bags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bag_clubs junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS bag_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bag_id, club_id)
);

-- Step 3: Update rounds table to reference bags instead of bag_setups
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS fk_rounds_bag_setup;
ALTER TABLE rounds DROP COLUMN IF EXISTS bag_setup_id;

-- Add bag_id column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE rounds ADD COLUMN bag_id UUID REFERENCES bags(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 4: Enable Row Level Security (only if not already enabled)
DO $$ BEGIN
    ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE bags ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE bag_clubs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Step 5: Create RLS policies for clubs table (if not exists)
DO $$ BEGIN
    CREATE POLICY "Users can view their own clubs"
      ON clubs FOR SELECT
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own clubs"
      ON clubs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own clubs"
      ON clubs FOR UPDATE
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own clubs"
      ON clubs FOR DELETE
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 6: Create RLS policies for bags table (if not exists)
DO $$ BEGIN
    CREATE POLICY "Users can view their own bags"
      ON bags FOR SELECT
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own bags"
      ON bags FOR INSERT
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own bags"
      ON bags FOR UPDATE
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own bags"
      ON bags FOR DELETE
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 7: Create RLS policies for bag_clubs junction table (if not exists)
DO $$ BEGIN
    CREATE POLICY "Users can view their own bag_clubs"
      ON bag_clubs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM bags
          WHERE bags.id = bag_clubs.bag_id
          AND bags.user_id = auth.uid()
        )
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own bag_clubs"
      ON bag_clubs FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM bags
          WHERE bags.id = bag_clubs.bag_id
          AND bags.user_id = auth.uid()
        )
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own bag_clubs"
      ON bag_clubs FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM bags
          WHERE bags.id = bag_clubs.bag_id
          AND bags.user_id = auth.uid()
        )
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 8: Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_clubs_user_id ON clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_type ON clubs(type);
CREATE INDEX IF NOT EXISTS idx_bags_user_id ON bags(user_id);
CREATE INDEX IF NOT EXISTS idx_bags_is_default ON bags(is_default);
CREATE INDEX IF NOT EXISTS idx_bag_clubs_bag_id ON bag_clubs(bag_id);
CREATE INDEX IF NOT EXISTS idx_bag_clubs_club_id ON bag_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_rounds_bag_id ON rounds(bag_id);

-- Step 9: Create functions and triggers (replace if exists)
CREATE OR REPLACE FUNCTION ensure_single_default_bag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE bags
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS ensure_single_default_bag_trigger ON bags;
CREATE TRIGGER ensure_single_default_bag_trigger
BEFORE INSERT OR UPDATE ON bags
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_bag();

CREATE OR REPLACE FUNCTION ensure_user_has_default_bag()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user has no default bag, make the first bag the default
  IF NOT EXISTS (
    SELECT 1 FROM bags
    WHERE user_id = NEW.user_id
    AND is_default = true
  ) THEN
    UPDATE bags
    SET is_default = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS ensure_user_has_default_bag_trigger ON bags;
CREATE TRIGGER ensure_user_has_default_bag_trigger
AFTER INSERT ON bags
FOR EACH ROW
EXECUTE FUNCTION ensure_user_has_default_bag();

-- Step 10: Create updated_at triggers for equipment tables
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON clubs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bags_updated_at ON bags;
CREATE TRIGGER update_bags_updated_at
BEFORE UPDATE ON bags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Restore data from backup if it exists
-- Try to restore bags data from bags_backup if the backup contains compatible data
INSERT INTO bags (id, user_id, name, description, is_default, created_at, updated_at)
SELECT 
    id, 
    user_id, 
    name, 
    COALESCE(description, ''),
    COALESCE(is_default, false),
    created_at, 
    updated_at
FROM bags_backup 
WHERE EXISTS (SELECT 1 FROM bags_backup LIMIT 1)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Add comments for documentation
COMMENT ON TABLE clubs IS 'Golf clubs owned by users';
COMMENT ON TABLE bags IS 'Golf bags containing collections of clubs';
COMMENT ON TABLE bag_clubs IS 'Junction table linking bags to clubs';
COMMENT ON COLUMN rounds.bag_id IS 'Reference to bag used for this round';

-- Migration completed successfully
-- Original bags system restored with:
-- - clubs table for individual club management
-- - bags table for bag management  
-- - bag_clubs junction table for club-bag relationships
-- - rounds.bag_id for round-bag relationship
-- - All original RLS policies and triggers 