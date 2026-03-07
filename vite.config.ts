import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/users': 'http://127.0.0.1:3000',
      '/assinaturas': 'http://127.0.0.1:3000',
      '/pagamentos': 'http://127.0.0.1:3000',
      '/historicos': 'http://127.0.0.1:3000',
    }
  }
})