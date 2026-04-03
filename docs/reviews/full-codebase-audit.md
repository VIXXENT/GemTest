# Full Codebase Audit -- Voiler Project

**Date:** 2026-04-02
**Auditor:** Claude Opus 4.6 (1M context)
**Branch:** `feat/plan-a-foundation`
**Commit:** `1dca022`

---

## Executive Summary

The Voiler codebase demonstrates strong architectural fundamentals: clean hexagonal layering, proper
use of neverthrow for error handling in the API, well-structured DI via container.ts, and good
security middleware. However, the audit uncovered several significant issues -- a critical security
gap in the user creation endpoint, multiple `as` casts in the frontend that bypass type safety,
missing database indexes on the audit_log table, try/catch usage in tRPC procedures that violates
the neverthrow mandate, and incomplete test coverage for several key areas.

Total findings: 5 Critical, 8 High, 12 Medium, 7 Low

---

## Findings

### [CRITICAL] SEC-01: User creation endpoint is public -- no authentication required

**File:** `apps/api/src/trpc/procedures/user.ts:89`
**Category:** Security
**Description:** The `user.create` mutation uses `publicProcedure`, meaning anyone on the internet
can create user records in the database without authentication. This is an admin-level operation
(creates user profiles directly in the DB) but has zero access control. An attacker could flood the
database with fake users, exhaust storage, or create accounts with specific emails to block
legitimate registrations (email uniqueness constraint).
**Fix:** Change `publicProcedure` to `adminProcedure` (or at minimum `authedProcedure`). User
self-registration should go through Better Auth's `/api/auth/sign-up` endpoint, not this tRPC
procedure. The JSDoc in `create-user.ts:27` already says "admin-level user creation" but the
procedure does not enforce it.

### [CRITICAL] SEC-02: Rate limiter uses last IP in X-Forwarded-For -- spoofable

**File:** `apps/api/src/middleware/rate-limiter.ts:35`
**Category:** Security
**Description:** The `keyGenerator` uses `ips?.at(-1)` (the last IP in X-Forwarded-For). In standard
proxy chains, the last IP is the one added by the most recent proxy. However, if no trusted proxy
is configured, an attacker can craft arbitrary `X-Forwarded-For` headers to bypass rate limiting
entirely by rotating fake IPs on every request. The comment says "set by the trusted reverse proxy"
but there is no trusted proxy configuration in the Hono app.
**Fix:** Either (a) configure Hono's `app.set('trust proxy', ...)` and use the first untrusted IP,
or (b) use `ips?.at(0)` which is the client IP when a single trusted proxy exists, or (c) fall back
to the connection remote address. Document the expected proxy topology. The current implementation
is trivially bypassable.

### [CRITICAL] SEC-03: CORS allows empty origins in production

**File:** `apps/api/src/index.ts:56-61`
**Category:** Security
**Description:** When `TRUSTED_ORIGINS` is not set and `NODE_ENV` is `production`, `allowedOrigins`
becomes an empty array `[]`. Hono's `cors()` middleware with an empty `origin` array will reject
all cross-origin requests, effectively breaking the frontend. However, the real risk is the opposite
scenario: if someone misconfigures and sets `NODE_ENV=development` in production (common mistake),
localhost origins are allowed, enabling CSRF from any local service.
**Fix:** Add a startup validation check: if `NODE_ENV === 'production'` and `TRUSTED_ORIGINS` is
empty, log a fatal error and exit. Do not silently default to empty. Add `TRUSTED_ORIGINS` as a
required field in `envSchema` when `NODE_ENV === 'production'` via a Zod `.refine()`.

### [CRITICAL] SEC-04: Admin page has client-side-only role check

