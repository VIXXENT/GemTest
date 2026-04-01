import type { EnvConfig } from '@voiler/config-env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema.js'

/**
 * Database connection and query result types.
 */
type DbClient = ReturnType<typeof drizzle<typeof schema>>

interface CreateDbParams {
  databaseUrl: EnvConfig['DATABASE_URL']
}

/**
 * Create a Drizzle ORM instance connected to PostgreSQL.
 * Uses the postgres.js driver for optimal performance.
 *
 * @param params - Object containing the DATABASE_URL connection string.
 * @returns Configured Drizzle ORM instance with schema type inference.
 *
 * @remarks
 * The connection is lazy — no query is executed until first use.
 * Schema is passed for full type inference in queries.
 */
const createDb = (params: CreateDbParams): DbClient => {
  const { databaseUrl } = params

  const client: ReturnType<typeof postgres> = postgres(databaseUrl)

  const db: DbClient = drizzle(client, { schema })

  return db
}

export { createDb }
export type { DbClient }
