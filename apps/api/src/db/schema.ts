/**
 * Re-exports all Drizzle table definitions from @gemtest/schema.
 * This file is the single import point for Drizzle migrations and queries.
 *
 * @remarks
 * drizzle-kit reads this file for migration generation.
 * New tables from @gemtest/schema must be re-exported here.
 */
export { User } from '@gemtest/schema'
