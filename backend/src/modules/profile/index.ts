import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { users, activities } from '../../db/schema.js'
import { ProfileSummarySchema } from '../../schemas/profile.js'
import { ErrorSchema } from '../../schemas/common.js'

type ProfileVariables = { userId: number }
const profileRouter = new OpenAPIHono<{ Variables: ProfileVariables }>()

// --- Helpers de fecha ---

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

const RUN_TYPES  = new Set(['Run', 'TrailRun', 'VirtualRun'])
const RIDE_TYPES = new Set(['Ride', 'VirtualRide', 'MountainBikeRide', 'GravelRide', 'EBikeRide'])

// --- Ruta ---

const summaryRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'Resumen del perfil del usuario',
  tags: ['Profile'],
  responses: {
    200: { content: { 'application/json': { schema: ProfileSummarySchema } }, description: 'OK' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'No encontrado' },
  },
})

profileRouter.openapi(summaryRoute, async (c) => {
  const userId = c.get('userId')

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { firstname: true, lastname: true, profilePicture: true, createdAt: true, lastSyncAt: true },
  })
  if (!user) return c.json({ error: 'Not found' }, 404 as const)

  const now = new Date()
  const thisWeekStart  = getMondayOf(now)
  const sixteenWeeksAgo = addWeeks(thisWeekStart, -16)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const earliestNeeded = yearStart < sixteenWeeksAgo ? yearStart : sixteenWeeksAgo

  const rows = await db
    .select({
      startDate:          activities.startDate,
      type:               activities.type,
      distance:           activities.distance,
      movingTime:         activities.movingTime,
      totalElevationGain: activities.totalElevationGain,
    })
    .from(activities)
    .where(and(eq(activities.userId, userId), gte(activities.startDate, earliestNeeded)))

  // --- Helpers de agregación ---

  type Row = typeof rows[0]

  function sumPeriod(arr: Row[]) {
    return {
      count:      arr.length,
      distance:   arr.reduce((s, a) => s + (a.distance ?? 0), 0),
      movingTime: arr.reduce((s, a) => s + (a.movingTime ?? 0), 0),
      elevation:  arr.reduce((s, a) => s + (a.totalElevationGain ?? 0), 0),
    }
  }

  function typeStats(arr: Row[]) {
    return {
      movingTime: arr.reduce((s, a) => s + (a.movingTime ?? 0), 0),
      distance:   arr.reduce((s, a) => s + (a.distance ?? 0), 0),
    }
  }

  // --- Periodos ---

  const thisWeekActivities  = rows.filter(a => a.startDate >= thisWeekStart)
  const prevWeeksStart      = addWeeks(thisWeekStart, -4)
  const prevWeeksActivities = rows.filter(a => a.startDate >= prevWeeksStart && a.startDate < thisWeekStart)
  const ytdActivities       = rows.filter(a => a.startDate >= yearStart)

  const thisWeek  = sumPeriod(thisWeekActivities)
  const prevTotal = sumPeriod(prevWeeksActivities)
  const prevWeeksAvg = {
    count:      prevTotal.count      / 4,
    distance:   prevTotal.distance   / 4,
    movingTime: prevTotal.movingTime / 4,
    elevation:  prevTotal.elevation  / 4,
  }
  const yearToDate = sumPeriod(ytdActivities)

  // --- Volumen semanal (últimas 16 semanas) ---

  const weeklyVolume = Array.from({ length: 16 }, (_, i) => {
    const wStart = addWeeks(thisWeekStart, i - 15)
    const wEnd   = addWeeks(wStart, 1)
    const wRows  = rows.filter(a => a.startDate >= wStart && a.startDate < wEnd)

    return {
      weekStart: wStart.toISOString().split('T')[0],
      count: wRows.length,
      run:   typeStats(wRows.filter(a => RUN_TYPES.has(a.type))),
      ride:  typeStats(wRows.filter(a => RIDE_TYPES.has(a.type))),
      other: typeStats(wRows.filter(a => !RUN_TYPES.has(a.type) && !RIDE_TYPES.has(a.type))),
    }
  })

  return c.json({
    user: {
      ...user,
      createdAt:  user.createdAt.toISOString(),
      lastSyncAt: user.lastSyncAt?.toISOString() ?? null,
    },
    thisWeek,
    prevWeeksAvg,
    yearToDate,
    weeklyVolume,
  }, 200 as const)
})

export default profileRouter
