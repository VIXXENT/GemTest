import { errAsync, okAsync } from 'neverthrow'
import type { ResultAsync } from 'neverthrow'
import { userNotFound } from '@gemtest/domain'
import type { UserEntity } from '@gemtest/domain'
import type { AppError, IUserRepository } from '@gemtest/core'

// ---------------------------------------------------------------------------
// Dependency types
// ---------------------------------------------------------------------------

/**
 * Dependencies required by the GetUser use case.
 */
type GetUserDeps = {
  readonly userRepository: IUserRepository
}

// ---------------------------------------------------------------------------
// Parameter types
// ---------------------------------------------------------------------------

/**
 * Parameters accepted by the GetUser execute function.
 */
type GetUserParams = {
  readonly id: string
}

// ---------------------------------------------------------------------------
// Use case factory
// ---------------------------------------------------------------------------

/**
 * Factory for the GetUser use case.
 *
 * Finds a user by ID and returns the domain entity.
 * Returns a UserNotFound error when no record exists for the given ID.
 *
 * Why a factory: Deps injected once, execute fn stays pure and testable.
 * Why UserEntity return: Mapping to presentation types (PublicUser) is the
 * responsibility of the resolver/adapter layer, not the use case.
 *
 * @param deps - Port interfaces needed to find a user.
 * @returns An execute function that resolves to a UserEntity or AppError.
 */
export const getUserUseCase: (
  deps: GetUserDeps,
) => (params: GetUserParams) => ResultAsync<UserEntity, AppError> = (deps) => {
  const { userRepository } = deps

  return (params) => {
    const { id } = params

    return userRepository.findById(id).andThen((entity) => {
      if (entity === null) {
        return errAsync(userNotFound(id))
      }
      return okAsync(entity)
    })
  }
}
