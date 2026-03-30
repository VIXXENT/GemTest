/**
 * @gemtest/core — hexagonal port definitions for the application layer.
 *
 * Why: This package contains only interfaces (ports) and shared error types.
 * It has zero infrastructure dependencies so any package can import it
 * without pulling in DB drivers, HTTP clients, or framework code.
 *
 * All fallible operations use `ResultAsync<T, AppError>` from neverthrow —
 * never `Promise` with implicit rejection.
 */

// Errors
export type { AppError, InfrastructureError, ValidationError } from './errors/app-error.js'
export { infrastructureError, validationError } from './errors/app-error.js'

// Repository ports
export type { IRepository, UpdateParams } from './repositories/base.repository.js'
export type {
  IUserRepository,
  CreateUserInput,
  UserWithPassword,
} from './repositories/user.repository.js'

// Service ports
export type { IEmailService, SendVerificationParams } from './services/email.service.js'
export type {
  IPasswordService,
  HashPasswordParams,
  VerifyPasswordParams,
} from './services/password.service.js'
export type {
  ITokenService,
  GenerateTokenParams,
  VerifyTokenParams,
  TokenPayload,
} from './services/token.service.js'
