import { errAsync } from 'neverthrow'
import type { ResultAsync } from 'neverthrow'
import type { Ok } from 'neverthrow'
import { createEmail, createPassword, userAlreadyExists } from '@gemtest/domain'
import type { UserEntity, Email, Password, DomainError } from '@gemtest/domain'
import type { AppError, IUserRepository, IPasswordService } from '@gemtest/core'
import { validationError } from '@gemtest/core'
import { CreateUserInputSchema } from '@gemtest/schema'
import type { CreateUserInput } from '@gemtest/schema'

// ---------------------------------------------------------------------------
// Dependency types
// ---------------------------------------------------------------------------

/**
 * Dependencies required by the CreateUser use case.
 *
 * Why: Constructor injection via a deps object allows the use case to remain
 * fully decoupled from concrete implementations — tests can supply fakes,
 * production wires real adapters.
 */
type CreateUserDeps = {
  readonly userRepository: IUserRepository
  readonly passwordService: IPasswordService
}

// ---------------------------------------------------------------------------
// Use case factory
// ---------------------------------------------------------------------------

/**
 * Factory for the CreateUser use case.
 *
 * Orchestrates: Zod input validation → domain value-object construction →
 * duplicate-email check → password hashing → persistence.
 *
 * Why a factory: Captures dependencies once at construction time, returning a
 * single-argument execute function that is easy to test and compose.
 *
 * @param deps - Port interfaces for repository and password service.
 * @returns An execute function that creates a user and returns the entity.
 */
export const createUserUseCase: (
  deps: CreateUserDeps,
) => (params: CreateUserInput) => ResultAsync<UserEntity, AppError> = (deps) => {
  const { userRepository, passwordService } = deps

  return (params) => {
    const { name, email, password } = params

    // 1. Validate raw input shape with Zod
    const parseResult: ReturnType<typeof CreateUserInputSchema.safeParse> =
      CreateUserInputSchema.safeParse({ name, email, password })

    if (!parseResult.success) {
      const message: string =
        parseResult.error.issues[0]?.message ?? 'Invalid input'
      return errAsync(validationError({ message }))
    }

    // 2. Construct domain Email value object
    const emailResult: Ok<Email, DomainError> | ReturnType<typeof createEmail> =
      createEmail({ value: email })
    if (emailResult.isErr()) {
      return errAsync(emailResult.error)
    }

    // 3. Construct domain Password value object
    const passwordResult: Ok<Password, DomainError> | ReturnType<typeof createPassword> =
      createPassword({ value: password })
    if (passwordResult.isErr()) {
      return errAsync(passwordResult.error)
    }

    // TypeScript narrows emailResult and passwordResult to Ok<T, E> after isErr() guards
    const validEmail: Email = emailResult.value
    const validPassword: Password = passwordResult.value

    // 4. Check for duplicate email, then hash and persist
    return userRepository
      .findByEmail(validEmail)
      .andThen((existing) => {
        if (existing !== null) {
          return errAsync(userAlreadyExists(email))
        }
        return passwordService.hash({ plaintext: validPassword })
      })
      .andThen((passwordHash) =>
        userRepository.create({
          email: validEmail,
          name,
          passwordHash,
        }),
      )
  }
}
