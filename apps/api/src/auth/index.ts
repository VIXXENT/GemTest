import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins/admin'

import type { DbClient } from '../db/index.js'

/**
 * Parameters for creating the Better Auth instance.
 */
interface CreateAuthParams {
  readonly db: DbClient
  readonly secret: string
  readonly trustedOrigins?: string[]
}

/**
 * Create a configured Better Auth instance.
 *
 * Uses the Drizzle adapter for PostgreSQL and enables
 * email/password authentication with admin plugin
 * for impersonation support.
 *
 * @param params - Database client, auth secret, and
 *   optional trusted origins.
 * @returns Configured Better Auth instance.
 */
const createAuth = (params: CreateAuthParams) => {
  const { db, secret, trustedOrigins = [] } = params

  // eslint-disable-next-line @typescript-eslint/typedef
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'user',
          input: false,
        },
      },
    },
    plugins: [admin()],
  })

  return auth
}

/**
 * Better Auth instance type inferred from the factory.
 */
type BetterAuthInstance = ReturnType<typeof createAuth>

export { createAuth }
export type { BetterAuthInstance, CreateAuthParams }
