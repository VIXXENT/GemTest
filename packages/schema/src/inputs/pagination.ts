import { z } from 'zod'

/**
 * Default page size for paginated queries.
 */
const DEFAULT_PAGE_SIZE = 20

/**
 * Maximum allowed page size to prevent abuse.
 */
const MAX_PAGE_SIZE = 100

/**
 * Zod schema for pagination input parameters.
 *
 * Provides sensible defaults so existing callers
 * work without changes.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const PaginationInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

/**
 * Inferred type for pagination input.
 */
type PaginationInput = z.infer<typeof PaginationInputSchema>

export { PaginationInputSchema }
export type { PaginationInput }
