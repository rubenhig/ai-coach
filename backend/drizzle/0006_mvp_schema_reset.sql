-- MVP Schema Reset: Drop old training entities, create Goals + PlannedSessions
-- See docs/domain/mvp.md for the entity model

-- 1. Drop old tables (order matters due to FK constraints)
DROP TABLE IF EXISTS "planned_sessions" CASCADE;
DROP TABLE IF EXISTS "training_plans" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;

-- 2. Clear old coach messages (old format, incompatible with new agent)
DELETE FROM "coach_messages";

-- 3. Create goals table
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"sport" text NOT NULL,
	"target_description" text NOT NULL,
	"target_date" timestamp with time zone,
	"priority" text DEFAULT 'A' NOT NULL,
	"parent_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"result_description" text,
	"result_activity_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 4. Create planned_sessions table (new schema)
CREATE TABLE "planned_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"sport" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_duration" integer,
	"status" text DEFAULT 'planned' NOT NULL,
	"linked_activity_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Foreign keys
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "goals" ADD CONSTRAINT "goals_result_activity_id_activities_id_fk" FOREIGN KEY ("result_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_linked_activity_id_activities_id_fk" FOREIGN KEY ("linked_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;

-- 6. Indexes
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");
CREATE INDEX "goals_parent_id_idx" ON "goals" USING btree ("parent_id");
CREATE INDEX "goals_status_idx" ON "goals" USING btree ("status");
CREATE INDEX "planned_sessions_goal_id_idx" ON "planned_sessions" USING btree ("goal_id");
CREATE INDEX "planned_sessions_date_idx" ON "planned_sessions" USING btree ("date");
CREATE INDEX "planned_sessions_status_idx" ON "planned_sessions" USING btree ("status");
CREATE INDEX "planned_sessions_linked_activity_idx" ON "planned_sessions" USING btree ("linked_activity_id");