**File:** `apps/web/src/routes/admin/users.tsx:135-148`
**Category:** Security
**Description:** The admin users page checks `session.data.user?.role !== 'admin'` in the
`beforeLoad` guard and redirects to `/dashboard`. This is a client-side check only. The actual
data fetching (`trpc.user.list.useQuery()`) uses `authedProcedure` on the server, not
`adminProcedure`. Any authenticated user can see the full user list (names, emails, roles) by
calling the tRPC endpoint directly. The impersonation button is also visible in the UI if a user
reaches the page.
**Fix:** The `user.list` procedure at `apps/api/src/trpc/procedures/user.ts:119` should use
`adminProcedure` instead of `authedProcedure` if it is meant to be admin-only. Alternatively, if
all authenticated users should see the user list, remove the client-side admin guard from the page.
The current mismatch between client and server access control is confusing and exploitable.

### [CRITICAL] SEC-05: Payment webhook endpoint has no signature verification

**File:** `apps/api/src/trpc/procedures/payments.ts:37-56`
**Category:** Security
**Description:** The payment webhook procedure uses `publicProcedure` (correct for webhooks) but
performs zero signature verification on the incoming event. Any attacker can POST fabricated webhook
events to trigger fake checkout completions, payment failures, or subscription updates. The stub
service just logs, but when a real Stripe adapter is connected, this becomes an immediate financial
vulnerability. Even as a stub/boilerplate, this teaches the wrong pattern.
**Fix:** Add a middleware or input validator that verifies the Stripe webhook signature using the
`STRIPE_WEBHOOK_SECRET`. The webhook handler should receive the raw request body and signature
header, not a pre-parsed JSON object. Consider adding a comment or TODO making this explicit.

---

### [HIGH] ARCH-01: Session/admin tRPC procedures use try/catch instead of neverthrow

**File:** `apps/api/src/trpc/procedures/session.ts:56-68,71-94,97-108,112-124`
**File:** `apps/api/src/trpc/procedures/admin.ts:49-59,78-87`
**Category:** Architecture / Best Practices
**Description:** The CLAUDE.md mandates: "throw/try-catch forbidden for business logic. All
fallible functions return Result<T, E> or ResultAsync<T, E>." The session and admin procedures
wrap Better Auth API calls in try/catch blocks and throw TRPCError directly. This violates the
project's error handling contract and creates an inconsistent pattern -- user procedures use
neverthrow `.match()` properly while session/admin procedures use imperative error handling.
**Fix:** Wrap Better Auth calls in `ResultAsync.fromPromise(...)` and use `.match()` to convert
to TRPCError at the boundary, matching the pattern in `user.ts`. Create a shared utility like
`wrapAuthCall` that handles the conversion consistently.

### [HIGH] ARCH-02: Authenticate use case is wired in container but not exposed via tRPC

**File:** `apps/api/src/container.ts` / `apps/api/src/trpc/router.ts`
**Category:** Architecture
**Description:** The `createAuthenticate` use case exists with full implementation, tests, and
dependencies (IPasswordService, ITokenService, findPasswordHash). The `auth.ts` tRPC procedure
file exists and imports it. However, the auth router is NOT mounted in `createAppRouter` at
`router.ts:28-47` -- only `user`, `session`, and `admin` routers are created. The container also
does not wire `authenticate` (no passwordService or tokenService instantiation). This is dead code
that compiles but is unreachable.
**Fix:** Either (a) remove the authenticate use case, auth procedure, password service adapter,
and token service adapter since Better Auth handles authentication, or (b) wire it properly in the
container and router. Given the comments throughout indicating "passwords are managed by Better
Auth", option (a) is correct. The dead code adds confusion about which auth flow is active.

### [HIGH] TEST-01: No tests for listUsers use case

**File:** `apps/api/src/__tests__/use-cases/` (missing)
**Category:** Testing
**Description:** There are tests for `createUser`, `getUser`, and `authenticate`, but no test file
for `listUsers`. While the use case is simple (delegates to `userRepository.findAll()`), the
absence of a test breaks the pattern and means the error path is untested.
**Fix:** Add `list-users.test.ts` covering at least: (1) happy path returning an array, (2) empty
array, (3) repository error.

### [HIGH] TEST-02: No tRPC procedure integration tests

