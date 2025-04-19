-- Drop competition-related tables in correct dependency order
DROP TABLE IF EXISTS competition_invitations CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS competition_participants CASCADE;
DROP TABLE IF EXISTS competitions CASCADE; 