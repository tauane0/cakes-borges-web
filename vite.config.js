import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// =======================
// Configuração do Vite e proxy local para a API
// =======================
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
