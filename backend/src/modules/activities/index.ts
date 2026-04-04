import { Hono } from 'hono'
import { eq, desc, and, count } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activities } from '../../db/schema.js'

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

export default activitiesRouter
