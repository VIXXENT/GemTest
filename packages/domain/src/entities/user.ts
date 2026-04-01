import type { Email } from '../value-objects/email'
import type { UserId } from '../value-objects/user-id'

/**
 * Domain entity representing a user.
 *
 * All fields are readonly to enforce immutability.
 */
export interface UserEntity {
  readonly id: UserId
  readonly email: Email
  readonly name: string
  readonly role: string
  readonly createdAt: Date
}
