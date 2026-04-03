# Authentication

Voiler uses **Better Auth** with the Drizzle adapter for PostgreSQL. Authentication supports email/password and optional OAuth (Google, GitHub).

## Setup

The auth instance is created in `apps/api/src/auth/index.ts`:

```typescript
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  secret,
  trustedOrigins,
  session: {
    cookieCache: { enabled: true, maxAge: 300 },
  },
  advanced: {
    cookiePrefix: 'voiler',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    },
  },
  emailAndPassword: { enabled: true },
  socialProviders: {
    // Conditionally included based on env vars
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            /* ... */
          },
        }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            /* ... */
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
    },
  },
  plugins: [admin()],
})
```

## Auth Routes

Better Auth handles all auth endpoints at `/api/auth/**`:

```typescript
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw)
})
```

## Session Extraction

A Hono middleware extracts the session for every non-auth request:

```typescript
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth/')) {
    c.set('user', null)
    c.set('session', null)
    await next()
    return
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)
  await next()
})
```

## tRPC Context Enrichment

The session is injected into every tRPC context:

```typescript
interface TRPCContext {
  readonly db: DbClient
  readonly requestId: string
  readonly user: AuthUser | null
  readonly session: AuthSession | null
  readonly headers: Headers
}
```

## Procedure Guards

| Procedure         | Requirement                   | Use                       |
| ----------------- | ----------------------------- | ------------------------- |
| `publicProcedure` | None                          | Public queries            |
| `authedProcedure` | Valid session                 | User-facing endpoints     |
| `adminProcedure`  | `role === 'admin'`            | Admin CRUD, impersonation |
| `devProcedure`    | `role === 'dev'` or `'admin'` | Developer tools           |

Guards narrow the context type to `AuthedTRPCContext` (guaranteed non-null user/session).

## Cookie Configuration

| Setting  | Value          | Notes                        |
| -------- | -------------- | ---------------------------- |
| Prefix   | `voiler`       | Namespaced cookies           |
| httpOnly | `true`         | No JS access                 |
| secure   | `true` in prod | HTTPS only in production     |
| sameSite | `lax`          | Allows top-level navigations |
| path     | `/`            | Available site-wide          |
| Cache    | 300s           | Session cookie cache TTL     |

## Impersonation

Admin users can impersonate other users via the admin plugin:

```typescript
impersonate: adminProcedure.input(ImpersonateInputSchema).mutation(async (opts) => {
  // Self-impersonation blocked
  if (opts.ctx.user.id === opts.input.userId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot impersonate yourself' })
  }

  await impersonateUser({ headers: opts.ctx.headers, userId: opts.input.userId })

  // Audit logged for security
  await writeAuditLogAsync({
    db: opts.ctx.db,
    entry: {
      requestId: opts.ctx.requestId,
      action: 'admin.impersonate',
      userId: opts.ctx.user.id,
      entityId: opts.input.userId,
      metadata: { impersonatedBy: opts.ctx.user.id },
    },
  })

  return { success: true }
})
```

## OAuth Configuration

Set these env vars to enable social login:

| Variable                                    | Provider     |
| ------------------------------------------- | ------------ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |

Providers are only enabled when both client ID and secret are present.

## Rate Limiting

Auth endpoints have stricter rate limits (10 req/min per IP vs. default):

```typescript
app.use('/api/auth/*', createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: 'auth' }))
```
