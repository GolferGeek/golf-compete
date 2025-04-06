-- Drop existing policies
DROP POLICY IF EXISTS "series_participants_read_policy" ON series_participants;
DROP POLICY IF EXISTS "series_participants_insert_policy" ON series_participants;
DROP POLICY IF EXISTS "series_participants_update_policy" ON series_participants;
DROP POLICY IF EXISTS "series_participants_delete_policy" ON series_participants;

-- Enable RLS
ALTER TABLE series_participants ENABLE ROW LEVEL SECURITY;

-- Read policy: Allow reading if user is a participant or admin of the series
CREATE POLICY "series_participants_read_policy" ON series_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM series_participants sp
      WHERE sp.series_id = series_participants.series_id
      AND sp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM series s
      WHERE s.id = series_participants.series_id
      AND s.created_by = auth.uid()
    )
  );

-- Insert policy: Allow inserting if user is an admin of the series or series creator
CREATE POLICY "series_participants_insert_policy" ON series_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM series s
      WHERE s.id = series_participants.series_id
      AND s.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM series_participants admins
      WHERE admins.series_id = series_participants.series_id
      AND admins.user_id = auth.uid()
      AND admins.role = 'admin'
    )
  );

-- Update policy: Allow updating if user is an admin of the series or series creator
CREATE POLICY "series_participants_update_policy" ON series_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM series s
      WHERE s.id = series_participants.series_id
      AND s.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM series_participants admins
      WHERE admins.series_id = series_participants.series_id
      AND admins.user_id = auth.uid()
      AND admins.role = 'admin'
    )
  );

-- Delete policy: Allow deleting if user is an admin of the series or series creator
CREATE POLICY "series_participants_delete_policy" ON series_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM series s
      WHERE s.id = series_participants.series_id
      AND s.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM series_participants admins
      WHERE admins.series_id = series_participants.series_id
      AND admins.user_id = auth.uid()
      AND admins.role = 'admin'
    )
  ); 