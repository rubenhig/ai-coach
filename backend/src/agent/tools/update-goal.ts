import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import type { GoalData } from '../types.js'

export function createUpdateGoalTool(onGoalUpdate: (goal: GoalData) => void): AgentTool {
  return {
    name: 'update_goal',
    label: 'Actualizando objetivo de entrenamiento',
    description: 'Create or update a training goal with its sub-goals and planned sessions. Call this whenever you define or modify a goal. You can call it multiple times to build incrementally.',
    parameters: Type.Object({
      goal: Type.Object({
        name: Type.String({ description: 'Goal name, e.g. "Maratón Valencia 2025"' }),
        sport: Type.String({ description: 'Strava sport type: "Run", "Ride", "Swim", etc.' }),
        targetDescription: Type.String({ description: 'What the athlete wants to achieve, e.g. "Terminar en sub-3:30"' }),
        targetDate: Type.Optional(Type.String({ description: 'ISO date of the target event' })),
        priority: Type.Optional(Type.String({ description: '"A" (main goal), "B" (prep), or "C" (training)' })),
        subGoals: Type.Optional(Type.Array(Type.Object({
          name: Type.String({ description: 'Sub-goal name, e.g. "Base aeróbica"' }),
          sport: Type.String({ description: 'Sport type' }),
          targetDescription: Type.String({ description: 'What this sub-goal develops' }),
        }))),
        sessions: Type.Array(Type.Object({
          date: Type.String({ description: 'ISO date for the session' }),
          sport: Type.String({ description: 'Sport type' }),
          title: Type.String({ description: 'Session title, e.g. "Rodaje suave Z2"' }),
          description: Type.Optional(Type.String({ description: 'Detailed session description' })),
          targetDuration: Type.Optional(Type.Number({ description: 'Target duration in minutes' })),
        })),
      }),
    }),
    execute: async (_id, params) => {
      const p = params as unknown as { goal: GoalData }
      onGoalUpdate(p.goal)
      return {
        content: [{ type: 'text' as const, text: 'Goal updated and displayed to the user.' }],
        details: {},
      }
    },
  }
}
