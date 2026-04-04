import { cookies } from 'next/headers'
import CoachChat from './_components/coach-chat'

async function getHistory() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

  const res = await fetch(`${backendUrl}/api/coach/history`, {
    headers: { Cookie: `session=${session?.value}` },
    cache: 'no-store',
  })
  if (!res.ok) return { messages: [], plan: null }
  return res.json()
}

export default async function CoachPage() {
  const initial = await getHistory()

  return (
    <div className="-m-6 md:-m-8 h-[calc(100vh-3rem)] overflow-hidden">
      <CoachChat initial={initial} />
    </div>
  )
}
