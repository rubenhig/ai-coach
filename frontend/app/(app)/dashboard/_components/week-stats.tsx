import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ProfileSummary } from '../types'

function formatDistance(meters: number): string {
  const km = meters / 1000
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

type DeltaProps = {
  current: number
  avg: number
  isCount?: boolean
}

function Delta({ current, avg, isCount }: DeltaProps) {
  if (avg === 0) return null

  const pct = ((current - avg) / avg) * 100
  const abs = Math.abs(pct)

  if (abs <= 5) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" /> igual
      </span>
    )
  }

  const up = pct > 0
  const label = isCount
    ? `${up ? '+' : '-'}${Math.abs(Math.round(current - avg)).toFixed(1)}`
    : `${up ? '+' : '-'}${Math.round(abs)}%`

  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {label} vs media 4 sem
    </span>
  )
}

type StatCardProps = {
  label: string
  value: string
  delta: DeltaProps
}

function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <Delta {...delta} />
      </CardContent>
    </Card>
  )
}

type WeekStatsProps = {
  thisWeek: ProfileSummary['thisWeek']
  prevWeeksAvg: ProfileSummary['prevWeeksAvg']
}

export default function WeekStats({ thisWeek, prevWeeksAvg }: WeekStatsProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Esta semana
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Actividades"
          value={String(thisWeek.count)}
          delta={{ current: thisWeek.count, avg: prevWeeksAvg.count, isCount: true }}
        />
        <StatCard
          label="Distancia"
          value={formatDistance(thisWeek.distance)}
          delta={{ current: thisWeek.distance, avg: prevWeeksAvg.distance }}
        />
        <StatCard
          label="Tiempo"
          value={formatDuration(thisWeek.movingTime)}
          delta={{ current: thisWeek.movingTime, avg: prevWeeksAvg.movingTime }}
        />
      </div>
    </div>
  )
}
