import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileHeader from './_components/profile-header'
import WeekStats from './_components/week-stats'
import WeeklyVolumeChart from './_components/weekly-volume-chart'
import TrendInsight from './_components/trend-insight'
import RecentActivities from './_components/recent-activities'
import type { ProfileSummary } from './types'
import type { ActivitiesResponse } from '../activities/_components/types'

async function getProfileSummary(): Promise<ProfileSummary> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

  const res = await fetch(`${backendUrl}/api/profile`, {
    headers: { Cookie: `session=${session?.value}` },
    cache: 'no-store',
  })
  if (res.status === 401) redirect('/')
  if (!res.ok) throw new Error('Failed to fetch profile summary')
  return res.json()
}

async function getRecentActivities(): Promise<ActivitiesResponse> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

  const res = await fetch(`${backendUrl}/api/activities?per_page=5`, {
    headers: { Cookie: `session=${session?.value}` },
    cache: 'no-store',
  })
  if (res.status === 401) redirect('/')
  if (!res.ok) throw new Error('Failed to fetch recent activities')
  return res.json()
}

export default async function DashboardPage() {
  const [summary, recentData] = await Promise.all([
    getProfileSummary(),
    getRecentActivities(),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <ProfileHeader user={summary.user} />

      <WeekStats thisWeek={summary.thisWeek} prevWeeksAvg={summary.prevWeeksAvg} />

      <WeeklyVolumeChart weeklyVolume={summary.weeklyVolume} yearToDate={summary.yearToDate} />

      <TrendInsight weeklyVolume={summary.weeklyVolume} />

      <RecentActivities activities={recentData.data} />
    </div>
  )
}
