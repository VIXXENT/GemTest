# AGENTS.md — Voiler AI Agent Guide

Voiler is an AI-first fullstack monorepo boilerplate for web applications.
Optimized for AI-agent-driven development with a hexagonal architecture.

## Project Overview

Voiler provides a production-ready foundation with:

- SSR-capable frontend via TanStack Start (React 19 + Vite + Nitro)
- Type-safe API via tRPC + Hono (port 4000)
- Auth via Better Auth (sessions, OAuth Google/GitHub, impersonation)
- PostgreSQL database with Drizzle ORM (pg-core)
- Zod as the single validation source of truth
- neverthrow for explicit error handling (no throw/try-catch in business logic)
- Turborepo + pnpm monorepo

## Architecture — Hexagonal Layers

```
packages/domain       ← Entities, branded value objects, domain errors (no infra imports)
packages/core         ← Port interfaces (IUserRepository, IPasswordService, ITokenService), AppError
packages/schema       ← Zod schemas for inputs, outputs, DB tables
packages/config-env   ← Zod-validated environment variables
apps/api              ← Hono server, tRPC router, use cases, adapters, container.ts (DI root)
apps/web              ← TanStack Start, auth forms, dashboard, i18n
```

### Data Flow

```
HTTP request
  → Hono middleware (security, CORS, logging)
  → tRPC router (parse input with Zod schema)
  → Use case (domain logic, returns Result<T,E>)
  → Adapter (implements port interface)
  → Database (Drizzle + PostgreSQL)
```

### Dependency Rules

- `domain` imports nothing from infra or app layers
- `core` imports only `domain`
- Use cases depend only on port interfaces from `core`
- `container.ts` is the ONLY file that imports concrete adapters and wires dependencies
- tRPC routers are thin: parse input → call use case → return result

## Development Workflow

### Setup

```bash
cp .env.example .env           # Edit AUTH_SECRET
docker compose up db -d        # Start PostgreSQL (dev)
pnpm install                   # Install all dependencies
pnpm --filter @voiler/api db:push  # Push schema to DB
```

### Dev Commands

```bash
pnpm --filter @voiler/api dev  # API (port 4000, hot reload)
pnpm --filter @voiler/web dev  # Web (port 3000, hot reload)
docker compose up --build      # Full stack via Docker
pnpm preview                   # Prod-like Docker build
```

### Verification Checklist (run after EVERY task)

```bash
pnpm lint           # ESLint strict — 0 errors
pnpm typecheck      # tsc --noEmit — 0 errors
pnpm test           # Vitest unit tests — all passing
pnpm format:check   # Prettier — all files formatted
```

Run E2E tests if runtime code changed (requires dev server running):

```bash
pnpm test:e2e       # Playwright E2E
```

## Coding Standards

### Style

- No semicolons — project-wide
- Arrow functions mandatory for logic and components
- `const` over `let`, no object/array mutation
- Trailing commas in all multi-line structures
- Max 100 character lines
- Max 1 parameter per arrow function — always wrap in object: `({ id, name }) =>`

### TypeScript

- `any` is forbidden. Casting (`as any`, `as unknown`) is forbidden.
- Explicit type annotations on ALL `const` declarations
  - Exception: Zod schemas use `// eslint-disable-next-line @typescript-eslint/typedef`
- Parameter types defined separately, destructure in function body
- Explicit return types on all exported functions
- JSDoc on all exported functions

### Example — Correct Pattern

```typescript
// eslint-disable-next-line @typescript-eslint/typedef
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type CreateUserInput = z.infer<typeof createUserSchema>

/**
 * Creates a new user in the system.
 */
const createUser = ({
  input,
  repo,
}: {
  input: CreateUserInput
  repo: IUserRepository
}): ResultAsync<User, AppError> => {
  // ...
}
```

## Error Handling

All fallible functions must return `Result<T, E>` or `ResultAsync<T, E>` from neverthrow.
`throw` and `try-catch` are **forbidden** for business logic.

```typescript
import { ok, err, ResultAsync } from 'neverthrow'

const findUser = ({ id }: { id: UserId }): ResultAsync<User, AppError> =>
  ResultAsync.fromPromise(
    repo.findById({ id }),
    () => new AppError({ tag: 'NOT_FOUND', message: 'User not found' }),
  )

// Consuming:
const result = await findUser({ id })
result.match(
  (user) => {
    /* success */
  },
  (error) => {
    /* error — exhaustive by tag */
  },
)
```

AppError uses tagged unions for exhaustive error handling. Never swallow errors silently.

## Testing

- **Unit tests:** Vitest — co-located with source (`*.test.ts`) or in `__tests__/`
- **E2E tests:** Playwright — in `apps/web/e2e/`
- **TDD preferred** — write tests before implementation
- Tests cover: domain logic, use cases (with mocked ports), adapters (with test DB)

```bash
pnpm test            # All Vitest unit tests
pnpm test:e2e        # Playwright (requires running dev server)
```

## Auth — Better Auth

Better Auth handles authentication with:

- **Sessions** — server-side session management with secure cookies
- **OAuth** — Google and GitHub providers
- **Impersonation** — admin can impersonate any user (audit logged)

Auth state is available in tRPC context via `ctx.session` and `ctx.user`.
Protected procedures use the `protectedProcedure` builder.
Auth routes are mounted at `/api/auth/*` on the Hono server.

## Package Naming

All packages use the `@voiler/` scope:

| Package              | Description                            |
| -------------------- | -------------------------------------- |
| `@voiler/domain`     | Entities, value objects, domain errors |
| `@voiler/core`       | Port interfaces, AppError              |
| `@voiler/schema`     | Zod schemas                            |
| `@voiler/config-env` | Environment variable validation        |
| `@voiler/api`        | Hono + tRPC server                     |
| `@voiler/web`        | TanStack Start frontend                |
