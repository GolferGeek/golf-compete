-- Drop existing policies
DROP POLICY IF EXISTS "Event participants are viewable by all authenticated users" ON event_participants;
DROP POLICY IF EXISTS "Event participants can be managed by admins" ON event_participants;

-- Enable RLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create new policies for event_participants
CREATE POLICY "event_participants_read_policy" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "event_participants_insert_policy" ON event_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_participants.event_id
      AND e.created_by = auth.uid()
    ) OR
    auth.uid() = event_participants.user_id
  );

CREATE POLICY "event_participants_update_policy" ON event_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_participants.event_id
      AND e.created_by = auth.uid()
    ) OR
    auth.uid() = event_participants.user_id
  );

CREATE POLICY "event_participants_delete_policy" ON event_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_participants.event_id
      AND e.created_by = auth.uid()
    ) OR
    auth.uid() = event_participants.user_id
  ); 