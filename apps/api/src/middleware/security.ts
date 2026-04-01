import type { MiddlewareHandler } from 'hono'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'

/**
 * Secure HTTP headers middleware.
 * Sets OWASP-recommended headers: HSTS, CSP, X-Content-Type-Options,
 * X-Frame-Options, Referrer-Policy, and Permissions-Policy.
 *
 * @returns Hono middleware handler that sets security headers on every response.
 */
const securityHeaders = (): MiddlewareHandler => {
  return secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
  })
}

interface CsrfMiddlewareParams {
  allowedOrigins: string[]
}

/**
 * CSRF protection middleware.
 * Validates Origin header on mutation requests (POST, PUT, PATCH, DELETE).
 *
 * @param params - Object containing allowed origins for CSRF validation.
 * @returns Hono middleware handler for CSRF protection.
 */
const csrfProtection = (params: CsrfMiddlewareParams): MiddlewareHandler => {
  const { allowedOrigins } = params

  return csrf({ origin: allowedOrigins })
}

export { securityHeaders, csrfProtection }
