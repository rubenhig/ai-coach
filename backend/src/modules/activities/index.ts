import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, desc, and, count, asc, isNull } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activities, activityStreams, activitySplits, activityLaps } from '../../db/schema.js'
import { enrichmentQueue } from '../../queue/index.js'
import { enqueueRequested } from '../../queue/enrichment-producer.js'
import {
  ActivitySchema,
  ActivitiesResponseSchema,
  ActivityDetailSchema,
  ActivityStatusSchema,
} from '../../schemas/activity.js'
import { ErrorSchema } from '../../schemas/common.js'

type ActivitiesVariables = { userId: number }
const activitiesRouter = new OpenAPIHono<{ Variables: ActivitiesVariables }>()

const VALID_TYPES = ['Run', 'Ride', 'TrailRun', 'VirtualRide', 'Hike', 'Walk', 'Swim'] as const
const MAX_PER_PAGE = 50

// --- GET /activities ---

const listRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'Lista de actividades del usuario',
  tags: ['Activities'],
  request: {
    query: z.object({
      page:     z.coerce.number().int().min(1).optional().default(1),
      per_page: z.coerce.number().int().min(1).max(MAX_PER_PAGE).optional().default(20),
      type:     z.enum(VALID_TYPES).optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: ActivitiesResponseSchema } }, description: 'OK' },
  },
})

activitiesRouter.openapi(listRoute, async (c) => {
  const userId = c.get('userId')
  const { page, per_page: perPage, type: typeParam } = c.req.valid('query')

  const filters = [eq(activities.userId, userId)]
  if (typeParam) filters.push(eq(activities.type, typeParam))

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
      workoutType: activities.workoutType,
      startDate: activities.startDate,
      distance: activities.distance,
      movingTime: activities.movingTime,
      elapsedTime: activities.elapsedTime,
      totalElevationGain: activities.totalElevationGain,
      elevHigh: activities.elevHigh,
      elevLow: activities.elevLow,
      averageSpeed: activities.averageSpeed,
      averageWatts: activities.averageWatts,
      weightedAverageWatts: activities.weightedAverageWatts,
      hasHeartrate: activities.hasHeartrate,
      averageHeartrate: activities.averageHeartrate,
      maxHeartrate: activities.maxHeartrate,
      averageCadence: activities.averageCadence,
      averageTemp: activities.averageTemp,
      trainer: activities.trainer,
      commute: activities.commute,
      description: activities.description,
      calories: activities.calories,
      summaryPolyline: activities.summaryPolyline,
      fullPolyline: activities.fullPolyline,
      startLat: activities.startLat,
      startLng: activities.startLng,
      endLat: activities.endLat,
      endLng: activities.endLng,
      detailFetchedAt: activities.detailFetchedAt,
      streamsFetchedAt: activities.streamsFetchedAt,
    })
    .from(activities)
    .where(and(...filters))
    .orderBy(desc(activities.startDate))
    .limit(perPage)
    .offset((page - 1) * perPage)

  return c.json({
    data: rows.map((r) => ({
      ...r,
      startDate: r.startDate.toISOString(),
      detailFetchedAt: r.detailFetchedAt?.toISOString() ?? null,
      streamsFetchedAt: r.streamsFetchedAt?.toISOString() ?? null,
    })),
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  }, 200 as const)
})

// --- GET /activities/:id/status ---

const statusRoute = createRoute({
  method: 'get',
  path: '/{id}/status',
  summary: 'Estado de enriquecimiento de una actividad',
  tags: ['Activities'],
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
  },
  responses: {
    200: { content: { 'application/json': { schema: ActivityStatusSchema } }, description: 'OK' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'No encontrada' },
  },
})

activitiesRouter.openapi(statusRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')

  const activity = await db.query.activities.findFirst({
    where: and(eq(activities.id, id), eq(activities.userId, userId)),
    columns: { detailFetchedAt: true, streamsFetchedAt: true },
  })
  if (!activity) return c.json({ error: 'Not found' }, 404 as const)

  const enriched = activity.detailFetchedAt !== null && activity.streamsFetchedAt !== null
  if (enriched) return c.json({ enriched: true, position: null, etaSeconds: null }, 200 as const)

  const jobId = `activity-${id}`
  const existing = await enrichmentQueue.getJob(jobId)
  const state = existing ? await existing.getState() : null

  if (!existing || state === 'failed') {
    if (existing) await existing.remove()
    await enqueueRequested(id)
  } else if (state === 'waiting' || state === 'delayed') {
    await existing.changePriority({ priority: 1 })
  }

  const waitingCount = await enrichmentQueue.getWaitingCount()
  const etaSeconds = state === 'active' ? 5 : Math.max(5, waitingCount * 3)

  return c.json({ enriched: false, position: waitingCount, etaSeconds }, 200 as const)
})

// --- GET /activities/:id ---

const detailRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: 'Detalle completo de una actividad',
  tags: ['Activities'],
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
  },
  responses: {
    200: { content: { 'application/json': { schema: ActivityDetailSchema } }, description: 'OK' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'No encontrada' },
  },
})

activitiesRouter.openapi(detailRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')

  const activity = await db.query.activities.findFirst({
    where: and(eq(activities.id, id), eq(activities.userId, userId)),
  })
  if (!activity) return c.json({ error: 'Not found' }, 404 as const)

  const [streams, splits, laps] = await Promise.all([
    db.query.activityStreams.findFirst({ where: eq(activityStreams.activityId, id) }),
    db.select().from(activitySplits).where(eq(activitySplits.activityId, id)).orderBy(asc(activitySplits.splitIndex)),
    db.select().from(activityLaps).where(eq(activityLaps.activityId, id)).orderBy(asc(activityLaps.lapIndex)),
  ])

  const serialize = (a: typeof activity) => ({
    ...a,
    startDate: a.startDate.toISOString(),
    detailFetchedAt: a.detailFetchedAt?.toISOString() ?? null,
    streamsFetchedAt: a.streamsFetchedAt?.toISOString() ?? null,
  })

  const serializeLap = (l: typeof laps[0]) => ({
    ...l,
    startDate: l.startDate?.toISOString() ?? null,
  })

  return c.json({
    activity: serialize(activity),
    streams: streams
      ? { ...streams, latlng: streams.latlng as [number, number][] | null }
      : null,
    splits,
    laps: laps.map(serializeLap),
  }, 200 as const)
})

export default activitiesRouter
