import { z } from 'zod'

/**
 * Zod schema for validating admin user creation input.
 * Used as the single source of truth for the create-user
 * tRPC procedure.
 *
 * @remarks
 * Password handling is managed by Better Auth via its own
 * signup endpoint. This schema is for admin-level user
 * profile creation only.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const CreateUserInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
})

/**
 * TypeScript type for validated user registration input.
 * Inferred from {@link CreateUserInputSchema}.
 */
type CreateUserInput = z.infer<typeof CreateUserInputSchema>

export { CreateUserInputSchema }
export type { CreateUserInput }
