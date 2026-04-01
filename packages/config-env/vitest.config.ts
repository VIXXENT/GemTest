import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
