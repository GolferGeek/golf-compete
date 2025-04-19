-- Create enum for invitation status
CREATE TYPE invitation_status AS ENUM (
    'invited',
    'accepted',
    'declined'
);

-- Create enum for participant status
CREATE TYPE participant_status AS ENUM (
    'checked_in', 
    'started',
    'completed',
    'withdrawn'
);

-- First remove old columns
ALTER TABLE event_participants
    DROP COLUMN IF EXISTS registration_date,
    DROP COLUMN IF EXISTS payment_status,
    DROP COLUMN IF EXISTS payment_date;

-- Then add new columns
ALTER TABLE event_participants
    ADD COLUMN IF NOT EXISTS invitation_status invitation_status NOT NULL DEFAULT 'invited',
    ADD COLUMN IF NOT EXISTS invitation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS response_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status participant_status,
    ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS position INTEGER,
    ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gross_score INTEGER,
    ADD COLUMN IF NOT EXISTS net_score INTEGER;

-- Add index for round lookups
CREATE INDEX IF NOT EXISTS idx_event_participants_round_id ON event_participants(round_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_invitation ON event_participants(event_id, invitation_status);

-- Create function to update participant scores
CREATE OR REPLACE FUNCTION update_participant_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the event_participants table with scores from the rounds table
    UPDATE event_participants
    SET 
        gross_score = r.total_score,
        -- net_score will need to be calculated separately taking into account handicap
        updated_at = NOW()
    FROM rounds r
    WHERE event_participants.round_id = r.id
    AND event_participants.round_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update participant scores when round totals change
CREATE TRIGGER update_participant_scores_trigger
AFTER UPDATE OF total_score ON rounds
FOR EACH ROW
EXECUTE FUNCTION update_participant_scores(); 