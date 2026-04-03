# Code Standards

All coding mandates for the Voiler project. Enforced by ESLint, Prettier, and tsc.

## Communication

- **Chat language:** Spanish only. Internal thinking: English allowed.
- **Code language:** All code, comments, logs, and docs in English.
- **Critical agency:** Treat every request as a refutable hypothesis.

## No Semicolons

Prettier is configured with `semi: false`. Never add semicolons.
Prettier auto-removes them, so this is enforced automatically.
If you see a semicolon in a diff, your editor is misconfigured.

## Arrow Functions Only

Use arrow functions for all logic and components. No `function` declarations:

```typescript
// GOOD
const createEmail: (params: CreateEmailParams) => Result<Email, DomainError> = (params) => {
  const { value } = params
  // ...
}

// BAD
function createEmail(params: CreateEmailParams): Result<Email, DomainError> {
  // ...
}
```

## Max 1 Parameter -- Object Params

Arrow functions take at most 1 parameter. Multiple values are wrapped in an object:

```typescript
// GOOD
interface CreateUserParams {
  readonly name: string
  readonly email: string
}

const createUser: (params: CreateUserParams) => ResultAsync<UserEntity, AppError> = (params) => {
  const { name, email } = params
  // ...
}

// BAD
const createUser = (name: string, email: string) => {
  /* ... */
}
```

## Trust TS Inference

Do **not** annotate types when TypeScript infers correctly. **Do** annotate when initializing objects destined as function arguments (pre-validation pattern -- so errors point to the wrong property, not the call site):

```typescript
// GOOD -- inferred
const trimmed = value.trim().toLowerCase()

// GOOD -- pre-validation: annotate to catch errors at declaration
const startLog: RequestStartLog = {
  level: 'info',
  event: 'request.start',
  requestId,
  method,
  path,
  timestamp: new Date(startMs).toISOString(),
}

// BAD -- redundant annotation
const trimmed: string = value.trim().toLowerCase()
```

**Explicit return types** are required on all exported functions.

## `const` Over `let`, No Mutation

Always use `const`. Never reassign. Never mutate objects or arrays:

```typescript
// GOOD
const ageDays: number = maxAgeDays ?? DEFAULT_MAX_AGE_DAYS
const cutoffMs: number = Date.now() - ageDays * MS_PER_DAY
const cutoffDate: Date = new Date(cutoffMs)

// BAD
let cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - 30)
```

## Trailing Commas

Always use trailing commas in multi-line structures:

```typescript
// GOOD
return {
  createUser,
  getUser,
  listUsers,
}
```

## Line Length

Prettier handles formatting at `printWidth: 100`. No hard ESLint limit.

## TypeScript Strictness

- `any` is **forbidden**. Use proper types or generics.
- Casting (`as any`, `as unknown`) is **forbidden**. The only exception is branded types (e.g., `as Email`).
- Parameter types defined as separate interfaces, destructured in the function body:

```typescript
interface WriteAuditLogParams {
  readonly db: DbClient
  readonly entry: AuditLogEntry
}

const writeAuditLog: (params: WriteAuditLogParams) => void = (params) => {
  const { db, entry } = params
  // ...
}
```

## JSDoc

All exported functions must have JSDoc:

```typescript
/**
 * Validate and create an Email value object.
 *
 * @returns A Result containing the branded Email or a DomainError.
 */
export const createEmail: (params: CreateEmailParams) => Result<Email, DomainError> = (params) => {
  // ...
}
```

## `readonly` on Interface Properties

All interface properties use `readonly`:

```typescript
interface CreateContainerParams {
  readonly db: DbClient
}
```
