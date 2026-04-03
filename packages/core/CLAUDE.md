# @voiler/core

Core layer -- port interfaces and application error union. Depends only on `@voiler/domain` and `neverthrow`.

## Key Files

| File                                  | Purpose                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| `src/errors/app-error.ts`             | AppError union (DomainError + InfrastructureError + ValidationError) |
| `src/repositories/user.repository.ts` | IUserRepository port interface                                       |

## Rules

- Defines **port interfaces** that adapters implement.
- Never imports concrete implementations (DB drivers, HTTP clients).
- All repository methods return `ResultAsync<T, AppError>`.

## Commands

```bash
pnpm --filter @voiler/core typecheck   # Type check
```

See [../../docs/architecture.md] and [../../docs/error-handling.md].
