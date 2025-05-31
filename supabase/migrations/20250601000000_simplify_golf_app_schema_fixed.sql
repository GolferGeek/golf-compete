-- Migration: Simplify Golf App Schema (FIXED VERSION)
-- Date: 2025-06-01
-- Description: Remove complex hole-by-hole scoring, simplify rounds, enhance notes system
-- Version: 1.0.1 - Fixed table creation order

-- Step 1: Create backup tables for data preservation
CREATE TABLE IF NOT EXISTS rounds_backup AS SELECT * FROM rounds;
CREATE TABLE IF NOT EXISTS bags_backup AS SELECT * FROM bags;
CREATE TABLE IF NOT EXISTS user_notes_backup AS SELECT * FROM user_notes;

-- Step 2: Drop complex scoring tables (no data to preserve)
DROP TABLE IF EXISTS round_holes CASCADE;
DROP TABLE IF EXISTS hole_scores CASCADE; 
DROP TABLE IF EXISTS tee_set_distances CASCADE;
DROP TABLE IF EXISTS holes CASCADE;

-- Step 3: Drop old rounds table 
DROP TABLE IF EXISTS rounds CASCADE;

-- Step 4: Create new bag_setups table FIRST (before rounds table that references it)
-- First drop existing bags table dependencies
DROP TABLE IF EXISTS bag_clubs CASCADE;
DROP TABLE IF EXISTS bags CASCADE;

CREATE TABLE bag_setups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setup_name TEXT NOT NULL,
    description TEXT,
    current_handicap DECIMAL(4,1),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 5: Now create simplified rounds table (with proper bag_setups reference)
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id),
    course_tee_id UUID NOT NULL REFERENCES tee_sets(id),
    bag_setup_id UUID REFERENCES bag_setups(id),
    round_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_score INTEGER,
    weather_conditions TEXT,
    course_conditions TEXT,
    temperature INTEGER,
    wind_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 6: Create enhanced notes table (rename and enhance user_notes)
DROP TABLE IF EXISTS user_notes CASCADE;

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_title TEXT,
    note_text TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    hole_number INTEGER CHECK (hole_number > 0 AND hole_number <= 18),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 7: Create indexes for performance
CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_course_tee_id ON rounds(course_tee_id);
CREATE INDEX idx_rounds_bag_setup_id ON rounds(bag_setup_id);
CREATE INDEX idx_rounds_round_date ON rounds(round_date);

CREATE INDEX idx_bag_setups_user_id ON bag_setups(user_id);
CREATE INDEX idx_bag_setups_is_default ON bag_setups(is_default);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_round_id ON notes(round_id);
CREATE INDEX idx_notes_course_id ON notes(course_id);
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

-- Step 8: Enable Row Level Security
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bag_setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for rounds table
CREATE POLICY "Users can view their own rounds"
ON rounds FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rounds"
ON rounds FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rounds"
ON rounds FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rounds"
ON rounds FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for bag_setups table
CREATE POLICY "Users can view their own bag setups"
ON bag_setups FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bag setups"
ON bag_setups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bag setups"
ON bag_setups FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bag setups"
ON bag_setups FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 11: Create RLS policies for notes table
CREATE POLICY "Users can view their own notes"
ON notes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
ON notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON notes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON notes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 12: Create function to ensure only one default bag setup per user
CREATE OR REPLACE FUNCTION ensure_single_default_bag_setup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE bag_setups
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single default bag setup
CREATE TRIGGER ensure_single_default_bag_setup_trigger
BEFORE INSERT OR UPDATE ON bag_setups
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_bag_setup();

-- Step 13: Create function to ensure user always has at least one default bag setup
CREATE OR REPLACE FUNCTION ensure_user_has_default_bag_setup()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bag_setups
    WHERE user_id = NEW.user_id
    AND is_default = true
  ) THEN
    UPDATE bag_setups
    SET is_default = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure user has default bag setup
CREATE TRIGGER ensure_user_has_default_bag_setup_trigger
AFTER INSERT ON bag_setups
FOR EACH ROW
EXECUTE FUNCTION ensure_user_has_default_bag_setup();

-- Step 14: Create function to update round updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_rounds_updated_at
BEFORE UPDATE ON rounds
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bag_setups_updated_at
BEFORE UPDATE ON bag_setups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 15: Add comments for documentation
COMMENT ON TABLE rounds IS 'Simplified golf rounds with total score only';
COMMENT ON COLUMN rounds.total_score IS 'Final total score for the round';
COMMENT ON COLUMN rounds.bag_setup_id IS 'Reference to bag setup used for this round';

COMMENT ON TABLE bag_setups IS 'Different golf bag configurations with separate handicaps';
COMMENT ON COLUMN bag_setups.setup_name IS 'Name of the bag setup (e.g., "Full Bag", "Travel Set")';
COMMENT ON COLUMN bag_setups.current_handicap IS 'Current handicap index for this bag setup';

COMMENT ON TABLE notes IS 'Universal notes system for golf-related observations';
COMMENT ON COLUMN notes.note_title IS 'Optional title for the note';
COMMENT ON COLUMN notes.round_id IS 'Optional link to specific round';
COMMENT ON COLUMN notes.course_id IS 'Optional link to specific course';
COMMENT ON COLUMN notes.hole_number IS 'Optional hole context (1-18)';

-- Migration completed successfully
-- Backup tables preserved for data recovery if needed:
-- - rounds_backup
-- - bags_backup  
-- - user_notes_backup 