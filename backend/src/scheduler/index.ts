import { isNull, or, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { activities } from '../db/schema.js'
import { enqueueBackground } from '../queue/enrichment-producer.js'
import logger from '../lib/logger.js'

const INTERVAL_MS = 15 * 60 * 1000 // 15 minutos

/**
 * Red de seguridad: detecta actividades sin enriquecer que se hayan
 * escapado del flujo normal (crash, bug, backend caído durante sync)
 * y las encola en background.
 */
async function runSafetyNet(): Promise<void> {
  try {
    const pending = await db
      .select({ id: activities.id })
      .from(activities)
      .where(or(isNull(activities.detailFetchedAt), isNull(activities.streamsFetchedAt)))
      .orderBy(desc(activities.startDate)) // más reciente primero

    if (pending.length === 0) return

    const ids = pending.map((a) => a.id)
    await enqueueBackground(ids)
    logger.info({ count: ids.length }, 'scheduler: enqueued pending activities')
  } catch (err) {
    logger.error({ err }, 'scheduler safety net failed')
  }
}

export function startScheduler(): void {
  void runSafetyNet()
  setInterval(() => void runSafetyNet(), INTERVAL_MS)
  logger.info('scheduler started')
}
