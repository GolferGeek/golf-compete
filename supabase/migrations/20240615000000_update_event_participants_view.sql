-- Drop existing view and policies
DROP VIEW IF EXISTS event_participants_with_users;
DROP POLICY IF EXISTS "Event participants are viewable by all authenticated users" ON event_participants;
DROP POLICY IF EXISTS "Event participants can be managed by admins" ON event_participants;
DROP POLICY IF EXISTS "event_participants_read_policy" ON event_participants;
DROP POLICY IF EXISTS "event_participants_insert_policy" ON event_participants;
DROP POLICY IF EXISTS "event_participants_update_policy" ON event_participants;
DROP POLICY IF EXISTS "event_participants_delete_policy" ON event_participants;

-- Drop existing functions
DROP FUNCTION IF EXISTS auth_event_participants_with_users();
DROP FUNCTION IF EXISTS get_non_event_participants(UUID);

-- Create the view with additional event information
CREATE VIEW event_participants_with_users AS
SELECT
  ep.id,
  ep.user_id,
  ep.event_id,
  ep.status,
  ep.registration_date,
  ep.tee_time,
  ep.starting_hole,
  ep.group_number,
  ep.handicap_index,
  p.first_name,
  p.last_name,
  p.username,
  p.handicap,
  e.name as event_name,
  e.description as event_description,
  e.event_date,
  e.event_format,
  e.status as event_status,
  e.course_id
FROM
  event_participants ep
JOIN
  profiles p ON ep.user_id = p.id
JOIN
  events e ON ep.event_id = e.id;

-- Add a comment to the view
COMMENT ON VIEW event_participants_with_users IS 'View that joins event participants with user profile and event data';

-- Create a security definer function that checks if the user is authenticated
CREATE OR REPLACE FUNCTION auth_event_participants_with_users()
RETURNS SETOF event_participants_with_users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM event_participants_with_users
  WHERE auth.role() = 'authenticated';
$$;

-- Enable RLS on event_participants table
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_participants
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

-- Create a function to get users who are not participants in an event
CREATE FUNCTION get_non_event_participants(p_event_id UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM profiles p
  WHERE p.id NOT IN (
    SELECT user_id
    FROM event_participants
    WHERE event_id = p_event_id
  )
  AND auth.role() = 'authenticated';
$$; 