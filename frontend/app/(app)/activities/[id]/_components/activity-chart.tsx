'use client'

import { useState } from 'react'
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

type Metric = 'altitude' | 'heartrate' | 'pace' | 'watts' | 'cadence' | 'temp' | 'grade'

type ChartPoint = {
  dist: number
  altitude: number | null
  heartrate: number | null
  pace: number | null
  watts: number | null
  cadence: number | null
  temp: number | null
  grade: number | null
}

const METRIC_CONFIG: Record<Metric, {
  label: string
  color: string
  formatter: (v: number) => string
  unit: string
}> = {
  altitude:  { label: 'Altitud',   color: '#94a3b8', formatter: (v) => `${Math.round(v)}m`,  unit: 'm'   },
  heartrate: { label: 'FC',        color: '#ef4444', formatter: (v) => `${Math.round(v)}`,   unit: 'bpm' },
  pace:      { label: 'Ritmo',     color: '#3b82f6', formatter: (v) => { const m = Math.floor(v); const s = Math.round((v - m) * 60); return `${m}:${String(s).padStart(2, '0')}` }, unit: '/km' },
  watts:     { label: 'Potencia',  color: '#f97316', formatter: (v) => `${Math.round(v)}`,   unit: 'W'   },
  cadence:   { label: 'Cadencia',  color: '#8b5cf6', formatter: (v) => `${Math.round(v)}`,   unit: 'rpm' },
  temp:      { label: 'Temp.',     color: '#06b6d4', formatter: (v) => `${Math.round(v)}`,   unit: '°C'  },
  grade:     { label: 'Pendiente', color: '#84cc16', formatter: (v) => `${v.toFixed(1)}`,    unit: '%'   },
}

// Orden de prioridad para defaults
const METRIC_PRIORITY: Metric[] = ['altitude', 'watts', 'pace', 'heartrate', 'cadence', 'temp', 'grade']

function msToPace(ms: number): number {
  if (ms <= 0) return 0
  return 1000 / (ms * 60)
}

function MetricButton({
  metric,
  side,
  onClick,
}: {
  metric: Metric
  side: 'left' | 'right' | null
  onClick: () => void
}) {
  const cfg = METRIC_CONFIG[metric]
  const isSelected = side !== null

  return (
    <button
      onClick={onClick}
      className="relative px-2.5 py-1 rounded text-xs font-medium border transition-all"
      style={isSelected ? {
        backgroundColor: cfg.color,
        borderColor: cfg.color,
        color: 'white',
      } : {
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))',
      }}
    >
      {cfg.label}
      {isSelected && (
        <span className="ml-1 text-[10px] opacity-80">
          {side === 'left' ? 'L' : 'R'}
        </span>
      )}
    </button>
  )
}

export function ActivityChart({ streams, activity }: { streams: ActivityStreams; activity: Activity }) {
  const config = getTypeConfig(activity.type)
  const n = streams.time?.length ?? 0
  if (n === 0) return null

  const indices = downsample(Array.from({ length: n }, (_, i) => i), MAX_POINTS)

  const data: ChartPoint[] = indices.map((i) => ({
    dist:      streams.distance?.[i]  != null ? Math.round((streams.distance![i] / 1000) * 100) / 100 : i,
    altitude:  streams.altitude?.[i]  ?? null,
    heartrate: streams.heartrate?.[i] ?? null,
    pace:      streams.velocity?.[i]  != null && config.isRun
                 ? Math.round(msToPace(streams.velocity![i]!) * 100) / 100
                 : null,
    watts:     streams.watts?.[i]     ?? null,
    cadence:   streams.cadence?.[i]   ?? null,
    temp:      streams.temp?.[i]      ?? null,
    grade:     streams.grade?.[i]     ?? null,
  }))

  const available = METRIC_PRIORITY.filter((m) => data.some((d) => d[m] != null))
  if (available.length === 0) return null

  const [left, setLeft]   = useState<Metric | null>(available[0] ?? null)
  const [right, setRight] = useState<Metric | null>(available[1] ?? null)

  function handleClick(m: Metric) {
    if (left === m) {
      // izquierda → derecha (reemplaza lo que hubiera)
      setLeft(null)
      setRight(m)
    } else if (right === m) {
      // derecha → deseleccionar
      setRight(null)
    } else {
      // no seleccionado → izquierda primero, si está ocupada → derecha
      if (left === null) setLeft(m)
      else if (right === null) setRight(m)
      else setLeft(m) // ambos ocupados → reemplaza izquierda
    }
  }

  const leftCfg  = left  ? METRIC_CONFIG[left]  : null
  const rightCfg = right ? METRIC_CONFIG[right] : null

  const tooltipLabel: Record<Metric, string> = {
    altitude:  'Altitud',
    heartrate: 'FC',
    pace:      'Ritmo',
    watts:     'Potencia',
    cadence:   'Cadencia',
    temp:      'Temp.',
    grade:     'Pendiente',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {[left, right].filter(Boolean).map((m) => METRIC_CONFIG[m!].label).join(' · ') || 'Gráfico'}
          </CardTitle>
          <div className="flex gap-1 flex-wrap">
            {available.map((m) => (
              <MetricButton
                key={m}
                metric={m}
                side={left === m ? 'left' : right === m ? 'right' : null}
                onClick={() => handleClick(m)}
              />
            ))}
          </div>
        </div>
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
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={leftCfg?.formatter ?? String}
              width={left ? 48 : 0}
              hide={!left}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={rightCfg?.formatter ?? String}
              width={right ? 52 : 0}
              hide={!right}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload as ChartPoint
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                    <div className="text-muted-foreground">{d.dist} km</div>
                    {left  && d[left]  != null && (
                      <div style={{ color: leftCfg!.color }}>
                        {tooltipLabel[left]}: <b>
                          {left === 'pace'
                            ? `${leftCfg!.formatter(d[left]!)}${leftCfg!.unit}`
                            : `${leftCfg!.formatter(d[left]!)} ${leftCfg!.unit}`}
                        </b>
                      </div>
                    )}
                    {right && d[right] != null && (
                      <div style={{ color: rightCfg!.color }}>
                        {tooltipLabel[right]}: <b>
                          {right === 'pace'
                            ? `${rightCfg!.formatter(d[right]!)}${rightCfg!.unit}`
                            : `${rightCfg!.formatter(d[right]!)} ${rightCfg!.unit}`}
                        </b>
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {/* Altitud como Area si está en el eje izquierdo, sino como Line */}
            {left === 'altitude' ? (
              <Area
                yAxisId="left"
                dataKey="altitude"
                fill={leftCfg!.color + '33'}
                stroke={leftCfg!.color}
                strokeWidth={1}
                fillOpacity={0.8}
                dot={false}
                isAnimationActive={false}
              />
            ) : (
              <Line
                yAxisId="left"
                dataKey={left ?? 'altitude'}
                stroke={leftCfg?.color ?? 'transparent'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                connectNulls
                hide={!left}
              />
            )}
            {right === 'altitude' ? (
              <Area
                yAxisId="right"
                dataKey="altitude"
                fill={rightCfg!.color + '33'}
                stroke={rightCfg!.color}
                strokeWidth={1}
                fillOpacity={0.8}
                dot={false}
                isAnimationActive={false}
              />
            ) : (
              <Line
                yAxisId="right"
                dataKey={right ?? 'heartrate'}
                stroke={rightCfg?.color ?? 'transparent'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                connectNulls
                hide={!right}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
