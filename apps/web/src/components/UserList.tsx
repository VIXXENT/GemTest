import { type PublicUser } from '@gemtest/schema'
import { type ReactElement } from 'react'
import { type ApolloError } from '@apollo/client'

type UserListProps = {
  readonly loading: boolean
  readonly error: ApolloError | undefined
  readonly users: PublicUser[] | undefined
}

/**
 * UserList component — displays the list of registered users from the GraphQL API.
 *
 * Renders loading, error, empty, and populated states.
 * Receives data as props — no direct data fetching.
 *
 * @param props - Component props.
 * @param props.loading - Whether the GraphQL query is in flight.
 * @param props.error - Apollo error object if the query failed.
 * @param props.users - Array of users to display, or undefined if not yet loaded.
 * @returns A ReactElement representing the user list section.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const UserList = (props: UserListProps): ReactElement => {
  const { loading, error, users } = props

  return (
    <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📡 API / Usuarios</h2>
      {loading && <p className="text-gray-400">Cargando...</p>}
      {error && (
        <div className="text-red-500 text-sm">
          {error.message}
        </div>
      )}
      {users && (
        <ul className="space-y-3">
          {users.map((user: PublicUser): ReactElement => (
            <li
              key={user.id}
              className="bg-white p-3 rounded shadow-sm border border-gray-200
                flex justify-between items-center"
            >
              <span className="font-medium text-gray-700">{user.name}</span>
              <span className="text-xs text-gray-400 font-mono">{user.email}</span>
            </li>
          ))}
          {users.length === 0 && (
            <p className="text-gray-400 italic text-center">Sin usuarios.</p>
          )}
        </ul>
      )}
    </section>
  )
}

export default UserList
export type { UserListProps }
