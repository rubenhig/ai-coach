export type ActivityType = string

export type Activity = {
  id: number
  stravaId: number
  name: string
  type: ActivityType
  sportType: string
  startDate: string
  distance: number | null
  movingTime: number | null
  elapsedTime: number | null
  totalElevationGain: number | null
  averageSpeed: number | null
  averageWatts: number | null
  weightedAverageWatts: number | null
  hasHeartrate: boolean | null
  averageHeartrate: number | null
  maxHeartrate: number | null
  averageCadence: number | null
  sufferScore: number | null
  prCount: number | null
  trainer: boolean | null
  commute: boolean | null
  summaryPolyline: string | null
  startLat: number | null
  startLng: number | null
  detailFetched: boolean
}

export type ActivitiesResponse = {
  data: Activity[]
  meta: { page: number; perPage: number; total: number; totalPages: number }
}
