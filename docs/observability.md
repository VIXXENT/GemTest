# Observability

Voiler uses structured JSON logging, audit trails, and health checks for production observability.

## Structured Request Logging

Every request gets a unique ID and structured JSON logs at start and completion:

```typescript
// apps/api/src/logging/request-logger.ts
const requestLogger: () => MiddlewareHandler = () => {
  return async (c, next) => {
    const requestId: string = crypto.randomUUID()
    c.set('requestId', requestId)

    // Log: { level, event: "request.start", requestId, method, path, timestamp }
    await next()
    // Log: { level, event: "request.complete", requestId, method, path, status, durationMs }
  }
}
```

The `requestId` propagates through the entire request lifecycle -- tRPC context, use cases, and audit logs all reference it.

## Log Format

All logs are JSON written to `stderr` via `console.warn` (or `console.error` for errors):

```json
{
  "level": "info",
  "event": "request.complete",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/trpc/user.create",
  "status": 200,
  "durationMs": 42
}
```

## Use Case Logger

The `withAuditLog` wrapper adds structured logging and audit trails to use cases:

```typescript
// apps/api/src/logging/use-case-logger.ts
const createUser = withAuditLog({
  name: 'user.create',
  useCase: rawCreateUser,
  getEntityId: (result) => String(result.id),
  db,
})
```

This produces three events per use case call:

1. `use-case.start` -- before execution (info)
2. `use-case.success` -- after success, writes audit log (info)
3. `use-case.failure` -- after failure (error)

## Audit Log

Audit log entries are persisted to PostgreSQL via the `AuditLog` table:

```typescript
interface AuditLogEntry {
  readonly requestId: string
  readonly action: string // e.g., 'user.create', 'admin.impersonate'
  readonly userId?: string // Who performed the action
  readonly entityId?: string // What was affected
  readonly metadata?: Record<string, unknown>
}
```

Two write modes:

- `writeAuditLog` -- fire-and-forget (non-blocking, for regular use cases)
- `writeAuditLogAsync` -- awaited (for critical actions like impersonation)

## Audit Log Cleanup

Old audit entries are pruned on server startup (default: 30-day retention):

```typescript
// apps/api/src/logging/cleanup.ts
const cleanupAuditLog: (params: CleanupAuditLogParams) => Promise<void> = async (params) => {
  const ageDays: number = maxAgeDays ?? DEFAULT_MAX_AGE_DAYS // 30
  const cutoffDate: Date = new Date(Date.now() - ageDays * MS_PER_DAY)
  await db.delete(AuditLog).where(lt(AuditLog.createdAt, cutoffDate))
}
```

Runs as fire-and-forget on server boot:

```typescript
void cleanupAuditLog({ db }).catch((cleanupErr: unknown) => {
  console.error('[api] Audit log cleanup failed:', cleanupErr)
})
```

## Health Check

`GET /health` returns server status, uptime, and database connectivity:

```typescript
// apps/api/src/http/health.ts
interface HealthResponse {
  status: 'ok' | 'error'
  uptime: number // seconds
  db: 'connected' | 'disconnected'
  timestamp: string // ISO 8601
}
```

Returns `200` when DB is connected, `503` when disconnected.

## Middleware Stack Order

Middleware order in `apps/api/src/index.ts` matters:

| Order | Middleware       | Purpose                          |
| ----- | ---------------- | -------------------------------- |
| 1     | Rate limiter     | Reject abusive IPs early         |
| 2     | Request logger   | Assign request ID, log start/end |
| 3     | Security headers | HSTS, CSP, X-Frame-Options       |
| 4     | CORS             | Validate origin                  |
| 5     | CSRF             | Validate origin on mutations     |
| 6     | Body limit       | Reject payloads > 1 MB           |
