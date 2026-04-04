import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import auth from './modules/auth/index.js'
import activitiesRouter from './modules/activities/index.js'
import { startEnrichmentWorker } from './queue/enrichment-worker.js'
import { startScheduler } from './scheduler/index.js'
import logger from './lib/logger.js'
import { env } from './lib/env.js'

type AppVariables = { userId: number }
const app = new OpenAPIHono<{ Variables: AppVariables }>()

// Middleware de Logs con Pino (reemplaza hono/logger)
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  const duration = `${end - start}ms`
  const method = c.req.method
  const url = c.req.url
  const status = c.res.status

  logger.info({ method, url, status, duration }, 'http request')
})

app.use('*', cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}))

// Rutas públicas — sin autenticación
app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/auth', auth)

// Middleware de sesión — protege todas las rutas bajo /api/*
app.use('/api/*', async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = await verify(token, env.SESSION_SECRET, 'HS256')
    c.set('userId', Number(payload.sub))
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// Rutas protegidas
app.route('/api/auth', auth)
app.route('/api/activities', activitiesRouter)

// OpenAPI + Swagger UI (solo desarrollo)
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'GPTrainer API', version: '1.0.0' },
})
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

serve({ fetch: app.fetch, port: env.PORT })
logger.info({ port: env.PORT }, 'backend started')

startEnrichmentWorker()
startScheduler()
