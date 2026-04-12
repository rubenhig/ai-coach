import { Target, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react'

type PlannedSession = {
  date: string
  sport: string
  title: string
  description?: string
  targetDuration?: number
}

type SubGoal = {
  name: string
  sport: string
  targetDescription: string
}

export type GoalData = {
  name: string
  sport: string
  targetDescription: string
  targetDate?: string
  priority?: string
  subGoals?: SubGoal[]
  sessions: PlannedSession[]
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function priorityLabel(p?: string) {
  if (p === 'A') return 'Principal'
  if (p === 'B') return 'Preparatorio'
  if (p === 'C') return 'Entrenamiento'
  return null
}

function SessionCard({ session }: { session: PlannedSession }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <div className="flex flex-col items-center flex-shrink-0 min-w-[56px]">
        <span className="text-xs font-medium text-primary">{formatDate(session.date)}</span>
      </div>
      <Circle className="w-2 h-2 text-muted-foreground mt-1.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">{session.title}</p>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{session.sport}</span>
        </div>
        {session.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{session.description}</p>
        )}
      </div>
      {session.targetDuration && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="w-3 h-3" />
          {session.targetDuration} min
        </div>
      )}
    </div>
  )
}

type GoalPanelProps = {
  goal: GoalData | null
  isThinking: boolean
}

export default function GoalPanel({ goal, isThinking }: GoalPanelProps) {
  if (!goal && !isThinking) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Tu objetivo aparecerá aquí</p>
        <p className="text-xs text-muted-foreground mt-1">
          Cuéntale al coach tu objetivo y construirá un plan personalizado en tiempo real.
        </p>
      </div>
    )
  }

  if (isThinking && !goal) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          Construyendo tu objetivo...
        </div>
      </div>
    )
  }

  if (!goal) return null

  const pLabel = priorityLabel(goal.priority)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {/* Goal header */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{goal.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{goal.targetDescription}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">{goal.sport}</span>
              {goal.targetDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatFullDate(goal.targetDate)}
                </span>
              )}
              {pLabel && (
                <span className="text-[10px] text-primary font-medium">{pLabel}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-goals */}
      {goal.subGoals && goal.subGoals.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sub-objetivos</p>
          </div>
          <div className="divide-y divide-border">
            {goal.subGoals.map((sg, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">{sg.name}</p>
                  <p className="text-xs text-muted-foreground">{sg.targetDescription}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned sessions */}
      {goal.sessions.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Sesiones planificadas ({goal.sessions.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {goal.sessions.map((session, i) => (
              <SessionCard key={i} session={session} />
            ))}
          </div>
        </div>
      )}

      {isThinking && (
        <div className="rounded-lg border border-border border-dashed px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          Añadiendo más sesiones...
        </div>
      )}
    </div>
  )
}
