import Link from 'next/link'
import { Clock, Heart, TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getTypeConfig, formatDate, formatDistance, formatPace, formatSwimPace, formatTime } from './activity-config'
import type { Activity } from './types'

function ActivityCard({ activity }: { activity: Activity }) {
  const config = getTypeConfig(activity.type)
  const Icon = config.icon

  return (
    <Link href={`/activities/${activity.id}`}>
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-0">
      <div className={`bg-gradient-to-br ${config.gradient} px-4 pt-4 pb-3`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-foreground/70 flex-shrink-0" />
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.badgeClass}`}>
              {config.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDate(activity.startDate)}
          </span>
        </div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-1">{activity.name}</h3>
      </div>

      <CardContent className="px-4 py-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <div className="text-xs text-muted-foreground">Distancia</div>
            <div className="font-semibold text-sm">
              {activity.distance ? formatDistance(activity.distance) : '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Tiempo
            </div>
            <div className="font-semibold text-sm">
              {activity.movingTime ? formatTime(activity.movingTime) : '—'}
            </div>
          </div>

          <div>
            {config.isCycling && activity.averageWatts ? (
              <>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Potencia
                </div>
                <div className="font-semibold text-sm">{Math.round(activity.averageWatts)} W</div>
              </>
            ) : config.isSwim && activity.distance && activity.movingTime ? (
              <>
                <div className="text-xs text-muted-foreground">Ritmo</div>
                <div className="font-semibold text-sm">{formatSwimPace(activity.distance, activity.movingTime)}</div>
              </>
            ) : config.isRun && activity.distance && activity.movingTime ? (
              <>
                <div className="text-xs text-muted-foreground">Ritmo</div>
                <div className="font-semibold text-sm">{formatPace(activity.distance, activity.movingTime)}</div>
              </>
            ) : (
              <>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Desnivel
                </div>
                <div className="font-semibold text-sm">
                  +{activity.totalElevationGain ? Math.round(activity.totalElevationGain) : 0} m
                </div>
              </>
            )}
          </div>

          <div>
            {activity.averageHeartrate ? (
              <>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Heart className="w-3 h-3" /> FC media
                </div>
                <div className="font-semibold text-sm">{Math.round(activity.averageHeartrate)} bpm</div>
              </>
            ) : (
              <>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Desnivel
                </div>
                <div className="font-semibold text-sm">
                  +{activity.totalElevationGain ? Math.round(activity.totalElevationGain) : 0} m
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}

export default function ActivityGrid({ activities }: { activities: Activity[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  )
}
