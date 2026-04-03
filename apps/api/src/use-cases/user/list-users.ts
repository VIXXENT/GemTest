import type { AppError, IUserRepository, PaginationParams } from '@voiler/core'
import type { UserEntity } from '@voiler/domain'
import type { ResultAsync } from 'neverthrow'

/**
 * Dependencies injected into the listUsers use case.
 */
interface ListUsersDeps {
  readonly userRepository: IUserRepository
}

/**
 * Parameters for the listUsers use case.
 */
interface ListUsersParams {
  readonly pagination: PaginationParams
}

/**
 * Factory that builds a use case for retrieving users
 * with pagination.
 */
export const createListUsers: (
  deps: ListUsersDeps,
) => (params: ListUsersParams) => ResultAsync<UserEntity[], AppError> = (deps) => (params) => {
  const { userRepository } = deps

  return userRepository.findAll({
    pagination: params.pagination,
  })
}
