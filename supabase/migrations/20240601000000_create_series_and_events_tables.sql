-- Migration file for Series and Events Management
-- To be executed in Supabase SQL Editor or via migrations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Series Table
CREATE TABLE series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  series_type VARCHAR(50) NOT NULL, -- e.g., 'season_long', 'match_play', 'tournament'
  scoring_system JSONB, -- Flexible JSON structure for different scoring rules
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_status CHECK (status IN ('upcoming', 'active', 'completed'))
);

-- 2. Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  registration_close_date DATE,
  course_id UUID REFERENCES courses(id) NOT NULL,
  event_format VARCHAR(50) NOT NULL, -- 'stroke_play', 'match_play', 'stableford', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'in_progress', 'completed', 'cancelled'
  max_participants INTEGER,
  scoring_type VARCHAR(50) NOT NULL DEFAULT 'gross', -- 'gross', 'net', 'both'
  is_standalone BOOLEAN DEFAULT TRUE, -- Whether this event belongs to a series or is standalone
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT valid_event_status CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_scoring_type CHECK (scoring_type IN ('gross', 'net', 'both'))
);

-- 3. Series Participants Table
CREATE TABLE series_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'participant', -- 'participant', 'admin'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'withdrawn', 'invited'
  
  -- Constraints
  CONSTRAINT unique_series_participant UNIQUE (series_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('participant', 'admin')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'withdrawn', 'invited'))
);

-- 4. Series Events Junction Table
CREATE TABLE series_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  event_order INTEGER NOT NULL,
  points_multiplier DECIMAL(3,1) DEFAULT 1.0,
  
  -- Constraints
  CONSTRAINT unique_series_event UNIQUE (series_id, event_id),
  CONSTRAINT valid_points_multiplier CHECK (points_multiplier > 0)
);

-- 5. Event Participants Table
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'registered', -- 'registered', 'confirmed', 'withdrawn', 'no_show'
  tee_time TIMESTAMP WITH TIME ZONE,
  starting_hole INTEGER,
  group_number INTEGER,
  handicap_index DECIMAL(4,1),
  
  -- Constraints
  CONSTRAINT unique_event_participant UNIQUE (event_id, user_id),
  CONSTRAINT valid_participant_status CHECK (status IN ('registered', 'confirmed', 'withdrawn', 'no_show'))
);

-- 6. Event Results Table
CREATE TABLE event_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gross_score INTEGER,
  net_score INTEGER,
  points INTEGER,
  position INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'verified', 'disqualified'
  scorecard JSONB, -- Detailed hole-by-hole scores
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_event_result UNIQUE (event_id, user_id),
  CONSTRAINT valid_result_status CHECK (status IN ('pending', 'submitted', 'verified', 'disqualified'))
);

-- 7. Series Points Table
CREATE TABLE series_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_series_event_user UNIQUE (series_id, event_id, user_id)
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_series_updated_at
BEFORE UPDATE ON series
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_results_updated_at
BEFORE UPDATE ON event_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_points_updated_at
BEFORE UPDATE ON series_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update series status based on dates
CREATE OR REPLACE FUNCTION update_series_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set status based on dates
  IF NEW.start_date > CURRENT_DATE THEN
    NEW.status = 'upcoming';
  ELSIF NEW.end_date < CURRENT_DATE THEN
    NEW.status = 'completed';
  ELSE
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to series table for status updates
CREATE TRIGGER update_series_status_trigger
BEFORE INSERT OR UPDATE OF start_date, end_date ON series
FOR EACH ROW
EXECUTE FUNCTION update_series_status();

-- Function to automatically update event status based on date
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set status based on date
  IF NEW.event_date > CURRENT_DATE THEN
    NEW.status = 'upcoming';
  ELSIF NEW.event_date = CURRENT_DATE THEN
    NEW.status = 'in_progress';
  ELSIF NEW.event_date < CURRENT_DATE THEN
    NEW.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to events table for status updates
CREATE TRIGGER update_event_status_trigger
BEFORE INSERT OR UPDATE OF event_date ON events
FOR EACH ROW
EXECUTE FUNCTION update_event_status();

-- Enable Row Level Security on all tables
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Series
CREATE POLICY "Series are viewable by all authenticated users"
  ON series FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Series can be created by admins"
  ON series FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

CREATE POLICY "Series can be updated by admins"
  ON series FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

CREATE POLICY "Series can be deleted by admins"
  ON series FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- RLS Policies for Events
CREATE POLICY "Events are viewable by all authenticated users"
  ON events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Events can be created by admins"
  ON events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

CREATE POLICY "Events can be updated by admins"
  ON events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

CREATE POLICY "Events can be deleted by admins"
  ON events FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- RLS Policies for Series Participants
CREATE POLICY "Series participants are viewable by all authenticated users"
  ON series_participants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Series participants can be managed by admins"
  ON series_participants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- RLS Policies for Series Events
CREATE POLICY "Series events are viewable by all authenticated users"
  ON series_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Series events can be managed by admins"
  ON series_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- RLS Policies for Event Participants
CREATE POLICY "Event participants are viewable by all authenticated users"
  ON event_participants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Event participants can be managed by admins"
  ON event_participants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- RLS Policies for Event Results
CREATE POLICY "Event results are viewable by all authenticated users"
  ON event_results FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Event results can be managed by admins"
  ON event_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- RLS Policies for Series Points
CREATE POLICY "Series points are viewable by all authenticated users"
  ON series_points FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Series points can be managed by admins"
  ON series_points FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

-- Create indexes for performance
CREATE INDEX idx_series_status ON series(status);
CREATE INDEX idx_series_created_by ON series(created_by);

CREATE INDEX idx_events_course_id ON events(course_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);

CREATE INDEX idx_series_participants_series_id ON series_participants(series_id);
CREATE INDEX idx_series_participants_user_id ON series_participants(user_id);

CREATE INDEX idx_series_events_series_id ON series_events(series_id);
CREATE INDEX idx_series_events_event_id ON series_events(event_id);

CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);

CREATE INDEX idx_event_results_event_id ON event_results(event_id);
CREATE INDEX idx_event_results_user_id ON event_results(user_id);

CREATE INDEX idx_series_points_series_id ON series_points(series_id);
CREATE INDEX idx_series_points_user_id ON series_points(user_id);
CREATE INDEX idx_series_points_event_id ON series_points(event_id); 