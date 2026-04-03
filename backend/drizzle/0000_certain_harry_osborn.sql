CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"strava_athlete_id" integer NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"firstname" text,
	"lastname" text,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_strava_athlete_id_unique" UNIQUE("strava_athlete_id")
);
