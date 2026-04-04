// Decodificador de Google Encoded Polyline (server-safe, sin dependencias)
export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1)

    shift = result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1)

    coords.push([lat / 1e5, lng / 1e5])
  }

  return coords
}

// Reduce el número de puntos para renderizado eficiente
export function downsample<T>(arr: T[], targetPoints: number): T[] {
  if (arr.length <= targetPoints) return arr
  const step = arr.length / targetPoints
  return Array.from({ length: targetPoints }, (_, i) => arr[Math.round(i * step)])
}
