/**
 * Use-cases barrel — application layer entry point.
 *
 * Re-exports all use case factories so consumers import from a single
 * location rather than navigating the internal directory structure.
 *
 * Why: A single import surface makes it straightforward to wire use cases
 * in resolvers and simplifies refactoring of the internal layout.
 */

export { createUserUseCase } from './user/create-user.js'
export { getUserUseCase } from './user/get-user.js'
export { listUsersUseCase } from './user/list-users.js'
export { authenticateUseCase } from './auth/authenticate.js'
export type { AuthResult } from './auth/authenticate.js'
