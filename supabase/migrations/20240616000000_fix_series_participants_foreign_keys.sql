-- Drop existing foreign key constraints if they exist
ALTER TABLE series_participants 
  DROP CONSTRAINT IF EXISTS series_participants_user_id_fkey;

-- Add the foreign key constraint with the correct name
ALTER TABLE series_participants
  ADD CONSTRAINT series_participants_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Update the query in getSeriesParticipants to use the view
DROP VIEW IF EXISTS series_participants_with_profiles;
CREATE VIEW series_participants_with_profiles AS
SELECT
  sp.id,
  sp.series_id,
  sp.user_id,
  sp.role,
  sp.status,
  sp.joined_at,
  p.first_name,
  p.last_name,
  p.username,
  p.handicap,
  s.name as series_name,
  s.description as series_description,
  s.start_date,
  s.end_date,
  s.status as series_status
FROM
  series_participants sp
JOIN
  profiles p ON sp.user_id = p.id
JOIN
  series s ON sp.series_id = s.id; 