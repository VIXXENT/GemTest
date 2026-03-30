import { SignJWT, jwtVerify } from 'jose'
import { fromPromise } from 'neverthrow'
import type { ResultAsync } from 'neverthrow'
import type {
  ITokenService,
  GenerateTokenParams,
  VerifyTokenParams,
  TokenPayload,
} from '@gemtest/core'
import { infrastructureError } from '@gemtest/core'
import type { AppError } from '@gemtest/core'
import type { UserId } from '@gemtest/domain'
import { createUserId } from '@gemtest/domain'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Converts an unknown caught value into an infrastructure `AppError`.
 *
 * @param cause - The original error caught from jose.
 * @returns An `AppError` tagged as `InfrastructureError`.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const toInfraError = (cause: unknown): AppError =>
  infrastructureError({ message: 'Token operation failed', cause })

// ---------------------------------------------------------------------------
// Deps type
// ---------------------------------------------------------------------------

/** Dependencies required by the JWT token service. */
type JwtTokenServiceDeps = {
  /** Raw AUTH_SECRET string used to sign and verify JWTs. */
  readonly secret: string
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Creates an `ITokenService` backed by the `jose` library using HS256.
 *
 * Why: `jose` is a well-maintained, standards-compliant JWT library that
 * works in Node.js and edge runtimes without native bindings. Using a factory
 * with injected `secret` makes the adapter easy to configure and test.
 *
 * @param deps - Object containing the JWT signing secret.
 * @returns An object implementing `ITokenService`.
 */
export const createJwtTokenService: (deps: JwtTokenServiceDeps) => ITokenService = (deps) => {
  const { secret } = deps
  // eslint-disable-next-line @typescript-eslint/typedef
  const secretBytes = new TextEncoder().encode(secret)

  return {
    /**
     * Signs and returns a JWT for the given subject user.
     *
     * @param params - Subject UserId and expiration duration in seconds.
     * @returns `ResultAsync` resolving to the signed JWT string, or an `AppError`.
     */
    generate: (params: GenerateTokenParams): ResultAsync<string, AppError> => {
      const { sub, expiresInSeconds } = params
      // eslint-disable-next-line @typescript-eslint/typedef
      const now = Math.floor(Date.now() / 1000)
      return fromPromise(
        (async (): Promise<string> => {
          const token: string = await new SignJWT({ sub: sub as string })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt(now)
            .setExpirationTime(now + expiresInSeconds)
            .sign(secretBytes)
          return token
        })(),
        toInfraError,
      )
    },

    /**
     * Verifies a JWT and extracts the decoded payload.
     *
     * @param params - Object containing the raw token string.
     * @returns `ResultAsync` resolving to `TokenPayload`, or an `AppError` if
     *          the token is invalid, expired, or tampered.
     */
    verify: (params: VerifyTokenParams): ResultAsync<TokenPayload, AppError> => {
      const { token } = params
      return fromPromise(
        (async (): Promise<TokenPayload> => {
          const result: Awaited<ReturnType<typeof jwtVerify>> = await jwtVerify(
            token,
            secretBytes,
          )
          const { payload } = result
          const sub: string = typeof payload.sub === 'string' ? payload.sub : ''
          const exp: number = typeof payload.exp === 'number' ? payload.exp : 0
          const iat: number = typeof payload.iat === 'number' ? payload.iat : 0
          const tokenPayload: TokenPayload = {
            sub: createUserId(sub) as UserId,
            exp,
            iat,
          }
          return tokenPayload
        })(),
        toInfraError,
      )
    },
  }
}
