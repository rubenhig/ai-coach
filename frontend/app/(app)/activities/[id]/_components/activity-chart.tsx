'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTypeConfig } from '../../_components/activity-config'
import { downsample } from './polyline'
import type { Activity, ActivityStreams } from '../../_components/types'

const MAX_POINTS = 400

type ChartPoint = {
  dist: number
  altitude: number | null
  heartrate: number | null
  pace: number | null
  watts: number | null
}

function msToPace(ms: number): number {
  // m/s → min/km (valor numérico para el gráfico)
  if (ms <= 0) return 0
  return 1000 / (ms * 60)
}

function formatPaceAxis(value: number): string {
  const m = Math.floor(value)
  const s = Math.round((value - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ActivityChart({ streams, activity }: { streams: ActivityStreams; activity: Activity }) {
  const config = getTypeConfig(activity.type)
  const n = streams.time?.length ?? 0
  if (n === 0) return null

  const indices = downsample(Array.from({ length: n }, (_, i) => i), MAX_POINTS)

  const data: ChartPoint[] = indices.map((i) => ({
    dist: streams.distance ? Math.round((streams.distance[i] / 1000) * 100) / 100 : i,
    altitude: streams.altitude?.[i] ?? null,
    heartrate: streams.heartrate?.[i] ?? null,
    pace: streams.velocity?.[i] != null && config.isRun
      ? Math.round(msToPace(streams.velocity[i]!) * 100) / 100
      : null,
    watts: streams.watts?.[i] ?? null,
  }))

  const hasAltitude = data.some((d) => d.altitude != null)
  const hasHR = data.some((d) => d.heartrate != null)
  const hasPace = data.some((d) => d.pace != null)
  const hasWatts = data.some((d) => d.watts != null)

  if (!hasAltitude && !hasHR && !hasPace && !hasWatts) return null

  const rightMetric = hasWatts ? 'watts' : hasPace ? 'pace' : hasHR ? 'heartrate' : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {hasAltitude && rightMetric ? 'Altitud y ' : hasAltitude ? 'Altitud' : ''}
          {rightMetric === 'watts' ? 'Potencia' : rightMetric === 'pace' ? 'Ritmo' : rightMetric === 'heartrate' ? 'Frecuencia cardíaca' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="dist"
              tickFormatter={(v) => `${v} km`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={50}
            />
            {hasAltitude && (
              <YAxis
                yAxisId="alt"
                orientation="left"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}m`}
                width={48}
              />
            )}
            {rightMetric && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={rightMetric === 'pace' ? formatPaceAxis : (v) => String(v)}
                width={48}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload as ChartPoint
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                    <div className="text-muted-foreground">{d.dist} km</div>
                    {d.altitude != null && <div>Altitud: <b>{Math.round(d.altitude)} m</b></div>}
                    {d.heartrate != null && <div>FC: <b>{d.heartrate} bpm</b></div>}
                    {d.pace != null && <div>Ritmo: <b>{formatPaceAxis(d.pace)}/km</b></div>}
                    {d.watts != null && <div>Potencia: <b>{d.watts} W</b></div>}
                  </div>
                )
              }}
            />
            {hasAltitude && (
              <Area
                yAxisId="alt"
                dataKey="altitude"
                fill="hsl(var(--muted))"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                fillOpacity={0.6}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {rightMetric === 'heartrate' && (
              <Line
                yAxisId="right"
                dataKey="heartrate"
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {rightMetric === 'pace' && (
              <Line
                yAxisId="right"
                dataKey="pace"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {rightMetric === 'watts' && (
              <Line
                yAxisId="right"
                dataKey="watts"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