**File:** `apps/api/src/__tests__/trpc/` (only guards.test.ts)
**Category:** Testing
**Description:** The only tRPC test (`guards.test.ts`) validates auth middleware guards. There are
no integration tests for actual tRPC procedures (user.create, user.getById, user.list, session._,
admin._). The procedures contain real logic: input validation, error mapping, entity transformation.
None of this is tested.
**Fix:** Add procedure-level tests using `testRouter.createCaller(ctx)` that verify: input
validation rejects bad data, error mapping converts AppError tags to correct TRPCError codes,
entity mapping produces correct PublicUser shape, and null user in getById returns NOT_FOUND.

### [HIGH] TEST-03: No tests for value-object edge cases

**File:** `packages/domain/src/__tests__/value-objects/email.test.ts`
**Category:** Testing
**Description:** The email value object tests miss important edge cases: emails with multiple @
signs (e.g., `user@@example.com`), extremely long emails, emails with unicode characters, SQL
injection attempts in email fields. The UserId test does not verify UUID format acceptance. The
Password test does not verify the 128-char max boundary.
**Fix:** Add boundary tests: password at exactly 8 chars, exactly 128 chars, exactly 129 chars.
Email tests for malformed inputs like `user@.com`, `.@domain.com`, and injection strings.

### [HIGH] PERF-01: findAll() with no pagination on user list

**File:** `apps/api/src/adapters/db/drizzle-user-repository.ts:103-114`
**Category:** Performance
**Description:** `findAll()` selects ALL rows from the User table with no LIMIT, no pagination,
and no cursor. This is used in `listUsers` which is called by `user.list` procedure, displayed
in both the dashboard UserList and admin Users page. With even moderate user counts (10K+), this
will cause memory exhaustion (mapping all rows through `ResultAsync.combine`) and slow responses.
**Fix:** Add pagination to IUserRepository (`findAll` should accept `{ limit, offset }` or
cursor-based params). The tRPC procedure should accept pagination input. This is a scalability
blocker.

### [HIGH] SEC-06: Drizzle config schema path does not include AuditLog

**File:** `apps/api/drizzle.config.ts:12`
**Category:** Correctness
**Description:** The drizzle config reads schemas from `../../packages/schema/src/entities/*.ts`,
but the `AuditLog` table is defined in `apps/api/src/logging/audit-log.repository.ts`. This means
`drizzle-kit push` and `drizzle-kit generate` will NOT create or manage the `audit_log` table.
The table exists in the db schema file (`apps/api/src/db/schema.ts:10`) as a re-export, but
drizzle-kit reads from the config path, not from runtime imports.
**Fix:** Either (a) move AuditLog to `packages/schema/src/entities/audit-log.ts` and re-export
from the schema barrel, or (b) add `apps/api/src/logging/audit-log.repository.ts` as a second
schema path in drizzle.config.ts: `schema: ['../../packages/schema/src/entities/*.ts',
'./src/logging/audit-log.repository.ts']`.

### [HIGH] TYPE-01: Frontend riddled with unsafe type casts

**File:** Multiple files in `apps/web/src/`
**Category:** Best Practices / Correctness
**Description:** The frontend contains numerous `as` casts that bypass type safety:

- `session.data?.user?.role as string | undefined` (DevMenu:24, NavBar:16, RoleGate:34)
- `data as UserRow[] | undefined` (UserList:26, admin/users:33)
- `error as { message: string }` (UserList:29, admin/users:36)
- `result.error as { message?: string }` (sessions:28)
- `result.data as SessionEntry[] | null` (sessions:30)
- `session.data?.session as Record<string, unknown>` (ImpersonationBanner:16)
- `JSON.parse(raw) as LogLevels` (LogLevelToggle:31)

The root cause is the cross-package tRPC type collision noted in `lib/trpc.ts:27` with
`@ts-expect-error`. Instead of fixing the type export, every consumer casts away the types.
**Fix:** Resolve the cross-package AppRouter type export properly (the TODO at trpc.ts:12 already
notes this). Once tRPC types flow correctly, all the downstream casts become unnecessary. For the
Better Auth session casts, create a typed wrapper around `authClient.useSession()` that returns
properly typed data including the `role` and `impersonatedBy` fields.

