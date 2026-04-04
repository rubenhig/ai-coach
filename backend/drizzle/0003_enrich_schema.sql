-- Columnas nuevas en activities
ALTER TABLE "activities" ADD COLUMN "workout_type" integer;
ALTER TABLE "activities" ADD COLUMN "average_temp" integer;
ALTER TABLE "activities" ADD COLUMN "full_polyline" text;
ALTER TABLE "activities" ADD COLUMN "end_lat" double precision;
ALTER TABLE "activities" ADD COLUMN "end_lng" double precision;
ALTER TABLE "activities" ADD COLUMN "description" text;
ALTER TABLE "activities" ADD COLUMN "detail_fetched_at" timestamp;
ALTER TABLE "activities" ADD COLUMN "streams_fetched_at" timestamp;
--> statement-breakpoint

-- Migrar detail_fetched bool → detail_fetched_at timestamp
UPDATE "activities" SET "detail_fetched_at" = now() WHERE "detail_fetched" = true;
--> statement-breakpoint

ALTER TABLE "activities" DROP COLUMN "detail_fetched";
--> statement-breakpoint

-- Índices para las colas de enriquecimiento
CREATE INDEX "activities_detail_fetched_idx" ON "activities" ("detail_fetched_at");
CREATE INDEX "activities_streams_fetched_idx" ON "activities" ("streams_fetched_at");
--> statement-breakpoint

-- Tabla: activity_streams
CREATE TABLE "activity_streams" (
  "id" serial PRIMARY KEY NOT NULL,
  "activity_id" integer NOT NULL UNIQUE,
  "time" integer[],
  "distance" double precision[],
  "latlng" jsonb,
  "altitude" double precision[],
  "grade" double precision[],
  "heartrate" integer[],
  "cadence" integer[],
  "watts" integer[],
  "temp" integer[],
  "velocity" double precision[],
  "moving" boolean[],
  "original_size" integer,
  "resolution" text,
  "fetched_at" timestamp NOT NULL,
  CONSTRAINT "activity_streams_activity_id_fk"
    FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);
--> statement-breakpoint

-- Tabla: activity_splits
CREATE TABLE "activity_splits" (
  "id" serial PRIMARY KEY NOT NULL,
  "activity_id" integer NOT NULL,
  "split_index" integer NOT NULL,
  "distance" double precision,
  "moving_time" integer,
  "elapsed_time" integer,
  "elevation_diff" double precision,
  "average_speed" double precision,
  "pace_zone" integer,
  CONSTRAINT "activity_splits_activity_id_fk"
    FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);
CREATE INDEX "splits_activity_id_idx" ON "activity_splits" ("activity_id");
--> statement-breakpoint

-- Tabla: activity_laps
CREATE TABLE "activity_laps" (
  "id" serial PRIMARY KEY NOT NULL,
  "activity_id" integer NOT NULL,
  "strava_lap_id" bigint,
  "lap_index" integer NOT NULL,
  "name" text,
  "start_date" timestamp with time zone,
  "elapsed_time" integer,
  "moving_time" integer,
  "distance" double precision,
  "total_elevation_gain" double precision,
  "average_speed" double precision,
  "max_speed" double precision,
  "average_cadence" double precision,
  "average_watts" double precision,
  "device_watts" boolean,
  "start_index" integer,
  "end_index" integer,
  CONSTRAINT "activity_laps_activity_id_fk"
    FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);
CREATE INDEX "laps_activity_id_idx" ON "activity_laps" ("activity_id");
--> statement-breakpoint

-- Tabla: athlete_zones
CREATE TABLE "athlete_zones" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "type" text NOT NULL,
  "zones" jsonb NOT NULL,
  "sensor_based" boolean,
  "fetched_at" timestamp NOT NULL,
  CONSTRAINT "athlete_zones_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "athlete_zones_user_type_idx" ON "athlete_zones" ("user_id", "type");
