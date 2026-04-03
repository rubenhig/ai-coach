import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { users, activities } from '../../db/schema.js'
import { getValidToken, fetchActivitiesPage } from '../../lib/strava.js'
import { normalizeStravaActivity } from './providers/strava.js'
import logger from '../../lib/logger.js'

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

    const rows = batch.map((a) => normalizeStravaActivity(a, userId))

    for (const row of rows) {
      await db
        .insert(activities)
        .values(row)
        .onConflictDoUpdate({
          target: [activities.source, activities.providerActivityId],
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
