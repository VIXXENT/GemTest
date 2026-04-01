# Voiler — Implementation Plans Overview

> **For agentic workers:** This document defines 6 implementation plans and their contracts.
> Each plan produces working, testable software. Plans execute sequentially (A → B → C → D → E → F).
> Before writing detailed plans, verify all contracts are compatible.

**Goal:** Build Voiler boilerplate from scratch with new stack (TanStack Start + tRPC + Hono + Better Auth + Drizzle + PostgreSQL/SQLite + Paraglide)

**Spec:** `docs/superpowers/specs/2026-03-30-voiler-boilerplate-design.md`

---

## Plan Dependency Graph

```
A (Foundation) ──→ B (tRPC + Domain) ──→ C (Auth) ──→ D (Frontend) ──→ E (Infra) ──→ F (Docs)
                         │                    │              │
                         └── packages/*       └── auth API   └── SSR routes
```

Each plan builds on the previous. At the end of each plan, all tests pass and the project is in a deployable state (for what exists so far).

---

## Plan A: Foundation

### What It Builds

Monorepo skeleton with Hono server, Drizzle dual-driver (SQLite dev / PostgreSQL prod), shared packages, tooling gates, and a running `/health` endpoint.

### Entry State

Empty repository (or fresh clone of boilerplate template).

### Exit State

- `docker compose up db` starts PostgreSQL on port 5432
- `pnpm dev` starts Hono server on port 4000 (connects to local PostgreSQL)
- `GET /health` returns `{ status: "ok", uptime: N, db: "connected" }`
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck` all pass

### Contract Exposed

```typescript
// packages/config-env — validated environment
type EnvConfig = {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_URL: string       // PostgreSQL connection string (all envs)
  AUTH_SECRET: string
}
export const loadEnv: () => EnvConfig

// packages/schema — Zod source of truth (empty User for now)
export const UserSchema: z.ZodObject<...>
export type User = z.infer<typeof UserSchema>

// packages/domain — empty barrel (entities, errors, value objects added in Plan B)
// packages/core — empty barrel (ports added in Plan B)

// apps/api — Hono server
// Exports nothing; runs as standalone HTTP server
// GET /health — JSON health check
// Drizzle db instance available internally

// Tooling
// pnpm lint       — ESLint (strict: typedef, no-any, max-params, no-semicolons)
// pnpm format     — Prettier write
// pnpm format:check — Prettier check (CI gate)
// pnpm typecheck  — tsc --noEmit across all packages
// pnpm test       — Vitest (no tests yet, but runner configured)
```

### Files Created

```
voiler/
  package.json                    # Root workspace config
  pnpm-workspace.yaml
  turbo.json
  tsconfig.json                   # Root tsconfig references
  eslint.config.mjs               # Strict ESLint config
  prettier.config.mjs             # Prettier config
  .env.example
  apps/
    api/
      package.json
      tsconfig.json
      src/
        index.ts                  # Hono server entry
        db/
          index.ts                # Drizzle client (dual-driver)
          schema.ts               # Drizzle table definitions
        http/
          health.ts               # GET /health handler
          index.ts                # HTTP router barrel
  packages/
    config-ts/                    # Shared tsconfig (base.json)
    config-env/                   # Zod env validation
      src/
        schema.ts
        load-env.ts
        index.ts
    schema/                       # Zod schemas (User entity)
      src/
        entities/user.ts
        index.ts
    domain/                       # Empty barrel (populated in Plan B)
      src/index.ts
    core/                         # Empty barrel (populated in Plan B)
      src/index.ts
    ui/                           # Empty barrel (populated in Plan D)
      src/index.ts
```

---

## Plan B: tRPC + Hexagonal Domain

### What It Builds

tRPC router, domain entities with branded types, port interfaces, use cases, adapters, and DI container. Complete hexagonal architecture with a working CRUD API for Users.

### Entry State

Plan A complete — Hono server running, DB connected, tooling gates passing.

### Exit State

- tRPC endpoint at `/trpc` with User CRUD operations
- `pnpm test` runs Vitest unit tests for domain + use-cases (all pass)
- Full hexagonal flow: tRPC router → use case → ports → adapters → DB
- Structured logging: every request gets a `requestId`, logs to `audit_log` table
- Log rolling: entries older than 30 days auto-deleted
- tRPC guard middleware: `publicProcedure`, `authedProcedure`, `adminProcedure`, `devProcedure`

### Contract Exposed

```typescript
// packages/domain
export type UserEntity = {
  readonly id: UserId
  readonly email: Email
  readonly name: string
  readonly role: string
  readonly createdAt: Date
}
export type UserId = Brand<string, 'UserId'>
export type Email = Brand<string, 'Email'>
export type Password = Brand<string, 'Password'>
export type DomainError =
  | InvalidEmail
  | InvalidPassword
  | WeakPassword
  | UserNotFound
  | UserAlreadyExists
