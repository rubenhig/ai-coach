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

export type StravaActivity = {
  id: number
  name: string
  type: string
  sport_type: string
  workout_type: number | null
  external_id: string | null
  upload_id: number | null
  start_date: string
  start_date_local: string
  timezone: string
  utc_offset: number
  distance: number
  total_elevation_gain: number
  moving_time: number
  elapsed_time: number
  average_speed: number
  max_speed: number
  average_cadence: number | null
  average_watts: number | null
  weighted_average_watts: number | null
  max_watts: number | null
  kilojoules: number | null
  device_watts: boolean
  has_heartrate: boolean
  average_heartrate: number | null
  max_heartrate: number | null
  trainer: boolean
  commute: boolean
  manual: boolean
  gear_id: string | null
  device_name: string | null
  suffer_score: number | null
  pr_count: number
  map: {
    summary_polyline: string | null
  }
  start_latlng: [number, number] | null
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
  stravaId: number
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRAVA_API_URL}/activities/${stravaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava activity detail fetch failed: ${res.status} ${body}`)
  }

  return res.json() as Promise<Record<string, unknown>>
}
