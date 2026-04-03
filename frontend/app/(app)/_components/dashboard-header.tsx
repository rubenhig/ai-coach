import { TrendingUp } from 'lucide-react'

type DashboardHeaderProps = {
  userName: string
  weekLabel: string
  ctl?: number
}

export default function DashboardHeader({ userName, weekLabel, ctl }: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex justify-between items-end">
      <div>
        <p className="text-sm font-medium text-strava mb-1">{weekLabel}</p>
        <h1 className="text-3xl font-bold tracking-tight">Hola, {userName}</h1>
      </div>
      {ctl !== undefined && (
        <div className="text-right hidden sm:block">
          <p className="text-sm text-muted-foreground">Estado de Forma (CTL)</p>
          <p className="text-2xl font-bold flex items-center gap-2 justify-end">
            {ctl.toFixed(1)}
            <TrendingUp className="w-5 h-5 text-green-500" />
          </p>
        </div>
      )}
    </header>
  )
}
