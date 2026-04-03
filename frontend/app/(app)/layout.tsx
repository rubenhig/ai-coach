import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardShell from './_components/dashboard-shell'

export type AppUser = {
  id: number
  firstname: string | null
  lastname: string | null
  profilePicture: string | null
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  if (!session) redirect('/')

  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
  const res = await fetch(`${backendUrl}/api/auth/me`, {
    headers: { Cookie: `session=${session.value}` },
  })
  if (!res.ok) redirect('/')

  const user: AppUser = await res.json()

  return <DashboardShell user={user}>{children}</DashboardShell>
}
