# Voiler — AI-First Fullstack Boilerplate

Monorepo boilerplate for web applications (with or without frontend), optimized for AI-agent-driven development.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TanStack Start (SSR + SPA hybrid) |
| API | tRPC + Hono |
| Auth | Better Auth (plugins: sessions, impersonation) |
| ORM | Drizzle (pg-core) |
| DB | PostgreSQL (all envs, dev via Docker) |
| Validation | Zod (single source of truth) |
| Errors | neverthrow (Result/ResultAsync) |
| i18n | Paraglide JS (compile-time) |
| Monorepo | Turborepo + pnpm |
| Tests | Vitest (unit) + Playwright (E2E) |
| Format | Prettier |
| UI | Tailwind CSS + shadcn/ui |

## Critical Mandates

### Communication
- **Chat language:** Spanish only. Internal thinking: English allowed.
- **Critical agency:** Treat every request as a refutable hypothesis.
- **Code language:** All code, comments, logs, and docs in English.

### Code Quality
- **No semicolons** — project uses no-semicolon style.
- **Explicit type annotations on ALL `const`** — use `// eslint-disable-next-line @typescript-eslint/typedef` for Zod schemas.
- **Max 1 parameter per arrow function** — always wrap in object params.
- **Arrow functions** mandatory for logic and components.
- **`const` over `let`**, no object/array mutation.
- **Trailing commas** in multi-line structures.
- **Max 100 char lines.**
- **JSDoc** on all exported functions.

### TypeScript
- `any` is **forbidden**. Casting (`as any`, `as unknown`) is **forbidden**.
- Parameter types defined separately, destructure in body.
- Explicit return types on exported functions.

### Error Handling
- `throw`/`try-catch` **forbidden** for business logic.
- All fallible functions return `Result<T, E>` or `ResultAsync<T, E>`.
- Exhaustive handling with `.match()` or `switch` on tags.

### Architecture (Hexagonal)
- Domain layer has zero infrastructure imports.
- Use cases depend only on port interfaces.
- tRPC routers are thin: parse input → call use case → return result.
- `container.ts` is the ONLY file importing concrete adapters.

## Documents

| File | Read when... |
|------|-------------|
| `docs/superpowers/specs/2026-03-30-gemtest-v2-boilerplate-design.md` | Understanding overall design and decisions |
| `docs/superpowers/specs/2026-03-31-security-hardening-plan.md` | Implementing security measures |
| `docs/superpowers/plans/2026-03-31-gemtest-v2-overview.md` | Understanding plan contracts and dependencies |
| `docs/superpowers/plans/2026-03-31-plan-a-foundation.md` | Executing Plan A (Foundation) |

## Commands

```bash
docker compose up db           # Start PostgreSQL
pnpm dev                       # Start API + web (hot reload)
pnpm lint                      # ESLint strict
pnpm format:check              # Prettier check
pnpm typecheck                 # tsc --noEmit all packages
pnpm test                      # Vitest unit tests
pnpm test:e2e                  # Playwright E2E (requires dev server)
pnpm preview                   # Build + run in Docker (prod-like)
```

## Verification (after every task)

Always run after completing a task:
1. `npx eslint <changed-files>` — 0 errors
2. `pnpm typecheck` — if code was changed
3. E2E tests if runtime code changed (requires dev server)
