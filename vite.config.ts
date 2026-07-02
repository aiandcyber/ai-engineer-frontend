import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In real-API mode (VITE_USE_MOCK=false) the dev server proxies /api to the
// FastAPI BFF so the browser stays same-origin (no CORS, cookies just work).
const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
})
