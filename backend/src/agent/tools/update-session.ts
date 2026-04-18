import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { goals, plannedSessions } from '../../db/schema.js'
import type { PlannedSessionView, CoachSSEEvent } from '../types.js'

export function createUpdateSessionTool(
  userId: number,
  onSessionUpdate: (event: CoachSSEEvent) => void,
): AgentTool {
  return {
    name: 'update_session',
    label: 'Actualizando sesión',
    description:
      'Update the status of a planned session. Mark it as "completed" (with optional linkedActivityId) or "skipped". ' +
      'Use get_current_goals first to find the session ID.',
    parameters: Type.Object({
      sessionId: Type.Number({ description: 'The planned session ID to update' }),
      status: Type.Union([
        Type.Literal('completed'),
        Type.Literal('skipped'),
      ], { description: '"completed" or "skipped"' }),
      linkedActivityId: Type.Optional(Type.Number({
        description: 'Activity ID to link when marking as completed',
      })),
    }),
    execute: async (_id, params, signal) => {
      const p = params as {
        sessionId: number
        status: 'completed' | 'skipped'
        linkedActivityId?: number
      }

      // Verify the session belongs to a goal owned by this user
      const session = await db.query.plannedSessions.findFirst({
        where: eq(plannedSessions.id, p.sessionId),
        with: { goal: true },
      })

      if (!session) {
        throw new Error(`Session ${p.sessionId} not found.`)
      }

      // Check ownership through goal
      const goal = await db.query.goals.findFirst({
        where: and(eq(goals.id, session.goalId), eq(goals.userId, userId)),
      })
      if (!goal) {
        throw new Error(`Session ${p.sessionId} does not belong to this user.`)
      }

      if (signal?.aborted) return { content: [{ type: 'text' as const, text: 'Aborted.' }], details: {} }

      await db
        .update(plannedSessions)
        .set({
          status: p.status,
          linkedActivityId: p.linkedActivityId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(plannedSessions.id, p.sessionId))

      const sessionView: PlannedSessionView = {
        id: session.id,
        date: session.date.toISOString(),
        sport: session.sport,
        title: session.title,
        description: session.description,
        targetDuration: session.targetDuration,
        status: p.status,
        linkedActivityId: p.linkedActivityId ?? null,
      }

      onSessionUpdate({ type: 'session_update', session: sessionView })

      return {
        content: [{
          type: 'text' as const,
          text: `Session "${session.title}" (${session.date.toISOString().split('T')[0]}) marked as ${p.status}.`,
        }],
        details: { sessionId: p.sessionId, status: p.status },
      }
    },
  }
}
