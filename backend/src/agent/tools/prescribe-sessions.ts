import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { goals, plannedSessions } from '../../db/schema.js'
import type { PlannedSessionView, CoachSSEEvent } from '../types.js'

export function createPrescribeSessionsTool(
  userId: number,
  onSessionsUpdate: (event: CoachSSEEvent) => void,
): AgentTool {
  return {
    name: 'prescribe_sessions',
    label: 'Prescribiendo sesiones de entrenamiento',
    description:
      'Add planned training sessions to an existing goal. ' +
      'Use replaceFromDate to replace future planned sessions from that date onward (completed/skipped sessions are never touched). ' +
      'Prescribe only 7-10 days ahead, not more.',
    parameters: Type.Object({
      goalId: Type.Number({ description: 'The goal ID to add sessions to' }),
      sessions: Type.Array(Type.Object({
        date: Type.String({ description: 'ISO date for the session' }),
        sport: Type.String({ description: 'Strava sport type' }),
        title: Type.String({ description: 'Session title, e.g. "Rodaje suave Z2"' }),
        description: Type.Optional(Type.String({ description: 'Detailed session description with coach instructions' })),
        targetDuration: Type.Optional(Type.Number({ description: 'Target duration in minutes' })),
      })),
      replaceFromDate: Type.Optional(Type.String({
        description: 'ISO date. If provided, deletes all PLANNED (not completed/skipped) sessions from this date onward before inserting new ones.',
      })),
    }),
    execute: async (_id, params, signal) => {
      const p = params as {
        goalId: number
        sessions: { date: string; sport: string; title: string; description?: string; targetDuration?: number }[]
        replaceFromDate?: string
      }

      // Verify the goal belongs to this user
      const goal = await db.query.goals.findFirst({
        where: and(eq(goals.id, p.goalId), eq(goals.userId, userId)),
      })
      if (!goal) {
        throw new Error(`Goal ${p.goalId} not found for this user.`)
      }

      if (signal?.aborted) return { content: [{ type: 'text' as const, text: 'Aborted.' }], details: {} }

      // Replace planned sessions from date if requested
      if (p.replaceFromDate) {
        await db.delete(plannedSessions).where(
          and(
            eq(plannedSessions.goalId, p.goalId),
            eq(plannedSessions.status, 'planned'),
            gte(plannedSessions.date, new Date(p.replaceFromDate)),
          ),
        )
      }

      if (signal?.aborted) return { content: [{ type: 'text' as const, text: 'Aborted.' }], details: {} }

      // Insert new sessions
      if (p.sessions.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No sessions to add.' }],
          details: {},
        }
      }

      const inserted = await db
        .insert(plannedSessions)
        .values(
          p.sessions.map(s => ({
            goalId: p.goalId,
            date: new Date(s.date),
            sport: s.sport,
            title: s.title,
            description: s.description ?? null,
            targetDuration: s.targetDuration ?? null,
            status: 'planned' as const,
          })),
        )
        .returning()

      const sessionViews: PlannedSessionView[] = inserted.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        sport: s.sport,
        title: s.title,
        description: s.description,
        targetDuration: s.targetDuration,
        status: s.status,
        linkedActivityId: s.linkedActivityId,
      }))

      onSessionsUpdate({ type: 'sessions_update', goalId: p.goalId, sessions: sessionViews })

      return {
        content: [{
          type: 'text' as const,
          text: `${p.sessions.length} session(s) prescribed for goal "${goal.name}". Displayed to the user.`,
        }],
        details: { goalId: p.goalId, count: p.sessions.length },
      }
    },
  }
}
