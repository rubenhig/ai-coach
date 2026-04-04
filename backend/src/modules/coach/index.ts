import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'
import { Agent } from '@mariozechner/pi-agent-core'
import { getModel } from '@mariozechner/pi-ai'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { coachMessages, goals } from '../../db/schema.js'
import { ErrorSchema } from '../../schemas/common.js'
import { createGetTrainingContextTool, createUpdatePlanTool } from './tools.js'
import type { TrainingPlan, CoachSSEEvent } from './types.js'
import type { AgentMessage } from '@mariozechner/pi-agent-core'

type CoachVariables = { userId: number }
const coachRouter = new OpenAPIHono<{ Variables: CoachVariables }>()

const SYSTEM_PROMPT = `Eres un coach de atletismo y fitness experto. Tu especialidad es preparar atletas para eventos específicos: carreras, Hyrox, triatlones, etc.

Cuando el usuario te comparte un objetivo:
1. PRIMERO llama a get_training_context para analizar su historial real de entrenamiento.
2. Si falta información esencial (experiencia previa en el evento, días disponibles, acceso a equipamiento), haz 1-2 preguntas concretas.
3. Una vez tengas contexto suficiente, construye el plan usando update_plan. Puedes llamarlo múltiples veces para añadir fases progresivamente mientras conversas.
4. El plan debe tener fases claras (Base, Construcción, Especificidad, Puesta a punto), con sesiones concretas por día, tipo y duración.
5. Adapta siempre el plan al nivel real del atleta según su historial.

Sé directo, motivador y específico. Responde SIEMPRE en español.`

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
          schema: z.object({
            messages: z.array(z.any()),
            plan: z.any().nullable(),
          }),
        },
      },
      description: 'OK',
    },
  },
})

coachRouter.openapi(historyRoute, async (c) => {
  const userId = c.get('userId')

  const [msgs, activeGoal] = await Promise.all([
    db.select().from(coachMessages).where(eq(coachMessages.userId, userId)).orderBy(asc(coachMessages.id)),
    db.query.goals.findFirst({
      where: eq(goals.userId, userId),
      orderBy: asc(goals.id),
    }),
  ])

  return c.json({
    messages: msgs.map(m => m.data),
    plan: activeGoal?.plan ?? null,
  }, 200 as const)
})

// --- POST /coach/chat ---

coachRouter.post('/chat', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const userMessage: string = body.message?.trim()
  if (!userMessage) return c.json({ error: 'message is required' }, 400)

  return streamSSE(c, async (stream) => {
    const send = async (event: CoachSSEEvent) => {
      await stream.writeSSE({ data: JSON.stringify(event) })
    }

    try {
      // Cargar historial de la BD
      const stored = await db
        .select()
        .from(coachMessages)
        .where(eq(coachMessages.userId, userId))
        .orderBy(asc(coachMessages.id))

      const history = stored.map(r => r.data) as AgentMessage[]

      let latestPlan: TrainingPlan | null = null

      const agent = new Agent({
        initialState: {
          systemPrompt: SYSTEM_PROMPT,
          model: getModel('openrouter', 'anthropic/claude-3.7-sonnet'),
          tools: [
            createGetTrainingContextTool(userId),
            createUpdatePlanTool((plan) => {
              latestPlan = plan
              // Fire and forget — SSE write is async but subscribe is awaited
              send({ type: 'plan_update', plan })
            }),
          ],
          messages: history,
        },
      })

      agent.subscribe(async (event) => {
        if (
          event.type === 'message_update' &&
          event.assistantMessageEvent.type === 'text_delta'
        ) {
          await send({ type: 'text_delta', delta: event.assistantMessageEvent.delta })
        } else if (event.type === 'tool_execution_start') {
          const label = event.toolName === 'get_training_context'
            ? 'Analizando tu historial...'
            : 'Actualizando el plan...'
          await send({ type: 'tool_start', label })
        }
      })

      await agent.prompt(userMessage)

      // Persistir todos los mensajes nuevos (los que no estaban antes)
      const newMessages = agent.state.messages.slice(history.length)
      if (newMessages.length > 0) {
        await db.insert(coachMessages).values(
          newMessages.map(m => ({ userId, data: m as unknown as Record<string, unknown> }))
        )
      }

      // Persistir el plan si fue actualizado
      if (latestPlan) {
        const existing = await db.query.goals.findFirst({
          where: eq(goals.userId, userId),
        })
        const planDescription = (latestPlan as TrainingPlan).goal.description
        if (existing) {
          await db.update(goals)
            .set({ plan: latestPlan as Record<string, unknown>, description: planDescription, updatedAt: new Date() })
            .where(eq(goals.id, existing.id))
        } else {
          await db.insert(goals).values({
            userId,
            description: planDescription,
            plan: latestPlan as Record<string, unknown>,
          })
        }
      }

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
  const userId = c.get('userId')
  await db.delete(coachMessages).where(eq(coachMessages.userId, userId))
  return c.json({ ok: true }, 200 as const)
})

export default coachRouter
