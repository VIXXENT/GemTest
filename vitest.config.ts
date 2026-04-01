import { defineConfig } from 'vitest/config'

/**
 * Root Vitest configuration.
 * Discovers test projects across all packages and apps via glob patterns.
 *
 * @remarks
 * Each package can override settings via local vitest.config.ts.
 * Tests run in parallel across projects by default.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export default defineConfig({
  test: {
    projects: [
      'apps/*/vitest.config.ts',
      'packages/*/vitest.config.ts',
    ],
  },
})