---

### [MEDIUM] ARCH-03: Health endpoint uses try/catch instead of neverthrow

**File:** `apps/api/src/http/health.ts:34-38`
**Category:** Architecture
**Description:** The health check wraps the DB ping in a try/catch. While this is infrastructure
code (not business logic), it creates a precedent that makes it harder to enforce the neverthrow
rule consistently.
**Fix:** Use `ResultAsync.fromPromise()` for consistency, though this is lower priority since
health checks are infrastructure.

### [MEDIUM] ARCH-04: Duplicate AppError type definition in modules

**File:** `modules/email/src/service.ts:5` and `modules/payments/src/service.ts:5`
**Category:** Architecture / DRY
**Description:** Both module stubs define their own `type AppError = { readonly tag: string;
readonly message: string }` instead of importing from `@voiler/core`. This means the module error
types are structurally compatible but nominally disconnected from the real AppError union.
**Fix:** Add `@voiler/core` as a dependency of both modules and import `AppError` from there.
This ensures type compatibility when modules are activated and wired into the container.

### [MEDIUM] ARCH-05: Adapter barrel exports dead code

**File:** `apps/api/src/adapters/index.ts`
**Category:** Architecture
**Description:** The adapters barrel exports `createArgon2PasswordService` and
`createJwtTokenService`, but neither is imported anywhere in the codebase. The container.ts
only imports `createDrizzleUserRepository` directly. These exports exist for the dead
`authenticate` use case (see ARCH-02).
**Fix:** Remove the dead exports when resolving ARCH-02, or wire them into the container if
the custom auth flow is intentionally kept.

### [MEDIUM] SEC-07: No HTTPS redirect or HSTS preload

**File:** `apps/api/src/middleware/security.ts:32`
**Category:** Security
**Description:** HSTS is set with `max-age=31536000; includeSubDomains` but does not include
the `preload` directive. Without `preload`, the first visit to the site over HTTP is still
vulnerable to downgrade attacks until the HSTS header is received. Also, there is no HTTP to
HTTPS redirect middleware.
**Fix:** Add `; preload` to the HSTS header value. Add an HTTP redirect middleware or document
that this is handled by the reverse proxy/CDN.

### [MEDIUM] SEC-08: Audit log write is fire-and-forget with no retry

**File:** `apps/api/src/logging/audit-log.repository.ts:48-72`
**Category:** Security / Correctness
**Description:** `writeAuditLog` uses `void db.insert(...)` with `.catch()` that only logs to
console. Security-sensitive actions (admin.impersonate, admin.stopImpersonating) rely on this for
their audit trail. If the DB write fails (connection issue, constraint violation), the audit entry
is permanently lost. For impersonation events, this means security-critical actions go untracked.
**Fix:** For high-security actions (impersonation), consider using a synchronous audit write that
returns a ResultAsync and blocks the response until the audit is confirmed. Keep fire-and-forget
for lower-priority audit entries (user.create, user.get).

### [MEDIUM] PERF-02: No database indexes on audit_log table

**File:** `apps/api/src/logging/audit-log.repository.ts:10-22`
**Category:** Performance
**Description:** The `audit_log` table has no indexes besides the primary key on `id`. The cleanup
query (`cleanupAuditLog`) filters by `created_at` using `lt()`, and any audit log query by
`user_id` or `request_id` would require a full table scan. As the audit log grows, cleanup
becomes increasingly slow.
**Fix:** Add indexes on `created_at` (for cleanup), `user_id` (for user activity queries), and
`request_id` (for request tracing). Example:

```ts
const AuditLog = pgTable('audit_log', { ... }, (table) => ({
  createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
  userIdIdx: index('audit_log_user_id_idx').on(table.userId),
}))
```

