# @voiler/schema

Single source of truth for all database tables and validation schemas. Drizzle owns table definitions, Zod owns validation rules.

## Key Files

| File                         | Purpose                                                    |
| ---------------------------- | ---------------------------------------------------------- |
| `src/entities/user.ts`       | User table (Drizzle) + select/insert schemas (drizzle-zod) |
| `src/entities/auth.ts`       | Session, Account, Verification tables (Better Auth)        |
| `src/entities/audit-log.ts`  | AuditLog table                                             |
| `src/inputs/create-user.ts`  | CreateUserInputSchema (tRPC input validation)              |
| `src/inputs/update-user.ts`  | UpdateUserInputSchema                                      |
| `src/inputs/pagination.ts`   | PaginationInputSchema                                      |
| `src/outputs/public-user.ts` | PublicUser schema (client-safe response)                   |

## Rules

- Types are inferred from schemas -- never manually defined.
- Shared by both API (Drizzle queries) and frontend (Zod validation).

## Commands

```bash
pnpm --filter @voiler/schema typecheck   # Type check
```

See [../../docs/architecture.md].
