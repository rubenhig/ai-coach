import { enrichmentQueue, PRIORITY_REQUESTED, PRIORITY_BACKGROUND } from './index.js'

const JOB_OPTS_BASE = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
}

/**
 * Encola una actividad con máxima prioridad — el usuario la ha abierto
 * y está esperando ver los datos.
 */
export async function enqueueRequested(activityId: number): Promise<void> {
  await enrichmentQueue.add(
    'enrich',
    { activityId },
    {
      ...JOB_OPTS_BASE,
      jobId: `activity-${activityId}`,
      priority: PRIORITY_REQUESTED,
    }
  )
}

/**
 * Encola un batch de actividades en background, ordenadas por fecha
 * (más reciente primero — el array debe venir ya ordenado desc).
 * BullMQ ignora las que ya tengan ese jobId en cola.
 */
export async function enqueueBackground(activityIds: number[]): Promise<void> {
  if (activityIds.length === 0) return

  const jobs = activityIds.map((activityId) => ({
    name: 'enrich',
    data: { activityId },
    opts: {
      ...JOB_OPTS_BASE,
      jobId: `activity-${activityId}`,
      priority: PRIORITY_BACKGROUND,
    },
  }))

  await enrichmentQueue.addBulk(jobs)
}
