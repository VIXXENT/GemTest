import { z } from 'zod'

/**
 * Account schema for OAuth providers.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const AccountSchema = z.object({
  id: z.string().optional(),
  userId: z.number().int(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().optional(),
  access_token: z.string().optional(),
  expires_at: z.number().int().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
  session_state: z.string().optional(),
})

/**
 * Session schema for database-based sessions.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const SessionSchema = z.object({
  id: z.string().optional(),
  sessionToken: z.string(),
  userId: z.number().int(),
  expires: z.date(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
})

/**
 * VerificationToken schema for Magic Links and Password Recovery.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const VerificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.date(),
})

export type Account = z.infer<typeof AccountSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type VerificationToken = z.infer<typeof VerificationTokenSchema>;
