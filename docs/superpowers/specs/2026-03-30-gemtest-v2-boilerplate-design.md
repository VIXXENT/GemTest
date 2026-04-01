# GemTest v2 — AI-First Boilerplate Design Spec

## Overview

GemTest v2 is a fullstack TypeScript monorepo boilerplate optimized for AI-agent-driven development. Each new project is an independent Git copy of this template. The boilerplate provides a solid architectural foundation (hexagonal architecture, type safety, error handling) that agents can parse, understand, and extend in a single context window.

## Target User

- Solo developer working with AI coding agents (Claude Code, Codex, Copilot)
- Building web applications: with frontend (landing + app) or without (API-only)
- Self-hosted or PaaS deployment — no vendor lock-in

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | TanStack Start | SSR + SPA hybrid, Vite-based, zero lock-in, typed routes |
| API | tRPC + Hono | End-to-end type safety without codegen + ultralight multi-runtime server |
| Auth | Better Auth | TS-first, plugin system, zero adapter code, Hono native |
| ORM | Drizzle | Same API for SQLite (dev) and PostgreSQL (prod) |
| DB (all envs) | PostgreSQL | One driver everywhere — dev via Docker, free and open source |
| Validation | Zod | Single source of truth for types |
| Error handling | neverthrow | Result/ResultAsync, no throw in business logic |
| Monorepo | Turborepo + pnpm | Proven, fast, well-supported |
| Unit tests | Vitest | Fast, Vite-native, compatible with monorepo |
| E2E tests | Playwright | Browser automation with webServer auto-start |
| Format | Prettier | Enforced style — prevents agent drift |
| UI | Tailwind CSS + shadcn/ui | Utility CSS + accessible components |
| i18n | Paraglide JS | Compile-time, zero runtime overhead, type-safe, tree-shakes unused strings |

## Architecture

### Hexagonal (Ports & Adapters)

```
PRIMARY ADAPTERS       TanStack Start routes (SSR pages)
                       tRPC router (type-safe API endpoints)
          |
APPLICATION LAYER      Use cases (pure orchestration via port interfaces)
          |
DOMAIN + PORTS         packages/domain/ (entities, value objects, domain errors)
                       packages/core/ (port interfaces, AppError union)
          |
SECONDARY ADAPTERS     Drizzle repositories, Better Auth, external services
          |
COMPOSITION ROOT       apps/api/src/container.ts (single DI wiring point)
```

### Key Invariants

- `container.ts` is the ONLY file that imports concrete adapter classes
- Use cases depend solely on port interfaces from `@gemtest/core`
- tRPC routers are thin: parse input, call use case, return result
- Domain layer has zero infrastructure imports
- All fallible operations return `Result<T, E>` or `ResultAsync<T, E>`

## Monorepo Structure

```
gemtest-v2/
  apps/
    api/                    # Hono server + tRPC router + Better Auth
      src/
        adapters/           # Secondary adapters (Drizzle, external services)
        use-cases/          # Application layer
        trpc/               # tRPC router definitions (thin layer)
        http/               # REST routes (health, webhooks)
        container.ts        # DI composition root
        index.ts            # Hono server entry point
    web/                    # TanStack Start frontend
      src/
        routes/             # File-based SSR routes
        components/         # React components
        lib/                # tRPC client, Better Auth client, utils
      e2e/                  # Playwright E2E tests

  packages/
    domain/                 # Entities, value objects, domain errors (zero deps)
    core/                   # Port interfaces, AppError union (neverthrow only)
    schema/                 # Zod schemas (source of truth), inputs, outputs
    config-env/             # Zod env validation with fail-fast
    ui/                     # Shared UI components (shadcn/ui)
    config-ts/              # Shared TypeScript config

  modules/                  # Optional modules (present but not connected)
    payments/               # Stripe subscriptions, webhooks, billing portal
    email/                  # Resend transactional emails
    admin/                  # Admin dashboard panel

  _agents/                  # Multi-agent role definitions
  docs/                     # Progressive disclosure documentation
  scripts/                  # Init script, dev runner, utilities
```

## AI-First Documentation System

### Files at Root

