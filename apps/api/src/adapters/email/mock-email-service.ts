import { okAsync } from 'neverthrow'
import type { ResultAsync } from 'neverthrow'
import type { IEmailService, SendVerificationParams } from '@gemtest/core'
import type { AppError } from '@gemtest/core'

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Creates a mock `IEmailService` that logs verification emails to the console
 * instead of sending real emails.
 *
 * Why: During development and testing, we need an implementation of
 * `IEmailService` that satisfies the port contract without requiring
 * SMTP credentials or an external email provider. All send operations
 * succeed immediately and log their parameters for inspection.
 *
 * @returns An object implementing `IEmailService`.
 */
export const createMockEmailService: () => IEmailService = () => ({
  /**
   * Simulates sending a verification email by logging to console.
   *
   * @param params - Recipient address and one-time token.
   * @returns `ResultAsync` that always resolves to `void`.
   */
  sendVerification: (params: SendVerificationParams): ResultAsync<void, AppError> => {
    const { to, token } = params
    console.info('[MockEmailService] Sending verification email', { to, token })
    return okAsync(undefined)
  },
})
