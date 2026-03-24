# GemTest Project Mandates

These mandates override any default agent behavior.

## Project Overview

Fullstack testing platform validating a professional stack: monorepo + GraphQL + SQLite.

- **Monorepo**: Turborepo + pnpm
- **Frontend**: React + Vite + Tailwind + Apollo Client
- **Backend**: Apollo Server + Drizzle ORM
- **Persistence**: SQLite (LibSQL)
- **Shared types**: `packages/schema` (Zod as single source of truth)

## 1. Communication

- **Chat language:** Spanish only.
- **Internal thinking:** English allowed.
- **Critical agency:** Treat every user request as a refutable hypothesis. Act as a Senior Critical Reviewer — look for flaws or tech debt before proceeding.

## 2. Code Standards (Clean Code)

- **Code language:** All code, comments, logs, and technical docs in English.
- **JSDoc:** All functions must include JSDoc: What/Why, Params & Returns, Context.
- **Naming:** Tables and models in singular PascalCase (`User` for table, type, and Zod schema).
- **Arrow Functions:** Mandatory for internal logic and components.
- **Immutability:** `const` over `let`. No object/array mutation (use spread/functional methods).
- **Simplicity:** Low cyclomatic complexity. Max 3 levels of indentation.

## 3. Type Management

- **Independent definitions:** Parameter types must be defined separately, never inline.
- **Destructuring:** In the function body, not the prototype.
  - Correct: `type MyFnParams = { a: string }` → `const myFn = (params: MyFnParams) => { const { a } = params; ... }`
- **Strict typing:**
  - `any` is forbidden. Casting (`as any`, `as unknown`, `as string`) is forbidden.
  - Resolve TS errors at the root cause using advanced typing or type guards.
  - **Type Extraction:** Prefer `Parameters<>`, `ReturnType<>`, `Type['prop']` over manual re-definitions.
  - **Annotations:** Only when they add more info than inference. Never annotate to widen or falsify the real type. Correct inference > incorrect annotation.
  - **Return types:** Explicit on exported/public functions. Optional on internal functions with clear inference.
  - **Location:** Centralized in `packages/schema` or `*.types.ts`. Exception: types used by a single function live right above it.

## 4. Error Handling (neverthrow)

- `throw` and `try/catch` are forbidden for business logic or expected errors (DB, API, validation).
- All fallible functions return `Result<T, E>` or `ResultAsync<T, E>`.
- Prefer `await` with `ResultAsync` for linear flow. Avoid deep `.andThen()` nesting.
- Exhaustive handling with `.match()` or `switch` on tags.

## 5. Observability

- Logs directory: `logs/` (git-ignored). `api.log` for backend, `combined.log` for full Turborepo output.
- Custom runner in `scripts/dev.mjs` intercepts stdout/stderr with ANSI stripping.
- Run `npm run lint -- --fix` after every intervention.

## 6. Context Window Protection (context-mode)

context-mode MCP tools are available to keep raw data in sandboxed subprocesses. These rules protect the context window from flooding during research and exploration.

### Tool routing hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary research tool. Runs multiple commands, auto-indexes output, returns search results. ONE call replaces many individual steps.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content from prior commands. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution for analysis. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

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

## 7. Context & RAG (Legacy)

- **RAG (LanceDB):** Use `npm run query` before massive reads. Run `npm run ingest` after significant doc changes.
- **E2E & CI/CD:** High priority once core is stable.

## 8. Project Management (GitHub Issues + MCP)

- **Board:** https://github.com/users/VIXXENT/projects/2
- **MCP:** GitHub MCP configured in `.mcp.json`. Use `mcp__github__*` tools to manage issues, PRs, and comments.
- **Workflow per session:**
  1. Check open issues (`mcp__github__list_issues`) to see prioritized backlog.
  2. Work on highest-priority unblocked issue.
  3. Create a branch per issue: `feature/#N-description` or `fix/#N-description`.
  4. Comment progress on the issue and check off completed checklist items.
  5. On completion: create PR linked to issue, close issue when merged.
- **Labels:** `epic:{auth,frontend,backend,testing,devops,dx}` | `priority:{critical,high,medium,low}` | `type:{bug,feature,tech-debt,infra}`
- **New work:** If unplanned work is discovered, create a new issue with appropriate labels before starting.
