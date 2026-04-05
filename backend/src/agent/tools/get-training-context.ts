import { Type } from '@sinclair/typebox'
import type { AgentTool } from '@mariozechner/pi-agent-core'
import { eq, desc, and, gte } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activities, athleteZones } from '../../db/schema.js'

export function createGetTrainingContextTool(userId: number): AgentTool {
  return {
    name: 'get_training_context',
    label: 'Analizando historial de entrenamiento',
    description: "Get the athlete's recent training history, weekly volume, and physiological zones. Call this first before proposing any plan.",
    parameters: Type.Object({}),
    execute: async () => {
      const now = new Date()
      const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 3600 * 1000)

      const recentActivities = await db
        .select({
          startDate:          activities.startDate,
          type:               activities.type,
          distance:           activities.distance,
          movingTime:         activities.movingTime,
          totalElevationGain: activities.totalElevationGain,
          averageHeartrate:   activities.averageHeartrate,
          averageWatts:       activities.averageWatts,
        })
        .from(activities)
        .where(and(eq(activities.userId, userId), gte(activities.startDate, eightWeeksAgo)))
        .orderBy(desc(activities.startDate))
        .limit(50)

      const zones = await db.query.athleteZones.findMany({
        where: eq(athleteZones.userId, userId),
      })

      const weeklyMap = new Map<string, { count: number; distanceKm: number; movingTimeH: number }>()
      for (const a of recentActivities) {
        const d = new Date(a.startDate)
        const monday = new Date(d)
        monday.setHours(0, 0, 0, 0)
        const day = monday.getDay()
        monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
        const key = monday.toISOString().split('T')[0]
        const w = weeklyMap.get(key) ?? { count: 0, distanceKm: 0, movingTimeH: 0 }
        w.count++
        w.distanceKm += (a.distance ?? 0) / 1000
        w.movingTimeH += (a.movingTime ?? 0) / 3600
        weeklyMap.set(key, w)
      }

      const weeklyVolume = [...weeklyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, v]) => ({
          week,
          activities: v.count,
          distanceKm: +v.distanceKm.toFixed(1),
          movingTimeH: +v.movingTimeH.toFixed(1),
        }))

      const typeCount = recentActivities.reduce<Record<string, number>>((acc, a) => {
        acc[a.type] = (acc[a.type] ?? 0) + 1
        return acc
      }, {})

      const summary = {
        totalActivitiesLast8Weeks: recentActivities.length,
        activityTypeBreakdown: typeCount,
        avgActivitiesPerWeek: +(recentActivities.length / 8).toFixed(1),
        weeklyVolume,
        zones: zones.map(z => ({ type: z.type, zones: z.zones })),
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
        details: {},
      }
    },
  }
}
