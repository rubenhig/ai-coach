import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  // Canjear el código de intercambio por un JWT (llamada server-side, nunca expone el JWT al browser)
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
  const exchangeRes = await fetch(`${backendUrl}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!exchangeRes.ok) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  const { token } = await exchangeRes.json() as { token: string }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const response = NextResponse.redirect(new URL('/dashboard', `${proto}://${host}`))
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
