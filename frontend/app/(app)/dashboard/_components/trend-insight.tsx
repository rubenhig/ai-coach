import { Sparkles } from 'lucide-react'
import type { WeeklyVolumeEntry } from '../types'

function computeInsights(weeklyVolume: WeeklyVolumeEntry[]): string[] {
  const insights: string[] = []

  const weekTotals = weeklyVolume.map(
    w => w.run.movingTime + w.ride.movingTime + w.other.movingTime
  )

  const currentWeekTotal  = weekTotals[weekTotals.length - 1]
  const completeWeeks     = weekTotals.slice(0, -1) // 15 semanas completas

  // Semanas consecutivas con actividad
  let consecutiveWeeks = 0
  for (let i = completeWeeks.length - 1; i >= 0; i--) {
    if (completeWeeks[i] > 0) consecutiveWeeks++
    else break
  }
  if (currentWeekTotal > 0) consecutiveWeeks++

  if (consecutiveWeeks >= 4) {
    insights.push(`Llevas ${consecutiveWeeks} semanas consecutivas entrenando. Buena consistencia.`)
  }

  // Carga creciente (últimas semanas completas)
  const last4 = completeWeeks.slice(-4)
  let increaseStreak = 0
  for (let i = last4.length - 1; i > 0; i--) {
    if (last4[i] > last4[i - 1] && last4[i] > 0) increaseStreak++
    else break
  }
  if (increaseStreak >= 2) {
    insights.push(`${increaseStreak + 1} semanas con carga creciente. Considera una semana de recuperación pronto.`)
  }

  // Semana actual es la más cargada en 8 semanas
  const last8Totals = weekTotals.slice(-8)
  const maxLast8 = Math.max(...last8Totals)
  if (currentWeekTotal > 0 && currentWeekTotal === maxLast8 && currentWeekTotal > last8Totals[last8Totals.length - 2]) {
    insights.push('Esta semana ya es tu semana con mayor volumen en los últimos 2 meses.')
  }

  // Sin actividad reciente
  const lastTwoComplete = completeWeeks.slice(-2)
  if (lastTwoComplete.every(t => t === 0) && currentWeekTotal === 0) {
    insights.push('No has entrenado en las últimas 2 semanas. ¿Todo bien?')
  }

  return insights.slice(0, 2)
}

export default function TrendInsight({ weeklyVolume }: { weeklyVolume: WeeklyVolumeEntry[] }) {
  const insights = computeInsights(weeklyVolume)
  if (insights.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex gap-3">
      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        {insights.map((text, i) => (
          <p key={i} className="text-sm text-foreground/80">{text}</p>
        ))}
      </div>
    </div>
  )
}
