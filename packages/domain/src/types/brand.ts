/**
 * Branded type utility.
 *
 * Creates a nominal type by intersecting a base type with
 * a phantom readonly `__brand` property. This prevents
 * accidental assignment between structurally identical types.
 */
export type Brand<T, B extends string> = T & {
  readonly __brand: B
}
