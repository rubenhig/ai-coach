import Link from 'next/link'
import { ArrowLeft, Bike, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTypeConfig, formatDate } from '../../_components/activity-config'
import type { Activity } from '../../_components/types'

const WORKOUT_TYPE_LABELS: Record<number, string> = {
  1: 'Carrera', 2: 'Long Run', 3: 'Entreno',
  11: 'Carrera', 12: 'Entreno',
}

export function ActivityDetailHeader({ activity }: { activity: Activity }) {
  const config = getTypeConfig(activity.type)
  const Icon = config.icon

  return (
    <div>
      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis actividades
      </Link>

      <div className={`rounded-xl bg-gradient-to-br ${config.gradient} px-5 py-4`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className="w-5 h-5 text-foreground/70 flex-shrink-0" />
            <Badge variant="outline" className={config.badgeClass}>
              {config.label}
            </Badge>
            {activity.workoutType != null && WORKOUT_TYPE_LABELS[activity.workoutType] && (
              <Badge variant="outline" className="text-xs">
                {WORKOUT_TYPE_LABELS[activity.workoutType]}
              </Badge>
            )}
            {activity.trainer && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />Indoor
              </Badge>
            )}
            {activity.commute && (
              <Badge variant="outline" className="text-xs">
                <Bike className="w-3 h-3 mr-1" />Commute
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground flex-shrink-0">
            {formatDate(activity.startDate)}
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight">{activity.name}</h1>

        {activity.description && (
          <p className="text-sm text-muted-foreground mt-1.5">{activity.description}</p>
        )}
      </div>
    </div>
  )
}
