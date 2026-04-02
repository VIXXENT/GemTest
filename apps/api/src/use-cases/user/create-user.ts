import type { AppError, IUserRepository } from '@voiler/core'
import type { UserEntity } from '@voiler/domain'
import type { ResultAsync } from 'neverthrow'

/**
 * Dependencies injected into the createUser use case.
 */
interface CreateUserDeps {
  readonly userRepository: IUserRepository
}

/**
 * Parameters for creating a new user.
 *
 * @remarks
 * Password handling is managed by Better Auth via its
 * own signup endpoint. This use case creates the user
 * profile only (admin-level user creation).
 */
interface CreateUserParams {
  readonly name: string
  readonly email: string
}

/**
 * Factory that builds a use case for creating a new user.
 *
 * Delegates persistence to the repository.
 * Duplicate-email detection is handled by the database
 * unique constraint (repository returns InfrastructureError).
 *
 * @remarks
 * Passwords are managed by Better Auth — this use case
 * only handles user profile creation.
 */
export const createCreateUser: (
  deps: CreateUserDeps,
) => (params: CreateUserParams) => ResultAsync<UserEntity, AppError> = (deps) => (params) => {
  const { userRepository } = deps
  const { name, email } = params

  return userRepository.create({
    data: {
      name,
      email,
      role: 'user',
    },
  })
}
