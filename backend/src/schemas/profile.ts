import { z } from '@hono/zod-openapi'

const PeriodStatsSchema = z.object({
  count:      z.number().int(),
  distance:   z.number(),
  movingTime: z.number().int(),
  elevation:  z.number(),
})

const WeekTypeStatsSchema = z.object({
  movingTime: z.number().int(),
  distance:   z.number(),
})

export const WeeklyVolumeEntrySchema = z.object({
  weekStart: z.string(),
  count:     z.number().int(),
  run:       WeekTypeStatsSchema,
  ride:      WeekTypeStatsSchema,
  other:     WeekTypeStatsSchema,
})

export const ProfileSummarySchema = z.object({
  user: z.object({
    firstname:      z.string().nullable(),
    lastname:       z.string().nullable(),
    profilePicture: z.string().nullable(),
    createdAt:      z.string().datetime(),
    lastSyncAt:     z.string().datetime().nullable(),
  }),
  thisWeek:     PeriodStatsSchema,
  prevWeeksAvg: z.object({
    count:      z.number(),
    distance:   z.number(),
    movingTime: z.number(),
    elevation:  z.number(),
  }),
  yearToDate:   PeriodStatsSchema,
  weeklyVolume: z.array(WeeklyVolumeEntrySchema),
}).openapi('ProfileSummary')
