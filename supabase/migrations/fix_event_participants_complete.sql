-- This script creates a view that joins event participants with user profile data
-- and adds a stored procedure for getting non-event participants
-- Run this in the Supabase SQL Editor to fix the issue with loading event participants

-- First, let's check if the view already exists and drop it if it does
DROP VIEW IF EXISTS event_participants_with_users;

-- Create the view
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
  p.handicap
FROM
  event_participants ep
JOIN
  profiles p ON ep.user_id = p.id;

-- Add a comment to the view
COMMENT ON VIEW event_participants_with_users IS 'View that joins event participants with user profile data';

-- Create a function to get non-event participants
CREATE OR REPLACE FUNCTION get_non_event_participants(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  handicap NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.username,
    p.handicap
  FROM
    profiles p
  WHERE
    p.id NOT IN (
      SELECT user_id FROM event_participants WHERE event_id = p_event_id
    );
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the function
COMMENT ON FUNCTION get_non_event_participants(UUID) IS 'Function to get users who are not participants in a specific event';

-- Verify the view was created successfully
SELECT * FROM event_participants_with_users LIMIT 5; 