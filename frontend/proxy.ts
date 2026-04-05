import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/coach', '/activities', '/plan', '/settings']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!isProtected) return NextResponse.next()

  const session = req.cookies.get('session')
  if (!session?.value) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
