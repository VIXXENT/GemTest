/**
 * @module use-cases
 *
 * Business logic layer. Each use case depends only on
 * port interfaces from @voiler/core — never on concrete
 * adapters. All use cases return ResultAsync<T, AppError>.
 */

// Auth
export { createAuthenticate } from './auth/authenticate.js'
export type { AuthResult } from './auth/authenticate.js'

// User
export { createCreateUser } from './user/create-user.js'
export { createGetUser } from './user/get-user.js'
export { createListUsers } from './user/list-users.js'
