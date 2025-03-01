-- Create competition tables for Golf Compete application
-- This migration creates tables for competitions, participants, courses, and scores

-- Create enum for competition status
CREATE TYPE competition_status AS ENUM (
  'draft',
  'open',
  'in_progress',
  'completed',
  'cancelled'
);

-- Create enum for competition types
CREATE TYPE competition_type AS ENUM (
  'stroke_play',
  'match_play',
  'stableford',
  'scramble',
  'best_ball'
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  par INTEGER NOT NULL,
  holes INTEGER NOT NULL DEFAULT 18,
  rating DECIMAL(4,1),
  slope INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course_holes table
CREATE TABLE course_holes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  handicap INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, hole_number)
);

-- Create competitions table
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  max_participants INTEGER,
  status competition_status NOT NULL DEFAULT 'draft',
  type competition_type NOT NULL DEFAULT 'stroke_play',
  is_handicap_enabled BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handicap DECIMAL(4,1),
  bag_id UUID REFERENCES bags(id),
  status TEXT NOT NULL DEFAULT 'registered',
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

-- Create scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  hole_number INTEGER NOT NULL,
  strokes INTEGER NOT NULL,
  putts INTEGER,
  fairway_hit BOOLEAN,
  green_in_regulation BOOLEAN,
  penalties INTEGER DEFAULT 0,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participant_id, competition_id, round_number, hole_number)
);

-- Create competition_invitations table
CREATE TABLE competition_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(competition_id, email)
);

-- Enable Row Level Security
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for competitions table
CREATE POLICY "Users can view public competitions"
  ON competitions FOR SELECT
  USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Users can insert their own competitions"
  ON competitions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own competitions"
  ON competitions FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own competitions"
  ON competitions FOR DELETE
  USING (auth.uid() = creator_id);

-- Create policies for participants table
CREATE POLICY "Users can view participants of competitions they can see"
  ON participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = participants.competition_id
      AND (competitions.is_public = true OR competitions.creator_id = auth.uid())
    )
    OR participants.user_id = auth.uid()
  );

CREATE POLICY "Users can insert themselves as participants"
  ON participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = participants.competition_id
      AND (competitions.is_public = true OR competitions.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own participation"
  ON participants FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = participants.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own participation"
  ON participants FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = participants.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

-- Create policies for scores table
CREATE POLICY "Users can view scores of competitions they can see"
  ON scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = scores.competition_id
      AND (competitions.is_public = true OR competitions.creator_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = scores.participant_id
      AND participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scores for themselves or as competition creator"
  ON scores FOR INSERT
  WITH CHECK (
    auth.uid() = recorded_by
    AND (
      EXISTS (
        SELECT 1 FROM participants
        WHERE participants.id = scores.participant_id
        AND participants.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = scores.competition_id
        AND competitions.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update scores they recorded or as competition creator"
  ON scores FOR UPDATE
  USING (
    auth.uid() = recorded_by
    OR EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = scores.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scores they recorded or as competition creator"
  ON scores FOR DELETE
  USING (
    auth.uid() = recorded_by
    OR EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = scores.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

-- Create policies for competition_invitations table
CREATE POLICY "Competition creators can view invitations"
  ON competition_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_invitations.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

CREATE POLICY "Competition creators can insert invitations"
  ON competition_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_invitations.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

CREATE POLICY "Competition creators can update invitations"
  ON competition_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_invitations.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

CREATE POLICY "Competition creators can delete invitations"
  ON competition_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_invitations.competition_id
      AND competitions.creator_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_competitions_creator_id ON competitions(creator_id);
CREATE INDEX idx_competitions_course_id ON competitions(course_id);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_participants_competition_id ON participants(competition_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_scores_participant_id ON scores(participant_id);
CREATE INDEX idx_scores_competition_id ON scores(competition_id);
CREATE INDEX idx_course_holes_course_id ON course_holes(course_id);
CREATE INDEX idx_competition_invitations_competition_id ON competition_invitations(competition_id);

-- Create function to update competition status based on dates
CREATE OR REPLACE FUNCTION update_competition_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update status if it's not draft or cancelled
  IF NEW.status NOT IN ('draft', 'cancelled') THEN
    -- If current date is before start date, set to open
    IF CURRENT_DATE < NEW.start_date THEN
      NEW.status := 'open';
    -- If current date is between start and end date, set to in_progress
    ELSIF CURRENT_DATE BETWEEN NEW.start_date AND NEW.end_date THEN
      NEW.status := 'in_progress';
    -- If current date is after end date, set to completed
    ELSIF CURRENT_DATE > NEW.end_date THEN
      NEW.status := 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update competition status based on dates
CREATE TRIGGER update_competition_status_trigger
BEFORE INSERT OR UPDATE ON competitions
FOR EACH ROW
EXECUTE FUNCTION update_competition_status(); 