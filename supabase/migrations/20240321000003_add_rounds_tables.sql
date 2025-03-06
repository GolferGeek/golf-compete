-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS hole_scores CASCADE;
DROP TABLE IF EXISTS rounds CASCADE;
DROP TYPE IF EXISTS weather_condition CASCADE;
DROP TYPE IF EXISTS course_condition CASCADE;

-- Create enum for weather conditions
CREATE TYPE weather_condition AS ENUM ('sunny', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'windy');

-- Create enum for course conditions
CREATE TYPE course_condition AS ENUM ('dry', 'wet', 'cart_path_only', 'frost_delay');

-- Create rounds table
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Optional link to an event
    course_id UUID NOT NULL REFERENCES courses(id),
    tee_set_id UUID NOT NULL REFERENCES tee_sets(id),
    date_played TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    weather_conditions weather_condition[],  -- Array of conditions that may have occurred during round
    course_conditions course_condition[],    -- Array of conditions that may have occurred during round
    temperature_start INTEGER,               -- Temperature in Fahrenheit at start
    temperature_end INTEGER,                 -- Temperature in Fahrenheit at end
    wind_speed_start INTEGER,               -- Wind speed in MPH at start
    wind_speed_end INTEGER,                 -- Wind speed in MPH at end
    wind_direction_start VARCHAR(3),        -- Wind direction at start (e.g., 'NW', 'SE')
    wind_direction_end VARCHAR(3),          -- Wind direction at end
    total_score INTEGER,                    -- Calculated from hole_scores
    total_putts INTEGER,                    -- Calculated from hole_scores
    fairways_hit INTEGER,                   -- Calculated from hole_scores
    greens_in_regulation INTEGER,           -- Calculated from hole_scores
    notes TEXT,                             -- General notes about the round
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_temperatures CHECK (
        (temperature_start BETWEEN -20 AND 120) AND 
        (temperature_end BETWEEN -20 AND 120)
    ),
    CONSTRAINT valid_wind_speeds CHECK (
        (wind_speed_start BETWEEN 0 AND 100) AND 
        (wind_speed_end BETWEEN 0 AND 100)
    ),
    CONSTRAINT valid_wind_directions CHECK (
        wind_direction_start ~ '^[NSEW]{1,3}$' AND 
        wind_direction_end ~ '^[NSEW]{1,3}$'
    )
);

-- Create hole scores table
CREATE TABLE hole_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    strokes INTEGER NOT NULL CHECK (strokes BETWEEN 1 AND 20),
    putts INTEGER CHECK (putts BETWEEN 0 AND 10),
    fairway_hit BOOLEAN,                    -- NULL for par 3s
    green_in_regulation BOOLEAN NOT NULL,
    penalty_strokes INTEGER DEFAULT 0 CHECK (penalty_strokes BETWEEN 0 AND 5),
    notes TEXT,                             -- Notes specific to this hole
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(round_id, hole_number)           -- Ensure no duplicate holes per round
);

-- Create function to update round totals
CREATE OR REPLACE FUNCTION update_round_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the rounds table with calculated totals
    UPDATE rounds
    SET 
        total_score = (
            SELECT SUM(strokes)
            FROM hole_scores
            WHERE round_id = NEW.round_id
        ),
        total_putts = (
            SELECT SUM(putts)
            FROM hole_scores
            WHERE round_id = NEW.round_id
        ),
        fairways_hit = (
            SELECT COUNT(*)
            FROM hole_scores
            WHERE round_id = NEW.round_id AND fairway_hit = true
        ),
        greens_in_regulation = (
            SELECT COUNT(*)
            FROM hole_scores
            WHERE round_id = NEW.round_id AND green_in_regulation = true
        ),
        updated_at = NOW()
    WHERE id = NEW.round_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update round totals when hole scores change
CREATE TRIGGER update_round_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON hole_scores
FOR EACH ROW
EXECUTE FUNCTION update_round_totals();

-- Add indexes for common queries
CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_rounds_event_id ON rounds(event_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_date_played ON rounds(date_played);
CREATE INDEX idx_hole_scores_round_id ON hole_scores(round_id);

-- Add RLS policies
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_scores ENABLE ROW LEVEL SECURITY;

-- Rounds policies
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

-- Hole scores policies
CREATE POLICY "Users can view scores for their rounds"
ON hole_scores FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = hole_scores.round_id
        AND rounds.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert scores for their rounds"
ON hole_scores FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = hole_scores.round_id
        AND rounds.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update scores for their rounds"
ON hole_scores FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = hole_scores.round_id
        AND rounds.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete scores for their rounds"
ON hole_scores FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = hole_scores.round_id
        AND rounds.user_id = auth.uid()
    )
); 