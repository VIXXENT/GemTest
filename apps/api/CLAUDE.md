# @voiler/api

Hono HTTP server with tRPC router, Better Auth, and hexagonal DI container.

## Key Files

| File                   | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `src/index.ts`         | Server entrypoint, middleware stack, route wiring            |
| `src/container.ts`     | DI container -- only file importing concrete adapters        |
| `src/auth/index.ts`    | Better Auth factory (sessions, OAuth, admin plugin)          |
| `src/trpc/context.ts`  | tRPC context, procedure guards (public/authed/admin/dev)     |
| `src/trpc/router.ts`   | Root tRPC router composing sub-routers                       |
| `src/trpc/procedures/` | Sub-routers: user, session, admin, email, payments           |
| `src/use-cases/`       | Business logic factories (receive ports, return ResultAsync) |
| `src/adapters/`        | Concrete implementations of core ports (Drizzle)             |
| `src/logging/`         | Request logger, audit log, use-case logger, cleanup          |
| `src/middleware/`      | Security headers, CSRF, rate limiter                         |
| `src/http/health.ts`   | GET /health endpoint                                         |

## Commands

```bash
pnpm --filter @voiler/api dev       # Dev server (port 4000)
pnpm --filter @voiler/api db:push   # Push schema to DB
pnpm --filter @voiler/api test      # Unit tests
```

## Architecture

See [../../docs/architecture.md] and [../../docs/auth.md].
