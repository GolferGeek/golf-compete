-- Combined migration SQL for Supabase
-- This file contains all the SQL statements from the three migration files

-- From 0000_bitter_bloodstrike.sql
CREATE TABLE IF NOT EXISTS "coaches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "credentials" text NOT NULL,
        "specialties" text NOT NULL,
        "experience" integer NOT NULL,
        "hourly_rate" real NOT NULL,
        "availability" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "competition_participants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "competition_id" uuid NOT NULL,
        "user_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "competitions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "description" text NOT NULL,
        "status" text NOT NULL,
        "format" text NOT NULL,
        "prizes" text
);

CREATE TABLE IF NOT EXISTS "courses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "location" text NOT NULL,
        "holes" integer NOT NULL,
        "par" integer NOT NULL,
        "rating" real NOT NULL,
        "slope" integer NOT NULL,
        "amenities" text,
        "website" text,
        "phone_number" text
);

CREATE TABLE IF NOT EXISTS "drills" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "category" text NOT NULL,
        "difficulty" text NOT NULL,
        "duration" integer NOT NULL,
        "equipment" text,
        "instructions" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "hole_scores" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "round_id" uuid NOT NULL,
        "hole_number" integer NOT NULL,
        "par" integer NOT NULL,
        "score" integer NOT NULL,
        "fairway_hit" boolean,
        "green_in_regulation" boolean,
        "putts" integer,
        "penalty_strokes" integer
);

CREATE TABLE IF NOT EXISTS "lessons" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "coach_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "date" timestamp NOT NULL,
        "duration" integer NOT NULL,
        "focus" text NOT NULL,
        "notes" text,
        "follow_up_actions" text
);

CREATE TABLE IF NOT EXISTS "practice_plan_drills" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "practice_plan_id" uuid NOT NULL,
        "drill_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "practice_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "user_id" uuid NOT NULL,
        "focus_areas" text NOT NULL,
        "duration" integer NOT NULL,
        "frequency" text NOT NULL,
        "notes" text
);

CREATE TABLE IF NOT EXISTS "rounds" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "date" timestamp NOT NULL,
        "course_id" uuid NOT NULL,
        "tee_set_id" uuid NOT NULL,
        "total_score" integer NOT NULL,
        "user_id" uuid NOT NULL,
        "competition_id" uuid,
        "notes" text
);

CREATE TABLE IF NOT EXISTS "tee_sets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "course_id" uuid NOT NULL,
        "name" text NOT NULL,
        "color" text NOT NULL,
        "rating" real NOT NULL,
        "slope" integer NOT NULL,
        "par" integer NOT NULL,
        "distance" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "handicap" real,
        "profile_image" text,
        "member_since" timestamp DEFAULT now() NOT NULL,
        "password" text NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Add foreign key constraints
ALTER TABLE IF EXISTS "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "competition_participants" ADD CONSTRAINT "competition_participants_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "competition_participants" ADD CONSTRAINT "competition_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "hole_scores" ADD CONSTRAINT "hole_scores_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "lessons" ADD CONSTRAINT "lessons_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "lessons" ADD CONSTRAINT "lessons_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "practice_plan_drills" ADD CONSTRAINT "practice_plan_drills_practice_plan_id_practice_plans_id_fk" FOREIGN KEY ("practice_plan_id") REFERENCES "practice_plans"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "practice_plan_drills" ADD CONSTRAINT "practice_plan_drills_drill_id_drills_id_fk" FOREIGN KEY ("drill_id") REFERENCES "drills"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "practice_plans" ADD CONSTRAINT "practice_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "rounds" ADD CONSTRAINT "rounds_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "rounds" ADD CONSTRAINT "rounds_tee_set_id_tee_sets_id_fk" FOREIGN KEY ("tee_set_id") REFERENCES "tee_sets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "rounds" ADD CONSTRAINT "rounds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "rounds" ADD CONSTRAINT "rounds_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "tee_sets" ADD CONSTRAINT "tee_sets_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE no action ON UPDATE no action;

-- From 0001_optimal_nebula.sql
CREATE TABLE IF NOT EXISTS "bag_clubs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "bag_id" uuid NOT NULL,
        "club_id" uuid NOT NULL,
        "in_bag_position" integer
);

CREATE TABLE IF NOT EXISTS "bags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "is_default" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "clubs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "brand" text NOT NULL,
        "model" text NOT NULL,
        "type" text NOT NULL,
        "loft" real,
        "shaft" text,
        "flex" text,
        "notes" text
);

ALTER TABLE IF EXISTS "bag_clubs" ADD CONSTRAINT "bag_clubs_bag_id_bags_id_fk" FOREIGN KEY ("bag_id") REFERENCES "bags"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "bag_clubs" ADD CONSTRAINT "bag_clubs_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE IF EXISTS "bags" ADD CONSTRAINT "bags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- From 0002_naive_angel.sql
ALTER TABLE IF EXISTS "clubs" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
ALTER TABLE IF EXISTS "clubs" ADD CONSTRAINT "clubs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action; 