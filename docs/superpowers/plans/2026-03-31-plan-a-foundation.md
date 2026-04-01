# Plan A: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up the monorepo foundation with Hono, PostgreSQL, Drizzle, and all tooling gates.

**Architecture:** Turborepo + pnpm monorepo with 6 packages and 1 app. PostgreSQL via Docker Compose. Hono server with security middleware.

**Tech Stack:** Hono, Drizzle (pg-core), Zod, PostgreSQL, Turborepo, pnpm, ESLint, Prettier, Vitest

---

## Task Dependency Graph

```
T1 (Monorepo scaffold)
 |
 +---> T2 (config-ts) --+
 |                       |
 +---> T3 (ESLint +   --+--> T5 (config-env) --+
 |      Prettier)        |                      |
 +---> T4 (Docker +   --+--> T6 (schema)     --+--> T8 (Hono server)
        PostgreSQL)      |                      |
                         +--> T7 (Empty       --+
                               barrels)         |
                                                +--> T9 (Vitest)
                                                |
                                                +--> T10 (Verification)
```

Tasks 2, 3, 4 can run in parallel after Task 1.
Tasks 5, 6, 7 can run in parallel after Tasks 2+3.
Task 8 depends on 4, 5, 6, 7.
Tasks 9, 10 depend on 8.

---

