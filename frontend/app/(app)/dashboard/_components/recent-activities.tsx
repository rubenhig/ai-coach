import Link from 'next/link'
import { TrendingUp, Zap, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getTypeConfig,
  formatDate,
  formatDistance,
  formatPace,
  formatTime,
} from '../../activities/_components/activity-config'
import type { Activity } from '../../activities/_components/types'

export default function RecentActivities({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Actividades recientes
        </h2>
        <Link
          href="/activities"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.map(activity => {
            const config = getTypeConfig(activity.type)
            const Icon = config.icon
            return (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted ${config.color}`}>
                  <Icon className="w-4 h-4" />
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
                <div className="hidden sm:flex items-center gap-5 text-sm flex-shrink-0">
                  <div className="w-14 text-right">
                    <div className="font-medium text-sm">{activity.distance ? formatDistance(activity.distance) : '—'}</div>
                  </div>
                  <div className="w-14 text-right">
                    <div className="font-medium text-sm">{activity.movingTime ? formatTime(activity.movingTime) : '—'}</div>
                  </div>
                  <div className="w-16 text-right">
                    {config.isCycling && activity.averageWatts ? (
                      <div className="font-medium text-sm flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3" />{Math.round(activity.averageWatts)} W
                      </div>
                    ) : config.isRun && activity.distance && activity.movingTime ? (
                      <div className="font-medium text-sm">{formatPace(activity.distance, activity.movingTime)}</div>
                    ) : (
                      <div className="text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="w-14 text-right">
                    <div className="font-medium text-sm flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {activity.totalElevationGain ? `${Math.round(activity.totalElevationGain)}m` : '—'}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
      </Card>
    </div>
  )
}
