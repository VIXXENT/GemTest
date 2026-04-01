import type { ITokenService, TokenPayload } from '@voiler/core'
import { infrastructureError } from '@voiler/core'
import { SignJWT, jwtVerify } from 'jose'
import { ResultAsync } from 'neverthrow'

/**
 * Parameters for creating a JwtTokenService.
 */
interface CreateJwtTokenServiceParams {
  secret: string
}

/**
 * Create a jose-backed implementation of ITokenService.
 *
 * Uses the jose library for JWT signing and verification,
 * wrapped in ResultAsync for safe error propagation.
 */
const createJwtTokenService: (params: CreateJwtTokenServiceParams) => ITokenService = (params) => {
  const encodedSecret: Uint8Array = new TextEncoder().encode(params.secret)

  const generate: ITokenService['generate'] = (generateParams) => {
    const nowSeconds: number = Math.floor(Date.now() / 1000)

    return ResultAsync.fromPromise(
      new SignJWT({
        sub: String(generateParams.sub),
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(nowSeconds)
        .setExpirationTime(nowSeconds + generateParams.expiresInSeconds)
        .sign(encodedSecret),
      (cause) =>
        infrastructureError({
          message: 'Failed to generate JWT',
          cause,
        }),
    )
  }

  const verify: ITokenService['verify'] = (verifyParams) => {
    return ResultAsync.fromPromise(
      jwtVerify(verifyParams.token, encodedSecret).then((result) => {
        const payload: TokenPayload = {
          sub: result.payload.sub ?? '',
          iat: result.payload.iat ?? 0,
          exp: result.payload.exp ?? 0,
        }

        return payload
      }),
      (cause) =>
        infrastructureError({
          message: 'Failed to verify JWT',
          cause,
        }),
    )
  }

  return { generate, verify }
}

export { createJwtTokenService }
export type { CreateJwtTokenServiceParams }
