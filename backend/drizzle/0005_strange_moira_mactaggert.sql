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
--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "sport" text NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "target_description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "target_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "priority" text DEFAULT 'A' NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "result_description" text;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "result_activity_id" integer;--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_linked_activity_id_activities_id_fk" FOREIGN KEY ("linked_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planned_sessions_goal_id_idx" ON "planned_sessions" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "planned_sessions_date_idx" ON "planned_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "planned_sessions_status_idx" ON "planned_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "planned_sessions_linked_activity_idx" ON "planned_sessions" USING btree ("linked_activity_id");--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_result_activity_id_activities_id_fk" FOREIGN KEY ("result_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_parent_id_idx" ON "goals" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "goals_status_idx" ON "goals" USING btree ("status");--> statement-breakpoint
ALTER TABLE "goals" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "goals" DROP COLUMN "event_date";--> statement-breakpoint
ALTER TABLE "goals" DROP COLUMN "target_time";--> statement-breakpoint
ALTER TABLE "goals" DROP COLUMN "plan";