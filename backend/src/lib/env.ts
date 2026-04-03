import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  PORT: z.coerce.number().optional().default(4000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional().default('info'),
})

export const env = envSchema.parse(process.env)
