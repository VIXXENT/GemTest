/**
 * @module @voiler/core
 *
 * Core layer — port interfaces and application error union.
 * Depends only on @voiler/domain and neverthrow.
 */

// Application errors
export type { AppError, InfrastructureError, ValidationError } from './errors/app-error'
export { infrastructureError, validationError } from './errors/app-error'

// Repository ports
export type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from './repositories/user.repository'

// Service ports
export type { IPasswordService } from './services/password.service'
export type { ITokenService, TokenPayload } from './services/token.service'
