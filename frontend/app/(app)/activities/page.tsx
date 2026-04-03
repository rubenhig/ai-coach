import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle'
import { PaginationNav } from '@/components/ui/pagination-nav'
import ActivityList from './_components/activity-list'
import ActivityGrid from './_components/activity-grid'
import type { ActivitiesResponse } from './_components/types'

const PER_PAGE = 20

async function getActivities(page: number): Promise<ActivitiesResponse> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
  const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })

  const res = await fetch(`${backendUrl}/api/activities?${params}`, {
    headers: { Cookie: `session=${session?.value}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error('Failed to fetch activities')
  return res.json()
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>
}) {
  const { view, page: pageParam } = await searchParams
  const currentView: ViewMode = view === 'grid' ? 'grid' : 'list'
  const page = Math.max(1, Number(pageParam ?? 1))

  const { data: activities, meta } = await getActivities(page)

  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (currentView !== 'list') params.set('view', currentView)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/activities${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Actividades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta.total === 0
              ? 'No hay actividades todavía'
              : `${meta.total} actividades · página ${page} de ${meta.totalPages}`}
          </p>
        </div>
        <Suspense>
          <ViewToggle defaultView="list" />
        </Suspense>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Sin actividades</p>
          <p className="text-sm mt-1">Conecta Strava para sincronizar tu historial.</p>
        </div>
      ) : currentView === 'list' ? (
        <ActivityList activities={activities} />
      ) : (
        <ActivityGrid activities={activities} />
      )}

      <PaginationNav
        page={page}
        totalPages={meta.totalPages}
        buildHref={buildHref}
      />
    </div>
  )
}
