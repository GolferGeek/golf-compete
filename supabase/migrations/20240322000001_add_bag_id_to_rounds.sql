-- Add bag_id column to rounds table
ALTER TABLE rounds 
ADD COLUMN bag_id UUID NOT NULL REFERENCES bags(id);

-- Add index for bag_id
CREATE INDEX idx_rounds_bag_id ON rounds(bag_id);

-- Update RLS policies to include bag ownership check
CREATE POLICY "Users can only use their own bags in rounds"
ON rounds FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM bags
        WHERE bags.id = bag_id
        AND bags.user_id = auth.uid()
    )
);

-- Update existing UPDATE policy to include bag ownership
DROP POLICY IF EXISTS "Users can update their own rounds" ON rounds;
CREATE POLICY "Users can update their own rounds"
ON rounds FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM bags
        WHERE bags.id = bag_id
        AND bags.user_id = auth.uid()
    )
); 