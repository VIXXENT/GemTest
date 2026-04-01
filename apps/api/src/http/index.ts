/**
 * HTTP route barrel — re-exports all REST route factories.
 *
 * @remarks
 * tRPC routes are NOT here — they are mounted separately in Plan B.
 * This barrel is for plain HTTP routes: health, webhooks, etc.
 */
export { createHealthRoute } from './health.js'
export type { HealthResponse } from './health.js'
