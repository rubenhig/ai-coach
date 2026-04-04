import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ActivityDetailHeader } from './_components/activity-detail-header'
import { ActivityMetrics } from './_components/activity-metrics'
import { ActivityMap } from './_components/activity-map'
import { ActivityChart } from './_components/activity-chart'
import { ActivitySplitsTable } from './_components/activity-splits-table'
import { ActivityLapsTable } from './_components/activity-laps-table'
import { decodePolyline } from './_components/polyline'
import type { ActivityDetail } from '../_components/types'

async function getActivity(id: number): Promise<ActivityDetail | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

  const res = await fetch(`${backendUrl}/api/activities/${id}`, {
    headers: { Cookie: `session=${session?.value}` },
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch activity')
  return res.json()
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getActivity(Number(id))
  if (!data) notFound()

  const { activity, streams, splits, laps } = data

  // Coordenadas del mapa: streams > full polyline > summary polyline
  const mapCoords: [number, number][] =
    streams?.latlng ??
    (activity.fullPolyline ? decodePolyline(activity.fullPolyline) : null) ??
    (activity.summaryPolyline ? decodePolyline(activity.summaryPolyline) : null) ??
    []

  const hasChart = streams != null &&
    (streams.altitude != null || streams.heartrate != null || streams.velocity != null || streams.watts != null)

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <ActivityDetailHeader activity={activity} />
      <ActivityMetrics activity={activity} />

      {mapCoords.length > 0 && <ActivityMap coords={mapCoords} />}

      {hasChart && <ActivityChart streams={streams!} activity={activity} />}

      {!activity.detailFetchedAt && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Datos de detalle pendientes de sincronización (splits, laps y gráficos disponibles pronto)
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {splits.length > 0 && <ActivitySplitsTable splits={splits} activity={activity} />}
        {laps.length > 1 && <ActivityLapsTable laps={laps} activity={activity} />}
      </div>
    </div>
  )
}
