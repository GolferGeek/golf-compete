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

-- Add index for performance
CREATE INDEX idx_round_holes_round_id ON round_holes(round_id);

-- Enable RLS
ALTER TABLE round_holes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view scores for their rounds"
ON round_holes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = round_holes.round_id
        AND rounds.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert scores for their rounds"
ON round_holes FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = round_holes.round_id
        AND rounds.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update scores for their rounds"
ON round_holes FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = round_holes.round_id
        AND rounds.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete scores for their rounds"
ON round_holes FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rounds
        WHERE rounds.id = round_holes.round_id
        AND rounds.user_id = auth.uid()
    )
); 