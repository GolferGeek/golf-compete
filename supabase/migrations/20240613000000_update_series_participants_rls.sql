-- Drop all existing policies
DROP POLICY IF EXISTS "Series participants can be managed by admins" ON series_participants;
DROP POLICY IF EXISTS "Series participants are viewable by all authenticated users" ON series_participants;
DROP POLICY IF EXISTS "Series participants can be inserted by admins" ON series_participants;
DROP POLICY IF EXISTS "Series participants can be updated by admins" ON series_participants;
DROP POLICY IF EXISTS "Series participants can be deleted by admins" ON series_participants;
DROP POLICY IF EXISTS "Series participants are viewable by all users" ON series_participants;
DROP POLICY IF EXISTS "series_participants_read_policy" ON series_participants;
DROP POLICY IF EXISTS "series_participants_insert_policy" ON series_participants;
DROP POLICY IF EXISTS "series_participants_update_policy" ON series_participants;
DROP POLICY IF EXISTS "series_participants_delete_policy" ON series_participants;

-- Enable RLS
ALTER TABLE series_participants ENABLE ROW LEVEL SECURITY;

-- Create new policies for series_participants
CREATE POLICY "series_participants_read_policy" ON series_participants
  FOR SELECT USING (true);

CREATE POLICY "series_participants_insert_policy" ON series_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM series s
      WHERE s.id = series_participants.series_id
      AND s.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM series_participants sp
      WHERE sp.series_id = series_participants.series_id
      AND sp.user_id = auth.uid()
      AND sp.role = 'admin'
    )
  );

CREATE POLICY "series_participants_update_policy" ON series_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM series_participants sp
      WHERE sp.series_id = series_participants.series_id
      AND sp.user_id = auth.uid()
      AND sp.role = 'admin'
    )
  );

CREATE POLICY "series_participants_delete_policy" ON series_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM series_participants sp
      WHERE sp.series_id = series_participants.series_id
      AND sp.user_id = auth.uid()
      AND sp.role = 'admin'
    )
  ); 