import type {
  AppError,
  IPasswordService,
  IUserRepository,
} from "@voiler/core"
import { infrastructureError } from "@voiler/core"
import type { Email, UserEntity, UserId } from "@voiler/domain"
import { errAsync, okAsync } from "neverthrow"
import { describe, it, expect, vi } from "vitest"

import {
  createCreateUser,
} from "../../use-cases/user/create-user"

/** Builds a fake UserEntity for test assertions. */
const makeFakeUser = (): UserEntity => ({
  id: "user-1" as UserId,
  email: "test@example.com" as Email,
  name: "Test User",
  role: "user",
  createdAt: new Date("2026-01-01"),
})

/** Builds a mock IUserRepository with vi.fn() stubs. */
const makeMockRepo = (): IUserRepository => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
})

/** Builds a mock IPasswordService with vi.fn() stubs. */
const makeMockPasswordService = (): IPasswordService => ({
  hash: vi.fn(),
  verify: vi.fn(),
})

describe("createUser use case", () => {
  it(
    "returns Ok(UserEntity) on happy path",
    async () => {
      // eslint-disable-next-line @typescript-eslint/typedef
      const fakeUser = makeFakeUser()
      // eslint-disable-next-line @typescript-eslint/typedef
      const repo = makeMockRepo()
      // eslint-disable-next-line @typescript-eslint/typedef
      const passwordService = makeMockPasswordService()

      vi.mocked(passwordService.hash).mockReturnValue(
        okAsync("hashed-pw"),
      )
      vi.mocked(repo.create).mockReturnValue(
        okAsync(fakeUser),
      )

      // eslint-disable-next-line @typescript-eslint/typedef
      const useCase = createCreateUser({
        userRepository: repo,
        passwordService,
      })

      // eslint-disable-next-line @typescript-eslint/typedef
      const result = await useCase({
        name: "Test User",
        email: "test@example.com",
        password: "Pass1234",
      })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(fakeUser)
      }
      expect(passwordService.hash).toHaveBeenCalledWith({
        plaintext: "Pass1234",
      })
      expect(repo.create).toHaveBeenCalledWith({
        data: {
          name: "Test User",
          email: "test@example.com",
          passwordHash: "hashed-pw",
          role: "user",
        },
      })
    },
  )

  it(
    "returns Err when password hash fails",
    async () => {
      // eslint-disable-next-line @typescript-eslint/typedef
      const repo = makeMockRepo()
      // eslint-disable-next-line @typescript-eslint/typedef
      const passwordService = makeMockPasswordService()

      // eslint-disable-next-line @typescript-eslint/typedef
      const hashError = infrastructureError({
        message: "hash failed",
      })

      vi.mocked(passwordService.hash).mockReturnValue(
        errAsync(hashError),
      )

      // eslint-disable-next-line @typescript-eslint/typedef
      const useCase = createCreateUser({
        userRepository: repo,
        passwordService,
      })

      // eslint-disable-next-line @typescript-eslint/typedef
      const result = await useCase({
        name: "Test",
        email: "test@example.com",
        password: "Pass1234",
      })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.tag).toBe(
          "InfrastructureError",
        )
      }
      expect(repo.create).not.toHaveBeenCalled()
    },
  )

  it(
    "returns Err when repository create fails",
    async () => {
      // eslint-disable-next-line @typescript-eslint/typedef
      const repo = makeMockRepo()
      // eslint-disable-next-line @typescript-eslint/typedef
      const passwordService = makeMockPasswordService()

      const repoError: AppError = infrastructureError({
        message: "db error",
      })

      vi.mocked(passwordService.hash).mockReturnValue(
        okAsync("hashed-pw"),
      )
      vi.mocked(repo.create).mockReturnValue(
        errAsync(repoError),
      )

      // eslint-disable-next-line @typescript-eslint/typedef
      const useCase = createCreateUser({
        userRepository: repo,
        passwordService,
      })

      // eslint-disable-next-line @typescript-eslint/typedef
      const result = await useCase({
        name: "Test",
        email: "test@example.com",
        password: "Pass1234",
      })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.tag).toBe(
          "InfrastructureError",
        )
      }
    },
  )
})
