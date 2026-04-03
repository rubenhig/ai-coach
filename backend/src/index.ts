import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import auth from './modules/auth/index.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    const payload = await verify(token, process.env.SESSION_SECRET!, 'HS256')
    c.set('userId', Number(payload.sub))
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// Rutas protegidas
app.route('/api/auth', auth)

const port = Number(process.env.PORT) || 4000
console.log(`Backend running on port ${port}`)

serve({ fetch: app.fetch, port })
