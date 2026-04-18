// --- Data types returned by read tools ---

export type SubGoalView = {
  id: number
  name: string
  sport: string
  targetDescription: string
  status: string
}

export type PlannedSessionView = {
  id: number
  date: string           // ISO date
  sport: string
  title: string
  description: string | null
  targetDuration: number | null
  status: string
  linkedActivityId: number | null
}

export type GoalView = {
  id: number
  name: string
  sport: string
  targetDescription: string
  targetDate: string | null
  priority: string
  status: string
  subGoals: SubGoalView[]
  sessions: PlannedSessionView[]
}

// --- Params for write tools ---

export type SaveGoalParams = {
  goalId?: number
  name: string
  sport: string
  targetDescription: string
  targetDate?: string
  priority?: 'A' | 'B' | 'C'
  status?: 'active' | 'completed' | 'cancelled'
  resultDescription?: string
  resultActivityId?: number
  subGoals?: {
    name: string
    sport: string
    targetDescription: string
  }[]
}

export type PrescribeSessionsParams = {
  goalId: number
  sessions: {
    date: string
    sport: string
    title: string
    description?: string
    targetDuration?: number
  }[]
  replaceFromDate?: string
}

export type UpdateSessionParams = {
  sessionId: number
  status: 'completed' | 'skipped'
  linkedActivityId?: number
}

// --- SSE events sent to frontend ---

export type CoachSSEEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_start'; label: string }
  | { type: 'goal_update'; goal: GoalView }
  | { type: 'sessions_update'; goalId: number; sessions: PlannedSessionView[] }
  | { type: 'session_update'; session: PlannedSessionView }
  | { type: 'done' }
  | { type: 'error'; message: string }
