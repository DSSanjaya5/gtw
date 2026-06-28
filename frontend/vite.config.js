import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // WebSocket — must come before HTTP catch-alls
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        rewriteWsOrigin: true,
      },
      '/login': 'http://localhost:8080',
      '/rooms': 'http://localhost:8080',
      '/game':  'http://localhost:8080',
    },
  },
})
