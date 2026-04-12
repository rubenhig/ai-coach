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
  uniqueIndex,
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

    // Proveedor
    source: text('source').notNull().default('strava'), // 'strava' | 'polar' | 'fit' | 'gpx'
    providerActivityId: text('provider_activity_id').notNull(),
    externalId: text('external_id'),

    // Info básica
    name: text('name').notNull(),
    type: text('type').notNull(),
    sportType: text('sport_type').notNull(),
    workoutType: integer('workout_type'), // 0 default, 1 race, 2 long_run, 3 workout

    // Tiempos
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    startDateLocal: timestamp('start_date_local').notNull(),
    timezone: text('timezone'),
    utcOffset: doublePrecision('utc_offset'),

    // Distancia y elevación
    distance: doublePrecision('distance'),
    totalElevationGain: doublePrecision('total_elevation_gain'),
    elevHigh: doublePrecision('elev_high'),
    elevLow: doublePrecision('elev_low'),

    // Tiempos de actividad
    movingTime: integer('moving_time'),
    elapsedTime: integer('elapsed_time'),

    // Velocidad
    averageSpeed: doublePrecision('average_speed'),
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

    // Cadencia y temperatura
    averageCadence: doublePrecision('average_cadence'),
    averageTemp: integer('average_temp'),

    // Mapa
    summaryPolyline: text('summary_polyline'),
    fullPolyline: text('full_polyline'), // alta resolución, del detail
    startLat: doublePrecision('start_lat'),
    startLng: doublePrecision('start_lng'),
    endLat: doublePrecision('end_lat'),
    endLng: doublePrecision('end_lng'),

    // Metadata
    trainer: boolean('trainer').default(false),
    commute: boolean('commute').default(false),
    manual: boolean('manual').default(false),
    gearId: text('gear_id'),
    deviceName: text('device_name'),
    description: text('description'),
    calories: doublePrecision('calories'),

    // JSON completo del proveedor
    rawData: jsonb('raw_data').notNull(),

    // Estado de enriquecimiento
    detailFetchedAt: timestamp('detail_fetched_at'),   // null = pendiente
    streamsFetchedAt: timestamp('streams_fetched_at'), // null = pendiente

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('activities_provider_unique_idx').on(t.source, t.providerActivityId),
    index('activities_user_id_idx').on(t.userId),
    index('activities_start_date_idx').on(t.startDate),
    index('activities_type_idx').on(t.type),
    index('activities_detail_fetched_idx').on(t.detailFetchedAt),
    index('activities_streams_fetched_idx').on(t.streamsFetchedAt),
  ]
)

// Datos punto a punto (streams) — 1 row por actividad
export const activityStreams = pgTable('activity_streams', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .notNull()
    .unique()
    .references(() => activities.id, { onDelete: 'cascade' }),

  // Índices temporales (siempre presentes)
  time: integer('time').array(),
  distance: doublePrecision('distance').array(),

  // GPS (null si la actividad no tiene GPS)
  latlng: jsonb('latlng'),             // [[lat, lng], ...]
  altitude: doublePrecision('altitude').array(),
  grade: doublePrecision('grade').array(),

  // Sensores (null si no hay sensor)
  heartrate: integer('heartrate').array(),
  cadence: integer('cadence').array(),
  watts: integer('watts').array(),
  temp: integer('temp').array(),

  // Calculados (siempre presentes)
  velocity: doublePrecision('velocity').array(),
  moving: boolean('moving').array(),

  originalSize: integer('original_size'),
  resolution: text('resolution'),
  fetchedAt: timestamp('fetched_at').notNull(),
})

// Splits por km/milla — del detail
export const activitySplits = pgTable(
  'activity_splits',
  {
    id: serial('id').primaryKey(),
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),

    splitIndex: integer('split_index').notNull(),
    distance: doublePrecision('distance'),
    movingTime: integer('moving_time'),
    elapsedTime: integer('elapsed_time'),
    elevationDiff: doublePrecision('elevation_diff'),
    averageSpeed: doublePrecision('average_speed'),
    paceZone: integer('pace_zone'),
  },
  (t) => [
    index('splits_activity_id_idx').on(t.activityId),
  ]
)

