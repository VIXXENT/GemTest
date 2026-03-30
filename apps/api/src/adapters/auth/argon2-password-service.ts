import argon2 from 'argon2'
import { fromPromise } from 'neverthrow'
import type { ResultAsync } from 'neverthrow'
import type { IPasswordService, HashPasswordParams, VerifyPasswordParams } from '@gemtest/core'
import { infrastructureError } from '@gemtest/core'
import type { AppError } from '@gemtest/core'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Converts an unknown caught value into an infrastructure `AppError`.
 *
 * @param cause - The original error caught from argon2.
 * @returns An `AppError` tagged as `InfrastructureError`.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const toInfraError = (cause: unknown): AppError =>
  infrastructureError({ message: 'Password operation failed', cause })

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Creates an `IPasswordService` backed by the argon2 hashing library.
 *
 * Why: argon2id is the recommended algorithm for password hashing as of
 * OWASP guidelines (2023+). Using a factory keeps the adapter stateless
 * and injectable, enabling easy replacement for testing.
 *
 * @returns An object implementing `IPasswordService`.
 */
export const createArgon2PasswordService: () => IPasswordService = () => ({
  /**
   * Hashes a plain-text password using argon2id.
   *
   * @param params - Object containing the plain-text password.
   * @returns `ResultAsync` resolving to the hash string, or an `AppError` on failure.
   */
  hash: (params: HashPasswordParams): ResultAsync<string, AppError> => {
    const { plaintext } = params
    return fromPromise(
      argon2.hash(plaintext),
      toInfraError,
    )
  },

  /**
   * Verifies a plain-text password against a stored argon2 hash.
   *
   * @param params - Object containing the plain-text password and the stored hash.
   * @returns `ResultAsync` resolving to `true` if they match, `false` if not,
   *          or an `AppError` on unexpected failure.
   */
  verify: (params: VerifyPasswordParams): ResultAsync<boolean, AppError> => {
    const { plaintext, hash } = params
    return fromPromise(
      argon2.verify(hash, plaintext),
      toInfraError,
    )
  },
})
