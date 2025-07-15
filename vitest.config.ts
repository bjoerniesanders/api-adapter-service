import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000, // 10 seconds for integration tests
    isolate: true, // Ensure test isolation
    pool: 'forks', // Use separate processes for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run tests in sequence for better isolation
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}); 