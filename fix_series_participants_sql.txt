-- Fix the relationship between series_participants and users
-- The error occurs because PostgREST can't find a direct relationship between series_participants and users

-- Create a view that joins series_participants with profiles
CREATE OR REPLACE VIEW series_participants_with_users AS
SELECT 
  sp.id,
  sp.series_id,
  sp.user_id,
  sp.role,
  sp.status,
  sp.joined_at,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  p.username,
  p.handicap,
  p.is_admin
FROM 
  series_participants sp
JOIN 
  profiles p ON sp.user_id = p.id;

-- For views, we need to create security policies differently
-- We'll use a security definer function to control access

-- Create a security definer function that checks if the user is authenticated
CREATE OR REPLACE FUNCTION auth_series_participants_with_users()
RETURNS SETOF series_participants_with_users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM series_participants_with_users
  WHERE auth.role() = 'authenticated';
$$;

-- Create a function to get users who are not participants in a series
CREATE OR REPLACE FUNCTION get_non_series_participants(p_series_id UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM profiles p
  WHERE p.id NOT IN (
    SELECT user_id
    FROM series_participants
    WHERE series_id = p_series_id
  )
  AND auth.role() = 'authenticated';
$$;

-- Comment on the view
COMMENT ON VIEW series_participants_with_users IS 'View that joins series_participants with profiles for easier querying'; 