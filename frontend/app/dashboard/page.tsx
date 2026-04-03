import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from './logout-button'

type User = {
  id: number
  firstname: string | null
  lastname: string | null
  profilePicture: string | null
}

export default async function Dashboard() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) redirect('/')

  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
  const res = await fetch(`${backendUrl}/api/auth/me`, {
    headers: { Cookie: `session=${session.value}` },
  })

  if (!res.ok) redirect('/')

  const user: User = await res.json()

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hola, {user.firstname} 👋
            </h1>
            <p className="text-muted-foreground">Bienvenido a GPTrainer</p>
          </div>
          <LogoutButton />
        </div>
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <p className="text-muted-foreground">
            Dashboard en construcción — aquí irán tus estadísticas y plan de entrenamiento.
          </p>
        </div>
      </div>
    </main>
  )
}
