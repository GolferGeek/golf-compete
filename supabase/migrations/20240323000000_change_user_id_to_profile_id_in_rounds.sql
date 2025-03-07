-- Change user_id to profile_id in rounds table
ALTER TABLE rounds 
  DROP CONSTRAINT IF EXISTS rounds_user_id_fkey;

ALTER TABLE rounds
  RENAME COLUMN user_id TO profile_id;

-- Add foreign key constraint to profiles table
ALTER TABLE rounds
  ADD CONSTRAINT rounds_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Update RLS policies to use profile_id instead of user_id
DROP POLICY IF EXISTS "Users can view their own rounds" ON rounds;
DROP POLICY IF EXISTS "Users can insert their own rounds" ON rounds;
DROP POLICY IF EXISTS "Users can update their own rounds" ON rounds;
DROP POLICY IF EXISTS "Users can delete their own rounds" ON rounds;

CREATE POLICY "Users can view their own rounds"
  ON rounds FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own rounds"
  ON rounds FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own rounds"
  ON rounds FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own rounds"
  ON rounds FOR DELETE
  USING (auth.uid() = profile_id); 