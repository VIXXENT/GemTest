import type { ResultAsync } from 'neverthrow'
import type { Email } from '@gemtest/domain'
import type { AppError } from '../errors/app-error.js'

// ---------------------------------------------------------------------------
// Parameter types
// ---------------------------------------------------------------------------

/**
 * Parameters required to send a verification email.
 *
 * Why: A single object parameter keeps the function signature stable when
 * new fields (e.g. locale, templateId) are added later without breaking
 * call sites.
 */
export type SendVerificationParams = {
  /** Validated, branded email address of the recipient. */
  readonly to: Email
  /** One-time verification token to embed in the email link. */
  readonly token: string
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * Hexagonal port for email delivery.
 *
 * Why: Isolates the application layer from the concrete email transport
 * (SMTP, SendGrid, Resend, etc.). Adapters in the infrastructure layer
 * implement this interface and are injected at runtime.
 */
export type IEmailService = {
  /**
   * Sends a verification email containing a one-time token link.
   *
   * @param params - Recipient address and token to embed.
   * @returns `ResultAsync` resolving to `void` on success, or an `AppError`
   *          if delivery fails (network error, rate limit, etc.).
   */
  sendVerification: (params: SendVerificationParams) => ResultAsync<void, AppError>
}
