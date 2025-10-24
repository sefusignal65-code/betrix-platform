import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    pool: 'vmThreads',
    testTimeout: 10000,
    include: ['tests/**/*.test.js'],
    exclude: ['src/test/**']
  },
})
