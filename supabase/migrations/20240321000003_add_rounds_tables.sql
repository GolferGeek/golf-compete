-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS round_holes CASCADE;
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
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    course_id UUID NOT NULL REFERENCES courses(id),
    tee_set_id UUID NOT NULL REFERENCES tee_sets(id),
    date_played TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    weather_conditions weather_condition[],
    course_conditions course_condition[],
    temperature_start INTEGER,
    temperature_end INTEGER,
    wind_speed_start INTEGER,
    wind_speed_end INTEGER,
    wind_direction_start VARCHAR(3),
    wind_direction_end VARCHAR(3),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create round_holes table
CREATE TABLE round_holes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id UUID NOT NULL REFERENCES holes(id),
    score INTEGER NOT NULL,
    putts INTEGER NOT NULL,
    fairway_hit BOOLEAN,  -- null for par 3s
    green_in_regulation BOOLEAN NOT NULL,
    penalty_strokes INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(round_id, hole_id)
);

-- Add indexes
CREATE INDEX idx_round_holes_round_id ON round_holes(round_id);
CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_rounds_event_id ON rounds(event_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);

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