import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'

// eslint-disable-next-line @typescript-eslint/typedef
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [...tanstackStart()],
})
