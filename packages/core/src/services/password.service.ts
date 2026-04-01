import type { ResultAsync } from 'neverthrow'

import type { AppError } from '../errors/app-error'

/**
 * Port interface for password hashing and verification.
 *
 * Adapters (e.g. argon2, bcrypt) implement this contract.
 */
export interface IPasswordService {
  /** Hash a plaintext password. */
  hash: (params: { plaintext: string }) => ResultAsync<string, AppError>

  /** Verify a plaintext password against a hash. */
  verify: (params: { plaintext: string; hash: string }) => ResultAsync<boolean, AppError>
}
