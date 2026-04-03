# Full Codebase Audit -- Triage

**Date:** 2026-04-02
**Triager:** Claude Opus 4.6 (1M context)
**Source:** `docs/reviews/full-codebase-audit.md`
**Branch:** `feat/plan-a-foundation` @ `1dca022`

---

## 1. Fix Now

### SEC-01: User creation endpoint is public -- no authentication required

**Effort:** Trivial
**What to fix:** Change `user.create` from `publicProcedure` to `adminProcedure` in
`apps/api/src/trpc/procedures/user.ts`. The JSDoc already says "admin-level" -- the
procedure just needs to match. One-line change.

### SEC-04: Admin page has client-side-only role check

**Effort:** Trivial
**What to fix:** Change `user.list` procedure from `authedProcedure` to `adminProcedure`
in `apps/api/src/trpc/procedures/user.ts`. The admin page already has a client guard;
the server side must match. One-line change.

### CORR-02: LogLevelToggle JSON.parse can crash on corrupt localStorage

**Effort:** Trivial
**What to fix:** Wrap `JSON.parse(raw)` in a try/catch that falls back to
`DEFAULT_LEVELS` in `apps/web/src/components/dev-menu/tools/LogLevelToggle.tsx:31`.
This is UI code, not business logic -- try/catch is acceptable here.

### CORR-03: DevMenu renders outside provider tree

**Effort:** Trivial
**What to fix:** Move `<DevMenu />` inside the `<I18nProvider>` / `<QueryClientProvider>`
tree in `apps/web/src/routes/__root.tsx`. Prevents future crashes if DevMenu gains
dependencies on those providers.

### STYLE-01: Inconsistent arrow function style in domain error constructors

**Effort:** Trivial
**What to fix:** Align `invalidUserId` to match the `const name: Type = (params) => ...`
pattern in `packages/domain/src/errors/domain-error.ts`. This is a boilerplate -- the
error module is one of the first things people read. It should be consistent.

### STYLE-02: use-cases/index.ts uses extensionless imports

**Effort:** Trivial
**What to fix:** Add `.js` extensions to imports in `apps/api/src/use-cases/index.ts`.
Inconsistency in a barrel file is visible and confusing for someone learning the patterns.

### STYLE-03: Missing JSDoc on exported functions

**Effort:** Small
**What to fix:** Add JSDoc to `createStubEmailService`, `createStubPaymentService`,
`readLevels`, `writeLevels`, and `getRouter`. These are exported functions and the
project mandate requires JSDoc on all exports.

### STYLE-04: `let` used in i18n interpolation

**Effort:** Trivial
**What to fix:** Replace `let result` + for-loop with `reduce` in
`apps/web/src/lib/i18n.tsx:62`. The boilerplate mandates `const` over `let` and no
mutation -- this should demonstrate the preferred pattern.

---

## 2. Create GitHub Issues

### SEC-02: Rate limiter uses last IP in X-Forwarded-For -- spoofable

**Suggested title:** fix(api): rate limiter IP extraction is spoofable via X-Forwarded-For
**Why defer:** The current rate limiter only applies in production behind a reverse proxy.
In dev/demo mode the boilerplate runs without a proxy, so the spoofability is moot.
Fixing it properly requires deciding on the expected proxy topology and configuring
trust levels, which is an architectural decision.
**Duplicates:** #46 (rate limiting) -- this is a refinement of the same topic.

### SEC-03: CORS allows empty origins in production

**Suggested title:** fix(api): validate TRUSTED_ORIGINS is set in production mode
**Why defer:** The failure mode (empty array = rejects all CORS) is actually safe by
default -- it blocks rather than allows. The risk scenario (dev mode in production) is a
deployment misconfiguration, not a code bug. A Zod `.refine()` on the env schema is a
nice improvement but not urgent.
**Duplicates:** None.

### SEC-05: Payment webhook has no signature verification

**Suggested title:** chore(payments): add TODO/stub for webhook signature verification
**Why defer:** The payment module is an intentional stub. It logs to console and does
nothing. The audit itself says "when a real Stripe adapter is connected" -- that is
future work. However, a prominent TODO comment would improve the boilerplate's
educational value.
**Duplicates:** None.

### ARCH-01: Session/admin procedures use try/catch instead of neverthrow

**Suggested title:** refactor(api): convert session/admin procedures to neverthrow
**Why defer:** The code works correctly. The try/catch blocks properly convert errors to
TRPCError. Converting to neverthrow is a consistency improvement that requires touching
every Better Auth call wrapper. Good refactor but not blocking.
**Duplicates:** None.

### ARCH-02: Dead authenticate use case and related code

**Suggested title:** chore(api): remove dead authenticate flow (Better Auth handles auth)
**Why defer:** Dead code that compiles. It does not break anything but adds confusion.
Removing it is straightforward but touches multiple files (use case, procedure, adapters,
barrel exports, container). Worth a dedicated cleanup PR.
**Duplicates:** None. (ARCH-05 is part of this same cleanup.)

### ARCH-03: Health endpoint uses try/catch

**Suggested title:** refactor(api): use ResultAsync in health endpoint
**Why defer:** Infrastructure code, not business logic. The CLAUDE.md mandate targets
business logic specifically. Health checks are an edge case that can be addressed during
a broader neverthrow consistency pass (with ARCH-01).
**Duplicates:** None. Bundle with ARCH-01.

### ARCH-04: Duplicate AppError type in module stubs

**Suggested title:** fix(modules): import AppError from @voiler/core instead of redefining
**Why defer:** The module stubs are intentionally minimal. When they get activated and
wired into the container, the type mismatch will surface as a compile error. Low risk
until then.
**Duplicates:** None.

### SEC-06: Drizzle config does not include AuditLog table