// Constructors: createUserId, createEmail, createPassword
// Error constructors: invalidEmail, invalidPassword, etc.

// packages/core
export type AppError = DomainError | InfrastructureError | ValidationError
export type IUserRepository = {
  create: (data: CreateUserInput) => ResultAsync<UserEntity, AppError>
  findAll: () => ResultAsync<UserEntity[], AppError>
  findById: (id: string) => ResultAsync<UserEntity | null, AppError>
  findByEmail: (email: Email) => ResultAsync<UserEntity | null, AppError>
  update: (params: UpdateParams<UserEntity>) => ResultAsync<UserEntity, AppError>
  delete: (id: string) => ResultAsync<boolean, AppError>
}
export type IPasswordService = {
  hash: (params: { plaintext: string }) => ResultAsync<string, AppError>
  verify: (params: { plaintext: string; hash: string }) => ResultAsync<boolean, AppError>
}
export type ITokenService = {
  generate: (params: { sub: UserId; expiresInSeconds: number }) => ResultAsync<string, AppError>
  verify: (params: { token: string }) => ResultAsync<TokenPayload, AppError>
}

// packages/schema
export const CreateUserInputSchema: z.ZodObject<{ name; email; password }>
export const LoginInputSchema: z.ZodObject<{ email; password }>
export const PublicUserSchema: z.ZodObject<{ id; name; email; role; createdAt }>
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>
export type LoginInput = z.infer<typeof LoginInputSchema>
export type PublicUser = z.infer<typeof PublicUserSchema>

// apps/api — tRPC router
// POST /trpc/user.create   { name, email, password } → PublicUser
// GET  /trpc/user.list     → PublicUser[]
// GET  /trpc/user.getById  { id } → PublicUser | null
// POST /trpc/auth.login    { email, password } → { token, user }

// apps/api — tRPC guard middleware
const publicProcedure // no auth required
const authedProcedure // rejects 401 if no session
const adminProcedure // rejects 403 if role !== 'admin'
const devProcedure // rejects 403 if role !== 'dev'

// apps/api — structured logging
// Hono middleware: requestId, method, path, status, durationMs
// Use-case interceptor: useCase, action, entityId, userId
// Storage: audit_log table (auto-cleanup > 30 days)

// apps/api — container.ts
export const container: {
  createUser: (params: CreateUserInput) => ResultAsync<UserEntity, AppError>
  getUser: (params: { id: string }) => ResultAsync<UserEntity | null, AppError>
  listUsers: () => ResultAsync<UserEntity[], AppError>
  authenticate: (params: LoginInput) => ResultAsync<AuthResult, AppError>
}
```

### Contract Consumed (from Plan A)

- `loadEnv()` for DATABASE_URL, AUTH_SECRET
- Drizzle `db` instance
- Hono app instance (to mount tRPC adapter)
- `UserSchema` from `packages/schema`

### Files Created/Modified

```
apps/api/src/
  trpc/
    context.ts              # tRPC context creation (req → { db, user? })
    router.ts               # Root tRPC router
    procedures/
      user.ts               # User CRUD procedures
      auth.ts               # Auth procedures (login)
    index.ts                # tRPC barrel + Hono adapter mount
  use-cases/
    user/create-user.ts
    user/get-user.ts
    user/list-users.ts
    auth/authenticate.ts
    index.ts
  adapters/
    db/drizzle-user-repository.ts
    auth/argon2-password-service.ts
    auth/jwt-token-service.ts
    index.ts
  logging/
    request-logger.ts         # Hono middleware (requestId, timing, path)
    use-case-logger.ts        # Use-case interceptor (action, entityId)
    audit-log.repository.ts   # Writes to audit_log table
    cleanup.ts                # Delete entries > 30 days
  container.ts

packages/domain/src/
  entities/user.ts
  value-objects/email.ts, password.ts, user-id.ts
  errors/domain-error.ts
  types/brand.ts
  index.ts

packages/core/src/
  repositories/base.repository.ts, user.repository.ts
  services/password.service.ts, token.service.ts
  errors/app-error.ts
  index.ts

packages/schema/src/
  inputs/create-user.ts, login.ts, update-user.ts
  outputs/public-user.ts, auth-response.ts
  index.ts (updated)
