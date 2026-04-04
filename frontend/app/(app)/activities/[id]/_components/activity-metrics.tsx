import { Activity as ActivityIcon, Clock, Flame, Heart, Mountain, ThermometerSun, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getTypeConfig, formatDistance, formatTime, formatPace, formatSwimPace } from '../../_components/activity-config'
import type { Activity } from '../../_components/types'

function Metric({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-sm">{value ?? '—'}</div>
    </div>
  )
}

export function ActivityMetrics({ activity }: { activity: Activity }) {
  const config = getTypeConfig(activity.type)

  const pace = config.isSwim && activity.distance && activity.movingTime
    ? formatSwimPace(activity.distance, activity.movingTime)
    : config.isRun && activity.distance && activity.movingTime
      ? formatPace(activity.distance, activity.movingTime)
      : null

  const power = config.isCycling && activity.averageWatts
    ? `${Math.round(activity.averageWatts)} W`
    : null

  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
          <Metric
            label="Distancia"
            value={activity.distance ? formatDistance(activity.distance) : null}
          />
          <Metric
            label="Tiempo"
            value={activity.movingTime ? formatTime(activity.movingTime) : null}
            icon={<Clock className="w-3 h-3" />}
          />
          {pace && <Metric label="Ritmo" value={pace} />}
          {power && <Metric label="Potencia" value={power} icon={<Zap className="w-3 h-3" />} />}
          {!pace && !power && (
            <Metric
              label="Vel. media"
              value={activity.averageSpeed ? `${(activity.averageSpeed * 3.6).toFixed(1)} km/h` : null}
            />
          )}
          <Metric
            label="Desnivel"
            value={activity.totalElevationGain != null ? `+${Math.round(activity.totalElevationGain)} m` : null}
            icon={<TrendingUp className="w-3 h-3" />}
          />

          {activity.hasHeartrate && (
            <>
              <Metric
                label="FC media"
                value={activity.averageHeartrate ? `${Math.round(activity.averageHeartrate)} bpm` : null}
                icon={<Heart className="w-3 h-3" />}
              />
              <Metric
                label="FC máx"
                value={activity.maxHeartrate ? `${Math.round(activity.maxHeartrate)} bpm` : null}
                icon={<Heart className="w-3 h-3" />}
              />
            </>
          )}
          {activity.averageCadence && (
            <Metric
              label="Cadencia"
              value={`${Math.round(activity.averageCadence)} rpm`}
              icon={<ActivityIcon className="w-3 h-3" />}
            />
          )}
          {activity.calories && (
            <Metric
              label="Calorías"
              value={`${Math.round(activity.calories)} kcal`}
              icon={<Flame className="w-3 h-3" />}
            />
          )}
          {activity.elevHigh != null && activity.elevLow != null && (
            <Metric
              label="Alt. max/min"
              value={`${Math.round(activity.elevHigh)} / ${Math.round(activity.elevLow)} m`}
              icon={<Mountain className="w-3 h-3" />}
            />
          )}
          {activity.averageTemp != null && (
            <Metric
              label="Temperatura"
              value={`${activity.averageTemp} °C`}
              icon={<ThermometerSun className="w-3 h-3" />}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
