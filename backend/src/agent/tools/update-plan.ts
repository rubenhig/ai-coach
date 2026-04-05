import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import type { TrainingPlan } from '../types.js'

export function createUpdatePlanTool(onPlanUpdate: (plan: TrainingPlan) => void): AgentTool {
  return {
    name: 'update_plan',
    label: 'Actualizando plan de entrenamiento',
    description: 'Update the training plan displayed to the user. Call this to show progress as you build the plan — you can call it multiple times to add phases incrementally.',
    parameters: Type.Object({
      plan: Type.Object({
        goal: Type.Object({
          description: Type.String({ description: 'Goal description, e.g. "Hyrox el 15 de mayo en 1h15"' }),
          eventDate:   Type.String({ description: 'ISO date string of the event' }),
          targetTime:  Type.Optional(Type.String({ description: 'Target time, e.g. "1:15:00"' })),
        }),
        phases: Type.Array(Type.Object({
          name:     Type.String({ description: 'Phase name, e.g. "Base aeróbica"' }),
          weeks:    Type.String({ description: 'Week range, e.g. "Semanas 1-3"' }),
          focus:    Type.String({ description: 'Short description of the phase objective' }),
          sessions: Type.Array(Type.Object({
            day:         Type.String({ description: 'Day of week in Spanish, e.g. "Martes"' }),
            type:        Type.String({ description: 'Session type, e.g. "Carrera Z2"' }),
            description: Type.String({ description: 'What to do in this session' }),
            duration:    Type.Optional(Type.String({ description: 'Duration, e.g. "45 min"' })),
          })),
        })),
      }),
    }),
    execute: async (_id, params) => {
      const p = params as unknown as { plan: TrainingPlan }
      onPlanUpdate(p.plan)
      return {
        content: [{ type: 'text' as const, text: 'Plan updated and displayed to the user.' }],
        details: {},
      }
    },
  }
}
