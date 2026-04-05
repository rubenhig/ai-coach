export type PlanSession = {
  day: string         // "Martes"
  type: string        // "Carrera Z2", "Fuerza funcional"
  description: string
  duration?: string   // "45 min"
}

export type PlanPhase = {
  name: string    // "Base aeróbica"
  weeks: string   // "Semanas 1-3"
  focus: string
  sessions: PlanSession[]
}

export type TrainingPlan = {
  goal: {
    description: string
    eventDate: string
    targetTime?: string
  }
  phases: PlanPhase[]
}

// Eventos SSE enviados al frontend
export type CoachSSEEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_start'; label: string }
  | { type: 'plan_update'; plan: TrainingPlan }
  | { type: 'done' }
  | { type: 'error'; message: string }
