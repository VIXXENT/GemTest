/**
 * Hono context variable type augmentation for auth.
 *
 * Extends Hono's ContextVariableMap to include `user` and
 * `session` extracted by the session middleware. These are
 * `null` for unauthenticated requests.
 */

/**
 * Auth user record as returned by Better Auth session API.
 * Matches Better Auth's internal User model with our
 * custom `role` field.
 *
 * @remarks
 * `role` is optional because it comes from `additionalFields`
 * and may not be present in the raw Better Auth return type.
 * `image` uses `undefined` union for optional DB columns.
 */
interface AuthUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly emailVerified: boolean
  readonly image?: string | null | undefined
  readonly role?: string | undefined
  readonly createdAt: Date
  readonly updatedAt: Date
}

/**
 * Auth session record as returned by Better Auth session API.
 *
 * @remarks
 * `impersonatedBy` is optional because it comes from the
 * admin plugin and may not be present in the base type.
 */
interface AuthSession {
  readonly id: string
  readonly expiresAt: Date
  readonly token: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly ipAddress?: string | null | undefined
  readonly userAgent?: string | null | undefined
  readonly userId: string
  readonly impersonatedBy?: string | null | undefined
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser | null
    session: AuthSession | null
  }
}

export type { AuthUser, AuthSession }
