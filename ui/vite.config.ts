import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Since the master merge Play serves the pages and the Tapir REST API (/api) on one port, 9000.
// The Sangria endpoint (/graphql) is expected there too once it is mounted (see ui/README.md).
// Another backend: VITE_BACKEND=http://host:port npm run dev
const backend = process.env.VITE_BACKEND ?? 'http://localhost:9000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/graphql': backend
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    env: { VITE_MOCK: '1' }
  }
})
