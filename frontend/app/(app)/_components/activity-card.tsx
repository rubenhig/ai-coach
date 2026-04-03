import { Bike, ChevronRight, Footprints, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ActivityType = 'run' | 'ride'

export type ActivityCardProps = {
  type: ActivityType
  title: string
  date: string
  distance: string
  time: string
  pace: string
  heartrate?: string
}

const activityConfig: Record<ActivityType, { icon: React.ReactNode; colorClass: string }> = {
  run: {
    icon: <Footprints className="w-6 h-6" />,
    colorClass: 'bg-blue-500/20 text-blue-400',
  },
  ride: {
    icon: <Bike className="w-6 h-6" />,
    colorClass: 'bg-yellow-500/20 text-yellow-400',
  },
}

export default function ActivityCard({
  type,
  title,
  date,
  distance,
  time,
  pace,
  heartrate,
}: ActivityCardProps) {
  const config = activityConfig[type]

  return (
    <Card className="hover:bg-muted/30 transition-colors cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', config.colorClass)}>
              {config.icon}
            </div>
            <div>
              <h4 className="text-base font-bold group-hover:text-strava transition-colors">
                {title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
            <Stat label="Distancia" value={distance} />
            <Stat label="Ritmo" value={pace} />
            <Stat label="Tiempo" value={time} />
            {heartrate && (
              <Stat
                label={
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> HR Med
                  </span>
                }
                value={heartrate}
              />
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors ml-auto sm:ml-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
