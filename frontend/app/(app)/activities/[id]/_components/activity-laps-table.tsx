import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTypeConfig, formatTime, formatDistance, formatPace } from '../../_components/activity-config'
import type { Activity, ActivityLap } from '../../_components/types'

export function ActivityLapsTable({ laps, activity }: { laps: ActivityLap[]; activity: Activity }) {
  const config = getTypeConfig(activity.type)
  const showWatts = config.isCycling && laps.some((l) => l.averageWatts)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Laps ({laps.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Lap</th>
                <th className="text-right px-4 py-2 font-medium">Distancia</th>
                <th className="text-right px-4 py-2 font-medium">Tiempo</th>
                <th className="text-right px-4 py-2 font-medium">{showWatts ? 'Potencia' : 'Ritmo'}</th>
                <th className="text-right px-4 py-2 font-medium">Desnivel</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => {
                const pace = !showWatts && lap.distance && lap.movingTime
                  ? formatPace(lap.distance, lap.movingTime)
                  : null

                return (
                  <tr key={lap.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium">
                      {lap.name ?? `Lap ${lap.lapIndex}`}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {lap.distance ? formatDistance(lap.distance) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {lap.movingTime ? formatTime(lap.movingTime) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {showWatts
                        ? lap.averageWatts ? `${Math.round(lap.averageWatts)} W` : '—'
                        : pace ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {lap.totalElevationGain != null
                        ? `+${Math.round(lap.totalElevationGain)} m`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
