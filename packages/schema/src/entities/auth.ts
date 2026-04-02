import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Session table for Better Auth.
 * Tracks active user sessions with expiration and metadata.
 *
 * @remarks
 * Better Auth manages session lifecycle (create, refresh, revoke).
 * The `token` column is the session identifier sent to the client.
 * `ipAddress` and `userAgent` support multi-device management.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const Session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
  }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull(),
  impersonatedBy: text('impersonated_by'),
})

/**
 * Account table for Better Auth.
 * Links authentication providers (credential, OAuth) to users.
 *
 * @remarks
 * Better Auth stores password hashes here (not in the user table).
 * Each provider connection is a separate row. The `providerId`
 * identifies the auth method (e.g., "credential", "google").
 */
// eslint-disable-next-line @typescript-eslint/typedef
const Account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }).notNull(),
})

/**
 * Verification table for Better Auth.
 * Stores verification tokens for email confirmation,
 * password reset, and other token-based flows.
 *
 * @remarks
 * Tokens are single-use and expire after `expiresAt`.
 * The `identifier` links the token to a specific purpose.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const Verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  }),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
})

export { Session, Account, Verification }
