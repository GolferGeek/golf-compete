-- Add bag_id to rounds table
ALTER TABLE rounds
ADD COLUMN bag_id UUID REFERENCES bags(id);

-- Update RLS policy to ensure users can only use their own bags
CREATE POLICY "Users can only use their own bags"
ON rounds
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM bags
        WHERE bags.id = rounds.bag_id
        AND bags.user_id = auth.uid()
    )
);

CREATE POLICY "Users can only update rounds with their own bags"
ON rounds
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bags
        WHERE bags.id = rounds.bag_id
        AND bags.user_id = auth.uid()
    )
); 