```

---

## Plan C: Better Auth

### What It Builds

Better Auth integration with Hono server, database session management, social OAuth (Google, GitHub), tRPC context enrichment, multi-device session management, and admin user impersonation.

### Entry State

Plan B complete — tRPC router working, User CRUD functional, container wired.

### Exit State

- `POST /api/auth/sign-up` creates user via Better Auth
- `POST /api/auth/sign-in` returns session cookie
- `GET /api/auth/session` returns current session
- OAuth flows configured (Google, GitHub — env vars optional)
- tRPC context includes `user` and `session` when authenticated
- Protected tRPC procedures reject unauthenticated requests
- Multi-device session management: list, revoke one, revoke all
- Admin impersonation: impersonate user, banner, stop, audit logged
- User schema extended via Better Auth `additionalFields` (role, etc.)

### Contract Exposed

```typescript
// apps/api — Better Auth instance
export const auth: BetterAuth // configured with Drizzle + plugins

// apps/api/src/trpc/context.ts — enriched context
type TRPCContext = {
  db: DrizzleDB
  user: User | null // populated from Better Auth session
  session: Session | null
}

// Auth API routes (Better Auth handles these):
// POST /api/auth/sign-up/email    { name, email, password }
// POST /api/auth/sign-in/email    { email, password }
// GET  /api/auth/session          → { user, session } | null
// POST /api/auth/sign-out
// GET  /api/auth/callback/google  (OAuth callback)
// GET  /api/auth/callback/github  (OAuth callback)

// Session management (Better Auth plugin):
// GET  /api/auth/sessions            → Session[] (all devices)
// POST /api/auth/revoke-session      { sessionId } → void
// POST /api/auth/revoke-all-sessions → void (except current)

// Impersonation (Better Auth plugin, admin-only):
// POST /api/auth/impersonate    { userId } → session as target user
// POST /api/auth/stop-impersonating → restore admin session

// Better Auth client (for frontend — Plan D consumes this)
// @voiler/auth package or inline in apps/api
export const authClient: ReturnType<typeof createAuthClient>
```

### Contract Consumed (from Plan B)

- Hono app instance (to mount auth routes)
- Drizzle `db` instance (Better Auth generates its own tables)
- `loadEnv()` for AUTH_SECRET
- tRPC context creation function (to inject user/session)

### Files Created/Modified

```
apps/api/src/
  auth/
    index.ts                # Better Auth instance configuration
    plugins.ts              # Auth plugins (optional: 2FA, magic-link)
  trpc/
    context.ts              # Modified: adds user/session from auth
    middleware.ts            # Protected procedure middleware
    procedures/
      user.ts               # Modified: protected routes require auth
  index.ts                  # Modified: mount auth routes on Hono

packages/schema/src/
  entities/auth.ts          # Better Auth table schemas (if extending)
```

---

## Plan D: TanStack Start Frontend

### What It Builds

TanStack Start application with SSR, tRPC client, Better Auth client integration, Paraglide i18n, shadcn/ui components, and Playwright E2E tests.

### Entry State

Plan C complete — API fully functional with auth, tRPC, and DB.

### Exit State

- `pnpm dev` starts both API (port 4000) and web (port 3000) via Turborepo
- SSR landing page renders
- Login/Register forms work via Better Auth client
- Authenticated users see dashboard with user list (tRPC query)
- Session persists across page reloads
- Locale switching works (Paraglide, default: English)
- Dev Menu accessible via `Ctrl+Shift+D` for dev/admin roles (log toggles, ID display)
- Route guards: unauthenticated → redirect to login, `<RoleGate>` hides content by role
- Session management UI: view active devices, revoke sessions
- Impersonation banner when admin is impersonating
- `pnpm test:e2e` runs Playwright tests (auth flow + smoke)

### Contract Exposed

```typescript
// apps/web — TanStack Start app
// Routes:
//   /                    → Landing page (SSR)
//   /dashboard           → Authenticated dashboard (user list)
//   /auth/login          → Login form
//   /auth/register       → Register form
//   /settings/sessions   → Active sessions management
//   /admin/users         → Admin user list (with impersonate button)

// Route guards (TanStack Start beforeLoad):
// /dashboard, /settings/* → redirect to /auth/login if unauthenticated
// /admin/*                → redirect to /dashboard if role !== 'admin'

// Component guards:
// <RoleGate role="admin">  — renders children only if role matches
// <RoleGate role="dev">    — renders children only if role matches
// <ImpersonationBanner />  — shows "Impersonating: X — Stop" when active