## Task 1: Monorepo Scaffold

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.npmrc`

- [ ] **Step 1: Initialize root `package.json`**

```json
{
  "name": "voiler",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:up": "docker compose up db -d",
    "db:down": "docker compose down"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Create root `tsconfig.json`**

```json
{
  "compilerOptions": {
    "incremental": true,
    "composite": false
  },
  "references": [
    { "path": "apps/api" },
    { "path": "packages/config-env" },
    { "path": "packages/schema" },
    { "path": "packages/domain" },
    { "path": "packages/core" },
    { "path": "packages/ui" }
  ]
}
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Database
drizzle/meta/

# Test
coverage/

# Docker
.docker/
```

- [ ] **Step 6: Create `.env.example`**

```env
# Server
NODE_ENV=development
PORT=4000

# Database (PostgreSQL via Docker Compose)
DATABASE_URL=postgresql://voiler:voiler_dev@localhost:5432/voiler_dev

# Auth (generate with: openssl rand -base64 48)
AUTH_SECRET=replace-me-with-at-least-32-characters-long-secret-key
```

- [ ] **Step 7: Create `.npmrc`**

```ini
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
```

- [ ] **Step 8: Commit**

```
feat(plan-a): scaffold monorepo root with Turborepo + pnpm workspace
```

---

## Task 2: packages/config-ts

**Files:**

- Create: `packages/config-ts/package.json`
- Create: `packages/config-ts/base.json`

- [ ] **Step 1: Create `packages/config-ts/package.json`**

```json
{
  "name": "@voiler/config-ts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "files": ["base.json"]
}
```

- [ ] **Step 2: Create `packages/config-ts/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Commit**

```
feat(plan-a): add shared TypeScript config package
```

---

## Task 3: ESLint + Prettier

**Files:**

- Create: `eslint.config.mjs`
- Create: `prettier.config.mjs`

- [ ] **Step 1: Install ESLint and Prettier dependencies (root)**

Run:

```bash
pnpm add -Dw eslint @eslint/js typescript-eslint \
  eslint-config-prettier eslint-plugin-import-x \
  prettier
```

Expected: Dependencies added to root `package.json` devDependencies.

- [ ] **Step 2: Create `eslint.config.mjs`**

```js
// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import-x'
import prettierConfig from 'eslint-config-prettier'

/** @type {import('typescript-eslint').Config} */
const config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      'import-x': importPlugin,
    },
    rules: {
      // --- Semicolons ---
      semi: ['error', 'never'],
      '@typescript-eslint/member-delimiter-style': [
        'error',
        {
          multiline: { delimiter: 'none' },
          singleline: { delimiter: 'semi', requireLast: false },
        },
      ],

      // --- Type annotations ---
      '@typescript-eslint/typedef': [
        'error',
        {
          variableDeclaration: true,
          variableDeclarationIgnoreFunction: true,
        },
      ],

      // --- No any ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // --- Arrow function params ---
      'max-params': ['error', { max: 1 }],

      // --- Trailing commas ---
      'comma-dangle': ['error', 'always-multiline'],

      // --- Curly braces ---
      curly: ['error', 'all'],

      // --- Max line length ---
      'max-len': [
        'error',
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: false,
        },
      ],

      // --- Imports ---
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',

      // --- Immutability ---
      'prefer-const': 'error',
      'no-var': 'error',

      // --- Security ---
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // --- General quality ---
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.turbo/**', '**/coverage/**'],
  },
)

export default config
```

- [ ] **Step 3: Create `prettier.config.mjs`**

```js
/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'always',
  endOfLine: 'lf',
  bracketSpacing: true,
}

export default config
```

- [ ] **Step 4: Add lint scripts to each package and app**

Each package that has TypeScript code needs in its `package.json`:

```json
{
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  }
}
```

These will be added as packages are created in subsequent tasks.

- [ ] **Step 5: Commit**

```
feat(plan-a): configure ESLint strict rules and Prettier
```

---

## Task 4: Docker Compose + PostgreSQL

**Files:**

- Create: `docker-compose.yml`
- Modify: `.env.example` (already has DATABASE_URL from Task 1)

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: voiler-db
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: voiler
      POSTGRES_PASSWORD: voiler_dev
      POSTGRES_DB: voiler_dev
    volumes:
      - voiler_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U voiler -d voiler_dev']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  voiler_pgdata:
    driver: local
```

- [ ] **Step 2: Verify PostgreSQL starts**

Run:

```bash
docker compose up db -d
```

Expected: Container `voiler-db` running, port 5432 open.

Run:

```bash
docker compose exec db pg_isready -U voiler -d voiler_dev
```

Expected: `voiler_dev - accepting connections`

- [ ] **Step 3: Commit**

```
feat(plan-a): add Docker Compose with PostgreSQL 16
```

---

## Task 5: packages/config-env

**Files:**

- Create: `packages/config-env/package.json`
- Create: `packages/config-env/tsconfig.json`
- Create: `packages/config-env/src/schema.ts`
- Create: `packages/config-env/src/load-env.ts`
- Create: `packages/config-env/src/index.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm add --filter @voiler/config-env zod dotenv
```

Expected: Dependencies added to `packages/config-env/package.json`.

- [ ] **Step 2: Create `packages/config-env/package.json`**

```json
{
  "name": "@voiler/config-env",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@voiler/config-ts": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create `packages/config-env/tsconfig.json`**

```json
{
  "extends": "@voiler/config-ts/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `packages/config-env/src/schema.ts`**

```ts
import { z } from 'zod'

/**
 * Minimum length for AUTH_SECRET to ensure cryptographic security.
 * 32 characters provides at least 192 bits of entropy with base64.
 */
const AUTH_SECRET_MIN_LENGTH: number = 32

/**
 * Zod schema for environment variable validation.
 * Validates all required env vars at startup — fail-fast on misconfiguration.
 *
 * @remarks
 * AUTH_SECRET must be at least 32 characters for session signing security.
 * DATABASE_URL must be a valid PostgreSQL connection string.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL connection string'),
  AUTH_SECRET: z
    .string()
    .min(
      AUTH_SECRET_MIN_LENGTH,
      `AUTH_SECRET must be at least ${String(AUTH_SECRET_MIN_LENGTH)} characters`,
    ),
})

type EnvSchema = typeof envSchema

/**
 * Validated environment configuration type.
 * Inferred from the Zod env schema — single source of truth.
 */
type EnvConfig = z.infer<EnvSchema>

export { envSchema }
export type { EnvConfig }
```

- [ ] **Step 5: Create `packages/config-env/src/load-env.ts`**

```ts
import { config } from 'dotenv'
import { z } from 'zod'

import type { EnvConfig } from './schema.js'
import { envSchema } from './schema.js'

