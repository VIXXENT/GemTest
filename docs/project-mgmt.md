# Project Management

Workflow for GitHub Issues, pull requests, and code review in Voiler.

## GitHub Issues

Issues track all planned work. Each issue has a clear title, description, and acceptance criteria.

### Labels

| Label      | Use                                                  |
| ---------- | ---------------------------------------------------- |
| `feat`     | New feature or capability                            |
| `fix`      | Bug fix                                              |
| `refactor` | Code improvement without behavior change             |
| `docs`     | Documentation only                                   |
| `test`     | Test additions or improvements                       |
| `chore`    | Tooling, CI, dependencies                            |
| `plan-X`   | Tracks which implementation plan the work belongs to |

### Issue Template

- Title: concise description of the deliverable
- Body: context, acceptance criteria, related plan reference
- Labels: at least one type label + plan label if applicable

## Branch Naming

```
feat/plan-X-short-description
fix/issue-number-short-description
docs/plan-X-short-description
```

Examples: `feat/plan-a-foundation`, `fix/42-email-validation`, `docs/plan-f-docs`.

## Pull Request Process

1. Create a branch from `main`
2. Implement changes with commits following conventional style
3. Run full verification before opening PR:
   - `pnpm lint` -- 0 errors
   - `pnpm typecheck` -- 0 errors
   - `pnpm test` -- all passing
   - `pnpm format:check` -- all formatted
4. Open PR with summary and test plan
5. PR gets double-agent review (see below)
6. Squash-merge to `main`

### PR Title Format

```
type(scope): short description
```

Examples:

- `feat(plan-a): implement Hono server with security middleware`
- `fix(auth): correct cookie prefix in production`
- `docs(plan-f): add documentation hub and detail docs`

### PR Body Template

```markdown
## Summary

- Bullet points describing what changed and why

## Test plan

- [ ] Unit tests pass
- [ ] E2E tests pass (if runtime code changed)
- [ ] Lint and typecheck clean
```

## Code Review -- Double-Agent Process

Every PR gets reviewed by two AI agents with different perspectives:

1. **Strict Reviewer** -- focuses on correctness, security, architecture compliance, and edge cases. Flags anything that violates the coding mandates.

2. **Pragmatic Triager** -- evaluates the strict reviewer's findings. Separates genuine issues from false positives and nitpicks. Prioritizes findings by severity.

This catches real issues while avoiding review fatigue from pedantic feedback.

### Review Checklist

- [ ] No `any` or `as` casting (except branded types)
- [ ] No semicolons
- [ ] Arrow functions with max 1 param
- [ ] `Result`/`ResultAsync` for fallible functions
- [ ] No `throw`/`try-catch` in business logic
- [ ] JSDoc on all exports
- [ ] Domain layer has zero infra imports
- [ ] tRPC routers are thin (parse, call, return)
- [ ] Infrastructure errors sanitized before client response

## Commit Style

```
type(scope): description

Co-Authored-By: Agent Name <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

## Plan Execution

Implementation follows numbered plans in `docs/superpowers/plans/`. Each plan:

- Has a spec defining contracts and deliverables
- Is executed in a dedicated branch (`feat/plan-X-...`)
- Gets a PR with full verification
- Is tracked by plan label on issues

Current plans:

- Plan A: Foundation (completed)
- Plan B: Auth + sessions (completed)
- Plans C+: See `docs/superpowers/plans/` for details
