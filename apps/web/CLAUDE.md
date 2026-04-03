# @voiler/web

TanStack Start frontend (SSR + SPA hybrid) with tRPC client, Better Auth client, and Paraglide i18n.

## Key Files

| File                   | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `src/router.tsx`       | TanStack router setup                                     |
| `src/routes/`          | File-based routes (auth, dashboard, admin, settings)      |
| `src/components/`      | Shared components (NavBar, RoleGate, ImpersonationBanner) |
| `src/lib/trpc.ts`      | tRPC client configuration                                 |
| `src/lib/auth.ts`      | Better Auth client                                        |
| `src/lib/i18n.tsx`     | Paraglide i18n setup                                      |
| `e2e/`                 | Playwright E2E tests                                      |
| `playwright.config.ts` | Playwright configuration                                  |

## Commands

```bash
pnpm --filter @voiler/web dev    # Dev server (port 3000)
pnpm test:e2e                    # Playwright E2E (needs API running)
```

## Architecture

See [../../docs/architecture.md] and [../../docs/auth.md].
