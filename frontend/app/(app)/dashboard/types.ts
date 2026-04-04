export type WeeklyVolumeEntry = {
  weekStart: string
  count:     number
  run:   { movingTime: number; distance: number }
  ride:  { movingTime: number; distance: number }
  other: { movingTime: number; distance: number }
}

export type PeriodStats = {
  count:      number
  distance:   number
  movingTime: number
  elevation:  number
}

export type ProfileSummary = {
  user: {
    firstname:      string | null
    lastname:       string | null
    profilePicture: string | null
    createdAt:      string
    lastSyncAt:     string | null
  }
  thisWeek:     PeriodStats
  prevWeeksAvg: { count: number; distance: number; movingTime: number; elevation: number }
  yearToDate:   PeriodStats
  weeklyVolume: WeeklyVolumeEntry[]
}