### [MEDIUM] PERF-03: ResultAsync.combine on all user rows in findAll

**File:** `apps/api/src/adapters/db/drizzle-user-repository.ts:109-113`
**Category:** Performance
**Description:** `findAll` maps every row through `mapRowToEntity` (which creates ResultAsync
values) then uses `ResultAsync.combine()` to merge them. `combine` waits for ALL promises to
resolve and collects them into an array. For large result sets, this creates N separate
ResultAsync wrappers (one per row) where a single synchronous mapping would suffice. Since
`mapRowToEntity` only does synchronous validation (createUserId, createEmail), wrapping each in
ResultAsync is unnecessary overhead.
**Fix:** Use synchronous `Result.combine()` instead. Map rows through a synchronous function
returning `Result<UserEntity, AppError>`, then combine and lift to `ResultAsync` once.

### [MEDIUM] CORR-01: create-project.ts uses JSON.parse without validation

**File:** `scripts/create-project.ts:170`
**Category:** Correctness
**Description:** `const pkg = JSON.parse(content)` casts the result implicitly. If package.json
is malformed, this throws an unhandled exception. The script also uses `delete` on the parsed
object, which mutates it.
**Fix:** Wrap in a try/catch (acceptable here since it is a CLI script, not business logic) and
add a type annotation for the parsed result.

### [MEDIUM] CORR-02: LogLevelToggle JSON.parse can crash on corrupt localStorage

**File:** `apps/web/src/components/dev-menu/tools/LogLevelToggle.tsx:31`
**Category:** Correctness
**Description:** `JSON.parse(raw) as LogLevels` will throw if localStorage contains invalid JSON
(e.g., user manually edited it, storage corruption). This crashes the entire DevMenu component.
**Fix:** Wrap in a try/catch and fall back to `DEFAULT_LEVELS`:

```ts
try {
  return JSON.parse(raw) as LogLevels
} catch {
  return DEFAULT_LEVELS
}
```

### [MEDIUM] CORR-03: DevMenu renders outside I18nProvider

**File:** `apps/web/src/routes/__root.tsx:39`
**Category:** Correctness
**Description:** In the root layout, `<DevMenu />` is rendered outside the `<I18nProvider>` and
outside `<QueryClientProvider>`. If DevMenu ever needs translations or React Query data, it will
crash. Currently it only uses `authClient.useSession()` which works, but this is fragile.
**Fix:** Move `<DevMenu />` inside the provider tree, after `</main>` and before the closing
`</I18nProvider>`.

### [MEDIUM] TEST-04: Auth E2E test expects error on invalid login but does not verify specific flow

**File:** `apps/web/e2e/auth.spec.ts:22-28`
**Category:** Testing
**Description:** The test fills in invalid credentials and clicks submit, then expects
`/invalid|error|incorrect/i` to appear. This is a very loose assertion -- it would pass if ANY
text on the page matches those words (e.g., a label saying "Error handling" or navigation text).
It also does not verify that the user remains on the login page.
**Fix:** Assert that the error appears within the form context and verify the URL did not change
to `/dashboard`.

---

### [LOW] STYLE-01: Inconsistent arrow function style in domain error constructors

**File:** `packages/domain/src/errors/domain-error.ts:34-36`
**Category:** Best Practices
**Description:** `invalidUserId` uses `(message: string): DomainError =>` (return type after
params) while all other constructors use the `const name: (message: string) => DomainError =`
pattern (type annotation on the binding).
**Fix:** Change `invalidUserId` to match the pattern:

```ts
export const invalidUserId: (message: string) => DomainError = (message) => ({...})
```

### [LOW] STYLE-02: use-cases/index.ts uses extensionless imports

**File:** `apps/api/src/use-cases/index.ts:10-15`
**Category:** Best Practices
**Description:** The barrel file uses `'./auth/authenticate'` without the `.js` extension, while
all other barrel files in the API use `.js` extensions (Node ESM resolution).
**Fix:** Add `.js` extensions for consistency:
`'./auth/authenticate.js'`, `'./user/create-user.js'`, etc.