/**
 * Load and validate environment variables with fail-fast behavior.
 * Reads from `.env` file and validates against the Zod schema.
 *
 * @returns Validated and typed environment configuration.
 * @throws Exits process with code 1 if validation fails — this is
 *   intentional infrastructure-level failure, not business logic.
 */
const loadEnv = (): EnvConfig => {
  config()

  const result: z.SafeParseReturnType<unknown, EnvConfig> = envSchema.safeParse(process.env)

  if (!result.success) {
    const formattedErrors: string = result.error.issues
      .map((issue: z.ZodIssue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    console.error('[config-env] Environment validation failed:\n' + formattedErrors)
    process.exit(1)
  }

  return result.data
}

export { loadEnv }
```

- [ ] **Step 6: Create `packages/config-env/src/index.ts`**

````ts
/**
 * @module @voiler/config-env
 *
 * Zod-validated environment configuration with fail-fast behavior.
 * Validates all required env vars at startup — if any are missing
 * or malformed, the process exits immediately with a clear error.
 *
 * @example
 * ```ts
 * import { loadEnv } from '@voiler/config-env'
 * const env = loadEnv()
 * console.log(env.PORT) // 4000
 * ```
 */
export { loadEnv } from './load-env.js'
export { envSchema } from './schema.js'
export type { EnvConfig } from './schema.js'
````

- [ ] **Step 7: Commit**

```
feat(plan-a): add config-env package with Zod validation and fail-fast
```

---

## Task 6: packages/schema

**Files:**

- Create: `packages/schema/package.json`
- Create: `packages/schema/tsconfig.json`
- Create: `packages/schema/src/entities/user.ts`
- Create: `packages/schema/src/index.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm add --filter @voiler/schema zod drizzle-orm
pnpm add -D --filter @voiler/schema @types/node typescript
```

Expected: Dependencies added to `packages/schema/package.json`.

- [ ] **Step 2: Create `packages/schema/package.json`**

```json
{
  "name": "@voiler/schema",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "drizzle-orm": "^0.38.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@voiler/config-ts": "workspace:*",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create `packages/schema/tsconfig.json`**

```json
{
  "extends": "@voiler/config-ts/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `packages/schema/src/entities/user.ts`**

```ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

/**
 * User table definition for PostgreSQL via Drizzle ORM.
 * Single source of truth for the User entity schema.
 *
 * @remarks
 * Uses UUID primary keys for security (non-enumerable).
 * Timestamps use `defaultNow()` for automatic creation tracking.
 * The `role` column defaults to 'user' — extended roles added in Plan C.
 */
const User = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Zod schema for selecting a User from the database.
 * Inferred from the Drizzle table definition — stays in sync automatically.
 */
const UserSelectSchema = createSelectSchema(User)

/**
 * Zod schema for inserting a new User into the database.
 * Omits auto-generated fields (id, timestamps).
 */
const UserInsertSchema = createInsertSchema(User, {
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  role: z.enum(['user', 'admin', 'dev']).default('user'),
})

/**
 * TypeScript type for a User record as selected from the database.
 */
type UserSelect = z.infer<typeof UserSelectSchema>

/**
 * TypeScript type for inserting a new User record.
 */
type UserInsert = z.infer<typeof UserInsertSchema>

export { User, UserSelectSchema, UserInsertSchema }
export type { UserSelect, UserInsert }
```

- [ ] **Step 5: Create `packages/schema/src/index.ts`**

````ts
/**
 * @module @voiler/schema
 *
 * Zod + Drizzle schemas — single source of truth for all entities.
 * Drizzle owns table definitions, Zod owns validation rules.
 * Types are inferred from schemas — never manually defined.
 *
 * @example
 * ```ts
 * import { User, UserSelectSchema } from '@voiler/schema'
 * // User = Drizzle pgTable (for queries)
 * // UserSelectSchema = Zod schema (for validation)
 * ```
 */
export { User, UserSelectSchema, UserInsertSchema } from './entities/user.js'

export type { UserSelect, UserInsert } from './entities/user.js'
````

- [ ] **Step 6: Install drizzle-zod**

Run:

```bash
pnpm add --filter @voiler/schema drizzle-zod
```

Expected: `drizzle-zod` added to `packages/schema/package.json` dependencies.

- [ ] **Step 7: Commit**

```
feat(plan-a): add schema package with User table (Drizzle + Zod)
```

---

## Task 7: Empty Package Barrels

**Files:**

- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/domain/package.json`**

```json
{
  "name": "@voiler/domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@voiler/config-ts": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create `packages/domain/tsconfig.json`**

```json
{
  "extends": "@voiler/config-ts/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/domain/src/index.ts`**

```ts
/**
 * @module @voiler/domain
 *
 * Domain layer — entities, value objects, and domain errors.
 * This package has ZERO infrastructure dependencies.
 *
 * @remarks
 * Populated in Plan B with:
 * - UserEntity (domain entity with branded types)
 * - Value objects: Email, Password, UserId
 * - Domain errors: InvalidEmail, UserNotFound, etc.
 *
 * Currently empty — serves as a structural placeholder.
 */
```

- [ ] **Step 4: Create `packages/core/package.json`**

```json
{
  "name": "@voiler/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@voiler/config-ts": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 5: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "@voiler/config-ts/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create `packages/core/src/index.ts`**

```ts
/**
 * @module @voiler/core
 *
 * Core layer — port interfaces and application error union.
 * Depends only on @voiler/domain and neverthrow.
 *
 * @remarks
 * Populated in Plan B with:
 * - IUserRepository (port interface for user persistence)
 * - IPasswordService (port interface for hashing)
 * - ITokenService (port interface for JWT)
 * - AppError union type (domain + infrastructure errors)
 *
 * Currently empty — serves as a structural placeholder.
 */
```

- [ ] **Step 7: Create `packages/ui/package.json`**

```json
{
  "name": "@voiler/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@voiler/config-ts": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 8: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@voiler/config-ts/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 9: Create `packages/ui/src/index.ts`**

```ts
/**
 * @module @voiler/ui
 *
 * Shared UI components — Tailwind CSS + shadcn/ui based.
 *
 * @remarks
 * Populated in Plan D with:
 * - shadcn/ui component library
 * - Shared layout components
 * - Theme configuration
 *
 * Currently empty — serves as a structural placeholder.
 */
```

- [ ] **Step 10: Commit**

```
feat(plan-a): add empty barrel packages (domain, core, ui)
```

---

## Task 8: apps/api — Hono Server

**Files:**

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/http/health.ts`
- Create: `apps/api/src/http/index.ts`
- Create: `apps/api/src/middleware/security.ts`
- Create: `apps/api/src/middleware/rate-limiter.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm add --filter @voiler/api \
  hono \
  @hono/node-server \
  drizzle-orm \
  postgres \
  hono-rate-limiter
```

Run:

```bash
pnpm add -D --filter @voiler/api \
  @types/node \
  typescript \
  tsx \
  drizzle-kit
```

Expected: Dependencies added to `apps/api/package.json`.

- [ ] **Step 2: Create `apps/api/package.json`**

```json
{
  "name": "@voiler/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@voiler/config-env": "workspace:*",
    "@voiler/schema": "workspace:*",
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "drizzle-orm": "^0.38.0",
    "postgres": "^3.4.0",
    "hono-rate-limiter": "^0.4.0"
  },
  "devDependencies": {
    "@voiler/config-ts": "workspace:*",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "drizzle-kit": "^0.30.0"
  }
}
```

- [ ] **Step 3: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@voiler/config-ts/base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/config-env" }, { "path": "../../packages/schema" }]
}
```

- [ ] **Step 4: Create `apps/api/src/db/schema.ts`**

```ts
/**
 * Re-exports all Drizzle table definitions from @voiler/schema.
 * This file is the single import point for Drizzle migrations and queries.
 *
 * @remarks
 * drizzle-kit reads this file for migration generation.
 * New tables from @voiler/schema must be re-exported here.
 */
export { User } from '@voiler/schema'
```

- [ ] **Step 5: Create `apps/api/src/db/index.ts`**

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import type { EnvConfig } from '@voiler/config-env'

import * as schema from './schema.js'

/**
 * Database connection and query result types.
 */
type DbClient = ReturnType<typeof drizzle<typeof schema>>

type CreateDbParams = {
  databaseUrl: EnvConfig['DATABASE_URL']
}

/**
 * Create a Drizzle ORM instance connected to PostgreSQL.
 * Uses the postgres.js driver for optimal performance.
 *
 * @param params - Object containing the DATABASE_URL connection string.
 * @returns Configured Drizzle ORM instance with schema type inference.
 *
 * @remarks
 * The connection is lazy — no query is executed until first use.
 * Schema is passed for full type inference in queries.
 */
const createDb = (params: CreateDbParams): DbClient => {
  const { databaseUrl } = params

  const client: ReturnType<typeof postgres> = postgres(databaseUrl)

  const db: DbClient = drizzle(client, { schema })

  return db
}

export { createDb }
export type { DbClient }
```

- [ ] **Step 6: Create `apps/api/src/middleware/security.ts`**

```ts
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'

import type { MiddlewareHandler } from 'hono'

/**
 * Content Security Policy directives.
 * Strict policy — blocks inline scripts, only allows same-origin resources.
 *
 * @remarks
 * This policy will need tuning in Plan D when the frontend is added.
 * Currently set to maximum strictness for the API-only phase.
 */
const CSP_DIRECTIVES: string = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/**
 * Secure HTTP headers middleware.
 * Sets OWASP-recommended headers: HSTS, CSP, X-Content-Type-Options,
 * X-Frame-Options, Referrer-Policy, and Permissions-Policy.
 *
 * @returns Hono middleware handler that sets security headers on every response.
 */
const securityHeaders = (): MiddlewareHandler => {
  return secureHeaders({
    contentSecurityPolicy: CSP_DIRECTIVES,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
  })
}

type CsrfMiddlewareParams = {
  allowedOrigins: string[]
}

/**
 * CSRF protection middleware.
 * Validates Origin header on mutation requests (POST, PUT, PATCH, DELETE).
 *
 * @param params - Object containing allowed origins for CSRF validation.
 * @returns Hono middleware handler for CSRF protection.
 *
 * @remarks
 * Requires Hono >= 4.6.5 to avoid CVE-2024-48913 (case-insensitive bypass).
 */
const csrfProtection = (params: CsrfMiddlewareParams): MiddlewareHandler => {
  const { allowedOrigins } = params

  return csrf({ origin: allowedOrigins })
}

export { securityHeaders, csrfProtection }
```

- [ ] **Step 7: Create `apps/api/src/middleware/rate-limiter.ts`**

```ts
import { rateLimiter } from 'hono-rate-limiter'

import type { MiddlewareHandler } from 'hono'

/**
 * Default rate limit: 100 requests per minute per IP.
 * Conservative for a general API — auth endpoints get stricter limits in Plan B.
 */
const DEFAULT_WINDOW_MS: number = 60_000
const DEFAULT_MAX_REQUESTS: number = 100

type RateLimiterConfig = {
  windowMs?: number
  max?: number
}

/**
 * Global rate limiter middleware.
 * Limits requests per IP address to prevent abuse and DDoS.
 *
 * @param config - Optional override for window duration and max requests.
 * @returns Hono middleware handler that enforces rate limiting.
 *
 * @remarks
 * Uses in-memory store by default. For multi-instance deployments,
 * replace with Redis-backed store.
 * Returns 429 Too Many Requests when limit is exceeded.
 */
const createRateLimiter = (config?: RateLimiterConfig): MiddlewareHandler => {
  const windowMs: number = config?.windowMs ?? DEFAULT_WINDOW_MS
  const max: number = config?.max ?? DEFAULT_MAX_REQUESTS

  // eslint-disable-next-line @typescript-eslint/typedef
  const limiter = rateLimiter({
    windowMs,
    limit: max,
    standardHeaders: 'draft-6',
    keyGenerator: (c) => {
      const forwardedFor: string | undefined = c.req.header('x-forwarded-for')
      const realIp: string | undefined = c.req.header('x-real-ip')
      const fallback: string = '127.0.0.1'

      return forwardedFor?.split(',')[0]?.trim() ?? realIp ?? fallback
    },
  })

  return limiter
}

export { createRateLimiter }
```

- [ ] **Step 8: Create `apps/api/src/http/health.ts`**

```ts
import { Hono } from 'hono'
import { sql } from 'drizzle-orm'

import type { DbClient } from '../db/index.js'

type HealthRouteParams = {
  db: DbClient
  startTime: number
}

type HealthResponse = {
  status: 'ok' | 'error'
  uptime: number
  db: 'connected' | 'disconnected'
  timestamp: string
}

/**
 * Create the health check HTTP route.
 * Returns server status, uptime, database connectivity, and timestamp.
 *
 * @param params - Object containing the Drizzle DB client and server start time.
 * @returns Hono router with GET /health endpoint.
 *
 * @remarks
 * Used by Docker HEALTHCHECK, load balancers, and monitoring.
 * The DB check executes `SELECT 1` — lightweight and fast.
 */
const createHealthRoute = (params: HealthRouteParams): Hono => {
  const { db, startTime } = params
  // eslint-disable-next-line @typescript-eslint/typedef
  const route = new Hono()

  route.get('/health', async (c) => {
    let dbStatus: HealthResponse['db'] = 'disconnected'

    try {
      await db.execute(sql`SELECT 1`)
      dbStatus = 'connected'
    } catch {
      dbStatus = 'disconnected'
    }

    const uptimeMs: number = Date.now() - startTime
    const uptimeSeconds: number = Math.floor(uptimeMs / 1000)

    const response: HealthResponse = {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      uptime: uptimeSeconds,
      db: dbStatus,
      timestamp: new Date().toISOString(),
    }

    const statusCode: number = dbStatus === 'connected' ? 200 : 503

    return c.json(response, statusCode)
  })

  return route
}

export { createHealthRoute }
export type { HealthResponse }
```

- [ ] **Step 9: Create `apps/api/src/http/index.ts`**

```ts
/**
 * HTTP route barrel — re-exports all REST route factories.
 *
 * @remarks
 * tRPC routes are NOT here — they are mounted separately in Plan B.
 * This barrel is for plain HTTP routes: health, webhooks, etc.
 */
export { createHealthRoute } from './health.js'
export type { HealthResponse } from './health.js'
```

- [ ] **Step 10: Create `apps/api/src/index.ts`**

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { serve } from '@hono/node-server'

import { loadEnv } from '@voiler/config-env'

import { createDb } from './db/index.js'
import { createHealthRoute } from './http/index.js'
import { securityHeaders, csrfProtection } from './middleware/security.js'
import { createRateLimiter } from './middleware/rate-limiter.js'

/**
 * Maximum request body size in bytes (1 MB).
 * Prevents payload-based DoS attacks.
 */
const MAX_BODY_SIZE: number = 1_048_576

/**
 * Server start timestamp for uptime calculation.
 */
const startTime: number = Date.now()

/**
 * Load and validate environment variables.
 * Exits process immediately if validation fails.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const env = loadEnv()

/**
 * Create database connection.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const db = createDb({ databaseUrl: env.DATABASE_URL })

/**
 * Allowed CORS origins.
 * In development, allow localhost frontend.
 * In production, this should be set via environment variable.
 */
const allowedOrigins: string[] =
  env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:4000'] : []

/**
 * Create and configure the Hono application.
 *
 * Middleware order matters:
 * 1. Rate limiter (reject abusive IPs early)
 * 2. Security headers (set on every response)
 * 3. CORS (validate origin before processing)
 * 4. CSRF (validate origin on mutations)
 * 5. Body limit (reject oversized payloads)
 * 6. Routes
 */
// eslint-disable-next-line @typescript-eslint/typedef
const app = new Hono()

// --- Middleware ---
app.use('*', createRateLimiter())
app.use('*', securityHeaders())
app.use(
  '*',
  cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }),
)
app.use('*', csrfProtection({ allowedOrigins }))
app.use(
  '*',
  bodyLimit({
    maxSize: MAX_BODY_SIZE,
    onError: (c) => {
      return c.json({ error: 'Payload too large' }, 413)
    },
  }),
)

// --- Routes ---
// eslint-disable-next-line @typescript-eslint/typedef
const healthRoute = createHealthRoute({ db, startTime })
app.route('/', healthRoute)

// --- Server ---
serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.warn(`[api] Server running on http://localhost:${String(info.port)}`)
    console.warn(`[api] Environment: ${env.NODE_ENV}`)
  },
)
```

- [ ] **Step 11: Create `apps/api/drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit configuration for migration generation and DB push.
 *
 * @remarks
 * Uses DATABASE_URL from environment.
 * Schema is read from the db/schema.ts barrel file.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    url: process.env['DATABASE_URL']!,
  },
})
```

- [ ] **Step 12: Commit**

```
feat(plan-a): implement Hono server with security middleware and health endpoint
```

---

## Task 9: Vitest Configuration

**Files:**

- Create: `vitest.workspace.ts`
- Modify: `package.json` (root — already has `test` script from Task 1)

- [ ] **Step 1: Install Vitest at root**

Run:

```bash
pnpm add -Dw vitest
```

Expected: `vitest` added to root `devDependencies`.

- [ ] **Step 2: Create `vitest.workspace.ts`**

```ts
import { defineWorkspace } from 'vitest/config'

