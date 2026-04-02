import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

/**
 * Create and return the application router instance.
 * Called by TanStack Start internally via the
 * router entry.
 */
const getRouter = () => {
  // eslint-disable-next-line @typescript-eslint/typedef
  const router = createRouter({ routeTree })
  return router
}

export { getRouter }
