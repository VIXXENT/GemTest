import type { Email, UserEntity, UserRole } from '@voiler/domain'
import type { ResultAsync } from 'neverthrow'

import type { AppError } from '../errors/app-error'

/**
 * Data required to persist a new user.
 *
 * @remarks
 * Passwords are handled by Better Auth in the `account` table.
 * This interface only covers user profile data.
 */
export interface CreateUserData {
  readonly name: string
  readonly email: string
  readonly role?: UserRole
}

/**
 * Data allowed when updating an existing user.
 */
export interface UpdateUserData {
  readonly name?: string
  readonly email?: string
  readonly role?: UserRole
}

/**
 * Port interface for user persistence.
 *
 * Adapters (e.g. Drizzle) implement this contract.
 * The core layer never imports concrete implementations.
 */
export interface IUserRepository {
  /** Persist a new user record. */
  create: (params: { data: CreateUserData }) => ResultAsync<UserEntity, AppError>

  /** Retrieve all users. */
  findAll: () => ResultAsync<UserEntity[], AppError>

  /** Find a user by their unique identifier. */
  findById: (params: { id: string }) => ResultAsync<UserEntity | null, AppError>

  /** Find a user by their email address. */
  findByEmail: (params: { email: Email }) => ResultAsync<UserEntity | null, AppError>

  /** Update an existing user record. */
  update: (params: { id: string; data: UpdateUserData }) => ResultAsync<UserEntity, AppError>

  /** Delete a user by their unique identifier. */
  delete: (params: { id: string }) => ResultAsync<boolean, AppError>
}
