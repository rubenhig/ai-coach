import ActivityCard, { type ActivityCardProps } from './activity-card'

type ActivityListProps = {
  activities: ActivityCardProps[]
}

export default function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No hay actividades recientes. ¡Sal a entrenar!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, i) => (
        <ActivityCard key={i} {...activity} />
      ))}
    </div>
  )
}
