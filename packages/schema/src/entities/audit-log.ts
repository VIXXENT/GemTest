import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Audit log table for tracking use-case executions
 * and request-level actions across the application.
 */
const AuditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: text('request_id').notNull(),
  action: text('action').notNull(),
  userId: text('user_id'),
  entityId: text('entity_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})

export { AuditLog }
