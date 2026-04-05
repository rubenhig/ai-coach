import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Borrar la cookie sobreescribiéndola con maxAge: 0 (más fiable que .delete())
  const response = NextResponse.redirect(new URL('/', req.url))
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
