export type ActivityType = string

export type Activity = {
  id: number
  source: string
  providerActivityId: string
  name: string
  type: ActivityType
  sportType: string
  workoutType: number | null
  startDate: string
  distance: number | null
  movingTime: number | null
  elapsedTime: number | null
  totalElevationGain: number | null
  elevHigh: number | null
  elevLow: number | null
  averageSpeed: number | null
  averageWatts: number | null
  weightedAverageWatts: number | null
  hasHeartrate: boolean | null
  averageHeartrate: number | null
  maxHeartrate: number | null
  averageCadence: number | null
  averageTemp: number | null
  trainer: boolean | null
  commute: boolean | null
  description: string | null
  calories: number | null
  summaryPolyline: string | null
  fullPolyline: string | null
  startLat: number | null
  startLng: number | null
  endLat: number | null
  endLng: number | null
  detailFetchedAt: string | null
  streamsFetchedAt: string | null
}

export type ActivitySplit = {
  id: number
  activityId: number
  splitIndex: number
  distance: number | null
  movingTime: number | null
  elapsedTime: number | null
  elevationDiff: number | null
  averageSpeed: number | null
  paceZone: number | null
}

export type ActivityLap = {
  id: number
  activityId: number
  lapIndex: number
  name: string | null
  startDate: string | null
  elapsedTime: number | null
  movingTime: number | null
  distance: number | null
  totalElevationGain: number | null
  averageSpeed: number | null
  maxSpeed: number | null
  averageCadence: number | null
  averageWatts: number | null
  startIndex: number | null
  endIndex: number | null
}

export type ActivityStreams = {
  id: number
  activityId: number
  time: number[] | null
  distance: number[] | null
  latlng: [number, number][] | null
  altitude: number[] | null
  grade: number[] | null
  heartrate: number[] | null
  cadence: number[] | null
  watts: number[] | null
  temp: number[] | null
  velocity: number[] | null
  moving: boolean[] | null
  originalSize: number | null
  resolution: string | null
}

export type ActivityDetail = {
  activity: Activity
  streams: ActivityStreams | null
  splits: ActivitySplit[]
  laps: ActivityLap[]
}

export type ActivitiesResponse = {
  data: Activity[]
  meta: { page: number; perPage: number; total: number; totalPages: number }
}
