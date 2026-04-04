import Link from 'next/link'
import { TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTypeConfig, formatDate, formatDistance, formatPace, formatSwimPace, formatTime } from './activity-config'
import type { Activity } from './types'

function ActivityRow({ activity }: { activity: Activity }) {
  const config = getTypeConfig(activity.type)
  const Icon = config.icon

  return (
    <Link href={`/activities/${activity.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm truncate">{activity.name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${config.badgeClass}`}>
            {config.label}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(activity.startDate)}</span>
      </div>

      <div className="hidden sm:flex items-center gap-6 text-sm flex-shrink-0">
        <div className="w-16 text-right">
          <div className="font-medium">{activity.distance ? formatDistance(activity.distance) : '—'}</div>
          <div className="text-xs text-muted-foreground">distancia</div>
        </div>

        <div className="w-16 text-right">
          <div className="font-medium">{activity.movingTime ? formatTime(activity.movingTime) : '—'}</div>
          <div className="text-xs text-muted-foreground">tiempo</div>
        </div>

        <div className="w-20 text-right">
          {config.isCycling && activity.averageWatts ? (
            <>
              <div className="font-medium flex items-center justify-end gap-1">
                <Zap className="w-3 h-3" />{Math.round(activity.averageWatts)} W
              </div>
              <div className="text-xs text-muted-foreground">potencia</div>
            </>
          ) : config.isSwim && activity.distance && activity.movingTime ? (
            <>
              <div className="font-medium">{formatSwimPace(activity.distance, activity.movingTime)}</div>
              <div className="text-xs text-muted-foreground">ritmo</div>
            </>
          ) : config.isRun && activity.distance && activity.movingTime ? (
            <>
              <div className="font-medium">{formatPace(activity.distance, activity.movingTime)}</div>
              <div className="text-xs text-muted-foreground">ritmo</div>
            </>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>

        <div className="w-16 text-right">
          <div className="font-medium flex items-center justify-end gap-1">
            <TrendingUp className="w-3 h-3" />
            {activity.totalElevationGain ? `${Math.round(activity.totalElevationGain)} m` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">desnivel</div>
        </div>

        <div className="w-16 text-right">
          {activity.averageHeartrate ? (
            <>
              <div className="font-medium">{Math.round(activity.averageHeartrate)} bpm</div>
              <div className="text-xs text-muted-foreground">FC media</div>
            </>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {activities.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}
    </div>
  )
}
