import { Queue, QueueEvents } from 'bullmq'
import { env } from '../lib/env.js'

const redisUrl = new URL(env.REDIS_URL)

export const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
}

// Prioridades — número más bajo = mayor prioridad
export const PRIORITY_REQUESTED = 1   // usuario abre la actividad
export const PRIORITY_BACKGROUND = 10 // enriquecimiento automático

export const enrichmentQueue = new Queue('enrichment', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true, // Redis no guarda jobs completados — la BD es la fuente de verdad
    removeOnFail: 100,      // Guarda los últimos 100 fallidos para inspección
  },
})
export const enrichmentQueueEvents = new QueueEvents('enrichment', { connection })
