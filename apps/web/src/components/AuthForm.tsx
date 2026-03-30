import { Button } from '@gemtest/ui'
import { useMutation, gql, type DocumentNode, type ApolloError } from '@apollo/client'
import { useState, type ReactElement, type ChangeEvent, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'

const CREATE_USER: DocumentNode = gql`
  mutation CreateUser($name: String!, $email: String!, $password: String!) {
    createUser(name: $name, email: $email, password: $password) {
      id
      name
      email
    }
  }
`

type AuthFormProps = {
  readonly onRegisterSuccess: () => void
}

type RegisterFormState = {
  readonly name: string
  readonly email: string
  readonly password: string
}

type LoginFormState = {
  readonly email: string
  readonly password: string
}

type HandleRegisterFn = (e: FormEvent) => void
type HandleLoginFn = (e: FormEvent) => Promise<void>
type ToggleRegisterFn = () => void
type ToggleLoginViewFn = () => void

/**
 * AuthForm component — handles login, register, and OAuth flows.
 *
 * Encapsulates all auth UI states: idle (buttons only), registering (signup form),
 * and logging in (credentials form). Delegates session management to the parent.
 *
 * @param props - Component props.
 * @param props.onRegisterSuccess - Callback invoked after successful user registration
 *   so the parent can refetch the user list.
 * @returns A ReactElement representing the auth form section.
 */
// eslint-disable-next-line @typescript-eslint/typedef
const AuthForm = (props: AuthFormProps): ReactElement => {
  const { onRegisterSuccess } = props

  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)
  const [form, setForm] = useState<RegisterFormState>({ name: '', email: '', password: '' })
  const [loginForm, setLoginForm] = useState<LoginFormState>({ email: '', password: '' })
  const [loginError, setLoginError] = useState<string | null>(null)

  const [createUser, { loading: creating }] = useMutation(CREATE_USER, {
    onCompleted: (): void => {
      setIsRegistering(false)
      setForm({ name: '', email: '', password: '' })
      onRegisterSuccess()
    },
    onError: (err: ApolloError): void => {
      console.error('Registration failed:', err.message)
    },
  })

  /**
   * Handles user registration form submission.
   *
   * @param e - The form submission event.
   */
  const handleRegister: HandleRegisterFn = (e: FormEvent): void => {
    e.preventDefault()
    createUser({ variables: form }).catch((err: unknown): void => {
      console.error('Create user mutation failed:', err)
    })
  }

  /**
   * Handles login form submission using Auth.js credentials provider.
   *
   * @param e - The form submission event.
   */
  const handleLogin: HandleLoginFn = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setLoginError(null)
    try {
      const result: Awaited<ReturnType<typeof signIn>> = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      })
      if (result?.error) {
        setLoginError('Invalid credentials. Please try again.')
      } else {
        setIsLoggingIn(false)
        setLoginForm({ email: '', password: '' })
      }
    } catch {
      setLoginError('Network error. Please check your connection.')
    }
  }

  /**
   * Toggles the visibility of the registration form.
   * Closes the login form if open.
   */
  const toggleRegister: ToggleRegisterFn = (): void => {
    setIsRegistering(!isRegistering)
    setIsLoggingIn(false)
  }

  /**
   * Toggles the visibility of the login form.
   * Closes the registration form if open and clears any login errors.
   */
  const toggleLoginView: ToggleLoginViewFn = (): void => {
    setIsLoggingIn(!isLoggingIn)
    setIsRegistering(false)
    setLoginError(null)
  }

  if (isRegistering) {
    return (
      <section
        className="bg-indigo-50 rounded-xl p-6 border border-indigo-100
          animate-in fade-in duration-300"
      >
        <h2 className="text-xl font-bold text-indigo-900 mb-4">Crear Cuenta</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre completo"
            required
            className="w-full p-2 border rounded-md"
            value={form.name}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
              setForm({ ...form, name: e.target.value })
            }}
          />
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-2 border rounded-md"
            value={form.email}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
              setForm({ ...form, email: e.target.value })
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            className="w-full p-2 border rounded-md"
            value={form.password}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
              setForm({ ...form, password: e.target.value })
            }}
          />
          <div className="flex gap-2">
            <button
              disabled={creating}
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md
                font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Registrando...' : 'Confirmar Registro'}
            </button>
            <button
              type="button"
              onClick={toggleRegister}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md
                font-bold hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    )
  }

  if (isLoggingIn) {
    return (
      <section
        className="bg-indigo-50 rounded-xl p-6 border border-indigo-100
          animate-in fade-in duration-300"
      >
        <h2 className="text-xl font-bold text-indigo-900 mb-4">Bienvenido de nuevo</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200">
              {loginError}
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-2 border rounded-md"
            value={loginForm.email}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
              setLoginForm({ ...loginForm, email: e.target.value })
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            className="w-full p-2 border rounded-md"
            value={loginForm.password}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
              setLoginForm({ ...loginForm, password: e.target.value })
            }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md
                font-bold hover:bg-indigo-700"
            >
              Acceder
            </button>
            <button
              type="button"
              onClick={toggleLoginView}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md
                font-bold hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">
        🚀 Componentes Compartidos
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Prueba la interactividad de la librería UI compartida y verifica la comunicación
        con la API Apollo en tiempo real.
      </p>
      <div className="flex flex-col gap-4">
        <Button
          onClick={(): void => {
            console.info('Shared UI Library interacted!')
          }}
        >
          Interactuar con UI Lib
        </Button>
        <Button
          onClick={(): void => {
            signIn('google').catch((err: unknown): void => {
              console.error('Google OAuth failed:', err)
            })
          }}
          className="bg-white !text-gray-700 border border-gray-300 hover:bg-gray-50"
        >
          Login con Google (OAuth)
        </Button>
        <div className="flex gap-4 items-center pt-2">
          <button
            onClick={toggleRegister}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Registrarse
          </button>
          <button
            onClick={toggleLoginView}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full
              font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </section>
  )
}

export default AuthForm
export type { AuthFormProps }