// Laps (intervalos definidos por el atleta) — del detail
export const activityLaps = pgTable(
  'activity_laps',
  {
    id: serial('id').primaryKey(),
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    stravaLapId: bigint('strava_lap_id', { mode: 'number' }),

    lapIndex: integer('lap_index').notNull(),
    name: text('name'),
    startDate: timestamp('start_date', { withTimezone: true }),
    elapsedTime: integer('elapsed_time'),
    movingTime: integer('moving_time'),
    distance: doublePrecision('distance'),
    totalElevationGain: doublePrecision('total_elevation_gain'),
    averageSpeed: doublePrecision('average_speed'),
    maxSpeed: doublePrecision('max_speed'),
    averageCadence: doublePrecision('average_cadence'),
    averageWatts: doublePrecision('average_watts'),
    deviceWatts: boolean('device_watts'),
    startIndex: integer('start_index'), // puntero a activity_streams arrays
    endIndex: integer('end_index'),
  },
  (t) => [
    index('laps_activity_id_idx').on(t.activityId),
  ]
)

// Zonas del atleta (FC y potencia)
export const athleteZones = pgTable(
  'athlete_zones',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    type: text('type').notNull(), // 'heartrate' | 'power'
    zones: jsonb('zones').notNull(), // [{min: number, max: number}, ...]
    sensorBased: boolean('sensor_based'),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [
    uniqueIndex('athlete_zones_user_type_idx').on(t.userId, t.type),
  ]
)

// ─── Dominio de entrenamiento (MVP) ───
// Ver docs/domain/mvp.md

export const goals = pgTable(
  'goals',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sport: text('sport').notNull(), // Taxonomía Strava: "Run", "Ride", "Swim", ...
    targetDescription: text('target_description').notNull(),
    targetDate: timestamp('target_date', { withTimezone: true }),
    priority: text('priority').notNull().default('A'), // "A" | "B" | "C"
    parentId: integer('parent_id'),
    status: text('status').notNull().default('active'), // "active" | "completed" | "cancelled"
    resultDescription: text('result_description'),
    resultActivityId: integer('result_activity_id')
      .references(() => activities.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('goals_user_id_idx').on(t.userId),
    index('goals_parent_id_idx').on(t.parentId),
    index('goals_status_idx').on(t.status),
  ]
)

export const plannedSessions = pgTable(
  'planned_sessions',
  {
    id: serial('id').primaryKey(),
    goalId: integer('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    sport: text('sport').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    targetDuration: integer('target_duration'), // minutos
    status: text('status').notNull().default('planned'), // "planned" | "completed" | "skipped"
    linkedActivityId: integer('linked_activity_id')
      .references(() => activities.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('planned_sessions_goal_id_idx').on(t.goalId),
    index('planned_sessions_date_idx').on(t.date),
    index('planned_sessions_status_idx').on(t.status),
    index('planned_sessions_linked_activity_idx').on(t.linkedActivityId),
  ]
)

// Historial de conversación con el coach
export const coachMessages = pgTable(
  'coach_messages',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(), // AgentMessage (role, content, timestamp, ...)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('coach_messages_user_id_idx').on(t.userId),
  ]
)

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  athleteZones: many(athleteZones),
  goals: many(goals),
  coachMessages: many(coachMessages),
}))

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  parent: one(goals, { fields: [goals.parentId], references: [goals.id], relationName: 'subGoals' }),
  subGoals: many(goals, { relationName: 'subGoals' }),
  plannedSessions: many(plannedSessions),
  resultActivity: one(activities, { fields: [goals.resultActivityId], references: [activities.id] }),
}))

export const coachMessagesRelations = relations(coachMessages, ({ one }) => ({
  user: one(users, { fields: [coachMessages.userId], references: [users.id] }),
}))

export const plannedSessionsRelations = relations(plannedSessions, ({ one }) => ({
  goal: one(goals, { fields: [plannedSessions.goalId], references: [goals.id] }),
  linkedActivity: one(activities, { fields: [plannedSessions.linkedActivityId], references: [activities.id] }),
}))

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  streams: one(activityStreams, { fields: [activities.id], references: [activityStreams.activityId] }),
  splits: many(activitySplits),
  laps: many(activityLaps),
}))

export const activityStreamsRelations = relations(activityStreams, ({ one }) => ({
  activity: one(activities, { fields: [activityStreams.activityId], references: [activities.id] }),
}))

export const activitySplitsRelations = relations(activitySplits, ({ one }) => ({
  activity: one(activities, { fields: [activitySplits.activityId], references: [activities.id] }),
}))

export const activityLapsRelations = relations(activityLaps, ({ one }) => ({
  activity: one(activities, { fields: [activityLaps.activityId], references: [activities.id] }),
}))

export const athleteZonesRelations = relations(athleteZones, ({ one }) => ({
  user: one(users, { fields: [athleteZones.userId], references: [users.id] }),
}))
