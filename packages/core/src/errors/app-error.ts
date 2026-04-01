import type { DomainError } from "@voiler/domain"

/**
 * An error originating from infrastructure (DB, network, etc.).
 */
export interface InfrastructureError {
  readonly tag: "InfrastructureError"
  readonly message: string
  readonly cause?: unknown
}

/**
 * An error caused by invalid input that failed validation.
 */
export interface ValidationError {
  readonly tag: "ValidationError"
  readonly message: string
  readonly field?: string
}

/**
 * Application-level error union.
 *
 * Superset of domain errors, extended with infrastructure
 * and validation variants for use in port return types.
 */
export type AppError =
  | DomainError
  | InfrastructureError
  | ValidationError

/**
 * Create an InfrastructureError.
 */
export const infrastructureError: (
  params: { message: string; cause?: unknown },
) => InfrastructureError = (params) => ({
  tag: "InfrastructureError",
  message: params.message,
  cause: params.cause,
})

/**
 * Create a ValidationError.
 */
export const validationError: (
  params: { message: string; field?: string },
) => ValidationError = (params) => ({
  tag: "ValidationError",
  message: params.message,
  field: params.field,
})
