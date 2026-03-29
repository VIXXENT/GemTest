# GemTest — Agent Navigation Hub

Fullstack testing platform validating a professional stack: monorepo + GraphQL + SQLite.
These mandates override any default agent behavior.

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | React + Vite + Tailwind + Apollo Client |
| Backend | Apollo Server + Drizzle ORM |
| Persistence | SQLite (LibSQL) |
| Shared types | `packages/schema` — Zod as single source of truth |

---

## Critical Mandates (always active)

These rules apply in every file, every PR, every response. No exceptions.

### Communication
- **Chat language:** Spanish only. Internal thinking: English allowed.
- **Critical agency:** Treat every user request as a refutable hypothesis — look for flaws or tech debt before proceeding.
- **Code language:** All code, comments, logs, and technical docs in English.

### Code Quality
- **JSDoc:** All exported/public functions must have JSDoc: What/Why, Params & Returns, Context.
- **Arrow functions:** Mandatory for internal logic and components.
- **Immutability:** `const` over `let`. No object/array mutation — use spread/functional methods.
- **Simplicity:** Max 3 levels of indentation. Low cyclomatic complexity.
- **Naming:** Tables and models in singular PascalCase (`User` for table, type, and Zod schema).

### TypeScript
- `any` is **forbidden**. Casting (`as any`, `as unknown`, `as string`) is **forbidden**.
- Parameter types defined separately, never inline. Destructure in the function body, not the prototype.
- Resolve TS errors at root cause — use advanced typing or type guards, never cast.
- Annotations only when they add more than inference. Never widen or falsify the real type.
- Explicit return types on exported functions. Types centralized in `packages/schema` or `*.types.ts`.

### Error Handling
- `throw` and `try/catch` are **forbidden** for business logic or expected errors (DB, API, validation).
- All fallible functions return `Result<T, E>` or `ResultAsync<T, E>` (neverthrow).
- Prefer `await` with `ResultAsync` for linear flow. Exhaustive handling with `.match()` or `switch` on tags.

---

## Detail Documents

Read these **only when working in the relevant area** — do not pre-load all docs.
> **Note:** These files are created in Issue #22 (A2). Links may not resolve yet.

| File | Read when… |
|------|------------|
| [`docs/architecture.md`](./docs/architecture.md) | Modifying app structure, adding modules, or changing data flow |
| [`docs/code-standards.md`](./docs/code-standards.md) | Writing or reviewing code (JSDoc, naming, indentation, patterns) |
| [`docs/error-handling.md`](./docs/error-handling.md) | Implementing fallible operations or working with neverthrow |
| [`docs/auth.md`](./docs/auth.md) | Touching auth flow, sessions, or Auth.js configuration |
| [`docs/testing.md`](./docs/testing.md) | Writing tests (unit, integration, E2E) or configuring CI |
| [`docs/observability.md`](./docs/observability.md) | Working with logs, monitoring, or the custom dev runner |
| [`docs/project-mgmt.md`](./docs/project-mgmt.md) | Managing issues, PRs, branches, or the GitHub project board |

---

## Context Window Protection (context-mode)

context-mode MCP tools keep raw data in sandboxed subprocesses. **Always use these routing rules.**

### Tool routing hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary research tool. ONE call replaces many steps.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base.

### When to use context-mode vs built-in tools

| Task | Use context-mode | Use built-in |
|------|------------------|--------------|
| Read file to **edit** it | — | `Read` + `Edit` |
| Read file to **analyze/explore** | `ctx_execute_file` | — |
| Run short command (git, ls, npm) | — | `Bash` |
| Run command with large output (logs, tests) | `ctx_execute` (shell) | — |
| Research multiple files/dirs at once | `ctx_batch_execute` | — |
| Fetch web page/docs | `ctx_fetch_and_index` | — |
| Search codebase (targeted, <3 queries) | — | `Grep` / `Glob` |
| Search codebase (broad, multi-round) | `ctx_batch_execute` | — |

### Blocked patterns
- **curl/wget in Bash**: Use `ctx_execute` or `ctx_fetch_and_index` instead.
- **WebFetch**: Use `ctx_fetch_and_index` then `ctx_search` instead.
- **Bash for commands producing >50 lines**: Use `ctx_execute(language: "shell", code: "...")`.

### Diagnostics
| Command | Action |
|---------|--------|
| `ctx stats` | Show context savings and session statistics |
| `ctx doctor` | Diagnose installation (runtimes, FTS5, versions) |
| `ctx upgrade` | Update context-mode to latest version |

---

## Project Management (GitHub Issues + MCP)

- **Board:** https://github.com/users/VIXXENT/projects/2
- **MCP:** GitHub MCP in `.mcp.json`. Use `mcp__github__*` tools for issues, PRs, and comments.

### Workflow per session
1. Check open issues (`mcp__github__list_issues`) to see prioritized backlog.
2. Work on highest-priority unblocked issue.
3. Create a branch per issue: `feature/#N-description` or `fix/#N-description`.
4. Comment progress on the issue and check off completed checklist items.
5. On completion: create PR linked to issue, close issue when merged.

**Labels:** `epic:{auth,frontend,backend,testing,devops,dx}` | `priority:{critical,high,medium,low}` | `type:{bug,feature,tech-debt,infra}`

**New work:** If unplanned work is discovered, create a new issue with appropriate labels before starting.

---

## Observability (quick ref)

- Logs: `logs/` (git-ignored). `api.log` = backend, `combined.log` = full Turborepo output.
- Custom runner: `scripts/dev.mjs` — intercepts stdout/stderr with ANSI stripping.
- After every intervention: `npm run lint -- --fix`.
- RAG (LanceDB, legacy): `npm run query` before massive reads. `npm run ingest` after significant doc changes.
