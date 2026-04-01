# GemTest v2 — Security Hardening Plan

## Approach

Security is not a separate plan — it is woven into every plan (A-F). This document serves as the **reference checklist**. Each measure maps to the plan where it gets implemented.

Measures are organized by attack category, not by implementation order.

---

## 1. Injection Attacks (OWASP #1)

### SQL Injection

| Measure                            | How                                                               | Plan |
| ---------------------------------- | ----------------------------------------------------------------- | ---- |
| Parameterized queries only         | Drizzle ORM uses parameterized queries by default — never raw SQL | A    |
| No string concatenation in queries | ESLint rule: ban `sql.raw()` or template literals in DB calls     | A    |
| Input validation at boundary       | Zod schemas validate ALL tRPC inputs before reaching use cases    | B    |

### Cross-Site Scripting (XSS)

| Measure                        | How                                                      | Plan |
| ------------------------------ | -------------------------------------------------------- | ---- |
| React auto-escapes by default  | JSX escapes all interpolated values                      | D    |
| Ban `dangerouslySetInnerHTML`  | ESLint rule to prohibit unless explicitly reviewed       | D    |
| Content-Security-Policy header | Hono `secureHeaders` middleware with strict CSP          | A    |
| HttpOnly cookies               | Better Auth sets HttpOnly + Secure + SameSite by default | C    |

### Command Injection

| Measure                                  | How                                                    | Plan |
| ---------------------------------------- | ------------------------------------------------------ | ---- |
| No `exec()` or `spawn()` with user input | ESLint rule: ban `child_process` imports               | A    |
| No `eval()` or `Function()`              | TypeScript strict + ESLint `no-eval` (already default) | A    |

---

## 2. Broken Authentication (OWASP #2)

| Measure                           | How                                                        | Plan |
| --------------------------------- | ---------------------------------------------------------- | ---- |
| Argon2id password hashing         | Better Auth default algorithm — no bcrypt/sha256           | C    |
| Session-based auth (not JWT-only) | Better Auth database sessions — revocable, server-side     | C    |
| Session expiration                | Configurable TTL (default: 7 days idle, 30 days absolute)  | C    |
| Brute-force protection            | Rate limiter on `/api/auth/sign-in` (5 attempts/min)       | B    |
| Account lockout                   | Better Auth lockout after N failed attempts (configurable) | C    |
| Secure password requirements      | Zod validation: min 8 chars, letter + digit (domain layer) | B    |
| OAuth state parameter             | Better Auth handles CSRF for OAuth flows automatically     | C    |
| Multi-device session visibility   | User can see and revoke active sessions                    | C    |

---

## 3. Sensitive Data Exposure (OWASP #3)

### Files That MUST Never Be Served

| File/Path               | Risk                               | Prevention                                                 | Plan |
| ----------------------- | ---------------------------------- | ---------------------------------------------------------- | ---- |
| `.env`, `.env.*`        | DB passwords, API keys             | `.gitignore` + Hono does not serve static files by default | A    |
| `.git/`                 | Full source code + history         | Not served (Hono is not a static file server)              | A    |
| `node_modules/`         | Dependency source, potential vulns | Not served, not in Docker prod image                       | E    |
| `docker-compose*.yml`   | Infra topology, passwords          | Not served, not in build output                            | E    |
| `drizzle/` (migrations) | DB schema details                  | Not served                                                 | A    |
| Source `.ts` files      | Business logic                     | Only compiled JS in prod Docker image                      | E    |

### Data in Transit

| Measure             | How                                                   | Plan |
| ------------------- | ----------------------------------------------------- | ---- |
| HTTPS enforced      | Reverse proxy (Caddy auto-TLS) or PaaS handles TLS    | E    |
| HSTS header         | Hono `secureHeaders` with `Strict-Transport-Security` | A    |
| Secure cookie flags | `Secure; HttpOnly; SameSite=Lax` on all auth cookies  | C    |

### Data at Rest

| Measure                           | How                                                              | Plan |
| --------------------------------- | ---------------------------------------------------------------- | ---- |
| Passwords hashed (Argon2id)       | Never stored in plain text                                       | C    |
| Secrets in env vars only          | No hardcoded secrets in code — `config-env` validates at startup | A    |
| `.env.example` has no real values | Only placeholder instructions                                    | E    |
| `AUTH_SECRET` minimum 32 chars    | Zod validation in `config-env`                                   | A    |

---

## 4. Broken Access Control (OWASP #4)

### Backend (tRPC + Hono)

