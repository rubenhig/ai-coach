import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { users, activities } from '../../db/schema.js'
import { getValidToken, fetchActivityDetail } from '../../lib/strava.js'
import { normalizeStravaActivity } from '../sync/providers/strava.js'
import { enqueueBackground } from '../../queue/enrichment-producer.js'
import { env } from '../../lib/env.js'
import logger from '../../lib/logger.js'

const stravaWebhookRouter = new Hono()

// ─── Types ──────────────────────────────────────────────────────────────────

type StravaWebhookEvent = {
  object_type: 'activity' | 'athlete'
  aspect_type: 'create' | 'update' | 'delete'
  object_id: number      // activityId or athleteId
  owner_id: number       // Strava athleteId del propietario
  subscription_id: number
  event_time: number
  updates: Record<string, string>
}

// ─── GET — validación de suscripción ────────────────────────────────────────
// Strava llama esto una sola vez al registrar el webhook

stravaWebhookRouter.get('/', (c) => {
  const mode      = c.req.query('hub.mode')
  const token     = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')

  if (mode !== 'subscribe' || token !== env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    logger.warn({ mode, token }, 'strava webhook validation failed')
    return c.json({ error: 'Forbidden' }, 403)
  }

  logger.info('strava webhook subscription validated')
  return c.json({ 'hub.challenge': challenge })
})

// ─── POST — eventos en tiempo real ──────────────────────────────────────────
// Strava espera un 200 en < 2s — procesamos en background

stravaWebhookRouter.post('/', async (c) => {
  const event = await c.req.json() as StravaWebhookEvent
  logger.info({ object_type: event.object_type, aspect_type: event.aspect_type, object_id: event.object_id }, 'strava webhook received')

  handleEvent(event).catch((err) =>
    logger.error({ err, event }, 'strava webhook handler failed')
  )

  return c.json({ ok: true })
})

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleEvent(event: StravaWebhookEvent): Promise<void> {
  if (event.object_type !== 'activity') return

  const user = await db.query.users.findFirst({
    where: eq(users.stravaAthleteId, event.owner_id),
    columns: { id: true },
  })

  if (!user) {
    logger.warn({ owner_id: event.owner_id }, 'strava webhook: unknown athlete, ignoring')
    return
  }

  if (event.aspect_type === 'create' || event.aspect_type === 'update') {
    await upsertActivity(user.id, String(event.object_id))
  } else if (event.aspect_type === 'delete') {
    await deleteActivity(String(event.object_id))
  }
}

async function upsertActivity(userId: number, providerActivityId: string): Promise<void> {
  const token = await getValidToken(userId)
  const detail = await fetchActivityDetail(token, providerActivityId)
  const row = normalizeStravaActivity(detail, userId)

  const [saved] = await db
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
    .returning({ id: activities.id })

  await enqueueBackground([saved.id])
  logger.info({ userId, providerActivityId, activityId: saved.id }, 'strava webhook: activity upserted')
}

async function deleteActivity(providerActivityId: string): Promise<void> {
  await db
    .delete(activities)
    .where(and(
      eq(activities.source, 'strava'),
      eq(activities.providerActivityId, providerActivityId),
    ))
  logger.info({ providerActivityId }, 'strava webhook: activity deleted')
}

export default stravaWebhookRouter
