'use client'

import { useEffect, useRef } from 'react'

type Props = {
  coords: [number, number][]  // [lat, lng][]
}

export function ActivityMap({ coords }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current || coords.length === 0 || mapRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css' as string)

      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      const polyline = L.polyline(coords, {
        color: '#f97316',
        weight: 3,
        opacity: 0.85,
      }).addTo(map)

      // Marcadores de inicio y fin
      const startIcon = L.divIcon({
        html: '<div style="width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>',
        className: '', iconAnchor: [5, 5],
      })
      const endIcon = L.divIcon({
        html: '<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>',
        className: '', iconAnchor: [5, 5],
      })

      L.marker(coords[0], { icon: startIcon }).addTo(map)
      L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(map)

      map.fitBounds(polyline.getBounds(), { padding: [20, 20] })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove(): void }).remove()
        mapRef.current = null
      }
    }
  }, [coords])

  if (coords.length === 0) return null

  return (
    <div className="rounded-xl overflow-hidden border border-border h-72 sm:h-96">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
