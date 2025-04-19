-- Drop functions first
DROP FUNCTION IF EXISTS auth_event_participants_with_users();

-- Drop views with CASCADE to handle dependencies
DROP VIEW IF EXISTS event_participants_with_users CASCADE;

-- Drop tables (in correct order due to dependencies)
DROP TABLE IF EXISTS event_results CASCADE;
DROP TABLE IF EXISTS event_rounds CASCADE;
DROP TABLE IF EXISTS event_invitations CASCADE;

-- Drop any related types
DROP TYPE IF EXISTS event_invitation_status CASCADE;
DROP TYPE IF EXISTS event_result_status CASCADE; 