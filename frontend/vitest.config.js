import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    threads: false,
    // compatible with Vitest 0.34.6 worker configuration
    pool: 'forks',
    include: ['tests/**/*.test.js'],
    exclude: ['src/test/**']
  },
})