/**
 * Vitest workspace configuration.
 * Discovers test files across all packages and apps.
 *
 * @remarks
 * Each package can override settings via local vitest.config.ts.
 * Tests run in parallel across packages by default.
 */
export default defineWorkspace(['apps/*/vitest.config.ts', 'packages/*/vitest.config.ts'])
```

- [ ] **Step 3: Create `apps/api/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
  },
})
```

- [ ] **Step 4: Create `packages/config-env/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Create `packages/schema/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 6: Verify Vitest runs**

Run:

```bash
pnpm test
```

Expected: Vitest runs with 0 test suites, 0 tests, no errors. Clean exit.

- [ ] **Step 7: Commit**

```
feat(plan-a): configure Vitest workspace for monorepo testing
```

---

## Task 10: Verification

**Files:** None created — this task validates the entire Plan A output.

- [ ] **Step 1: Install all dependencies**

Run:

```bash
pnpm install
```

Expected: All workspace packages resolved, no peer dependency errors.

- [ ] **Step 2: Start PostgreSQL**

Run:

```bash
docker compose up db -d
```

Expected: `voiler-db` container running, healthy.

- [ ] **Step 3: Create `.env` from example**

Run:

```bash
cp .env.example .env
```

Edit `.env` to set a real AUTH_SECRET (at least 32 characters):

```env
AUTH_SECRET=this-is-a-development-secret-that-is-at-least-32-chars-long
```

- [ ] **Step 4: Push database schema**

Run:

```bash
pnpm --filter @voiler/api db:push
```

Expected: User table created in PostgreSQL. Output shows migration applied.

- [ ] **Step 5: Start development server**

Run:

```bash
pnpm --filter @voiler/api dev
```

Expected: `[api] Server running on http://localhost:4000`