// Dev Menu (Ctrl+Shift+D, role-gated: dev | admin):
// - Log level toggles per category
// - Entity ID display toggle
// - Request inspector (last N tRPC calls)

// tRPC client (consumes API from Plan B)
import { trpc } from '~/lib/trpc'
// trpc.user.list.useQuery()
// trpc.user.create.useMutation()

// Better Auth client (consumes auth from Plan C)
import { authClient } from '~/lib/auth'
// authClient.signIn.email({ email, password })
// authClient.signUp.email({ name, email, password })
// authClient.session()
// authClient.signOut()

// i18n (Paraglide)
import * as m from '~/paraglide/messages'
// m.welcome({ appName: '...' })
// m.login()
```

### Contract Consumed (from Plan C)

- tRPC router at `http://localhost:4000/trpc`
- Better Auth API at `http://localhost:4000/api/auth/*`
- Session cookie set by auth API

### Files Created

```
apps/web/
  package.json
  tsconfig.json
  app.config.ts               # TanStack Start config (Nitro/Vite)
  vite.config.ts               # Vite + Paraglide plugin
  src/
    routes/
      __root.tsx               # Root layout (providers, nav)
      index.tsx                # Landing page (SSR)
      dashboard.tsx            # Authenticated dashboard
      auth/
        login.tsx              # Login form
        register.tsx           # Register form
      settings/
        sessions.tsx           # Active sessions management
      admin/
        users.tsx              # Admin user list + impersonate
    components/
      AuthForm.tsx
      UserList.tsx
      NavBar.tsx
      RoleGate.tsx             # Conditional render by role
      ImpersonationBanner.tsx  # "Impersonating X — Stop" bar
      dev-menu/
        DevMenu.tsx            # Main dev panel (Ctrl+Shift+D)
        tools/
          LogLevelToggle.tsx   # Console log level per category
          IdDisplayToggle.tsx  # Show entity IDs in UI
          RequestInspector.tsx # Last N tRPC requests
      LocaleSwitcher.tsx
    lib/
      trpc.ts                  # tRPC client setup
      auth.ts                  # Better Auth client setup
  messages/
    en.json                    # English translations (default)
  e2e/
    smoke.spec.ts
    auth.spec.ts
  playwright.config.ts         # With webServer auto-start
```

---

## Plan E: Infrastructure

### What It Builds

Docker setup, CI/CD pipeline, init script, optional modules scaffolding, AGENTS.md, and llms.txt.

### Entry State

Plan D complete — full-stack app running (API + web + auth + i18n).

### Exit State

- `docker compose up` starts full stack (PostgreSQL + API + web) for dev
- `pnpm preview` builds and runs in Docker identically to production
- GitHub Actions CI runs all gates on push/PR
- `pnpm create-project` initializes a new project from boilerplate
- `modules/payments/`, `modules/email/`, `modules/admin/` present but disconnected (code marker pattern)
- `AGENTS.md` and `llms.txt` exist at root

### Contract Exposed

```
# Docker
docker compose up              → PostgreSQL + API + web (dev, hot reload)
docker compose -f docker-compose.prod.yml up → PostgreSQL + API (prod, built)
pnpm preview                   → Build + run in Docker like production (local validation)

# Init script
pnpm create-project            → Interactive project scaffolding
  - Renames @voiler/* to @<scope>/*
  - Connects selected modules
  - Removes unselected modules
  - Updates .env.example

# Module system
modules/<name>/
  module.json                  # Declarative integration manifest
  src/                         # Module source code
  CLAUDE.md                    # Agent guide for this module

# AI agent files
AGENTS.md                      # Open standard (6 core areas)
llms.txt                       # Machine-readable project summary
```

### Contract Consumed (from all previous plans)

- Full project structure (apps/api, apps/web, packages/\*)
- package.json names (`@voiler/*`) for rename logic
- container.ts, tRPC router (for module connection points)
- .env.example (for module env vars)

### Files Created

```
Dockerfile
docker-compose.yml
docker-compose.prod.yml
.github/workflows/ci.yml
scripts/
  create-project.ts            # Init script
AGENTS.md
llms.txt
modules/
  payments/
    module.json
    src/...
    CLAUDE.md
  email/
    module.json
    src/...
    CLAUDE.md
  admin/
    module.json
    src/...
    CLAUDE.md
```

---

## Plan F: Documentation

### What It Builds

Complete AI-first documentation: root CLAUDE.md hub, detail docs, ADRs, \_agents/ role files, and module CLAUDE.md files.

### Entry State

Plan E complete — everything built, infra in place.

