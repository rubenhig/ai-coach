export type SubGoalData = {
  name: string
  sport: string
  targetDescription: string
}

export type PlannedSessionData = {
  date: string           // ISO date
  sport: string          // Strava: "Run", "Ride", "Swim", ...
  title: string
  description?: string
  targetDuration?: number // minutos
}

export type GoalData = {
  name: string
  sport: string
  targetDescription: string
  targetDate?: string    // ISO date
  priority?: string      // "A" | "B" | "C"
  subGoals?: SubGoalData[]
  sessions: PlannedSessionData[]
}

// Eventos SSE enviados al frontend
export type CoachSSEEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_start'; label: string }
  | { type: 'goal_update'; goal: GoalData }
  | { type: 'done' }
  | { type: 'error'; message: string }
