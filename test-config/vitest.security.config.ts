/**
 * StringRay AI v1.1.0 - Security Testing Configuration
 *
 * Specialized testing configuration for security validation,
 * vulnerability testing, and OWASP compliance verification.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Security test configuration
    name: "StrRay Security Tests",
    environment: "node",
    globals: true,
    setupFiles: ["./src/__tests__/setup/security-setup.ts"],

    // Sequential execution for security tests (to avoid interference)
    pool: "threads",
    maxConcurrency: 1,

    // Extended timeouts for security tests
    testTimeout: 60000, // 60 seconds for security tests
    hookTimeout: 30000,
    teardownTimeout: 10000,

    // Security-specific coverage
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage/security",
      include: [
        "src/security/**/*.ts",
        "src/**/*.ts", // Include all for security validation
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
    },

    // Security-focused reporting
    reporters: [
      "default",
      ["html", { outputFile: "reports/security/index.html" }],
      ["junit", { outputFile: "reports/security/results.xml" }],
    ],

    // File patterns for security tests
    include: [
      "src/__tests__/security/**/*.test.ts",
      "src/__tests__/security/**/*.spec.ts",
      "src/__tests__/integration/security/**/*.test.ts",
    ],
    exclude: ["node_modules/**", "dist/**", "coverage/**", "**/*.config.ts"],

    // Security test configuration
    slowTestThreshold: 10000, // 10 seconds
    bail: 3, // Stop after 3 security failures
    retry: 1, // Limited retries for security tests

    // Environment variables for security testing
    env: {
      NODE_ENV: "test",
      SECURITY_TEST: "true",
      LOG_LEVEL: "error", // Reduce noise in security tests
      SECURITY_AUDIT: "enabled",
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./src/__tests__"),
      "@utils": resolve(__dirname, "./src/__tests__/utils"),
      "@security": resolve(__dirname, "./src/security"),
    },
  },
});
