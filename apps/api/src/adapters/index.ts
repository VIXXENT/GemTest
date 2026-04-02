/**
 * @module adapters
 *
 * Barrel re-export of all concrete adapter implementations.
 * These connect the hexagonal architecture ports to real
 * infrastructure: PostgreSQL, Argon2, and JWT via jose.
 */

export { createArgon2PasswordService } from './auth/argon2-password-service.js'
export { createJwtTokenService } from './auth/jwt-token-service.js'
export type { CreateJwtTokenServiceParams } from './auth/jwt-token-service.js'
export { createDrizzleUserRepository } from './db/drizzle-user-repository.js'
export type { CreateDrizzleUserRepositoryParams } from './db/drizzle-user-repository.js'
