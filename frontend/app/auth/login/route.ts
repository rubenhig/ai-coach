import { NextRequest, NextResponse } from 'next/server'

// Redirige al backend para iniciar el OAuth con Strava.
// Usamos una variable de servidor (sin NEXT_PUBLIC_) para la URL del backend.
export async function GET(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000'
  return NextResponse.redirect(`${backendUrl}/auth/strava`)
}
