'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = {
  enriched: boolean
  position: number | null
  etaSeconds: number | null
}

export function ActivityEnrichmentStatus({ activityId }: { activityId: number }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/activities/${activityId}/status`, { credentials: 'include' })
        if (!res.ok) return
        const data: Status = await res.json()
        setStatus(data)
        if (data.enriched) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          router.refresh()
        }
      } catch {
        // silencioso — reintentará en el siguiente tick
      }
    }

    void poll()
    intervalRef.current = setInterval(() => void poll(), 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activityId, router])

  if (status?.enriched) return null

  const eta = status?.etaSeconds
  const etaText = eta == null
    ? null
    : eta < 60
      ? `~${eta}s`
      : `~${Math.ceil(eta / 60)}min`

  return (
    <p className="text-xs text-muted-foreground text-center py-2 animate-pulse">
      Cargando detalle de la actividad{etaText ? ` · listo en ${etaText}` : '…'}
    </p>
  )
}
