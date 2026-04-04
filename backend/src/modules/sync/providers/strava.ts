import type { InferInsertModel } from 'drizzle-orm'
import type {
  StravaActivity,
  StravaActivityDetail,
  StravaStreamSet,
  StravaZone,
} from '../../../lib/strava.js'
import { activities, activitySplits, activityLaps, activityStreams, athleteZones } from '../../../db/schema.js'

type ActivityRow    = InferInsertModel<typeof activities>
type SplitRow      = InferInsertModel<typeof activitySplits>
type LapRow        = InferInsertModel<typeof activityLaps>
type StreamRow     = InferInsertModel<typeof activityStreams>
type AthleteZoneRow = InferInsertModel<typeof athleteZones>

// --- Summary (GET /athlete/activities) ---

export function normalizeStravaActivity(a: StravaActivity, userId: number): ActivityRow {
  return {
    userId,
    source: 'strava',
    providerActivityId: String(a.id),
    externalId: a.external_id ?? null,
    name: a.name,
    type: a.type,
    sportType: a.sport_type,
    workoutType: a.workout_type ?? null,
    startDate: new Date(a.start_date),
    startDateLocal: new Date(a.start_date_local),
    timezone: a.timezone ?? null,
    utcOffset: a.utc_offset ?? null,
    distance: a.distance ?? null,
    totalElevationGain: a.total_elevation_gain ?? null,
    elevHigh: a.elev_high ?? null,
    elevLow: a.elev_low ?? null,
    movingTime: a.moving_time ?? null,
    elapsedTime: a.elapsed_time ?? null,
    averageSpeed: a.average_speed ?? null,
    maxSpeed: a.max_speed ?? null,
    averageCadence: a.average_cadence ?? null,
    averageWatts: a.average_watts ?? null,
    weightedAverageWatts: a.weighted_average_watts ?? null,
    maxWatts: a.max_watts ?? null,
    kilojoules: a.kilojoules ?? null,
    deviceWatts: a.device_watts ?? null,
    hasHeartrate: a.has_heartrate ?? false,
    averageHeartrate: a.average_heartrate ?? null,
    maxHeartrate: a.max_heartrate ?? null,
    trainer: a.trainer ?? false,
    commute: a.commute ?? false,
    manual: a.manual ?? false,
    gearId: a.gear_id ?? null,
    deviceName: a.device_name ?? null,
    summaryPolyline: a.map?.summary_polyline ?? null,
    startLat: a.start_latlng?.[0] ?? null,
    startLng: a.start_latlng?.[1] ?? null,
    endLat: a.end_latlng?.[0] ?? null,
    endLng: a.end_latlng?.[1] ?? null,
    rawData: a as unknown as Record<string, unknown>,
  }
}

// --- Detail (GET /activities/{id}) ---

export function normalizeStravaDetail(
  d: StravaActivityDetail,
  activityId: number
): {
  activityUpdate: Partial<ActivityRow>
  splits: SplitRow[]
  laps: LapRow[]
} {
  const activityUpdate: Partial<ActivityRow> = {
    description: d.description ?? null,
    calories: d.calories ?? null,
    averageTemp: d.average_temp ?? null,
    elevHigh: d.elev_high ?? null,
    elevLow: d.elev_low ?? null,
    fullPolyline: d.map?.polyline ?? null,
    endLat: d.end_latlng?.[0] ?? null,
    endLng: d.end_latlng?.[1] ?? null,
    workoutType: d.workout_type ?? null,
    detailFetchedAt: new Date(),
    rawData: d as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  }

  const splits: SplitRow[] = (d.splits_metric ?? []).map((s) => ({
    activityId,
    splitIndex: s.split,
    distance: s.distance,
    movingTime: s.moving_time,
    elapsedTime: s.elapsed_time,
    elevationDiff: s.elevation_difference,
    averageSpeed: s.average_speed,
    paceZone: s.pace_zone,
  }))

  const laps: LapRow[] = (d.laps ?? []).map((l) => ({
    activityId,
    stravaLapId: l.id,
    lapIndex: l.lap_index,
    name: l.name ?? null,
    startDate: new Date(l.start_date),
    elapsedTime: l.elapsed_time,
    movingTime: l.moving_time,
    distance: l.distance,
    totalElevationGain: l.total_elevation_gain ?? null,
    averageSpeed: l.average_speed ?? null,
    maxSpeed: l.max_speed ?? null,
    averageCadence: l.average_cadence ?? null,
    averageWatts: l.average_watts ?? null,
    deviceWatts: l.device_watts ?? null,
    startIndex: l.start_index ?? null,
    endIndex: l.end_index ?? null,
  }))

  return { activityUpdate, splits, laps }
}

// --- Streams (GET /activities/{id}/streams) ---

export function normalizeStravaStreams(
  streams: StravaStreamSet,
  activityId: number
): StreamRow {
  const get = (key: string) => streams[key]?.data ?? null

  return {
    activityId,
    time: get('time') as number[] | null,
    distance: get('distance') as number[] | null,
    latlng: get('latlng') as unknown as Record<string, unknown> | null,
    altitude: get('altitude') as number[] | null,
    grade: get('grade_smooth') as number[] | null,
    heartrate: get('heartrate') as number[] | null,
    cadence: get('cadence') as number[] | null,
    watts: get('watts') as number[] | null,
    temp: get('temp') as number[] | null,
    velocity: get('velocity_smooth') as number[] | null,
    moving: get('moving') as boolean[] | null,
    originalSize: streams['time']?.original_size ?? null,
    resolution: streams['time']?.resolution ?? null,
    fetchedAt: new Date(),
  }
}

// --- Athlete zones (GET /athlete/zones) ---

export function normalizeStravaZones(zones: StravaZone[], userId: number): AthleteZoneRow[] {
  return zones.map((z) => ({
    userId,
    type: z.type,
    zones: z.zones as unknown as Record<string, unknown>,
    sensorBased: z.sensorBased ?? null,
    fetchedAt: new Date(),
  }))
}
