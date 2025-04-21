-- Create round_holes table
CREATE TABLE round_holes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    score INTEGER CHECK (score >= 1),
    putts INTEGER CHECK (putts >= 0),
    fairway_hit BOOLEAN,
    green_in_regulation BOOLEAN,
    penalties INTEGER CHECK (penalties >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(round_id, hole_number)
);

-- Enable RLS
ALTER TABLE round_holes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view scores for their rounds"
ON round_holes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        JOIN profiles ON profiles.id = rounds.profile_id
        WHERE rounds.id = round_holes.round_id
        AND auth.uid() = profiles.id
    )
);

CREATE POLICY "Users can insert scores for their rounds"
ON round_holes FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rounds
        JOIN profiles ON profiles.id = rounds.profile_id
        WHERE rounds.id = round_holes.round_id
        AND auth.uid() = profiles.id
    )
);

CREATE POLICY "Users can update scores for their rounds"
ON round_holes FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        JOIN profiles ON profiles.id = rounds.profile_id
        WHERE rounds.id = round_holes.round_id
        AND auth.uid() = profiles.id
    )
);

CREATE POLICY "Users can delete scores for their rounds"
ON round_holes FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        JOIN profiles ON profiles.id = rounds.profile_id
        WHERE rounds.id = round_holes.round_id
        AND auth.uid() = profiles.id
    )
);

-- Create trigger for updated_at
CREATE TRIGGER set_round_holes_updated_at
    BEFORE UPDATE ON round_holes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 