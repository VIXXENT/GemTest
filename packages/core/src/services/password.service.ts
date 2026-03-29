import type { ResultAsync } from 'neverthrow'
import type { AppError } from '../errors/app-error.js'

// ---------------------------------------------------------------------------
// Parameter types
// ---------------------------------------------------------------------------

/**
 * Parameters required to hash a plain-text password.
 *
 * Why: Wrapping the plain-text string in an object makes it explicit at the
 * call site what is being passed, reducing the chance of argument ordering
 * mistakes.
 */
export type HashPasswordParams = {
  /** Plain-text password to hash (never stored or logged). */
  readonly plaintext: string
}

/**
 * Parameters required to verify a plain-text password against a stored hash.
 */
export type VerifyPasswordParams = {
  /** Plain-text password provided by the user during sign-in. */
  readonly plaintext: string
  /** Previously hashed value stored in the database. */
  readonly hash: string
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * Hexagonal port for password hashing and verification.
 *
 * Why: Decouples the application layer from the concrete hashing algorithm
 * (bcrypt, argon2, scrypt, etc.). The infrastructure adapter is injected at
 * runtime, making it easy to swap algorithms or upgrade cost factors without
 * touching business logic.
 */
export type IPasswordService = {
  /**
   * Hashes a plain-text password using the configured algorithm.
   *
   * @param params - Object containing the plain-text password.
   * @returns `ResultAsync` resolving to the hash string, or an `AppError`
   *          if hashing fails (e.g. internal crypto error).
   */
  hash: (params: HashPasswordParams) => ResultAsync<string, AppError>

  /**
   * Checks whether a plain-text password matches a stored hash.
   *
   * @param params - Object containing the plain-text password and the hash.
   * @returns `ResultAsync` resolving to `true` if they match, `false` if not,
   *          or an `AppError` on unexpected failure.
   */
  verify: (params: VerifyPasswordParams) => ResultAsync<boolean, AppError>
}
