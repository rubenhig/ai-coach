import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTypeConfig, formatTime, formatPace, formatSwimPace } from '../../_components/activity-config'
import type { Activity, ActivitySplit } from '../../_components/types'

const PACE_ZONE_COLORS = ['', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700']

export function ActivitySplitsTable({ splits, activity }: { splits: ActivitySplit[]; activity: Activity }) {
  const config = getTypeConfig(activity.type)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Splits</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Km</th>
                <th className="text-right px-4 py-2 font-medium">Tiempo</th>
                <th className="text-right px-4 py-2 font-medium">Ritmo</th>
                <th className="text-right px-4 py-2 font-medium">Desnivel</th>
                <th className="text-right px-4 py-2 font-medium">Zona</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split) => {
                const pace = split.averageSpeed
                  ? config.isSwim
                    ? formatSwimPace((split.distance ?? 1000), (split.movingTime ?? 0))
                    : formatPace((split.distance ?? 1000), (split.movingTime ?? 0))
                  : '—'

                const zoneClass = split.paceZone ? PACE_ZONE_COLORS[split.paceZone] ?? '' : ''

                return (
                  <tr key={split.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium">{split.splitIndex}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {split.movingTime ? formatTime(split.movingTime) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{pace}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {split.elevationDiff != null
                        ? `${split.elevationDiff > 0 ? '+' : ''}${Math.round(split.elevationDiff)} m`
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {split.paceZone ? (
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${zoneClass}`}>
                          Z{split.paceZone}
                        </span>
                      ) : '—'}
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