- [ ] **Step 6: Test health endpoint**

Run (in a separate terminal):

```bash
curl -s http://localhost:4000/health | jq .
```

Expected:

```json
{
  "status": "ok",
  "uptime": 5,
  "db": "connected",
  "timestamp": "2026-03-31T..."
}
```

- [ ] **Step 7: Verify security headers**

Run:

```bash
curl -sI http://localhost:4000/health
```

Expected headers present:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; ...`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

- [ ] **Step 8: Run all tooling gates**

Run:

```bash
pnpm lint
```

Expected: 0 errors, 0 warnings.

Run:

```bash
pnpm format:check
```

Expected: All files formatted correctly, exit code 0.

Run:

```bash
pnpm typecheck
```

Expected: 0 errors across all packages and apps.

Run:

```bash
pnpm test
```

Expected: Vitest runs, 0 test suites found, clean exit (no failures).

- [ ] **Step 9: Verify CORS rejects unknown origins**

Run:

```bash
curl -sI -H "Origin: https://evil.com" http://localhost:4000/health
```

Expected: No `Access-Control-Allow-Origin` header in response (origin rejected).

- [ ] **Step 10: Verify rate limiter headers**

Run:

```bash
curl -sI http://localhost:4000/health
```

Expected headers present:

- `RateLimit-Limit: 100`
- `RateLimit-Remaining: 99`
- `RateLimit-Reset: ...`

- [ ] **Step 11: Final commit**

```
feat(plan-a): verify all tooling gates pass — Plan A complete
```

---

## Exit Checklist

At the end of Plan A, the following must be true:

| Gate                 | Command                          | Expected                            |
| -------------------- | -------------------------------- | ----------------------------------- |
| Dependencies install | `pnpm install`                   | Clean install, no errors            |
| PostgreSQL running   | `docker compose up db -d`        | Container healthy                   |
| Server starts        | `pnpm --filter @voiler/api dev`  | Listening on :4000                  |
| Health endpoint      | `curl localhost:4000/health`     | `{ status: "ok", db: "connected" }` |
| Security headers     | `curl -sI localhost:4000/health` | All OWASP headers present           |
| CORS works           | Origin check                     | Rejects unknown origins             |
| Rate limiter works   | Header check                     | RateLimit headers present           |
| Lint passes          | `pnpm lint`                      | 0 errors                            |
| Format passes        | `pnpm format:check`              | 0 differences                       |
| Types pass           | `pnpm typecheck`                 | 0 errors                            |
| Tests pass           | `pnpm test`                      | 0 suites, 0 failures                |

---

## Contracts Exposed to Plan B

```typescript
// packages/config-env
export const loadEnv: () => EnvConfig
// { NODE_ENV, PORT, DATABASE_URL, AUTH_SECRET }

