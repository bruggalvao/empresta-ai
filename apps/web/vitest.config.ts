import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Fixed fake project URL: tests never depend on the real .env.
    env: { VITE_SUPABASE_URL: 'https://projeto-teste.supabase.co' },
  },
})
