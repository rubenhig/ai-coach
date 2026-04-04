import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { env } from './env.js'
import logger from './logger.js'

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_API_URL = 'https://www.strava.com/api/v3'
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000 // refresca si quedan menos de 5 min

// --- Token management ---

export async function getValidToken(userId: number): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { accessToken: true, refreshToken: true, tokenExpiresAt: true },
  })

  if (!user) throw new Error(`User ${userId} not found`)

  const expiresAt = user.tokenExpiresAt.getTime()
  if (expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return user.accessToken
  }

  logger.info({ userId }, 'strava token expired, refreshing')

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava token refresh failed: ${res.status} ${body}`)
  }

  const data = await res.json() as {
    access_token: string
    refresh_token: string
    expires_at: number
  }

  await db
    .update(users)
    .set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(data.expires_at * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info({ userId }, 'strava token refreshed')
  return data.access_token
}

// --- Activity fetching ---

// Respuesta de GET /athlete/activities
export type StravaActivity = {
  id: number
  name: string
  type: string
  sport_type: string
  workout_type?: number | null
  external_id?: string | null
  start_date: string
  start_date_local: string
  timezone?: string | null
  utc_offset?: number | null
  distance?: number | null
  total_elevation_gain?: number | null
  elev_high?: number | null
  elev_low?: number | null
  moving_time?: number | null
  elapsed_time?: number | null
  average_speed?: number | null
  max_speed?: number | null
  average_cadence?: number | null
  average_watts?: number | null
  weighted_average_watts?: number | null
  max_watts?: number | null
  kilojoules?: number | null
  device_watts?: boolean | null
  has_heartrate?: boolean | null
  average_heartrate?: number | null
  max_heartrate?: number | null
  trainer?: boolean | null
  commute?: boolean | null
  manual?: boolean | null
  gear_id?: string | null
  device_name?: string | null
  map?: { summary_polyline?: string | null; polyline?: string | null } | null
  start_latlng?: [number, number] | null
  end_latlng?: [number, number] | null
  // Solo en rawData
  upload_id?: number | null
  suffer_score?: number | null
  pr_count?: number | null
}

// Campos adicionales que añade GET /activities/{id}
export type StravaActivityDetail = StravaActivity & {
  description?: string | null
  calories?: number | null
  average_temp?: number | null
  splits_metric?: StravaSplit[]
  laps?: StravaLap[]
}

export type StravaSplit = {
  split: number
  distance: number
  moving_time: number
  elapsed_time: number
  elevation_difference: number
  average_speed: number
  pace_zone: number
}

export type StravaLap = {
  id: number
  name?: string | null
  lap_index: number
  elapsed_time: number
  moving_time: number
  start_date: string
  distance: number
  total_elevation_gain?: number | null
  average_speed?: number | null
  max_speed?: number | null
  average_cadence?: number | null
  average_watts?: number | null
  device_watts?: boolean | null
  start_index?: number | null
  end_index?: number | null
}

// Respuesta de GET /activities/{id}/streams
export type StravaStreamSet = {
  [key: string]: {
    type: string
    data: unknown[]
    series_type: string
    original_size: number
    resolution: string
  }
}

// Respuesta de GET /athlete/zones
export type StravaZone = {
  type: string
  distribution_buckets: { min: number; max: number; time: number }[]
  sensor_based: boolean
}

export async function fetchActivitiesPage(
  token: string,
  opts: { page: number; after?: number }
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: '200',
    page: String(opts.page),
  })
  if (opts.after !== undefined) params.set('after', String(opts.after))

  const res = await fetch(`${STRAVA_API_URL}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava activities fetch failed: ${res.status} ${body}`)
  }

  return res.json() as Promise<StravaActivity[]>
}

export async function fetchActivityDetail(
  token: string,
  providerActivityId: string
): Promise<StravaActivityDetail> {
  const res = await fetch(`${STRAVA_API_URL}/activities/${providerActivityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava activity detail fetch failed: ${res.status} ${body}`)
  }

  return res.json() as Promise<StravaActivityDetail>
}

export async function fetchActivityStreams(
  token: string,
  providerActivityId: string
): Promise<StravaStreamSet> {
  const keys = [
    'time', 'distance', 'latlng', 'altitude', 'velocity_smooth',
    'heartrate', 'cadence', 'watts', 'temp', 'moving', 'grade_smooth',
  ].join(',')

  const res = await fetch(
    `${STRAVA_API_URL}/activities/${providerActivityId}/streams?keys=${keys}&key_by_type=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava streams fetch failed: ${res.status} ${body}`)
  }

  return res.json() as Promise<StravaStreamSet>
}

export async function fetchAthleteZones(token: string): Promise<StravaZone[]> {
  const res = await fetch(`${STRAVA_API_URL}/athlete/zones`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava athlete zones fetch failed: ${res.status} ${body}`)
  }

  const data = await res.json() as { heart_rate?: StravaZone; power?: StravaZone }

  // La API devuelve { heart_rate: {...}, power: {...} } — normalizamos a array
  const zones: StravaZone[] = []
  if (data.heart_rate) zones.push({ ...data.heart_rate, type: 'heartrate' })
  if (data.power) zones.push({ ...data.power, type: 'power' })
  return zones
}
