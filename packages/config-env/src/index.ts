/**
 * @file index.ts
 * @description Public API for @gemtest/config-env.
 * Exports the loadEnv() function and the EnvConfig type family.
 */

export { loadEnv } from './load-env.js'
export type {
  EnvConfig,
  BaseEnvConfig,
  ProductionEnvConfig,
  TestEnvConfig,
} from './schema.js'
