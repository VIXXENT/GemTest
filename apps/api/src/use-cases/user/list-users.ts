import type { ResultAsync } from 'neverthrow'
import type { UserEntity } from '@gemtest/domain'
import type { AppError, IUserRepository } from '@gemtest/core'

// ---------------------------------------------------------------------------
// Dependency types
// ---------------------------------------------------------------------------

/**
 * Dependencies required by the ListUsers use case.
 */
type ListUsersDeps = {
  readonly userRepository: IUserRepository
}

// ---------------------------------------------------------------------------
// Use case factory
// ---------------------------------------------------------------------------

/**
 * Factory for the ListUsers use case.
 *
 * Retrieves all users as domain entities.
 * Mapping to presentation types (PublicUser) is the responsibility of the
 * resolver/adapter layer, not the use case.
 *
 * Why a factory: Deps injected once, execute fn stays pure and testable.
 *
 * @param deps - Port interfaces needed to list users.
 * @returns An execute function that resolves to an array of UserEntity.
 */
export const listUsersUseCase: (
  deps: ListUsersDeps,
) => () => ResultAsync<UserEntity[], AppError> = (deps) => {
  const { userRepository } = deps

  return () => userRepository.findAll()
}
