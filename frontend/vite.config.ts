import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      // Proxy auth/API calls to the backend so the browser sees one origin.
      // Same-origin means Better Auth's session cookies work without CORS.
      proxy: {
        '/api': {
          target: env.AUTH_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: false,
        },
      },
    },
  }
})
