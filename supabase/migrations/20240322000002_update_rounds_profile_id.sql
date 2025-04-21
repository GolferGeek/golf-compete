-- Update RLS policies for rounds to use profile_id
DROP POLICY IF EXISTS "Users can view their own rounds" ON rounds;
DROP POLICY IF EXISTS "Users can insert their own rounds" ON rounds;
DROP POLICY IF EXISTS "Users can update their own rounds" ON rounds;
DROP POLICY IF EXISTS "Users can delete their own rounds" ON rounds;

CREATE POLICY "Users can view their own rounds"
ON rounds FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = rounds.profile_id
        AND auth.uid() = profiles.id
    )
);

CREATE POLICY "Users can insert their own rounds"
ON rounds FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = rounds.profile_id
        AND auth.uid() = profiles.id
    )
);

CREATE POLICY "Users can update their own rounds"
ON rounds FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = rounds.profile_id
        AND auth.uid() = profiles.id
    )
);

CREATE POLICY "Users can delete their own rounds"
ON rounds FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = rounds.profile_id
        AND auth.uid() = profiles.id
    )
); 