**Suggested title:** fix(api): include audit_log in drizzle-kit schema path
**Why defer:** The table works at runtime because it is imported in `db/schema.ts`.
The issue only affects `drizzle-kit push/generate` migrations. This is a real bug but
not blocking demo/dev usage since the table can be created via runtime code or manual
migration.
**Duplicates:** #53 (AuditLog table location) -- directly related. Resolving #53 by
moving AuditLog to `packages/schema` would fix this automatically.

### SEC-07: No HSTS preload directive

**Suggested title:** fix(api): add HSTS preload and document HTTPS redirect strategy
**Why defer:** HSTS preload only matters when submitting to the preload list, which a
boilerplate user would do for their own domain. The current HSTS header is functional.
HTTP-to-HTTPS redirect is typically handled by the reverse proxy/CDN.
**Duplicates:** None.

### SEC-08: Audit log write is fire-and-forget

**Suggested title:** feat(api): synchronous audit writes for security-critical actions
**Why defer:** The fire-and-forget pattern is a deliberate design choice for performance.
Making impersonation audit writes synchronous is a good improvement but requires deciding
which actions are "critical" vs "informational" -- an architectural decision.
**Duplicates:** #48 (withAuditLog wiring) -- related topic.

### TEST-01: No tests for listUsers use case

**Suggested title:** test(api): add listUsers use case tests
**Why defer:** The use case is trivial (delegates to repository). Missing tests do not
indicate a bug. Can be bundled with broader test coverage work.
**Duplicates:** None.

### TEST-02: No tRPC procedure integration tests

**Suggested title:** test(api): add tRPC procedure integration tests
**Why defer:** This is a significant testing effort that requires setting up a test
harness with `createCaller`. Important but not blocking.
**Duplicates:** #54 (integration tests) -- exact duplicate.

### TEST-03: Value object edge case tests

**Suggested title:** test(domain): add boundary tests for value objects
**Why defer:** The existing tests cover the happy path and basic validation. Edge cases
like SQL injection in email fields are caught by the Zod schema at the tRPC boundary
before reaching value objects. Nice to have, not urgent.
**Duplicates:** None.

### PERF-01: findAll() with no pagination

**Suggested title:** feat(api): add pagination to user list
**Why defer:** Only matters at scale. A boilerplate demo will have <100 users.
**Duplicates:** #49 (pagination) -- exact duplicate.

### PERF-02: No indexes on audit_log table

**Suggested title:** perf(api): add indexes to audit_log table
**Why defer:** Performance concern at scale. The boilerplate demo will generate minimal
audit logs.
**Duplicates:** None.

### PERF-03: ResultAsync.combine overhead on findAll

**Suggested title:** perf(api): use synchronous Result.combine in findAll mapping
**Why defer:** Micro-optimization. Only noticeable with large result sets, which are
already gated by the pagination issue (#49).
**Duplicates:** None.

### TYPE-01: Frontend unsafe type casts

**Suggested title:** fix(web): resolve cross-package tRPC type exports
**Why defer:** The root cause (cross-package AppRouter type) requires investigation into
tRPC's monorepo type export story. All the `as` casts are symptoms, not causes. The
casts are safe at runtime -- they match the actual shapes.
**Duplicates:** #66 (as casts) -- exact duplicate.

### TEST-04: Loose E2E auth test assertion

**Suggested title:** test(e2e): tighten invalid-login error assertion
**Why defer:** The test passes and catches the right behavior. The assertion could be
tighter but it is not a false positive.
**Duplicates:** None.

### CI-01: CI does not run E2E tests

**Suggested title:** ci: add Playwright E2E job to CI pipeline
**Why defer:** E2E tests require running dev servers which adds CI complexity and cost.
This is infrastructure work.
**Duplicates:** None.

### DOCKER-01: Production DB port exposed

**Suggested title:** fix(docker): remove exposed DB port in production compose
**Why defer:** The prod compose file is a template. Real deployments will customize it.
Exposing the port is actually useful during initial setup/debugging.
**Duplicates:** None.

### MISC-01: Hardcoded i18n strings

**Suggested title:** feat(web): replace hardcoded strings with i18n calls
**Why defer:** Cosmetic. The TODO comments already flag these. Will be addressed when
i18n coverage is prioritized.
**Duplicates:** None.

### CORR-01: create-project.ts JSON.parse without validation

**Suggested title:** fix(scripts): add error handling to create-project JSON.parse
**Why defer:** CLI script, not runtime code. The script would fail with a clear stack
trace anyway. Low impact.
**Duplicates:** None.

---

## 3. Dismiss

### ARCH-05: Adapter barrel exports dead code

**Reason:** This is a direct consequence of ARCH-02 (dead authenticate flow). Not a
separate finding -- it will be resolved when ARCH-02 is addressed. Tracking both would
be redundant.

---

## 4. Summary

| Decision            | Count  |
| ------------------- | ------ |
| Fix Now             | 8      |
| Create GitHub Issue | 23     |
| Dismiss             | 1      |
| **Total**           | **32** |

### Fix Now breakdown

| ID       | Effort  |
| -------- | ------- |
| SEC-01   | Trivial |
| SEC-04   | Trivial |
| CORR-02  | Trivial |
| CORR-03  | Trivial |
| STYLE-01 | Trivial |
| STYLE-02 | Trivial |
| STYLE-03 | Small   |
| STYLE-04 | Trivial |

**Estimated total effort for Fix Now:** ~1 hour

### Duplicates of existing issues

| Finding | Existing Issue |
| ------- | -------------- |
| SEC-02  | #46            |
| SEC-06  | #53            |
| PERF-01 | #49            |
| TEST-02 | #54            |
| TYPE-01 | #66            |
