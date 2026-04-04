import { eq, isNull, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activities, activitySplits, activityLaps, activityStreams } from '../../db/schema.js'
import { getValidToken, fetchActivityDetail, fetchActivityStreams } from '../../lib/strava.js'
import { normalizeStravaDetail, normalizeStravaStreams } from './providers/strava.js'
import logger from '../../lib/logger.js'

export async function enrichDetail(activityId: number): Promise<void> {
  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, activityId),
    columns: { userId: true, providerActivityId: true, source: true },
  })
  if (!activity) throw new Error(`Activity ${activityId} not found`)
  if (activity.source !== 'strava') return // solo Strava por ahora

  const token = await getValidToken(activity.userId)
  const detail = await fetchActivityDetail(token, activity.providerActivityId)
  const { activityUpdate, splits, laps } = normalizeStravaDetail(detail, activityId)

  await db.transaction(async (tx) => {
    await tx.update(activities).set(activityUpdate).where(eq(activities.id, activityId))

    if (splits.length > 0) {
      await tx.delete(activitySplits).where(eq(activitySplits.activityId, activityId))
      await tx.insert(activitySplits).values(splits)
    }

    if (laps.length > 0) {
      await tx.delete(activityLaps).where(eq(activityLaps.activityId, activityId))
      await tx.insert(activityLaps).values(laps)
    }
  })

  logger.info({ activityId, splits: splits.length, laps: laps.length }, 'detail enriched')
}

export async function enrichStreams(activityId: number): Promise<void> {
  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, activityId),
    columns: { userId: true, providerActivityId: true, source: true },
  })
  if (!activity) throw new Error(`Activity ${activityId} not found`)
  if (activity.source !== 'strava') return

  const token = await getValidToken(activity.userId)
  const streams = await fetchActivityStreams(token, activity.providerActivityId)
  const streamRow = normalizeStravaStreams(streams, activityId)

  await db
    .insert(activityStreams)
    .values(streamRow)
    .onConflictDoUpdate({
      target: activityStreams.activityId,
      set: { ...streamRow, fetchedAt: new Date() },
    })

  await db
    .update(activities)
    .set({ streamsFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(activities.id, activityId))

  logger.info({ activityId }, 'streams enriched')
}

export async function enrichActivities(userId: number): Promise<void> {
  const pending = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.userId, userId), isNull(activities.detailFetchedAt)))
    .orderBy(activities.startDate)

  if (pending.length === 0) return

  logger.info({ userId, count: pending.length }, 'enrichment started')

  for (const { id } of pending) {
    try {
      await enrichDetail(id)
      await enrichStreams(id)
    } catch (err) {
      logger.error({ activityId: id, err }, 'enrichment failed, skipping')
    }
  }

  logger.info({ userId }, 'enrichment completed')
}
