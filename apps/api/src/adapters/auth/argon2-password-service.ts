import type { IPasswordService } from '@voiler/core'
import { infrastructureError } from '@voiler/core'
import argon2 from 'argon2'
import { ResultAsync } from 'neverthrow'

/**
 * Create an Argon2-backed implementation of IPasswordService.
 *
 * Uses the argon2 library for secure password hashing
 * and verification, wrapped in ResultAsync for safe
 * error propagation.
 */
const createArgon2PasswordService: () => IPasswordService = () => {
  const hash: IPasswordService['hash'] = (params) => {
    return ResultAsync.fromPromise(argon2.hash(params.plaintext), (cause) =>
      infrastructureError({
        message: 'Failed to hash password',
        cause,
      }),
    )
  }

  const verify: IPasswordService['verify'] = (params) => {
    return ResultAsync.fromPromise(argon2.verify(params.hash, params.plaintext), (cause) =>
      infrastructureError({
        message: 'Failed to verify password',
        cause,
      }),
    )
  }

  return { hash, verify }
}

export { createArgon2PasswordService }
