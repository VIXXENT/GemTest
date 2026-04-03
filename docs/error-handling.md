# Error Handling

Voiler uses **neverthrow** for all fallible operations. `throw`/`try-catch` is forbidden for business logic. Errors are values, not exceptions.

## Core Principle

Every function that can fail returns `Result<T, E>` (sync) or `ResultAsync<T, E>` (async). Consumers handle both paths explicitly via `.match()`.

## DomainError -- Tagged Union

Domain errors are a discriminated union with a `tag` for exhaustive pattern matching:

```typescript
// packages/domain/src/errors/domain-error.ts
export type DomainError =
  | { readonly tag: 'InvalidEmail'; readonly message: string }
  | { readonly tag: 'InvalidPassword'; readonly message: string }
  | { readonly tag: 'InvalidUserId'; readonly message: string }
  | { readonly tag: 'WeakPassword'; readonly message: string }
  | { readonly tag: 'UserNotFound'; readonly message: string }
  | { readonly tag: 'UserAlreadyExists'; readonly message: string }
```

Factory functions create each variant:

```typescript
export const invalidEmail: (message: string) => DomainError = (message) => ({
  tag: 'InvalidEmail',
  message,
})
```

## AppError -- Extended Union

The core layer extends `DomainError` with infrastructure and validation variants:

```typescript
// packages/core/src/errors/app-error.ts
export type AppError = DomainError | InfrastructureError | ValidationError

export interface InfrastructureError {
  readonly tag: 'InfrastructureError'
  readonly message: string
  readonly cause?: unknown
}

export interface ValidationError {
  readonly tag: 'ValidationError'
  readonly message: string
  readonly field?: string
}
```

## Creating Results

Value objects return `Result` (sync):

```typescript
export const createEmail: (params: CreateEmailParams) => Result<Email, DomainError> = (params) => {
  const { value } = params
  const trimmed: string = value.trim().toLowerCase()

  if (!EMAIL_REGEX.test(trimmed)) {
    return err(invalidEmail('Invalid email address format'))
  }

  return ok(trimmed as Email)
}
```

Repository ports return `ResultAsync` (async):

```typescript
export interface IUserRepository {
  create: (params: { data: CreateUserData }) => ResultAsync<UserEntity, AppError>
  findById: (params: { id: string }) => ResultAsync<UserEntity | null, AppError>
}
```

## Consuming Results with `.match()`

tRPC procedures use `.match()` for exhaustive handling:

```typescript
const result = await createUser({ name: opts.input.name, email: opts.input.email })

return result.match(
  (entity) => mapToPublicUser({ entity }),
  (error) => throwTrpcError({ error }),
)
```

## Exhaustive Error Mapping

Map error tags to tRPC codes with a `switch` and `never` guard:

```typescript
const mapErrorCode: (params: { tag: AppError['tag'] }) => TRPCError['code'] = (params) => {
  switch (params.tag) {
    case 'UserNotFound':
      return 'NOT_FOUND'
    case 'UserAlreadyExists':
      return 'CONFLICT'
    case 'InvalidEmail':
    case 'InvalidPassword':
    case 'InvalidUserId':
    case 'WeakPassword':
    case 'ValidationError':
      return 'BAD_REQUEST'
    case 'InfrastructureError':
      return 'INTERNAL_SERVER_ERROR'
    default: {
      const _exhaustive: never = params.tag
      return _exhaustive
    }
  }
}
```

## Sanitizing Errors

Never leak infrastructure details to the client:

```typescript
const message: string =
  params.error.tag === 'InfrastructureError' ? 'Internal server error' : params.error.message
```

## What NOT to Do

```typescript
// FORBIDDEN -- throw in business logic
const createUser = (params) => {
  if (!valid) throw new Error('Invalid')
  // ...
}

// FORBIDDEN -- try-catch for flow control
try {
  const user = await getUser(id)
} catch (e) {
  // ...
}
```

The only place `throw` appears is in tRPC error boundaries (converting `AppError` to `TRPCError` at the adapter layer) and Better Auth admin procedures (which wrap external SDK calls).
