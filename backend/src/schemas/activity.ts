import { z } from '@hono/zod-openapi'
import { PaginationMetaSchema } from './common.js'

export const ActivitySchema = z.object({
  id:                    z.number().int(),
  source:                z.string(),
  providerActivityId:    z.string(),
  name:                  z.string(),
  type:                  z.string(),
  sportType:             z.string(),
  workoutType:           z.number().int().nullable(),
  startDate:             z.string().datetime(),
  distance:              z.number().nullable(),
  movingTime:            z.number().int().nullable(),
  elapsedTime:           z.number().int().nullable(),
  totalElevationGain:    z.number().nullable(),
  elevHigh:              z.number().nullable(),
  elevLow:               z.number().nullable(),
  averageSpeed:          z.number().nullable(),
  averageWatts:          z.number().nullable(),
  weightedAverageWatts:  z.number().nullable(),
  hasHeartrate:          z.boolean().nullable(),
  averageHeartrate:      z.number().nullable(),
  maxHeartrate:          z.number().nullable(),
  averageCadence:        z.number().nullable(),
  averageTemp:           z.number().int().nullable(),
  trainer:               z.boolean().nullable(),
  commute:               z.boolean().nullable(),
  description:           z.string().nullable(),
  calories:              z.number().nullable(),
  summaryPolyline:       z.string().nullable(),
  fullPolyline:          z.string().nullable(),
  startLat:              z.number().nullable(),
  startLng:              z.number().nullable(),
  endLat:                z.number().nullable(),
  endLng:                z.number().nullable(),
  detailFetchedAt:       z.string().datetime().nullable(),
  streamsFetchedAt:      z.string().datetime().nullable(),
}).openapi('Activity')

export const ActivitySplitSchema = z.object({
  id:           z.number().int(),
  activityId:   z.number().int(),
  splitIndex:   z.number().int(),
  distance:     z.number().nullable(),
  movingTime:   z.number().int().nullable(),
  elapsedTime:  z.number().int().nullable(),
  elevationDiff: z.number().nullable(),
  averageSpeed: z.number().nullable(),
  paceZone:     z.number().int().nullable(),
}).openapi('ActivitySplit')

export const ActivityLapSchema = z.object({
  id:                 z.number().int(),
  activityId:         z.number().int(),
  lapIndex:           z.number().int(),
  name:               z.string().nullable(),
  startDate:          z.string().datetime().nullable(),
  elapsedTime:        z.number().int().nullable(),
  movingTime:         z.number().int().nullable(),
  distance:           z.number().nullable(),
  totalElevationGain: z.number().nullable(),
  averageSpeed:       z.number().nullable(),
  maxSpeed:           z.number().nullable(),
  averageCadence:     z.number().nullable(),
  averageWatts:       z.number().nullable(),
  startIndex:         z.number().int().nullable(),
  endIndex:           z.number().int().nullable(),
}).openapi('ActivityLap')

export const ActivityStreamsSchema = z.object({
  id:           z.number().int(),
  activityId:   z.number().int(),
  time:         z.array(z.number().int()).nullable(),
  distance:     z.array(z.number()).nullable(),
  latlng:       z.array(z.tuple([z.number(), z.number()])).nullable(),
  altitude:     z.array(z.number()).nullable(),
  grade:        z.array(z.number()).nullable(),
  heartrate:    z.array(z.number().int()).nullable(),
  cadence:      z.array(z.number().int()).nullable(),
  watts:        z.array(z.number().int()).nullable(),
  temp:         z.array(z.number().int()).nullable(),
  velocity:     z.array(z.number()).nullable(),
  moving:       z.array(z.boolean()).nullable(),
  originalSize: z.number().int().nullable(),
  resolution:   z.string().nullable(),
}).openapi('ActivityStreams')

export const ActivitiesResponseSchema = z.object({
  data: z.array(ActivitySchema),
  meta: PaginationMetaSchema,
}).openapi('ActivitiesResponse')

export const ActivityDetailSchema = z.object({
  activity: ActivitySchema,
  streams:  ActivityStreamsSchema.nullable(),
  splits:   z.array(ActivitySplitSchema),
  laps:     z.array(ActivityLapSchema),
}).openapi('ActivityDetail')

export const ActivityStatusSchema = z.object({
  enriched:   z.boolean(),
  position:   z.number().int().nullable(),
  etaSeconds: z.number().int().nullable(),
}).openapi('ActivityStatus')
