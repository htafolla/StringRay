/**
 * StringRay AI v1.0.9 - Integration Testing Configuration
 *
 * Comprehensive integration testing setup with parallel execution,
 * thread pooling, and multi-component testing capabilities.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Integration test configuration
    name: "StrRay Integration Tests",
    environment: "node",
    globals: true,
    setupFiles: ["./src/__tests__/setup/integration-setup.ts"],

    // Parallel execution with thread pooling
    pool: "threads",

    // Test execution
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000,

    // Coverage for integration tests
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage/integration",
      include: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/**/__tests__/**",
        "!src/**/__mocks__/**",
      ],
      exclude: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "**/*.config.ts",
        "**/*.config.js",
      ],
      thresholds: {
        global: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },
    },

    // Reporting
    reporters: [
      "default",
      ["html", { outputFile: "reports/integration/index.html" }],
      ["junit", { outputFile: "reports/integration/results.xml" }],
    ],

    // File patterns
    include: [
      "src/__tests__/integration/**/*.test.ts",
      "src/__tests__/integration/**/*.spec.ts",
    ],
    exclude: ["node_modules/**", "dist/**", "coverage/**", "**/*.config.ts"],

    // Watch mode
    watch: false,

    // Global test configuration
    slowTestThreshold: 5000, // 5 seconds
    bail: 5, // Stop after 5 failures
    retry: 2, // Retry failed tests twice

    // Environment variables
    env: {
      NODE_ENV: "test",
      INTEGRATION_TEST: "true",
      LOG_LEVEL: "warn",
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./src/__tests__"),
      "@utils": resolve(__dirname, "./src/__tests__/utils"),
    },
  },
});
