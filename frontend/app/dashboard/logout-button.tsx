'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/auth/logout', { method: 'POST' })
    router.replace('/')
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Cerrar sesión
    </button>
  )
}
