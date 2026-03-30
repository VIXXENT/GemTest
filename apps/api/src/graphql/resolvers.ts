import { container } from '../container.js'
import { GraphQLError } from 'graphql'
import type { AppError } from '@gemtest/core'
import type { UserEntity } from '@gemtest/domain'
import type { ApolloServer } from '@apollo/server'

// ---------------------------------------------------------------------------
// GraphQL response shape
// ---------------------------------------------------------------------------

/**
 * Plain object representation of a User for GraphQL responses.
 *
 * Why: `UserEntity` uses branded types (UserId, Email) and lacks optional
 * fields the GraphQL schema expects (emailVerified, image). This type bridges
 * the domain model to the wire format without widening or falsifying types.
 */
type UserGraphQL = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly emailVerified: string | null
  readonly image: string | null
  readonly role: string
  readonly createdAt: string
}

// ---------------------------------------------------------------------------
// Resolver arg types
// ---------------------------------------------------------------------------

/** Resolver tuple for queries/mutations with no arguments: [parent]. */
type NoArgs = [unknown]

/** Resolver tuple for the `user(id: Int!)` query: [parent, args]. */
type GetUserParams = [unknown, { readonly id: number }]

/** Args shape for the `createUser` mutation. */
type CreateUserArgs = {
  readonly name: string
  readonly email: string
  readonly password: string
}

/** Resolver tuple for the `createUser` mutation: [parent, args]. */
type CreateUserParams = [unknown, CreateUserArgs]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a domain `UserEntity` to the plain `UserGraphQL` response shape.
 *
 * Why: `UserEntity.id` is a branded `UserId` (string), but the GraphQL schema
 * declares `id: Int!`. Since the DB uses auto-increment integers stored as
 * strings in the branded type, `parseInt` is safe here.
 * `emailVerified` and `image` are not part of the domain entity so they are
 * returned as null (matching the nullable schema fields).
 *
 * @param entity - The domain user entity returned by a use case.
 * @returns A plain object safe to serialise as a GraphQL User response.
 */
const toGraphQL: (entity: UserEntity) => UserGraphQL = (entity) => ({
  id: parseInt(entity.id, 10),
  name: entity.name,
  email: entity.email,
  emailVerified: null,
  image: null,
  role: entity.role,
  createdAt: entity.createdAt.toISOString(),
})

/**
 * Maps an `AppError` to a thrown `GraphQLError`.
 *
 * Why: Apollo Server catches `GraphQLError` and forwards its `extensions.code`
 * to the client. By mapping our discriminated union here we keep error
 * semantics consistent across the entire API surface.
 *
 * @param error - The application-layer error from a use case result.
 * @returns never — always throws.
 */
const mapToGraphQLError: (error: AppError) => never = (error) => {
  const code: string = error.tag.toUpperCase()
  throw new GraphQLError(error.message, {
    extensions: { code },
  })
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

/**
 * Type extraction for the resolvers object accepted by `ApolloServer`.
 * Avoids manual re-definition of the Apollo config shape.
 */
type ResolversType = ConstructorParameters<typeof ApolloServer>[0]['resolvers']

/**
 * GraphQL resolvers — thin primary adapter layer.
 *
 * Responsibilities:
 *   1. Parse GraphQL arguments into use-case input.
 *   2. Delegate to the DI container (use cases).
 *   3. Map domain entities to GraphQL response shapes.
 *   4. Map AppError to GraphQLError on failure.
 *
 * No business logic lives here. No direct DB or argon2 imports.
 */
export const resolvers: ResolversType = {
  Query: {
    /**
     * Health check — verifies the API process is reachable.
     * @returns Static confirmation string.
     */
    health: (..._params: NoArgs): string => 'OK - API is alive',

    /**
     * Returns all registered users.
     * @returns Array of serialisable user objects.
     */
    users: async (..._params: NoArgs): Promise<UserGraphQL[]> => {
      const result: Awaited<ReturnType<typeof container.listUsers>> = await container.listUsers()
      if (result.isErr()) { return mapToGraphQLError(result.error) }
      return result.value.map(toGraphQL)
    },

    /**
     * Returns a single user by numeric ID, or null if not found.
     * @param params - Resolver tuple [parent, args] where args.id is the user's numeric ID.
     * @returns The user object or null.
     */
    user: async (...params: GetUserParams): Promise<UserGraphQL | null> => {
      const args: GetUserParams[1] = params[1]
      const result: Awaited<ReturnType<typeof container.getUser>> =
        await container.getUser({ id: String(args.id) })
      if (result.isErr()) { return mapToGraphQLError(result.error) }
      const entity: UserEntity | null = result.value
      return entity === null ? null : toGraphQL(entity)
    },
  },

  Mutation: {
    /**
     * Creates a new user account.
     * @param params - Resolver tuple [parent, args] where args contains user data.
     * @returns The newly created user object.
     */
    createUser: async (...params: CreateUserParams): Promise<UserGraphQL> => {
      const args: CreateUserParams[1] = params[1]
      const result: Awaited<ReturnType<typeof container.createUser>> =
        await container.createUser({
          name: args.name,
          email: args.email,
          password: args.password,
        })
      if (result.isErr()) { return mapToGraphQLError(result.error) }
      return toGraphQL(result.value)
    },
  },
}
