-- Añadir columnas nuevas
ALTER TABLE "activities" ADD COLUMN "source" text NOT NULL DEFAULT 'strava';
ALTER TABLE "activities" ADD COLUMN "provider_activity_id" text;
--> statement-breakpoint

-- Migrar datos: copiar strava_id a provider_activity_id
UPDATE "activities" SET "provider_activity_id" = "strava_id"::text;
--> statement-breakpoint

-- Hacer provider_activity_id NOT NULL ahora que tiene datos
ALTER TABLE "activities" ALTER COLUMN "provider_activity_id" SET NOT NULL;
--> statement-breakpoint

-- Eliminar unique constraint viejo de strava_id
ALTER TABLE "activities" DROP CONSTRAINT "activities_strava_id_unique";
--> statement-breakpoint

-- Añadir unique compuesto (source, provider_activity_id)
CREATE UNIQUE INDEX "activities_provider_unique_idx" ON "activities" ("source", "provider_activity_id");
--> statement-breakpoint

-- Eliminar columnas Strava-específicas (los datos siguen en raw_data)
ALTER TABLE "activities" DROP COLUMN "strava_id";
ALTER TABLE "activities" DROP COLUMN "upload_id";
ALTER TABLE "activities" DROP COLUMN "suffer_score";
ALTER TABLE "activities" DROP COLUMN "pr_count";
ALTER TABLE "activities" DROP COLUMN "workout_type";