### [LOW] STYLE-03: Missing JSDoc on several exported functions

**File:** Multiple
**Category:** Best Practices
**Description:** Some exported functions lack JSDoc despite the project mandate:

- `createStubEmailService` in `modules/email/src/service.ts:23`
- `createStubPaymentService` in `modules/payments/src/service.ts:33`
- `readLevels` and `writeLevels` in `LogLevelToggle.tsx`
- `getRouter` in `apps/web/src/router.tsx`
  **Fix:** Add JSDoc comments to all exported functions.

### [LOW] STYLE-04: `let` used in request-logger interpolate function

**File:** `apps/web/src/lib/i18n.tsx:62`
**Category:** Best Practices
**Description:** `let result: string = template` followed by mutation in a for loop violates the
"const over let, no mutation" mandate. The interpolation function reassigns `result` on each
iteration.
**Fix:** Use `reduce`:

```ts
return entries.reduce((acc, [key, val]) => acc.replace(`{${key}}`, val), template)
```

### [LOW] CI-01: CI does not run E2E tests

**File:** `.github/workflows/ci.yml`
**Category:** Testing
**Description:** The CI pipeline runs lint, typecheck, format:check, and unit tests but does NOT
run Playwright E2E tests. The E2E tests exist and cover smoke and auth flows but are never
validated in CI.
**Fix:** Add a separate CI job for E2E tests that starts the dev servers and runs
`pnpm test:e2e`. Consider running it only on PRs targeting `main` to save CI minutes.

### [LOW] DOCKER-01: Production DB port exposed in docker-compose.prod.yml

**File:** `docker-compose.prod.yml:7`
**Category:** Security
**Description:** The production compose file exposes PostgreSQL on port 5432 to the host. In a
real production deployment, the DB should only be accessible within the Docker network.
**Fix:** Remove the `ports` mapping from the `db` service in the production compose file. The API
container connects via the internal Docker network hostname (`db:5432`), not localhost.

### [LOW] MISC-01: i18n strings hardcoded in AuthForm, UserList, ImpersonationBanner

**File:** `apps/web/src/components/AuthForm.tsx`, `UserList.tsx`, `ImpersonationBanner.tsx`
**Category:** Best Practices
**Description:** These components have `// TODO: i18n` comments but still use hardcoded English
strings while NavBar and other components use `t()`. This creates inconsistency.
**Fix:** Replace hardcoded strings with `t()` calls using the keys already defined in `en.json`.

---

## Summary Matrix

| Category       | Critical | High  | Medium | Low   |
| -------------- | -------- | ----- | ------ | ----- |
| Security       | 4        | 1     | 2      | 1     |
| Correctness    | 0        | 1     | 3      | 0     |
| Testing        | 0        | 3     | 1      | 1     |
| Architecture   | 1        | 2     | 3      | 0     |
| Best Practices | 0        | 1     | 0      | 4     |
| Performance    | 0        | 1     | 2      | 0     |
| Docker/CI      | 0        | 0     | 0      | 1     |
| **Total**      | **5**    | **9** | **11** | **7** |

## Priority Action Plan

**Immediate (before any merge to main):**

1. SEC-01: Lock down `user.create` to `adminProcedure`
2. SEC-02: Fix rate limiter IP extraction
3. SEC-04: Align client/server access control on admin page
4. SEC-05: Add webhook signature verification stub/TODO

**Short-term (next sprint):** 5. ARCH-01: Convert session/admin procedures to neverthrow 6. ARCH-02: Remove dead authenticate flow or wire it 7. SEC-03: Add production origin validation 8. PERF-01: Add pagination to findAll 9. SEC-06: Fix drizzle config to include AuditLog 10. TYPE-01: Resolve cross-package tRPC types

**Medium-term:** 11. TEST-01/02/03: Fill test coverage gaps 12. PERF-02/03: Add indexes and optimize ResultAsync.combine 13. Remaining medium/low findings
