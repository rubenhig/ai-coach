import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { goals, plannedSessions } from '../../db/schema.js'
import { ErrorSchema } from '../../schemas/common.js'

type GoalVariables = { userId: number }
const goalsRouter = new OpenAPIHono<{ Variables: GoalVariables }>()

// --- Schemas ---

const GoalSchema = z.object({
  id: z.number(),
  name: z.string(),
  sport: z.string(),
  targetDescription: z.string(),
  targetDate: z.string().nullable(),
  priority: z.string(),
  parentId: z.number().nullable(),
  status: z.string(),
  resultDescription: z.string().nullable(),
  resultActivityId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const PlannedSessionSchema = z.object({
  id: z.number(),
  goalId: z.number(),
  date: z.string(),
  sport: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  targetDuration: z.number().nullable(),
  status: z.string(),
  linkedActivityId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const GoalWithRelationsSchema = GoalSchema.extend({
  subGoals: z.array(GoalSchema),
  plannedSessions: z.array(PlannedSessionSchema),
})

// --- GET /goals ---

const listRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'Listar objetivos del usuario',
  tags: ['Goals'],
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(GoalWithRelationsSchema) } },
      description: 'OK',
    },
  },
})

goalsRouter.openapi(listRoute, async (c) => {
  const userId = c.get('userId')
  const result = await db.query.goals.findMany({
    where: and(eq(goals.userId, userId), eq(goals.parentId, null as unknown as number)),
    with: { subGoals: true, plannedSessions: true },
  })
  return c.json(result as any, 200 as const)
})

// --- GET /goals/:id ---

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: 'Obtener un objetivo con sub-goals y sesiones',
  tags: ['Goals'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: GoalWithRelationsSchema } },
      description: 'OK',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'No encontrado',
    },
  },
})

goalsRouter.openapi(getRoute, async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, userId)),
    with: { subGoals: true, plannedSessions: true },
  })
  if (!goal) return c.json({ error: 'Goal not found' }, 404 as const)
  return c.json(goal as any, 200 as const)
})

// --- PATCH /goals/:id/status ---

const updateStatusRoute = createRoute({
  method: 'patch',
  path: '/{id}/status',
  summary: 'Cambiar estado de un objetivo',
  tags: ['Goals'],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['active', 'completed', 'cancelled']),
            resultDescription: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: GoalSchema } },
      description: 'OK',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'No encontrado',
    },
  },
})

goalsRouter.openapi(updateStatusRoute, async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const { status, resultDescription } = c.req.valid('json')

  const existing = await db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, userId)),
  })
  if (!existing) return c.json({ error: 'Goal not found' }, 404 as const)

  const [updated] = await db.update(goals)
    .set({ status, resultDescription: resultDescription ?? null, updatedAt: new Date() })
    .where(eq(goals.id, id))
    .returning()

  return c.json(updated as any, 200 as const)
})

// --- PATCH /goals/sessions/:id/status ---

const updateSessionRoute = createRoute({
  method: 'patch',
  path: '/sessions/{id}/status',
  summary: 'Cambiar estado de una sesión planificada',
  tags: ['Goals'],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['planned', 'completed', 'skipped']),
            linkedActivityId: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PlannedSessionSchema } },
      description: 'OK',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'No encontrado',
    },
  },
})

goalsRouter.openapi(updateSessionRoute, async (c) => {
  const id = Number(c.req.param('id'))
  const { status, linkedActivityId } = c.req.valid('json')

  const [updated] = await db.update(plannedSessions)
    .set({
      status,
      linkedActivityId: linkedActivityId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(plannedSessions.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Session not found' }, 404 as const)
  return c.json(updated as any, 200 as const)
})

export default goalsRouter