// packages/schema
export { User } // Drizzle pgTable
export { UserSelectSchema } // Zod select schema
export { UserInsertSchema } // Zod insert schema
export type { UserSelect } // TypeScript select type
export type { UserInsert } // TypeScript insert type

// packages/domain — empty barrel
// packages/core — empty barrel
// packages/ui — empty barrel

// apps/api
// Hono app running on PORT with security middleware
// Drizzle db instance connected to PostgreSQL
// GET /health endpoint
// Security: secureHeaders, csrf, cors, rateLimiter, bodyLimit

// Tooling gates
// pnpm lint       → ESLint strict (typedef, no-any, max-params, no-semi)
// pnpm format:check → Prettier (no-semi, single quotes, trailing commas)
// pnpm typecheck  → tsc --noEmit all packages
// pnpm test       → Vitest workspace (runner configured, no tests yet)
```

---

## Notes for Implementers

1. **ESLint `typedef` rule:** Many inferred types from Hono/Drizzle are complex. Use `// eslint-disable-next-line @typescript-eslint/typedef` sparingly on lines where the inferred type is correct and explicit annotation would be verbose or impractical (e.g., `const app = new Hono()`, `const db = drizzle(...)`).

2. **`postgres` vs `pg`:** We use the `postgres` package (postgres.js) — not `pg` (node-postgres). postgres.js is ESM-native, faster, and works cleanly with Drizzle.

3. **drizzle-zod version:** Ensure `drizzle-zod` is compatible with the installed `drizzle-orm` version. Both should be from the same release cycle.

4. **hono-rate-limiter:** This is a community package. If unavailable or incompatible, implement a simple in-memory rate limiter as a Hono middleware using a `Map<string, { count: number; resetAt: number }>`.

5. **CSRF on health endpoint:** The CSRF middleware protects mutation methods (POST, PUT, PATCH, DELETE). GET requests like `/health` pass through without CSRF validation — this is correct behavior.

6. **Body limit middleware:** The `bodyLimit` middleware from Hono's built-in module handles both JSON and form payloads. The 1MB limit is generous for an API — can be tightened per-route in Plan B.

7. **Package versions:** All version ranges use `^` (caret) for minor/patch updates. Pin exact versions only if a specific bug is encountered. Run `pnpm update` after initial install to get latest compatible versions.