| Measure                         | How                                                   | Plan |
| ------------------------------- | ----------------------------------------------------- | ---- |
| `authedProcedure` middleware    | Every protected route verifies session                | B    |
| `roleGuard(role)` middleware    | Role-based access on admin/dev routes                 | B    |
| Object-level authorization      | Use cases verify `userId` matches requested resource  | B    |
| No direct DB access from routes | All operations through use cases (hexagonal)          | B    |
| CORS restricted                 | Only allow configured origins (not `*` in production) | A    |
| Admin impersonation audit trail | Every impersonation logged to `audit_log`             | C    |

### Frontend (TanStack Start)

| Measure                     | How                                                         | Plan |
| --------------------------- | ----------------------------------------------------------- | ---- |
| Route guards (`beforeLoad`) | Redirect to login if unauthenticated                        | D    |
| `<RoleGate>` component      | Hide admin UI from non-admin users                          | D    |
| Frontend guards are UX only | Real security is backend — frontend hides, backend enforces | B+D  |

---

## 5. Security Misconfiguration (OWASP #5)

### HTTP Headers (Hono `secureHeaders`)

| Header                      | Value                                        | Purpose                                     |
| --------------------------- | -------------------------------------------- | ------------------------------------------- |
| `X-Content-Type-Options`    | `nosniff`                                    | Prevent MIME sniffing                       |
| `X-Frame-Options`           | `DENY`                                       | Prevent clickjacking                        |
| `X-XSS-Protection`          | `0`                                          | Disable legacy XSS filter (CSP replaces it) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`        | Force HTTPS                                 |
| `Content-Security-Policy`   | Strict policy (script-src 'self', no inline) | Prevent XSS                                 |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`            | Limit referrer leakage                      |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`   | Disable unused APIs                         |

All set in **Plan A** via Hono `secureHeaders()` middleware.

### Server Configuration

| Measure                             | How                                                               | Plan |
| ----------------------------------- | ----------------------------------------------------------------- | ---- |
| No directory listing                | Hono does not serve directories (not a static server)             | A    |
| No server version header            | Hono does not send `X-Powered-By` by default                      | A    |
| Error messages don't leak internals | AppError → GraphQL/tRPC error mapping strips stack traces in prod | B    |
| `NODE_ENV=production` in prod       | `config-env` validates, stack traces hidden                       | A    |

---

## 6. Rate Limiting & DDoS Protection

| Measure                      | How                                                    | Plan |
| ---------------------------- | ------------------------------------------------------ | ---- |
| Global rate limiter          | `hono-rate-limiter`: 100 req/min per IP (configurable) | A    |
| Auth endpoint stricter limit | 5 req/min on `/api/auth/sign-in`                       | B    |
| tRPC endpoint limit          | 60 req/min per authenticated user                      | B    |
| Payload size limit           | Hono body parser: max 1MB request body                 | A    |
| Slowloris protection         | Connection timeout: 30s (Hono/Node default)            | A    |
| Production: reverse proxy    | Caddy/nginx with connection limits + buffering         | E    |

---

## 7. Dependency Vulnerabilities (OWASP #6)

| Measure                   | How                                                        | Plan |
| ------------------------- | ---------------------------------------------------------- | ---- |
| `pnpm audit` in CI        | Fail CI if high/critical vulns found                       | E    |
| Lockfile committed        | `pnpm-lock.yaml` in git — reproducible installs            | A    |
| Dependabot / Renovate     | Auto-PR for dependency updates                             | E    |
| Minimal prod dependencies | Docker multi-stage: only prod deps in final image          | E    |
| Alpine base image         | `node:20-alpine` — ~5MB vs ~200MB (smaller attack surface) | E    |

---

## 8. Logging & Monitoring (OWASP #9)

| Measure                          | How                                                     | Plan |
| -------------------------------- | ------------------------------------------------------- | ---- |
| `requestId` correlation          | UUID per request, threaded through all logs             | B    |
| Auth events logged               | Login, logout, register, failed attempts, impersonation | B+C  |
| CRUD actions logged              | Create, update, delete with entity ID (not full object) | B    |
| No secrets in logs               | Never log passwords, tokens, full request bodies        | B    |
| Log rolling (30 days)            | Scheduled cleanup of `audit_log` entries                | B    |
| Failed auth attempts highlighted | `level: 'warn'` for failed login, lockout events        | C    |

---

## 9. CSRF Protection

| Measure                      | How                                                    | Plan |
| ---------------------------- | ------------------------------------------------------ | ---- |
| Hono CSRF middleware         | Origin + Sec-Fetch-Site validation on mutations        | A    |
| SameSite cookies             | `SameSite=Lax` on auth cookies (Better Auth default)   | C    |
| tRPC uses POST for mutations | No GET mutations that could be triggered by image/link | B    |

**Note:** Hono CSRF had a bypass vulnerability (CVE-2024-48913) with case-insensitive MIME types. Ensure Hono version >= 4.6.5 where this is fixed.

---

## 10. Docker Security (Plan E)

| Measure                   | How                                                                  |
| ------------------------- | -------------------------------------------------------------------- |
| Non-root user             | `USER node` in Dockerfile (not root)                                 |
| Alpine base               | Minimal attack surface                                               |
| Multi-stage build         | No compilers/dev tools in prod image                                 |
| Read-only filesystem      | `read_only: true` in docker-compose (writable only for `/tmp`, logs) |
| No `--privileged`         | Never run containers privileged                                      |
| Drop all capabilities     | `cap_drop: ALL` in docker-compose                                    |
| Health check in container | `HEALTHCHECK CMD curl -f http://localhost:4000/health`               |
| Secrets via env vars      | Not baked into image — passed at runtime                             |
| `.dockerignore`           | Excludes `.env`, `.git`, `node_modules`, test files                  |

