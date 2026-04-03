import type { InferInsertModel } from 'drizzle-orm'
import type { StravaActivity } from '../../../lib/strava.js'
import { activities } from '../../../db/schema.js'

type ActivityRow = InferInsertModel<typeof activities>

export function normalizeStravaActivity(a: StravaActivity, userId: number): ActivityRow {
  return {
    userId,
    source: 'strava',
    providerActivityId: String(a.id),
    externalId: a.external_id ?? null,
    name: a.name,
    type: a.type,
    sportType: a.sport_type,
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
    rawData: a as unknown as Record<string, unknown>,
  }
}
