import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

  const body = await request.json()

  const backendRes = await fetch(`${backendUrl}/api/coach/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session=${session?.value}`,
    },
    body: JSON.stringify(body),
  })

  // Pasar el ReadableStream directamente al cliente sin bufferizar
  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