---

## 11. Additional Protections

### Path Traversal

| Measure                      | How                                                                    | Plan   |
| ---------------------------- | ---------------------------------------------------------------------- | ------ |
| No user input in file paths  | Application does not serve user-uploaded files (yet)                   | A      |
| If file serving needed later | Whitelist approach: explicit allowed paths, canonicalize + verify base | Future |

### Information Disclosure via Scanners

Automated scanners probe for common paths. Hono's behavior:

| Scanned Path       | Result                          | Why                      |
| ------------------ | ------------------------------- | ------------------------ |
| `/.env`            | 404                             | Hono doesn't serve files |
| `/.git/config`     | 404                             | Not a static server      |
| `/wp-admin/`       | 404                             | No WordPress             |
| `/phpinfo.php`     | 404                             | No PHP                   |
| `/server-status`   | 404                             | No Apache                |
| `/actuator/health` | 404                             | No Spring                |
| `/.well-known/*`   | 404 (unless explicitly mounted) | Secure by default        |

Hono is inherently safe against these scans because it only responds to explicitly mounted routes. This is a significant security advantage over static file servers (Express static, nginx default configs).

### Privilege Escalation

| Measure                                | How                                                      | Plan    |
| -------------------------------------- | -------------------------------------------------------- | ------- | ---------------------------------------------- | --- |
| Role changes audit logged              | `audit_log` records role changes with actor + target     | B       |
| Roles enforced server-side             | `roleGuard` middleware — no trust in client claims       | B       |
| Role list is finite                    | `'user'                                                  | 'admin' | 'dev'` — validated by Zod, not freeform string | B   |
| Impersonation doesn't grant real admin | Impersonated session inherits target's role, not admin's | C       |

---

## Implementation Summary

| Plan                  | Security Measures Count                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **A (Foundation)**    | Secure headers, CSRF, CORS, rate limiter, payload limit, CSP, HSTS, no-eval, parameterized queries, secrets validation, lockfile |
| **B (tRPC + Domain)** | Auth guards, role guards, input validation (Zod), error sanitization, structured logging, brute-force limit, audit trail         |
| **C (Auth)**          | Argon2id, database sessions, session expiry, lockout, OAuth CSRF, multi-device sessions, impersonation audit, secure cookies     |
| **D (Frontend)**      | Route guards, RoleGate, no dangerouslySetInnerHTML, auto-escaped JSX                                                             |
| **E (Infra)**         | Docker hardening (non-root, alpine, read-only, cap-drop), pnpm audit in CI, dependabot, .dockerignore, HTTPS via Caddy           |
| **F (Docs)**          | Security section in docs/architecture.md, security boundaries in AGENTS.md                                                       |

---

## What Remains Out of Scope (Future Issues)

These require project-specific decisions and should be GitHub Issues with `priority:high`:

1. **WAF (Web Application Firewall)** — Cloudflare, AWS WAF, or self-hosted ModSecurity. Decision depends on hosting.
2. **Penetration testing** — Automated (ZAP/Burp) + manual after first deployment.
3. **Backup encryption** — PostgreSQL backup strategy with encryption at rest.
4. **Secret rotation** — AUTH_SECRET rotation procedure without downtime.
5. **Content Security Policy tuning** — Adjust CSP after frontend is built (inline scripts, CDN, etc.).
6. **File upload security** — If/when file uploads are added: virus scanning, size limits, type validation, storage isolation.
7. **API versioning** — Breaking change strategy for public-facing APIs.