### Exit State

- `CLAUDE.md` < 200 lines, links to all docs
- `GEMINI.md` symlink
- 7 detail docs + 4 ADRs in `docs/`
- 6 agent role files in `_agents/`
- Module CLAUDE.md in every package
- All success criteria from spec met

### Contract Exposed

```
CLAUDE.md                       # Navigation hub < 200 lines
GEMINI.md                       # Symlink → CLAUDE.md
docs/
  architecture.md               # Hexagonal layers, data flow
  code-standards.md             # All coding mandates with examples
  error-handling.md             # neverthrow patterns, tagged unions
  auth.md                       # Better Auth setup, session flow
  testing.md                    # Vitest + Playwright + TDD workflow
  observability.md              # Logs, health check, monitoring
  project-mgmt.md              # GitHub Issues, labels, workflow
  decisions/
    001-hexagonal-architecture.md
    002-neverthrow-over-trycatch.md
    003-zod-single-source-of-truth.md
    004-trpc-over-graphql.md
    005-better-auth-over-authjs.md
    006-hono-over-express.md
_agents/
  orchestrator.md, architect.md, developer.md
  reviewer.md, qa-designer.md, tester.md
  README.md
```

### Contract Consumed (from all plans)

- Actual file structure, package names, config files
- Real code patterns for examples in docs
- Tech decisions for ADRs

---

## Contract Compatibility Matrix

| Producer → Consumer            | Interface                                               | Compatible? |
| ------------------------------ | ------------------------------------------------------- | ----------- |
| A(config-env) → B(container)   | `loadEnv()` → `DATABASE_URL`, `AUTH_SECRET`             | ✅          |
| A(db) → B(adapters)            | Drizzle `db` instance (PostgreSQL)                      | ✅          |
| A(hono) → B(trpc)              | Hono app → `app.route('/trpc', trpcHandler)`            | ✅          |
| A(schema) → B(domain)          | `UserSchema` → `UserEntity` (independent types)         | ✅          |
| A(docker) → A(db)              | `docker compose up db` → PostgreSQL on :5432            | ✅          |
| B(trpc guards) → C(auth)       | `authedProcedure` checks `ctx.session` from auth        | ✅          |
| B(container) → C(auth)         | Use cases unchanged; auth enriches tRPC context         | ✅          |
| B(logging) → B(trpc)           | Request middleware injects `requestId` in context       | ✅          |
| A(hono) → C(auth)              | Hono app → `app.route('/api/auth', authHandler)`        | ✅          |
| A(db) → C(auth)                | Drizzle `db` → Better Auth uses same instance           | ✅          |
| C(sessions) → D(frontend)      | Session API → settings/sessions page                    | ✅          |
| C(impersonation) → D(frontend) | Impersonate API → ImpersonationBanner                   | ✅          |
| B(trpc) → D(frontend)          | tRPC router type → `createTRPCClient<AppRouter>`        | ✅          |
| C(auth) → D(frontend)          | Auth API → `createAuthClient({ baseURL })`              | ✅          |
| B(trpc guards) → D(RoleGate)   | Backend rejects → frontend hides (defense in depth)     | ✅          |
| B(logging) → D(dev-menu)       | Request data → RequestInspector (via tRPC client state) | ✅          |
| A-D(\*) → E(docker)            | All apps/packages → Dockerfile build                    | ✅          |
| A-D(\*) → E(init)              | `@voiler/*` names + `[MODULE:x]` markers → init script  | ✅          |
| A-D(\*) → E(preview)           | Built images → `pnpm preview` validates prod-like       | ✅          |
| A-E(\*) → F(docs)              | Real code → documentation examples                      | ✅          |

### Resolved Design Decisions

1. **PostgreSQL everywhere** — No dual-driver. One schema (`drizzle-orm/pg-core`), one driver, all environments. Dev via `docker compose up db`.

2. **Better Auth owns User** — Better Auth generates user/session/account tables. Extended via `additionalFields` (e.g., `role`). Domain `UserEntity` maps from auth's user type.

3. **Cross-origin dev, same-origin prod** — Dev: Hono CORS allows `localhost:3000` → `:4000`. Prod: reverse proxy (Caddy/nginx) puts both under one domain. Boilerplate includes Caddy config example.

4. **Code markers for modules** — `// [MODULE:payments]` comment pattern. Init script activates (uncomment) or removes (delete line). Deterministic, no AST manipulation.

5. **Audit log rolling** — `audit_log` entries older than 30 days auto-deleted via scheduled cleanup (cron job or Better Auth scheduler).
