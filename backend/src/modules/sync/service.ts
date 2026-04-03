import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { users, activities } from '../../db/schema.js'
import { getValidToken, fetchActivitiesPage, type StravaActivity } from '../../lib/strava.js'
import logger from '../../lib/logger.js'

function activityToRow(a: StravaActivity, userId: number) {
  return {
    userId,
    stravaId: a.id,
    externalId: a.external_id,
    uploadId: a.upload_id,
    name: a.name,
    type: a.type,
    sportType: a.sport_type,
    workoutType: a.workout_type,
    startDate: new Date(a.start_date),
    startDateLocal: new Date(a.start_date_local),
    timezone: a.timezone,
    utcOffset: a.utc_offset,
    distance: a.distance,
    totalElevationGain: a.total_elevation_gain,
    movingTime: a.moving_time,
    elapsedTime: a.elapsed_time,
    averageSpeed: a.average_speed,
    maxSpeed: a.max_speed,
    averageCadence: a.average_cadence,
    averageWatts: a.average_watts,
    weightedAverageWatts: a.weighted_average_watts,
    maxWatts: a.max_watts,
    kilojoules: a.kilojoules,
    deviceWatts: a.device_watts,
    hasHeartrate: a.has_heartrate,
    averageHeartrate: a.average_heartrate,
    maxHeartrate: a.max_heartrate,
    trainer: a.trainer,
    commute: a.commute,
    manual: a.manual,
    gearId: a.gear_id,
    deviceName: a.device_name,
    sufferScore: a.suffer_score,
    prCount: a.pr_count,
    summaryPolyline: a.map?.summary_polyline ?? null,
    startLat: a.start_latlng?.[0] ?? null,
    startLng: a.start_latlng?.[1] ?? null,
    rawData: a as unknown as Record<string, unknown>,
  }
}

export async function syncUser(userId: number): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { lastSyncAt: true },
  })
  if (!user) throw new Error(`User ${userId} not found`)

  const isFullSync = user.lastSyncAt === null
  const after = isFullSync ? undefined : Math.floor(user.lastSyncAt!.getTime() / 1000)

  logger.info({ userId, isFullSync, after }, 'strava sync started')

  const token = await getValidToken(userId)

  let page = 1
  let totalSynced = 0

  while (true) {
    const batch = await fetchActivitiesPage(token, { page, after })

    if (batch.length === 0) break

    const rows = batch.map((a) => activityToRow(a, userId))

    for (const row of rows) {
      await db
        .insert(activities)
        .values(row)
        .onConflictDoUpdate({
          target: activities.stravaId,
          set: {
            name: row.name,
            distance: row.distance,
            movingTime: row.movingTime,
            elapsedTime: row.elapsedTime,
            totalElevationGain: row.totalElevationGain,
            averageSpeed: row.averageSpeed,
            averageWatts: row.averageWatts,
            averageHeartrate: row.averageHeartrate,
            maxHeartrate: row.maxHeartrate,
            sufferScore: row.sufferScore,
            summaryPolyline: row.summaryPolyline,
            rawData: row.rawData,
            updatedAt: new Date(),
          },
        })
    }

    totalSynced += batch.length
    logger.info({ userId, page, count: batch.length, totalSynced }, 'strava sync page done')

    if (batch.length < 200) break
    page++
  }

  await db
    .update(users)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId))

  logger.info({ userId, totalSynced }, 'strava sync completed')
}
