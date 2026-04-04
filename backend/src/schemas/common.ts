import { z } from '@hono/zod-openapi'

export const ErrorSchema = z.object({
  error: z.string(),
}).openapi('Error')

export const PaginationMetaSchema = z.object({
  page:       z.number().int(),
  perPage:    z.number().int(),
  total:      z.number().int(),
  totalPages: z.number().int(),
}).openapi('PaginationMeta')
