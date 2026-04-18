import { Target, Calendar, Clock, CheckCircle2, Circle, SkipForward, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalView, PlannedSessionView, SubGoalView } from './types'

// --- Helpers ---

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

function priorityLabel(p: string) {
  if (p === 'A') return 'Principal'
  if (p === 'B') return 'Preparatorio'
  if (p === 'C') return 'Entrenamiento'
  return null
}

// --- Session status icon ---

function SessionStatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
  if (status === 'skipped') return <SkipForward className="w-3 h-3 text-amber-500 flex-shrink-0" />
  return <Circle className="w-2 h-2 text-muted-foreground flex-shrink-0" />
}

// --- SubGoal status icon ---

function SubGoalStatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
  if (status === 'cancelled') return <XCircle className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
  return <Circle className="w-3.5 h-3.5 text-primary/40 mt-0.5 flex-shrink-0" />
}

// --- Session card ---

function SessionCard({ session }: { session: PlannedSessionView }) {
  const isDone = session.status === 'completed'
  const isSkipped = session.status === 'skipped'

  return (
    <div className={cn('flex items-start gap-3 px-4 py-2.5', (isDone || isSkipped) && 'opacity-60')}>
      <div className="flex flex-col items-center flex-shrink-0 min-w-[56px]">
        <span className="text-xs font-medium text-primary">{formatDate(session.date)}</span>
      </div>
      <div className="mt-1.5">
        <SessionStatusIcon status={session.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-xs font-medium', isDone && 'line-through')}>{session.title}</p>
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

// --- SubGoal card ---

function SubGoalCard({ subGoal }: { subGoal: SubGoalView }) {
  return (
    <div className={cn('px-4 py-2.5 flex items-start gap-2', subGoal.status === 'cancelled' && 'opacity-50')}>
      <SubGoalStatusIcon status={subGoal.status} />
      <div>
        <p className={cn('text-xs font-medium', subGoal.status === 'completed' && 'line-through')}>{subGoal.name}</p>
        <p className="text-xs text-muted-foreground">{subGoal.targetDescription}</p>
      </div>
    </div>
  )
}

// --- Single goal card ---

function GoalCard({ goal }: { goal: GoalView }) {
  const pLabel = priorityLabel(goal.priority)
  const plannedCount = goal.sessions.filter(s => s.status === 'planned').length
  const completedCount = goal.sessions.filter(s => s.status === 'completed').length

  return (
    <div className="space-y-3">
      {/* Goal header */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{goal.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{goal.targetDescription}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
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
      {goal.subGoals.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sub-objetivos</p>
          </div>
          <div className="divide-y divide-border">
            {goal.subGoals.map(sg => (
              <SubGoalCard key={sg.id} subGoal={sg} />
            ))}
          </div>
        </div>
      )}

      {/* Sessions */}
      {goal.sessions.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Sesiones ({goal.sessions.length})
            </p>
            {completedCount > 0 && (
              <span className="text-[10px] text-green-600 font-medium">
                {completedCount} completada{completedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {goal.sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Thinking indicator ---

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border border-dashed px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex gap-1">
        {[0, 150, 300].map(d => (
          <div key={d} className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      {label}
    </div>
  )
}

// --- Main component ---

type GoalPanelProps = {
  goals: GoalView[]
  isThinking: boolean
}

export default function GoalPanel({ goals, isThinking }: GoalPanelProps) {
  if (goals.length === 0 && !isThinking) {
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

  if (goals.length === 0 && isThinking) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <ThinkingIndicator label="Construyendo tu objetivo..." />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {goals.map(goal => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      {isThinking && <ThinkingIndicator label="Actualizando plan..." />}
    </div>
  )
}
