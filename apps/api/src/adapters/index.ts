/**
 * Secondary adapters barrel — infrastructure implementations of @gemtest/core ports.
 *
 * Why: A single barrel import keeps consumers (composition root, tests) clean.
 * Each export is a factory function that accepts its dependencies and returns
 * an object implementing the corresponding port interface.
 */

// DB adapter
export { createDrizzleUserRepository } from './db/drizzle-user-repository.js'

// Email adapter
export { createMockEmailService } from './email/mock-email-service.js'

// Auth adapters
export { createArgon2PasswordService } from './auth/argon2-password-service.js'
export { createJwtTokenService } from './auth/jwt-token-service.js'
