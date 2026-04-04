import { Target, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type PlanSession = {
  day: string
  type: string
  description: string
  duration?: string
}

type PlanPhase = {
  name: string
  weeks: string
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

function formatEventDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function PhaseCard({ phase }: { phase: PlanPhase }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{phase.name}</p>
            <p className="text-xs text-muted-foreground">{phase.weeks}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{phase.focus}</p>
      </div>
      <div className="divide-y divide-border">
        {phase.sessions.map((session, i) => (
          <div key={i} className="px-4 py-2.5 flex items-start gap-3">
            <span className="text-xs font-medium text-primary min-w-[60px] mt-0.5">{session.day}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{session.type}</p>
              <p className="text-xs text-muted-foreground">{session.description}</p>
            </div>
            {session.duration && (
              <span className="text-xs text-muted-foreground flex-shrink-0">{session.duration}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type PlanPanelProps = {
  plan: TrainingPlan | null
  isThinking: boolean
}

export default function PlanPanel({ plan, isThinking }: PlanPanelProps) {
  if (!plan && !isThinking) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Tu plan aparecerá aquí</p>
        <p className="text-xs text-muted-foreground mt-1">
          Cuéntale al coach tu objetivo y construirá un plan personalizado en tiempo real.
        </p>
      </div>
    )
  }

  if (isThinking && !plan) {
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
          Construyendo tu plan...
        </div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {/* Goal header */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">{plan.goal.description}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground">{formatEventDate(plan.goal.eventDate)}</p>
              {plan.goal.targetTime && (
                <p className="text-xs font-medium text-primary">{plan.goal.targetTime}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      {plan.phases.map((phase, i) => (
        <PhaseCard key={i} phase={phase} />
      ))}

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
          Añadiendo más fases...
        </div>
      )}
    </div>
  )
}
