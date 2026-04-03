import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { users } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import logger from '../../lib/logger.js'
import { env } from '../../lib/env.js'
import { syncUser } from '../sync/service.js'

type AuthVariables = { userId: number }
const auth = new Hono<{ Variables: AuthVariables }>()

// --- Schemas ---

const StravaTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  athlete: z.object({
    id: z.number(),
    firstname: z.string(),
    lastname: z.string(),
    profile_medium: z.string(),
  }),
})

const ExchangeBodySchema = z.object({
  code: z.string().uuid(),
})

// --- Códigos de intercambio (en memoria, TTL 60s) ---
// El JWT nunca viaja en la URL. En su lugar usamos un código de un solo uso.

type ExchangeCode = { userId: number; expiresAt: number }
const exchangeCodes = new Map<string, ExchangeCode>()

setInterval(() => {
  const now = Date.now()
  for (const [code, data] of exchangeCodes) {
    if (data.expiresAt < now) exchangeCodes.delete(code)
  }
}, 60_000)

// --- Constantes ---

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const { FRONTEND_URL, BACKEND_URL, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, SESSION_SECRET } = env

// --- Rutas públicas ---

// Inicia el flujo OAuth con Strava
auth.get('/strava', (c) => {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/auth/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,activity:write',
  })
  return c.redirect(`${STRAVA_AUTH_URL}?${params}`)
})

// Strava llama aquí tras autorizar
auth.get('/strava/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code) {
    logger.warn({ error }, 'strava oauth denied or missing code')
    return c.redirect(`${FRONTEND_URL}?error=auth_failed`)
  }

  const tokenRes = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    logger.error({ status: tokenRes.status }, 'strava token exchange failed')
    return c.redirect(`${FRONTEND_URL}?error=token_failed`)
  }

  const parsed = StravaTokenSchema.safeParse(await tokenRes.json())
  if (!parsed.success) {
    logger.error({ error: parsed.error.flatten() }, 'unexpected strava token response shape')
    return c.redirect(`${FRONTEND_URL}?error=token_failed`)
  }
  const tokenData = parsed.data
  const athlete = tokenData.athlete

  const [user] = await db
    .insert(users)
    .values({
      stravaAthleteId: athlete.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: new Date(tokenData.expires_at * 1000),
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      profilePicture: athlete.profile_medium,
    })
    .onConflictDoUpdate({
      target: users.stravaAthleteId,
      set: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(tokenData.expires_at * 1000),
        updatedAt: new Date(),
      },
    })
    .returning()

  // Sync en background — no bloqueamos el redirect al usuario
  syncUser(user.id).catch((err) =>
    logger.error({ userId: user.id, err }, 'background strava sync failed')
  )

  // Generamos un código de intercambio de un solo uso (el JWT nunca va en la URL)
  const exchangeCode = crypto.randomUUID()
  exchangeCodes.set(exchangeCode, { userId: user.id, expiresAt: Date.now() + 60_000 })

  return c.redirect(`${FRONTEND_URL}/auth/callback?code=${exchangeCode}`)
})

// El frontend llama aquí para canjear el código por un JWT
auth.post('/exchange', async (c) => {
  const body = ExchangeBodySchema.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: 'Invalid request' }, 400)

  const entry = exchangeCodes.get(body.data.code)
  if (!entry || entry.expiresAt < Date.now()) {
    logger.warn({ code: body.data.code }, 'invalid or expired exchange code')
    return c.json({ error: 'Invalid or expired code' }, 401)
  }

  // Código de un solo uso — lo eliminamos inmediatamente
  exchangeCodes.delete(body.data.code)

  const token = await sign(
    {
      sub: String(entry.userId),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 días
    },
    SESSION_SECRET,
    'HS256'
  )

  return c.json({ token })
})

auth.post('/logout', (c) => {
  return c.json({ ok: true })
})

// --- Rutas protegidas (requieren sesión vía middleware en index.ts) ---

auth.get('/me', async (c) => {
  const userId = c.get('userId') as number
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      stravaAthleteId: true,
      firstname: true,
      lastname: true,
      profilePicture: true,
    },
  })
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json(user)
})

export default auth
