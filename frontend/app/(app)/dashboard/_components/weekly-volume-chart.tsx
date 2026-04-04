'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import type { WeeklyVolumeEntry } from '../types'

type ChartEntry = {
  label: string
  count: number
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatHours(seconds: number): string {
  const h = seconds / 3600
  if (h === 0) return '0h'
  const hFloor = Math.floor(h)
  const m = Math.round((h - hFloor) * 60)
  return m === 0 ? `${hFloor}h` : `${hFloor}h ${m}m`
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const count = payload[0].value
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold">{count} {count === 1 ? 'actividad' : 'actividades'}</p>
    </div>
  )
}

type WeeklyVolumeChartProps = {
  weeklyVolume: WeeklyVolumeEntry[]
  yearToDate: { count: number; distance: number; movingTime: number }
}

export default function WeeklyVolumeChart({ weeklyVolume, yearToDate }: WeeklyVolumeChartProps) {
  const data: ChartEntry[] = weeklyVolume.map(w => ({
    label: formatWeekLabel(w.weekStart),
    count: w.count,
  }))

  const year = new Date().getFullYear()
  const totalKm = (yearToDate.distance / 1000).toFixed(0)
  const totalTime = formatHours(yearToDate.movingTime)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Actividades por semana
        </h2>
        <p className="text-xs text-muted-foreground">
          {year} · {yearToDate.count} actividades · {totalKm} km · {totalTime}
        </p>
      </div>
      <Card>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
            <Area
              type="linear"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#activityFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
      </Card>
    </div>
  )
}
