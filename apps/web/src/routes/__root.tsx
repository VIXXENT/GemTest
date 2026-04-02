import { Outlet, createRootRoute } from '@tanstack/react-router'

// eslint-disable-next-line @typescript-eslint/typedef
const Route = createRootRoute({
  component: () => <Outlet />,
})

export { Route }
