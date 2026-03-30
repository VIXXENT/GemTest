import { useQuery, gql, type DocumentNode } from '@apollo/client'
import { type ReactElement } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { type PublicUser } from '@gemtest/schema'
import AuthForm from './components/AuthForm'
import UserList from './components/UserList'

const GET_USERS: DocumentNode = gql`
  query GetUsers {
    health
    users {
      id
      name
      email
    }
  }
`

type GetUsersData = {
  readonly health: string
  readonly users: PublicUser[]
}

/**
 * Main App component — composition shell only.
 *
 * Manages session state via Auth.js and orchestrates the layout.
 * Business logic lives in AuthForm and UserList.
 *
 * @returns A ReactElement representing the full application layout.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const App = (): ReactElement => {
  const { data: session, status } = useSession()
  const { loading, error, data, refetch } = useQuery<GetUsersData>(GET_USERS)

  /** Refetch users after successful registration. */
  // eslint-disable-next-line @typescript-eslint/typedef
  const handleRegisterSuccess = (): void => {
    refetch().catch((err: unknown): void => {
      console.error('Refetch failed after registration:', err)
    })
  }

  const isLoadingSession: boolean = status === 'loading'

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <header className="flex justify-between items-center mb-10 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">
              GemTest Monorepo
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Arquitectura Fullstack Profesional
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {isLoadingSession ? (
              <span className="text-xs text-gray-400">Verificando sesión...</span>
            ) : session ? (
              <div
                className="flex items-center gap-4 bg-indigo-50 px-4 py-2
                  rounded-full border border-indigo-100"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-indigo-700 font-semibold leading-tight">
                    👤 {session.user?.name || session.user?.email}
                  </span>
                  {session.user?.email && (
                    <span className="text-[10px] text-indigo-400">
                      {session.user.email}
                    </span>
                  )}
                </div>
                <button
                  onClick={(): Promise<void> => signOut()}
                  className="text-xs text-red-500 font-bold hover:text-red-700
                    uppercase tracking-wider ml-2"
                >
                  Salir
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <AuthForm onRegisterSuccess={handleRegisterSuccess} />
          </div>
          <UserList loading={loading} error={error} users={data?.users} />
        </main>

        <footer className="mt-12 text-center text-gray-400 text-xs border-t pt-6">
          GemTest • Turborepo • pnpm • React • Apollo • Drizzle • Auth.js
        </footer>
      </div>
    </div>
  )
}

export default App
