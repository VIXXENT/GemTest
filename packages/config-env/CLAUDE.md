# @voiler/config-env

Zod-validated environment configuration with fail-fast behavior. Validates all required env vars at startup.

## Key Files

| File              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `src/schema.ts`   | Zod schema defining all env vars (EnvConfig type) |
| `src/load-env.ts` | Loads .env, validates, exits on failure           |

## Usage

```typescript
import { loadEnv } from '@voiler/config-env'
const env = loadEnv()
// env.PORT, env.DATABASE_URL, env.AUTH_SECRET, etc.
```

## Rules

- If any required env var is missing or malformed, the process exits immediately.
- All env vars are typed via Zod inference -- no manual type definitions.

## Commands

```bash
pnpm --filter @voiler/config-env typecheck   # Type check
```
