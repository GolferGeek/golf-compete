-- Create a view that joins event participants with user data
-- This view will be used to fetch event participants with their user information

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