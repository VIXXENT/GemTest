import type { ResultAsync } from 'neverthrow'
import type { UserId } from '@gemtest/domain'
import type { AppError } from '../errors/app-error.js'

// ---------------------------------------------------------------------------
// Payload & parameter types
// ---------------------------------------------------------------------------

/**
 * Decoded payload extracted from a verified token.
 *
 * Why: A dedicated type makes it explicit what data is available after
 * verification, avoiding reliance on `any`-typed JWT library returns.
 */
export type TokenPayload = {
  /** Branded user identifier embedded in the token. */
  readonly sub: UserId
  /** Token expiration timestamp (Unix seconds). */
  readonly exp: number
  /** Token issued-at timestamp (Unix seconds). */
  readonly iat: number
}

/**
 * Parameters required to generate a signed token.
 */
export type GenerateTokenParams = {
  /** The subject (user) the token is issued for. */
  readonly sub: UserId
  /** Token lifetime in seconds (e.g. 3600 for 1 hour). */
  readonly expiresInSeconds: number
}

/**
 * Parameters required to verify a token string.
 */
export type VerifyTokenParams = {
  /** The raw token string received from the client. */
  readonly token: string
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * Hexagonal port for token generation and verification.
 *
 * Why: Isolates the application layer from the concrete token implementation
 * (JWT, PASETO, opaque tokens, etc.). Adapters in the infrastructure layer
 * implement this interface and are injected at runtime.
 */
export type ITokenService = {
  /**
   * Generates a signed token for the given subject.
   *
   * @param params - Subject user ID and desired expiration duration.
   * @returns `ResultAsync` resolving to the signed token string, or an
   *          `AppError` if signing fails.
   */
  generate: (params: GenerateTokenParams) => ResultAsync<string, AppError>

  /**
   * Verifies a token and returns its decoded payload.
   *
   * @param params - Object containing the raw token string.
   * @returns `ResultAsync` resolving to the `TokenPayload` if the token is
   *          valid and unexpired, or an `AppError` if it is invalid, expired,
   *          or tampered.
   */
  verify: (params: VerifyTokenParams) => ResultAsync<TokenPayload, AppError>
}
