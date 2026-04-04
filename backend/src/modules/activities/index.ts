import { Hono } from 'hono'
import { eq, desc, and, count, asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activities, activityStreams, activitySplits, activityLaps } from '../../db/schema.js'
import { enrichmentQueue } from '../../queue/index.js'
import { enqueueRequested } from '../../queue/enrichment-producer.js'

type ActivitiesVariables = { userId: number }
const activitiesRouter = new Hono<{ Variables: ActivitiesVariables }>()

const VALID_TYPES = ['Run', 'Ride', 'TrailRun', 'VirtualRide', 'Hike', 'Walk', 'Swim'] as const
const MAX_PER_PAGE = 50

activitiesRouter.get('/', async (c) => {
  const userId = c.get('userId')

  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(c.req.query('per_page') ?? 20)))
  const typeParam = c.req.query('type')

  const filters = [eq(activities.userId, userId)]
  if (typeParam && VALID_TYPES.includes(typeParam as typeof VALID_TYPES[number])) {
    filters.push(eq(activities.type, typeParam))
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(activities)
    .where(and(...filters))

  const rows = await db
    .select({
      id: activities.id,
      source: activities.source,
      providerActivityId: activities.providerActivityId,
      name: activities.name,
      type: activities.type,
      sportType: activities.sportType,
      startDate: activities.startDate,
      distance: activities.distance,
      movingTime: activities.movingTime,
      elapsedTime: activities.elapsedTime,
      totalElevationGain: activities.totalElevationGain,
      averageSpeed: activities.averageSpeed,
      averageWatts: activities.averageWatts,
      weightedAverageWatts: activities.weightedAverageWatts,
      hasHeartrate: activities.hasHeartrate,
      averageHeartrate: activities.averageHeartrate,
      maxHeartrate: activities.maxHeartrate,
      averageCadence: activities.averageCadence,
      trainer: activities.trainer,
      commute: activities.commute,
      summaryPolyline: activities.summaryPolyline,
      startLat: activities.startLat,
      startLng: activities.startLng,
      detailFetchedAt: activities.detailFetchedAt,
      streamsFetchedAt: activities.streamsFetchedAt,
    })
    .from(activities)
    .where(and(...filters))
    .orderBy(desc(activities.startDate))
    .limit(perPage)
    .offset((page - 1) * perPage)

  return c.json({
    data: rows,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  })
})

activitiesRouter.get('/:id/status', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Invalid id' }, 400)

  const activity = await db.query.activities.findFirst({
    where: and(eq(activities.id, id), eq(activities.userId, userId)),
    columns: { detailFetchedAt: true, streamsFetchedAt: true },
  })
  if (!activity) return c.json({ error: 'Not found' }, 404)

  const enriched = activity.detailFetchedAt !== null && activity.streamsFetchedAt !== null
  if (enriched) return c.json({ enriched: true, position: null, etaSeconds: null })

  const jobId = `activity-${id}`
  const existing = await enrichmentQueue.getJob(jobId)
  const state = existing ? await existing.getState() : null

  if (!existing || state === 'failed') {
    // No está en cola, o falló permanentemente — re-encolamos
    if (existing) await existing.remove()
    await enqueueRequested(id)
  } else if (state === 'waiting' || state === 'delayed') {
    // Está en background — la promovemos a requested
    await existing.changePriority({ priority: 1 })
  }
  // Si state === 'active', ya se está procesando, no hacemos nada

  const waitingCount = await enrichmentQueue.getWaitingCount()
  const etaSeconds = state === 'active' ? 5 : Math.max(5, waitingCount * 3)

  return c.json({ enriched: false, position: waitingCount, etaSeconds })
})

activitiesRouter.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid id' }, 400)
  }

  const activity = await db.query.activities.findFirst({
    where: and(eq(activities.id, id), eq(activities.userId, userId)),
  })

  if (!activity) return c.json({ error: 'Not found' }, 404)

  const [streams, splits, laps] = await Promise.all([
    db.query.activityStreams.findFirst({
      where: eq(activityStreams.activityId, id),
    }),
    db
      .select()
      .from(activitySplits)
      .where(eq(activitySplits.activityId, id))
      .orderBy(asc(activitySplits.splitIndex)),
    db
      .select()
      .from(activityLaps)
      .where(eq(activityLaps.activityId, id))
      .orderBy(asc(activityLaps.lapIndex)),
  ])

  return c.json({ activity, streams: streams ?? null, splits, laps })
})

export default activitiesRouter
