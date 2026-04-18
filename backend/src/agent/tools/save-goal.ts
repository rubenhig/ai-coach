import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { goals } from '../../db/schema.js'
import type { GoalView, CoachSSEEvent } from '../types.js'

export function createSaveGoalTool(
  userId: number,
  onGoalUpdate: (event: CoachSSEEvent) => void,
): AgentTool {
  return {
    name: 'save_goal',
    label: 'Guardando objetivo',
    description:
      'Create or update a training goal with optional sub-goals. ' +
      'Use goalId to update an existing goal, omit it to create a new one. ' +
      'This tool does NOT manage sessions — use prescribe_sessions for that.',
    parameters: Type.Object({
      goalId: Type.Optional(Type.Number({ description: 'Existing goal ID to update. Omit to create new.' })),
      name: Type.String({ description: 'Goal name, e.g. "Sub 1:45 Media Maratón Valencia"' }),
      sport: Type.String({ description: 'Strava sport type: "Run", "Ride", "Swim", etc.' }),
      targetDescription: Type.String({ description: 'What the athlete wants to achieve, e.g. "Terminar en sub 1:45"' }),
      targetDate: Type.Optional(Type.String({ description: 'ISO date of the target event' })),
      priority: Type.Optional(Type.Union([
        Type.Literal('A'),
        Type.Literal('B'),
        Type.Literal('C'),
      ], { description: '"A" (main goal), "B" (preparatory), "C" (training)' })),
      status: Type.Optional(Type.Union([
        Type.Literal('active'),
        Type.Literal('completed'),
        Type.Literal('cancelled'),
      ], { description: 'Goal status. Use "completed" or "cancelled" to close a goal.' })),
      resultDescription: Type.Optional(Type.String({ description: 'Result description when closing the goal' })),
      resultActivityId: Type.Optional(Type.Number({ description: 'Activity ID that evidences the result' })),
      subGoals: Type.Optional(Type.Array(Type.Object({
        name: Type.String({ description: 'Sub-goal name, e.g. "Base aeróbica"' }),
        sport: Type.String({ description: 'Sport type' }),
        targetDescription: Type.String({ description: 'What this sub-goal develops' }),
      }))),
    }),
    execute: async (_id, params, signal) => {
      const p = params as {
        goalId?: number
        name: string
        sport: string
        targetDescription: string
        targetDate?: string
        priority?: 'A' | 'B' | 'C'
        status?: 'active' | 'completed' | 'cancelled'
        resultDescription?: string
        resultActivityId?: number
        subGoals?: { name: string; sport: string; targetDescription: string }[]
      }

      const goalRow = {
        name: p.name,
        sport: p.sport,
        targetDescription: p.targetDescription,
        targetDate: p.targetDate ? new Date(p.targetDate) : null,
        priority: p.priority ?? 'A',
        status: p.status ?? 'active',
        resultDescription: p.resultDescription ?? null,
        resultActivityId: p.resultActivityId ?? null,
        updatedAt: new Date(),
      }

      let goalId: number

      if (p.goalId) {
        // Verify the goal belongs to this user
        const existing = await db.query.goals.findFirst({
          where: and(eq(goals.id, p.goalId), eq(goals.userId, userId)),
        })
        if (!existing) {
          throw new Error(`Goal ${p.goalId} not found for this user.`)
        }

        if (signal?.aborted) return { content: [{ type: 'text' as const, text: 'Aborted.' }], details: {} }

        await db.update(goals).set(goalRow).where(eq(goals.id, p.goalId))
        goalId = p.goalId

        // Merge subGoals: delete active subGoals and recreate (preserve completed/cancelled)
        if (p.subGoals) {
          await db.delete(goals).where(
            and(eq(goals.parentId, goalId), eq(goals.status, 'active')),
          )
        }
      } else {
        if (signal?.aborted) return { content: [{ type: 'text' as const, text: 'Aborted.' }], details: {} }

        const [inserted] = await db
          .insert(goals)
          .values({ userId, ...goalRow })
          .returning({ id: goals.id })
        goalId = inserted.id
      }

      // Insert new subGoals
      if (p.subGoals?.length) {
        if (signal?.aborted) return { content: [{ type: 'text' as const, text: 'Aborted.' }], details: {} }

        await db.insert(goals).values(
          p.subGoals.map(sg => ({
            userId,
            name: sg.name,
            sport: sg.sport,
            targetDescription: sg.targetDescription,
            parentId: goalId,
            priority: 'C' as const,
            status: 'active' as const,
          })),
        )
      }

      // If closing the goal, close all active subGoals too
      if (p.status === 'completed' || p.status === 'cancelled') {
        await db
          .update(goals)
          .set({ status: p.status, updatedAt: new Date() })
          .where(and(eq(goals.parentId, goalId), eq(goals.status, 'active')))
      }

      // Read back full goal for the SSE event
      const saved = await db.query.goals.findFirst({
        where: eq(goals.id, goalId),
        with: {
          subGoals: true,
          plannedSessions: { orderBy: (ps, { asc }) => [asc(ps.date)] },
        },
      })

      if (saved) {
        const goalView: GoalView = {
          id: saved.id,
          name: saved.name,
          sport: saved.sport,
          targetDescription: saved.targetDescription,
          targetDate: saved.targetDate?.toISOString() ?? null,
          priority: saved.priority,
          status: saved.status,
          subGoals: (saved.subGoals ?? []).map(sg => ({
            id: sg.id,
            name: sg.name,
            sport: sg.sport,
            targetDescription: sg.targetDescription,
            status: sg.status,
          })),
          sessions: (saved.plannedSessions ?? []).map(s => ({
            id: s.id,
            date: s.date.toISOString(),
            sport: s.sport,
            title: s.title,
            description: s.description,
            targetDuration: s.targetDuration,
            status: s.status,
            linkedActivityId: s.linkedActivityId,
          })),
        }
        onGoalUpdate({ type: 'goal_update', goal: goalView })
      }

      const verb = p.goalId ? 'updated' : 'created'
      const statusInfo = p.status && p.status !== 'active' ? ` (${p.status})` : ''
      return {
        content: [{ type: 'text' as const, text: `Goal "${p.name}" ${verb}${statusInfo}. ID: ${goalId}` }],
        details: { goalId },
      }
    },
  }
}