| File | Purpose | Audience |
|------|---------|----------|
| `CLAUDE.md` | Navigation hub < 200 lines, critical mandates | Claude Code, Cursor |
| `AGENTS.md` | Open standard (Linux Foundation) — six core areas | Codex, Copilot, Kilo, any agent |
| `GEMINI.md` | Symlink to CLAUDE.md | Gemini CLI |
| `llms.txt` | Machine-readable project summary | LLM crawlers, agent discovery |

### AGENTS.md Structure (Six Core Areas)

1. **Commands** — `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`
2. **Testing** — Vitest for unit, Playwright for E2E, TDD workflow
3. **Project structure** — Monorepo layout, package responsibilities, file conventions
4. **Code style** — No semicolons, typedef on all const, max 1 param, trailing commas
5. **Git workflow** — Branch per issue, PR with reviewer, commit message format
6. **Boundaries** — Files to never touch, architectural invariants, what NOT to build

### Progressive Disclosure Tiers

| Tier | Content | When Loaded |
|------|---------|-------------|
| Hot (always) | CLAUDE.md, AGENTS.md | Every session start |
| Domain (on task) | docs/*.md, _agents/*.md, module CLAUDE.md | When working in relevant area |
| Cold (on demand) | ADRs, module.json, detailed guides | When agent needs specific reference |

### Multi-Agent System (_agents/)

Six roles with explicit handoff contracts:

- `orchestrator.md` — Human interface, GitHub coordination, no code
- `architect.md` — Plan creation, PR architecture review
- `developer.md` — Code implementation, restricted from test files
- `reviewer.md` — CLAUDE.md compliance checklist, approve/reject PR
- `qa-designer.md` — Test plan design, TDD coordination
- `tester.md` — Test implementation, restricted to test files

## Init Script

### Purpose

One-time project creation tool. Runs after cloning the boilerplate. Irreversible — the resulting project has no awareness of being a boilerplate.

### Flow

```
$ pnpm create-project

? Project name: my-saas-app
? Package scope (e.g., @my-saas-app): @myapp
? Select modules to include:
  [x] Auth (Better Auth) — always included
  [ ] Payments (Stripe integration)
  [ ] Email (Resend transactional emails)
  [ ] Admin panel
? Database for production: PostgreSQL (default) / SQLite (Turso)

Processing...
  -> Renaming @gemtest/* to @myapp/* across all package.json and imports
  -> Installing selected modules (connecting imports, routes, container deps)
  -> Removing unselected modules (deleting folders, cleaning references)
  -> Updating .env.example with selected module vars
  -> Done!

Run `pnpm dev` to start.
```

### Module Definition (module.json)

Each optional module declares its integration points:

```json
{
  "name": "payments",
  "description": "Stripe subscriptions, webhooks, billing portal",
  "dependencies": {
    "stripe": "^17.0.0"
  },
  "files": {
    "source": "modules/payments/src/",
    "target": "apps/api/src/modules/payments/"
  },
  "connect": {
    "container": "apps/api/src/container.ts",
    "routes": "apps/api/src/trpc/index.ts",
    "env": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]
  },
  "cleanup": {
    "remove": ["modules/payments/"],
    "unregister": ["container.payments", "trpcRouter.payments"]
  }
}
```

## Auth (Better Auth)

### Why Better Auth Over Auth.js

- Zero adapter code — point at DB, it generates tables
- Hono native — passes Web Request directly, no wrapper
- TypeScript-first — inferred types, no module augmentation hacks
- Plugin system — 2FA, magic links, passkeys, organizations are opt-in
- Database sessions by default (more secure than JWT-only)

### Integration Pattern

```
Browser → TanStack Start → Better Auth client (session check)
                             ↓
API requests → Hono → Better Auth middleware (session from cookies)
                        ↓
               tRPC context receives { user, session }
                        ↓
               Use cases receive user info via params
```

## Database Strategy

### PostgreSQL Everywhere

One database engine, one driver, one schema — zero ambiguity across environments.

| Environment | Database | How |
|------------|----------|-----|
| Development | PostgreSQL 16 | `docker compose up db` (local container) |
| Test | PostgreSQL 16 | Same container, separate test database or transaction rollback |
| Production | PostgreSQL 16 | Self-hosted or managed (Railway, Supabase, Neon, etc.) |

**Why not SQLite for dev?** Drizzle uses different schema modules per driver (`sqlite-core` vs `pg-core`). Maintaining dual schemas adds complexity and risk of drift. One driver everywhere is simpler.

**Critical rule:** Only use PostgreSQL-compatible column types. No database-specific extensions unless explicitly documented as a project decision.

### Schema as Code

Drizzle schema defined in `packages/schema/` using `drizzle-orm/pg-core`. Zod remains the source of truth for validation; Drizzle owns the table definitions. Migrations generated via `drizzle-kit generate` and applied via `drizzle-kit push`.

## Docker

### Files

```
Dockerfile                   # Multi-stage: deps → build → prod
docker-compose.yml           # Dev: PostgreSQL + API + web (hot reload)
docker-compose.prod.yml      # Prod: PostgreSQL + API (built)
docker-compose.preview.yml   # Local prod-like: built app + PostgreSQL (for testing)
.env.example                 # All env vars documented
```

### Preview Script

`pnpm preview` builds the project and runs it in Docker exactly as production:

```bash
# Builds images, starts PostgreSQL + API + web (built, no hot reload)
docker compose -f docker-compose.preview.yml up --build
```

This validates: Dockerfile works, migrations run, env vars are correct, SSR renders — before deploying to real production.

### Production Image

```dockerfile
# Stage 1: Install deps
FROM node:20-alpine AS deps
# ...pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS build
# ...turbo run build

# Stage 3: Production
FROM node:20-alpine AS prod
# ...copy built artifacts, expose port
CMD ["node", "apps/api/dist/index.js"]
```

## CI Gates

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint              # ESLint strict
      - run: pnpm format:check      # Prettier
      - run: pnpm typecheck          # tsc --noEmit all packages
      - run: pnpm test              # Vitest unit tests
      - run: npx playwright install --with-deps chromium
      - run: pnpm test:e2e          # Playwright with webServer auto-start
```

## Code Standards (Inherited from v1)

All standards from the current CLAUDE.md carry forward:

- No `any`, no casting (except branded types at boundary)
- Arrow functions mandatory
- `const` over `let`, no mutation
- neverthrow for all fallible operations
- JSDoc on all exported functions
- Parameter types defined separately, destructure in body
- No semicolons, trailing commas, max 100 char lines
- Explicit type annotations on all `const` declarations

## i18n (Paraglide JS)

### Why Built-in

Retrofitting i18n into a live project requires touching every hardcoded string — tedious and error-prone. Paraglide JS makes it zero-cost to include from day one:

- **Compile-time**: Translations become typed functions (`m.welcome({ name })`), not runtime lookups
- **Zero overhead with 1 language**: Tree-shaking removes all switching/detection code
- **Type-safe**: Missing translations or wrong params caught at compile time
- **TanStack Start native**: Official Vite plugin, SSR-compatible, cookie-based locale detection

### Single-Language Experience

With only one language (`messages/en.json`), the developer experience is:
- Write `m.buttonLabel()` instead of `"Button Label"` — slightly more explicit, fully typed
- No locale switcher, no detection middleware, no URL prefixes
- Build output identical to hardcoded strings (compiled away)

### Adding a Second Language

1. Create `messages/es.json` (or any locale)
2. Translate keys (Paraglide CLI can auto-translate via Google Cloud Translation)
3. Add a locale switcher component
4. Done — no refactoring of existing code needed

## Dev Menu

An in-app developer panel accessible only to users with `dev` or `admin` role. Designed to be extensible — new tools can be added over time.

### Built-in Tools

- **Log level toggles** — Switch console log verbosity (off / error / warn / info / debug) per category (network, auth, state)
- **ID display** — Show entity IDs alongside names throughout the UI (useful for debugging API calls)
- **Request inspector** — Show last N tRPC requests/responses inline (like a lightweight network tab)

### Design

- Activated via keyboard shortcut (e.g., `Ctrl+Shift+D`) or floating button — only visible if user has `dev` role
- Frontend-only panel (reads from tRPC client state, console interceptor)
- Extensible: each tool is a registered component, new ones added by dropping a file in `src/components/dev-menu/tools/`
- Persists preferences in localStorage
- Never shipped to production users — tree-shaken or role-gated at render time

## Guards (Auth + Role Protection)

### Backend Guards (tRPC middleware)

```typescript
// Stacking: publicProcedure → authedProcedure → adminProcedure
const publicProcedure = t.procedure
const authedProcedure = publicProcedure.use(authGuard)     // rejects if no session
const adminProcedure = authedProcedure.use(roleGuard('admin'))  // rejects if role !== 'admin'
const devProcedure = authedProcedure.use(roleGuard('dev'))
```

- `authGuard` — checks `ctx.session` exists, returns 401 if not
- `roleGuard(role)` — checks `ctx.user.role`, returns 403 if insufficient
- Guards are composable: stack as many as needed per procedure

### Frontend Guards (Route middleware)

- TanStack Start `beforeLoad` on route definitions — redirect to `/auth/login` if unauthenticated
- Component-level `<RoleGate role="admin">` wrapper — hides content if role doesn't match
- No security through obscurity — backend guards are the real protection, frontend guards are UX

## Structured Logging

### What Gets Logged

Every HTTP request to the backend generates a structured log entry:

| Field | Description |
|-------|-------------|
| `requestId` | UUID v4 — same ID across all logs for one request (correlation) |
| `timestamp` | ISO 8601 |
| `method` | HTTP method (GET, POST, etc.) |
| `path` | Request path (`/trpc/user.create`, `/api/auth/sign-in`) |
| `status` | Response status code |
| `durationMs` | Request → response time |
| `userId` | Authenticated user ID (if any) |
| `useCase` | Use case name executed (e.g., `createUser`, `authenticate`) |
| `action` | Semantic action tag: `user.create`, `user.delete`, `auth.login`, `auth.logout` |
| `entityId` | ID of the created/modified/deleted entity (not the full object) |
| `level` | `info` for success, `warn` for client errors (4xx), `error` for server errors (5xx) |

### What Does NOT Get Logged

- Full request/response bodies (privacy + size)
- Complex nested objects — only their ID
- Passwords, tokens, secrets (never)

### Storage

- **Target:** Database table (`audit_log`) — queryable, structured, easy to export
- **Format:** JSON columns for extensibility
- **Log rolling:** Entries older than 30 days automatically deleted via scheduled cleanup (cron or Better Auth's built-in scheduler)

### Implementation

- Hono middleware captures `requestId`, timing, method, path, status
- Use-case interceptor (wrapper in container) captures `useCase`, `action`, `entityId`
- Both write to same `audit_log` table correlated by `requestId`

## Multi-Device Session Management

Leverages Better Auth's session management plugin.

### Features

- **View active sessions** — list all sessions for current user (device, IP, last active, current indicator)
- **Revoke single session** — close a specific session on another device
- **Revoke all sessions** — nuclear option: close everything except current
- **Session metadata** — user agent, IP address, last activity timestamp

### Integration

Better Auth stores sessions in the database by default. The plugin adds:
- `GET /api/auth/sessions` — list active sessions
- `POST /api/auth/revoke-session` — revoke by session ID
- `POST /api/auth/revoke-all-sessions` — revoke all except current

Frontend: a "Sessions" tab in user settings showing active devices.

## User Impersonation

Admin-only feature. Leverages Better Auth's impersonation plugin.

### Flow

1. Admin clicks "Impersonate" on a user in the admin panel
2. Better Auth creates a temporary session as that user
3. Admin sees the app exactly as that user would (role, data, permissions)
4. A persistent banner shows "Impersonating: [user name] — Stop" at the top
5. Clicking "Stop" returns to the admin's original session

### Safety

- Only users with `admin` role can impersonate
- Impersonation is logged in `audit_log` with action `admin.impersonate` and both user IDs
- Original admin session is preserved (not destroyed)
- Impersonated session has a short TTL (e.g., 1 hour)

## What Is NOT In Scope

- Multi-tenancy (added per-project if needed)
- Real-time/WebSocket (added per-project)
- Mobile app support (web only)
- Specific business domain logic

## Success Criteria

1. Agent can read CLAUDE.md + AGENTS.md and understand the full project in < 2 minutes
2. `pnpm create-project` produces a clean, working project in < 30 seconds
3. `pnpm dev` starts both API and web with hot reload
4. `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` all pass on fresh clone
5. Docker build produces working production image
6. Adding a new use case (entity + CRUD) takes < 1 agent session
7. All module CLAUDE.md < 200 lines
8. Zero `any` types in codebase
