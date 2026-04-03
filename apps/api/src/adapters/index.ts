/**
 * @module adapters
 *
 * Barrel re-export of all concrete adapter implementations.
 * These connect the hexagonal architecture ports to real
 * infrastructure: PostgreSQL, Argon2, and JWT via jose.
 */

export { createDrizzleUserRepository } from './db/drizzle-user-repository.js'
export type { CreateDrizzleUserRepositoryParams } from './db/drizzle-user-repository.js'
