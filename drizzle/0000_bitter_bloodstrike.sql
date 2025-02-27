CREATE TABLE "coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credentials" text NOT NULL,
	"specialties" text NOT NULL,
	"experience" integer NOT NULL,
	"hourly_rate" real NOT NULL,
	"availability" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
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
--> statement-breakpoint
CREATE TABLE "courses" (
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
--> statement-breakpoint
CREATE TABLE "drills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"duration" integer NOT NULL,
	"equipment" text,
	"instructions" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hole_scores" (
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
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"focus" text NOT NULL,
	"notes" text,
	"follow_up_actions" text
);
--> statement-breakpoint
CREATE TABLE "practice_plan_drills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_plan_id" uuid NOT NULL,
	"drill_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"focus_areas" text NOT NULL,
	"duration" integer NOT NULL,
	"frequency" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"course_id" uuid NOT NULL,
	"tee_set_id" uuid NOT NULL,
	"total_score" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"competition_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "tee_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"rating" real NOT NULL,
	"slope" integer NOT NULL,
	"par" integer NOT NULL,
	"distance" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"handicap" real,
	"profile_image" text,
	"member_since" timestamp DEFAULT now() NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_plan_drills" ADD CONSTRAINT "practice_plan_drills_practice_plan_id_practice_plans_id_fk" FOREIGN KEY ("practice_plan_id") REFERENCES "public"."practice_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_plan_drills" ADD CONSTRAINT "practice_plan_drills_drill_id_drills_id_fk" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_plans" ADD CONSTRAINT "practice_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_tee_set_id_tee_sets_id_fk" FOREIGN KEY ("tee_set_id") REFERENCES "public"."tee_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tee_sets" ADD CONSTRAINT "tee_sets_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;