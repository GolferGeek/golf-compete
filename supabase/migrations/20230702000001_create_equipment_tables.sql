-- Create equipment tables for Golf Compete application
-- This migration creates tables for golf clubs and bags with proper relationships and RLS policies

-- Create enum for club types
CREATE TYPE club_type AS ENUM (
  'driver',
  'wood',
  'hybrid',
  'iron',
  'wedge',
  'putter'
);

-- Create clubs table
CREATE TABLE clubs (
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

-- Create bags table
CREATE TABLE bags (
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

-- Create bag_clubs junction table for many-to-many relationship
CREATE TABLE bag_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bag_id, club_id)
);

-- Enable Row Level Security
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bag_clubs ENABLE ROW LEVEL SECURITY;

-- Create policies for clubs table
CREATE POLICY "Users can view their own clubs"
  ON clubs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clubs"
  ON clubs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clubs"
  ON clubs FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for bags table
CREATE POLICY "Users can view their own bags"
  ON bags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bags"
  ON bags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bags"
  ON bags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bags"
  ON bags FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for bag_clubs junction table
CREATE POLICY "Users can view their own bag_clubs"
  ON bag_clubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bags
      WHERE bags.id = bag_clubs.bag_id
      AND bags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own bag_clubs"
  ON bag_clubs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bags
      WHERE bags.id = bag_clubs.bag_id
      AND bags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own bag_clubs"
  ON bag_clubs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bags
      WHERE bags.id = bag_clubs.bag_id
      AND bags.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_clubs_user_id ON clubs(user_id);
CREATE INDEX idx_bags_user_id ON bags(user_id);
CREATE INDEX idx_bag_clubs_bag_id ON bag_clubs(bag_id);
CREATE INDEX idx_bag_clubs_club_id ON bag_clubs(club_id);

-- Create function to ensure only one default bag per user
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

-- Create trigger to ensure only one default bag per user
CREATE TRIGGER ensure_single_default_bag_trigger
BEFORE INSERT OR UPDATE ON bags
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_bag();

-- Create function to ensure a user always has at least one default bag
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

-- Create trigger to ensure a user always has at least one default bag
CREATE TRIGGER ensure_user_has_default_bag_trigger
AFTER INSERT ON bags
FOR EACH ROW
EXECUTE FUNCTION ensure_user_has_default_bag(); 