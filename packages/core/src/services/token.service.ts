import type { UserId } from "@voiler/domain"
import type { ResultAsync } from "neverthrow"

import type { AppError } from "../errors/app-error"

/**
 * Decoded token payload returned by verification.
 */
export interface TokenPayload {
  readonly sub: string
  readonly iat: number
  readonly exp: number
}

/**
 * Port interface for token generation and verification.
 *
 * Adapters (e.g. jose, jsonwebtoken) implement this contract.
 */
export interface ITokenService {
  /** Generate a signed token for the given subject. */
  generate: (
    params: { sub: UserId; expiresInSeconds: number },
  ) => ResultAsync<string, AppError>

  /** Verify a token and return its decoded payload. */
  verify: (
    params: { token: string },
  ) => ResultAsync<TokenPayload, AppError>
}
