// Coach domain types — mirrors backend GoalView/PlannedSessionView/SubGoalView

export type PlannedSessionView = {
  id: number
  date: string
  sport: string
  title: string
  description: string | null
  targetDuration: number | null
  status: string // 'planned' | 'completed' | 'skipped'
  linkedActivityId: number | null
}

export type SubGoalView = {
  id: number
  name: string
  sport: string
  targetDescription: string
  status: string // 'active' | 'completed' | 'cancelled'
}

export type GoalView = {
  id: number
  name: string
  sport: string
  targetDescription: string
  targetDate: string | null
  priority: string // 'A' | 'B' | 'C'
  status: string // 'active' | 'completed' | 'cancelled'
  subGoals: SubGoalView[]
  sessions: PlannedSessionView[]
}

export type CoachSSEEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_start'; label: string }
  | { type: 'goal_update'; goal: GoalView }
  | { type: 'sessions_update'; goalId: number; sessions: PlannedSessionView[] }
  | { type: 'session_update'; session: PlannedSessionView & { goalId: number } }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type CoachHistory = {
  messages: { role: string; content: unknown }[]
  goals: GoalView[]
}
