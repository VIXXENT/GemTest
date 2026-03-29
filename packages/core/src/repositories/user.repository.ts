import type { ResultAsync } from 'neverthrow'
import type { UserEntity, Email } from '@gemtest/domain'
import type { AppError } from '../errors/app-error.js'
import type { IRepository } from './base.repository.js'

/**
 * Input required to create a new User.
 *
 * Why: Defined here in core rather than imported from @gemtest/schema so the
 * port stays framework-agnostic. Uses branded Email to guarantee the address
 * was validated before reaching the repository.
 */
export type CreateUserInput = {
  /** Validated, branded email address. */
  readonly email: Email
  /** Display name of the user. */
  readonly name: string
  /** Hashed password string (never a plain-text password). */
  readonly passwordHash: string
  /** Optional role string; defaults to 'user' when not provided. */
  readonly role?: string
}

/**
 * Hexagonal port for the User repository.
 *
 * Why: Extends the generic `IRepository` with user-specific lookup operations.
 * The concrete adapter (Drizzle + SQLite) will implement this interface in the
 * infrastructure layer, keeping the domain and service layers free of ORM code.
 */
export type IUserRepository = IRepository<UserEntity, CreateUserInput> & {
  /**
   * Looks up a user by their email address.
   *
   * @param email - The validated, branded email to search for.
   * @returns `ResultAsync` resolving to the `UserEntity` or `null` when no
   *          matching user exists, or an `AppError` on unexpected failure.
   */
  findByEmail: (email: Email) => ResultAsync<UserEntity | null, AppError>
}
