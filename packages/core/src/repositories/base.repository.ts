import type { ResultAsync } from 'neverthrow'
import type { AppError } from '../errors/app-error.js'

/**
 * Parameters for the update operation.
 *
 * Why: Keeping id and data together in a single object enforces the
 * project mandate of single-parameter functions and avoids positional
 * argument confusion. Uses string id to align with UUID / branded UserId.
 */
export type UpdateParams<T> = {
  /** Unique identifier of the entity to update (UUID / branded string). */
  readonly id: string
  /** Partial entity fields to apply as the update. */
  readonly data: Partial<T>
}

/**
 * Generic hexagonal port for data-access repositories.
 *
 * Why: Defines a framework-agnostic contract so the domain and service
 * layers depend only on this interface, not on any ORM or DB driver.
 * All operations return `ResultAsync` so callers can handle errors
 * exhaustively without `try/catch`.
 *
 * @typeParam T          - The domain entity type this repository manages.
 * @typeParam CreateInput - The input shape required to create a new entity.
 */
export type IRepository<T, CreateInput> = {
  /**
   * Persists a new entity.
   *
   * @param data - The input data required to create the entity.
   * @returns `ResultAsync` resolving to the created entity, or an `AppError`
   *          if persistence fails (e.g. constraint violation, DB error).
   */
  create: (data: CreateInput) => ResultAsync<T, AppError>

  /**
   * Retrieves every entity of this type.
   *
   * @returns `ResultAsync` resolving to an array of entities, or an `AppError`
   *          if the query fails.
   */
  findAll: () => ResultAsync<T[], AppError>

  /**
   * Looks up a single entity by its unique identifier.
   *
   * @param id - UUID / branded string identifier.
   * @returns `ResultAsync` resolving to the entity or `null` when not found,
   *          or an `AppError` if the query fails unexpectedly.
   */
  findById: (id: string) => ResultAsync<T | null, AppError>

  /**
   * Applies a partial update to an existing entity.
   *
   * @param params - Object containing the entity `id` and the `data` patch.
   * @returns `ResultAsync` resolving to the updated entity, or an `AppError`
   *          if the entity does not exist or the update fails.
   */
  update: (params: UpdateParams<T>) => ResultAsync<T, AppError>

  /**
   * Removes an entity permanently.
   *
   * @param id - UUID / branded string identifier.
   * @returns `ResultAsync` resolving to `true` if deleted, `false` if the
   *          entity was not found, or an `AppError` on unexpected failure.
   */
  delete: (id: string) => ResultAsync<boolean, AppError>
}
