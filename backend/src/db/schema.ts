import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  doublePrecision,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  stravaAthleteId: integer('strava_athlete_id').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  profilePicture: text('profile_picture'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const activities = pgTable(
  'activities',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Identificadores Strava
    stravaId: bigint('strava_id', { mode: 'number' }).notNull().unique(),
    externalId: text('external_id'),
    uploadId: bigint('upload_id', { mode: 'number' }),

    // Info básica
    name: text('name').notNull(),
    type: text('type').notNull(),       // "Run", "Ride", etc.
    sportType: text('sport_type').notNull(), // "TrailRun", "MountainBikeRide", etc.
    workoutType: integer('workout_type'),

    // Tiempos
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    startDateLocal: timestamp('start_date_local').notNull(),
    timezone: text('timezone'),
    utcOffset: doublePrecision('utc_offset'),

    // Distancia y elevación
    distance: doublePrecision('distance'),           // metros
    totalElevationGain: doublePrecision('total_elevation_gain'), // metros
    elevHigh: doublePrecision('elev_high'),
    elevLow: doublePrecision('elev_low'),

    // Tiempos de actividad
    movingTime: integer('moving_time'),   // segundos
    elapsedTime: integer('elapsed_time'), // segundos

    // Velocidad
    averageSpeed: doublePrecision('average_speed'), // m/s
    maxSpeed: doublePrecision('max_speed'),

    // Potencia (ciclismo)
    averageWatts: doublePrecision('average_watts'),
    weightedAverageWatts: integer('weighted_average_watts'),
    maxWatts: integer('max_watts'),
    kilojoules: doublePrecision('kilojoules'),
    deviceWatts: boolean('device_watts'),

    // Cardio
    hasHeartrate: boolean('has_heartrate').default(false),
    averageHeartrate: doublePrecision('average_heartrate'),
    maxHeartrate: doublePrecision('max_heartrate'),

    // Cadencia
    averageCadence: doublePrecision('average_cadence'),

    // Mapa
    summaryPolyline: text('summary_polyline'),
    startLat: doublePrecision('start_lat'),
    startLng: doublePrecision('start_lng'),

    // Metadata
    trainer: boolean('trainer').default(false),
    commute: boolean('commute').default(false),
    manual: boolean('manual').default(false),
    gearId: text('gear_id'),
    deviceName: text('device_name'),
    sufferScore: integer('suffer_score'),
    prCount: integer('pr_count').default(0),
    calories: doublePrecision('calories'),

    // JSON completo de Strava (para no perder nada)
    rawData: jsonb('raw_data').notNull(),

    // Flag: ¿ya tenemos el DetailedActivity de este registro?
    detailFetched: boolean('detail_fetched').default(false).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('activities_user_id_idx').on(t.userId),
    index('activities_start_date_idx').on(t.startDate),
    index('activities_type_idx').on(t.type),
  ]
)

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}))
