import { createFileRoute } from '@tanstack/react-router'

// eslint-disable-next-line @typescript-eslint/typedef
const Route = createFileRoute('/')({
  component: () => <h1>Voiler</h1>,
})

export { Route }
