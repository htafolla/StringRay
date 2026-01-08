import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/contract/*.test.ts'],
    coverage: {
      enabled: false, // Contract tests validate API contracts, not code coverage
    },
    testTimeout: 10000,
    retry: 2,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/__tests__'),
    },
  },
});