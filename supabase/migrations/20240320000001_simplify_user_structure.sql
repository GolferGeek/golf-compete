-- Add role and is_active to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update foreign key references to point to auth.users instead of users table
ALTER TABLE coaches
DROP CONSTRAINT coaches_user_id_users_id_fk,
ADD CONSTRAINT coaches_user_id_auth_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE competition_participants
DROP CONSTRAINT competition_participants_user_id_users_id_fk,
ADD CONSTRAINT competition_participants_user_id_auth_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE lessons
DROP CONSTRAINT lessons_student_id_users_id_fk,
ADD CONSTRAINT lessons_student_id_auth_users_id_fk 
    FOREIGN KEY (student_id) REFERENCES auth.users(id);

ALTER TABLE practice_plans
DROP CONSTRAINT practice_plans_user_id_users_id_fk,
ADD CONSTRAINT practice_plans_user_id_auth_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE rounds
DROP CONSTRAINT rounds_user_id_users_id_fk,
ADD CONSTRAINT rounds_user_id_auth_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE bags
DROP CONSTRAINT bags_user_id_users_id_fk,
ADD CONSTRAINT bags_user_id_auth_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE clubs
DROP CONSTRAINT clubs_user_id_users_id_fk,
ADD CONSTRAINT clubs_user_id_auth_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Drop the redundant users table
DROP TABLE IF EXISTS users; 