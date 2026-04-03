# Architecture

Voiler follows **hexagonal architecture** (ports and adapters). The domain layer is pure logic with zero infrastructure imports. Use cases depend only on port interfaces. Concrete adapters are wired in a single DI container file.

## Package Structure

```
voiler/
  apps/
    api/          -- Hono server, tRPC router, adapters, DI container
    web/          -- TanStack Start frontend (SSR + SPA)
  packages/
    domain/       -- Entities, value objects, domain errors (zero deps)
    core/         -- Port interfaces, AppError union (depends on domain)
    schema/       -- Drizzle tables + Zod schemas (single source of truth)
    config-env/   -- Zod-validated env config with fail-fast
    config-ts/    -- Shared tsconfig bases
    ui/           -- Shared UI components (Tailwind + shadcn/ui)
```

## Layer Dependency Rules

```
domain  <--  core  <--  apps/api
  (zero deps)  (ports only)  (adapters + wiring)
```

| Rule                     | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| Domain imports nothing   | Only TS stdlib, neverthrow for Result types                      |
| Core imports domain only | Defines port interfaces (e.g., `IUserRepository`)                |
| API imports everything   | Wires adapters to ports in `container.ts`                        |
| Schema is shared         | Used by both API (Drizzle queries) and frontend (Zod validation) |

## Data Flow

```
HTTP Request
  |
  v
Hono Middleware (rate limit, logging, security, CORS, CSRF, body limit)
  |
  v
Better Auth (/api/auth/**)  OR  tRPC Router (/trpc/*)
  |                                |
  v                                v
Session extraction           tRPC Procedure (input validation via Zod)
  |                                |
  v                                v
Context (db, requestId,      Use Case (pure logic, returns ResultAsync)
  user, session)                   |
                                   v
                             Repository Port (IUserRepository)
                                   |
                                   v
                             Drizzle Adapter (concrete DB implementation)
                                   |
                                   v
                             PostgreSQL
```

## Dependency Injection

`apps/api/src/container.ts` is the **only file** that imports concrete adapters:

```typescript
const createContainer: (params: CreateContainerParams) => Container = (params) => {
  const { db } = params

  // Concrete adapter -- only imported here
  const userRepository = createDrizzleUserRepository({ db })

  // Use cases receive ports, not implementations
  const rawCreateUser = createCreateUser({ userRepository })

  // Wrap with cross-cutting concerns (audit logging)
  const createUser = withAuditLog({
    name: 'user.create',
    useCase: rawCreateUser,
    getEntityId: (result) => String(result.id),
    db,
  })

  return { createUser /* ... */ }
}
```

## tRPC Routers Are Thin

Routers only: parse input, call use case, map result. No business logic:

```typescript
create: adminProcedure.input(CreateUserInputSchema).mutation(async (opts) => {
  const result = await createUser({
    name: opts.input.name,
    email: opts.input.email,
  })

  return result.match(
    (entity) => mapToPublicUser({ entity }),
    (error) => throwTrpcError({ error }),
  )
})
```

## Module Markers

Future modules use comment markers for activation:

```typescript
// [MODULE:payments] import { createStubPaymentService } from '@voiler/mod-payments'
// [MODULE:email] import { createStubEmailService } from '@voiler/mod-email'
```

Uncomment when the module is implemented. This keeps the container forward-compatible.
