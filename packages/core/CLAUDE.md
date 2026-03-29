# @gemtest/core

Hexagonal port definitions for the application layer.

## Purpose

Pure interface package — zero infrastructure dependencies.
Defines all ports (repository + service contracts) and the `AppError` union.

## State

- `IRepository<T, CreateInput>` — generic CRUD port, all methods return `ResultAsync<T, AppError>`.
- `IUserRepository` — extends `IRepository<UserEntity, CreateUserInput>` with `findByEmail`.
- `AppError` — discriminated union: `DomainError | InfrastructureError | ValidationError`.
- `IEmailService` — port for email delivery (sendVerification).
- `IPasswordService` — port for password hashing/verification (hash, verify).
- `ITokenService` — port for token generation/verification (generate, verify).

## Source layout

```
src/
  errors/
    app-error.ts         # AppError union + InfrastructureError + ValidationError
  repositories/
    base.repository.ts   # IRepository<T, CreateInput> generic port
    user.repository.ts   # IUserRepository port
  services/
    email.service.ts     # IEmailService port
    password.service.ts  # IPasswordService port
    token.service.ts     # ITokenService port
  index.ts               # Barrel re-exports
```

## Dependencies

- `@gemtest/domain` — domain types (UserEntity, UserId, Email, DomainError, …)
- `neverthrow` — ResultAsync

## Rules

- No `throw` or `try/catch` — all errors via `ResultAsync`.
- No ORM, no DB drivers, no HTTP clients.
- All parameter types defined separately (never inline).
- JSDoc on every exported type and function.
