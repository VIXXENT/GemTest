# @voiler/domain

Pure domain layer -- entities, value objects, and domain errors. **Zero infrastructure dependencies.**

## Key Files

| File                            | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `src/entities/user.ts`          | UserEntity type, UserRole                    |
| `src/value-objects/email.ts`    | Email branded type with validation           |
| `src/value-objects/password.ts` | Password branded type with strength rules    |
| `src/value-objects/user-id.ts`  | UserId branded type                          |
| `src/errors/domain-error.ts`    | DomainError tagged union + factory functions |
| `src/types/brand.ts`            | Brand utility type                           |
| `src/__tests__/`                | Unit tests for errors and value objects      |

## Rules

- This package must NEVER import infrastructure (DB, HTTP, etc.).
- Only depends on `neverthrow` for Result types.
- All value objects return `Result<T, DomainError>`.

## Commands

```bash
pnpm --filter @voiler/domain test      # Unit tests
pnpm --filter @voiler/domain typecheck # Type check
```

See [../../docs/architecture.md] and [../../docs/error-handling.md].
