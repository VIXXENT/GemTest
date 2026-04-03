import { AuditLog } from '@voiler/schema'

import type { DbClient } from '../db/index.js'

/**
 * Entry data for writing an audit log record.
 */
interface AuditLogEntry {
  readonly requestId: string
  readonly action: string
  readonly userId?: string
  readonly entityId?: string
  readonly metadata?: Record<string, unknown>
}

/**
 * Parameters for writing an audit log entry.
 */
interface WriteAuditLogParams {
  readonly db: DbClient
  readonly entry: AuditLogEntry
}

/**
 * Write an audit log entry to the database.
 * Fire-and-forget -- does not block the request.
 * Errors are logged to console but never thrown.
 */
const writeAuditLog: (params: WriteAuditLogParams) => void = (params) => {
  const { db, entry } = params

  void db
    .insert(AuditLog)
    .values({
      requestId: entry.requestId,
      action: entry.action,
      userId: entry.userId ?? null,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
    })
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Failed to write audit log',
          action: entry.action,
          requestId: entry.requestId,
          error: String(error),
        }),
      )
    })
}

/**
 * Write an audit log entry and await the result.
 * Use for critical actions (e.g. impersonation) where
 * the audit record must be persisted before responding.
 */
const writeAuditLogAsync: (params: WriteAuditLogParams) => Promise<void> = async (params) => {
  const { db, entry } = params

  await db.insert(AuditLog).values({
    requestId: entry.requestId,
    action: entry.action,
    userId: entry.userId ?? null,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? null,
  })
}

export { AuditLog, writeAuditLog, writeAuditLogAsync }
export type { AuditLogEntry, WriteAuditLogParams }
