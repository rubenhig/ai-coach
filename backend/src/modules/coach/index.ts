import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'
import { ErrorSchema } from '../../schemas/common.js'
import { agentService } from '../../agent/service.js'

type CoachVariables = { userId: number }
const coachRouter = new OpenAPIHono<{ Variables: CoachVariables }>()

// --- GET /coach/history ---

const historyRoute = createRoute({
  method: 'get',
  path: '/history',
  summary: 'Historial de conversación con el coach',
  tags: ['Coach'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ messages: z.array(z.any()), goal: z.any().nullable() }),
        },
      },
      description: 'OK',
    },
  },
})

coachRouter.openapi(historyRoute, async (c) => {
  const result = await agentService.getHistory(c.get('userId'))
  return c.json(result, 200 as const)
})

// --- POST /coach/chat ---

coachRouter.post('/chat', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const userMessage: string = body.message?.trim()
  if (!userMessage) return c.json({ error: 'message is required' }, 400)

  return streamSSE(c, async (stream) => {
    const send = (event: object) => stream.writeSSE({ data: JSON.stringify(event) })

    try {
      await agentService.runCoachSession(userId, userMessage, send)
      await send({ type: 'done' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[coach] stream error:', err)
      await send({ type: 'error', message })
    }
  })
})

// --- DELETE /coach/history ---

const clearRoute = createRoute({
  method: 'delete',
  path: '/history',
  summary: 'Borrar conversación con el coach',
  tags: ['Coach'],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } }, description: 'OK' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'No encontrado' },
  },
})

coachRouter.openapi(clearRoute, async (c) => {
  await agentService.clearHistory(c.get('userId'))
  return c.json({ ok: true }, 200 as const)
})

export default coachRouter
