import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { goals, plannedSessions } from '../../db/schema.js'
import type { GoalView } from '../types.js'

export function createGetCurrentGoalsTool(userId: number): AgentTool {
  return {
    name: 'get_current_goals',
    label: 'Consultando objetivos actuales',
    description:
      'Get all active goals for the athlete, including sub-goals and planned sessions with their statuses. ' +
      'Call this before evaluating progress, re-planning sessions, or when you need to know the current state.',
    parameters: Type.Object({}),
    execute: async () => {
      const activeGoals = await db.query.goals.findMany({
        where: and(eq(goals.userId, userId), eq(goals.status, 'active'), eq(goals.parentId, undefined!)),
        with: {
          subGoals: true,
          plannedSessions: {
            orderBy: (ps, { asc }) => [asc(ps.date)],
          },
        },
      })

      // Filter top-level goals (parentId is null)
      const topLevel = activeGoals.filter(g => g.parentId === null)

      const result: GoalView[] = topLevel.map(g => ({
        id: g.id,
        name: g.name,
        sport: g.sport,
        targetDescription: g.targetDescription,
        targetDate: g.targetDate?.toISOString() ?? null,
        priority: g.priority,
        status: g.status,
        subGoals: (g.subGoals ?? []).map(sg => ({
          id: sg.id,
          name: sg.name,
          sport: sg.sport,
          targetDescription: sg.targetDescription,
          status: sg.status,
        })),
        sessions: (g.plannedSessions ?? []).map(s => ({
          id: s.id,
          date: s.date.toISOString(),
          sport: s.sport,
          title: s.title,
          description: s.description,
          targetDuration: s.targetDuration,
          status: s.status,
          linkedActivityId: s.linkedActivityId,
        })),
      }))

      return {
        content: [{
          type: 'text' as const,
          text: result.length > 0
            ? JSON.stringify(result, null, 2)
            : 'No hay objetivos activos. El atleta aún no ha definido ningún objetivo.',
        }],
        details: {},
      }
    },
  }
}
