# Multi-Agent System — GemTest

This folder defines the role prompts for the GemTest multi-agent development team. Each file is a system instruction that configures a Claude Code session to behave as a specific agent.

## Architecture

```
Human
  │
  ▼
ORCHESTRATOR  ─────────────────────────────────────
  · Single interface with the human                │
  · Creates/assigns/closes GitHub Issues           │
  · Receives reports from ALL agents               │
  · Does NOT write code, tests, or docs            │
  │                                                │
  ├──► ARCHITECT                                   │
  │      · Analyzes issue requirements             │
  │      · Creates implementation plans            │
  │      · Reviews architecture in PRs             │
  │                                                │
  ├──► DEVELOPER                                   │
  │      · Implements issues (source code only)    │
  │      · Cannot edit *.spec.ts / *.test.ts       │
  │      · Opens PR when done                      │
  │                                                │
  ├──► REVIEWER                                    │
  │      · Verifies CLAUDE.md compliance           │
  │      · Checks types, no-any, neverthrow        │
  │      · Approves PR or creates fix Issue        │
  │                                                │
  ├──► QA DESIGNER                                 │
  │      · Designs test plans (unit + E2E)         │
  │      · Creates Issues for Tester (TDD first)   │
  │      · Creates Bug Issues on failures          │
  │                                                │
  └──► TESTER                                      │
         · Implements QA Designer plans            │
         · Only edits test files                   │
         · Reports results to QA Designer          │
─────────────────────────────────────────────────────
```

## Agent Files

| File | Role | Writes To |
|------|------|-----------|
| `orchestrator.md` | Human interface, Issue management | GitHub Issues |
| `architect.md` | Plans, interface design, PR arch review | Issue comments |
| `developer.md` | Source code implementation | `apps/`, `packages/` |
| `reviewer.md` | CLAUDE.md compliance, PR approval | PR reviews, fix Issues |
| `qa-designer.md` | Test strategy, bug triage | Test Issues, Bug Issues |
| `tester.md` | Test implementation and execution | Test files, result reports |

## Handoff Contracts

| From → To | Channel | Format |
|-----------|---------|--------|
| Human → Orchestrator | Chat | Natural language request |
| Orchestrator → Architect | GitHub Issue | Functional requirements + acceptance criteria |
| Orchestrator → QA Designer | GitHub Issue comment | "Please design test plan for #N" |
| Architect → Developer | Issue comment | Files, interfaces, constraints, error cases |
| Architect → QA Designer | Issue comment | Inputs, outputs, error cases, fixtures |
| Developer → Reviewer | GitHub PR | PR description with checklist and test steps |
| Reviewer → Orchestrator | Issue comment | "PR #N approved" or fix Issue created |
| QA Designer → Tester | GitHub Issue | Test cases, fixtures, coverage targets |
| Tester → QA Designer | Issue comment | Pass rate, failures, coverage data |
| QA Designer → Orchestrator | Issue comment | "Test plan complete. N/M passing. Coverage X%." |

## Complete Feature Lifecycle

```
1. Human requests feature
       │
       ▼
2. Orchestrator creates GitHub Issue #N
       │
       ▼
3. Architect reads Issue → posts Implementation Plan + Test Brief on #N
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
4. Developer implements (branch:       4b. QA Designer creates Tester Issue #M
   feature/#N-description)                 with full test cases
       │                                  │
       ▼                                  ▼ (TDD: tests written first, confirm red)
5. Developer opens PR #P           5b. Tester implements test files
       │                                  │
       ▼                                  ▼
6. Reviewer audits PR #P           6b. Tester runs suite → posts results on #M
       │                                  │
   [FAIL] Fix Issue #Q created     [FAIL] QA Designer creates Bug Issue #R
       │                                  │
   Developer fixes → re-review     Developer fixes → Tester re-runs
       │                                  │
   [PASS] Reviewer approves        [PASS] QA Designer reports to Orchestrator
       │
       ▼
7. Orchestrator confirms: PR merged, Issue #N closed
```

## Using This System

### Starting a new Claude Code session as an agent

1. Open a new Claude Code session.
2. Use the contents of the relevant `_agents/<role>.md` as your system prompt or initial instruction.
3. Always reference the GitHub Issue number when posting comments.
4. Always state your role in your first message: "Acting as [ROLE] on Issue #N."

### Context mode

All agents should use context-mode MCP tools to avoid flooding the context window:
- `ctx_batch_execute` for multi-file research
- `ctx_search` for follow-up queries
- `ctx_execute` for running commands with large output (test runs, lint)

See `CLAUDE.md` Section 6 for the full routing hierarchy.

### GitHub Labels

Use consistent labels on all Issues:

| Category | Values |
|----------|--------|
| `epic:` | `auth`, `frontend`, `backend`, `testing`, `devops`, `dx` |
| `priority:` | `critical`, `high`, `medium`, `low` |
| `type:` | `bug`, `feature`, `tech-debt`, `infra` |

### Branch Naming

```
feature/#N-short-description
fix/#N-short-description
test/#N-short-description
refactor/#N-short-description
```

## Key Constraints (from CLAUDE.md)

These constraints apply to ALL agents producing code or test files:

- **No `any`** — TypeScript strict mode enforced
- **No type casting** — resolve type errors at root cause
- **No `throw`** — use `neverthrow` `Result<T, E>` for all fallible logic
- **Arrow functions** — mandatory for all functions and components
- **JSDoc** — required on all exported functions
- **`const` over `let`** — no mutation, use spread/functional methods
- **Max 3 levels of indentation** — refactor if exceeded
- **Types defined separately** — no inline type literals in function signatures
