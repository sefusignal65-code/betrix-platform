import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'axios']
        }
      }
    },
    target: 'esnext',
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})