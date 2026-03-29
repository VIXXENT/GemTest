/**
 * Generic branded type utility.
 *
 * Why: Branded types add a phantom tag to a primitive so that two structurally
 * identical types (e.g., Email and Password — both strings) are incompatible
 * at compile time. The brand exists only in the type system; zero runtime cost.
 */
export type Brand<T, B> = T & { readonly __brand: B }
