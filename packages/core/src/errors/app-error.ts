import type { DomainError } from '@gemtest/domain'

// ---------------------------------------------------------------------------
// Infrastructure error
// ---------------------------------------------------------------------------

/**
 * Represents an unexpected failure in the infrastructure layer (DB, network,
 * file system, external service).
 *
 * Why: Separating infrastructure errors from domain errors lets callers
 * handle user-facing validation failures differently from unexpected system
 * failures, without relying on `instanceof` or thrown exceptions.
 */
export type InfrastructureError = {
  readonly tag: 'InfrastructureError'
  /** Human-readable description of what failed. */
  readonly message: string
  /** Original error caught from the infrastructure layer, if available. */
  readonly cause?: unknown
}

// ---------------------------------------------------------------------------
// Validation error
// ---------------------------------------------------------------------------

/**
 * Represents an input that failed structural or cross-field validation
 * at the application boundary (e.g. missing required field, type mismatch).
 *
 * Why: Distinguishes schema/input validation failures (which the caller can
 * show to the end user) from domain rule violations (`DomainError`) and
 * system failures (`InfrastructureError`).
 */
export type ValidationError = {
  readonly tag: 'ValidationError'
  /** Human-readable description of the validation failure. */
  readonly message: string
  /** Optional field name that caused the failure. */
  readonly field?: string
}

// ---------------------------------------------------------------------------
// AppError union
// ---------------------------------------------------------------------------

/**
 * Top-level application error union.
 *
 * Why: A single discriminated union enables exhaustive `switch (error.tag)`
 * handling across the entire call stack — domain, application, and
 * infrastructure errors are all represented without `throw`.
 *
 * Use `switch (error.tag)` or `.match()` to handle each variant.
 */
export type AppError = DomainError | InfrastructureError | ValidationError

// ---------------------------------------------------------------------------
// Constructor helpers
// ---------------------------------------------------------------------------

/** Parameters for {@link infrastructureError}. */
type InfrastructureErrorParams = {
  readonly message: string
  readonly cause?: unknown
}

/**
 * Creates an `InfrastructureError`.
 *
 * @param params - Object containing message and optional cause.
 * @returns An `InfrastructureError` value (never thrown).
 */
export const infrastructureError: (
  params: InfrastructureErrorParams,
) => InfrastructureError = (params) => {
  const { message, cause } = params
  return { tag: 'InfrastructureError', message, cause }
}

/** Parameters for {@link validationError}. */
type ValidationErrorParams = {
  readonly message: string
  readonly field?: string
}

/**
 * Creates a `ValidationError`.
 *
 * @param params - Object containing message and optional field name.
 * @returns A `ValidationError` value (never thrown).
 */
export const validationError: (
  params: ValidationErrorParams,
) => ValidationError = (params) => {
  const { message, field } = params
  return { tag: 'ValidationError', message, field }
}
