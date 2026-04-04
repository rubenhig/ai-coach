import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { athleteZones } from '../../db/schema.js'
import { getValidToken, fetchAthleteZones } from '../../lib/strava.js'
import { normalizeStravaZones } from './providers/strava.js'
import logger from '../../lib/logger.js'

export async function syncAthleteZones(userId: number): Promise<void> {
  const token = await getValidToken(userId)
  const zones = await fetchAthleteZones(token)

  if (zones.length === 0) {
    logger.info({ userId }, 'no athlete zones configured in Strava')
    return
  }

  const rows = normalizeStravaZones(zones, userId)

  for (const row of rows) {
    await db
      .insert(athleteZones)
      .values(row)
      .onConflictDoUpdate({
        target: [athleteZones.userId, athleteZones.type],
        set: { zones: row.zones, sensorBased: row.sensorBased, fetchedAt: row.fetchedAt },
      })
  }

  logger.info({ userId, types: rows.map((r) => r.type) }, 'athlete zones synced')
}
