# Testing

Voiler uses **Vitest** for unit tests and **Playwright** for E2E tests.

## Test Locations

| Package            | Test directory   | What to test                             |
| ------------------ | ---------------- | ---------------------------------------- |
| `packages/domain/` | `src/__tests__/` | Value objects, domain error constructors |
| `apps/api/`        | `src/__tests__/` | Use cases, tRPC guards, error mapping    |
| `apps/web/`        | `e2e/`           | Full user flows (Playwright)             |

## Running Tests

```bash
pnpm test              # Run all Vitest unit tests (all packages)
pnpm test:e2e          # Run Playwright E2E (requires dev server running)
```

## Vitest Configuration

The project uses a Vitest workspace at the root that discovers all packages:

```
vitest.workspace.ts    # Root workspace config
apps/api/vitest.config.ts
packages/domain/vitest.config.ts
```

## Writing Unit Tests

### Use Case Tests

Use cases are tested by mocking the repository port:

```typescript
import { errAsync, okAsync } from 'neverthrow'
import { describe, it, expect, vi } from 'vitest'

const makeMockRepo = (): IUserRepository => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
})

describe('createUser use case', () => {
  it('returns Ok(UserEntity) on happy path', async () => {
    const fakeUser = makeFakeUser()
    const repo = makeMockRepo()
    vi.mocked(repo.create).mockReturnValue(okAsync(fakeUser))

    const useCase = createCreateUser({ userRepository: repo })
    const result = await useCase({ name: 'Test User', email: 'test@example.com' })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual(fakeUser)
    }
  })

  it('returns Err when repository create fails', async () => {
    const repo = makeMockRepo()
    const repoError: AppError = infrastructureError({ message: 'db error' })
    vi.mocked(repo.create).mockReturnValue(errAsync(repoError))

    const useCase = createCreateUser({ userRepository: repo })
    const result = await useCase({ name: 'Test', email: 'test@example.com' })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.tag).toBe('InfrastructureError')
    }
  })
})
```

### Domain Tests

Domain error constructors and value objects are tested for correct tag/message:

```typescript
describe('DomainError constructors', () => {
  it('invalidEmail creates correct tag and message', () => {
    const error = invalidEmail('bad email')
    expect(error.tag).toBe('InvalidEmail')
    expect(error.message).toBe('bad email')
  })
})
```

## Test Patterns

| Pattern                         | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| Mock ports, not implementations | Use `vi.fn()` to stub `IUserRepository` methods                 |
| Test both paths                 | Always test `Ok` and `Err` branches                             |
| Use `isOk()` / `isErr()` guards | Narrow the result type before asserting on `.value` or `.error` |
| Factory helpers                 | Create `makeFakeUser()` and `makeMockRepo()` helpers            |
| No DB in unit tests             | Unit tests never touch the database                             |

## TDD Workflow

1. Write a failing test for the new behavior
2. Implement the minimum code to pass
3. Refactor while keeping tests green
4. Run `pnpm test` to verify

## E2E Tests (Playwright)

E2E tests live in `apps/web/e2e/` and test full user flows through the browser. They require the dev server to be running:

```bash
# Terminal 1
docker compose up db -d
pnpm --filter @voiler/api dev

# Terminal 2
pnpm test:e2e
```

## Verification Checklist

After every task:

1. `pnpm test` -- all unit tests passing
2. `pnpm test:e2e` -- if runtime code changed
3. `pnpm lint` -- 0 errors
4. `pnpm typecheck` -- 0 errors
