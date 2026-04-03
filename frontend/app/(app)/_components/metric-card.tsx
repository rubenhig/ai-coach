import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  icon: React.ReactNode
  value: string
  unit: string
  target?: string
  progress?: number
  accentClass: string
}

export default function MetricCard({
  label,
  icon,
  value,
  unit,
  target,
  progress,
  accentClass,
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:border-border/80 transition-colors">
      <CardContent className="p-5">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', accentClass)} />
          {label}
        </p>
        <p className="text-3xl font-bold">
          {value}{' '}
          <span className="text-lg text-muted-foreground font-normal">{unit}</span>
        </p>
        {target && (
          <p className="text-xs text-muted-foreground mt-2">Objetivo: {target}</p>
        )}
        {progress !== undefined && (
          <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', accentClass)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
