import { Worker } from 'bullmq'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { activities } from '../db/schema.js'
import { enrichDetail, enrichStreams } from '../modules/sync/enrichment.js'
import { connection } from './index.js'
import logger from '../lib/logger.js'

// Pausa entre jobs para respetar el rate limit de Strava (200 req/15min)
const INTER_JOB_DELAY_MS = 500

export function startEnrichmentWorker(): Worker {
  const worker = new Worker(
    'enrichment',
    async (job) => {
      const { activityId } = job.data as { activityId: number }

      const activity = await db.query.activities.findFirst({
        where: eq(activities.id, activityId),
        columns: { detailFetchedAt: true, streamsFetchedAt: true },
      })

      if (!activity) {
        logger.warn({ activityId }, 'activity not found, skipping enrichment')
        return { skipped: true }
      }

      const alreadyEnriched = activity.detailFetchedAt !== null && activity.streamsFetchedAt !== null
      if (alreadyEnriched) {
        logger.debug({ activityId }, 'already enriched, skipping')
        return { skipped: true }
      }

      if (!activity.detailFetchedAt) {
        await enrichDetail(activityId)
      }

      if (!activity.streamsFetchedAt) {
        await enrichStreams(activityId)
      }

      await new Promise((resolve) => setTimeout(resolve, INTER_JOB_DELAY_MS))

      return { enriched: true }
    },
    {
      connection,
      concurrency: 1,
    }
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, activityId: job.data.activityId }, 'enrichment job completed')
  })

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, activityId: job?.data?.activityId, err }, 'enrichment job failed')
  })

  logger.info('enrichment worker started')
  return worker
}
