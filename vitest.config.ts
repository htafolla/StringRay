import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      "coverage",
      "src/__tests__/plugins/marketplace-service.test.ts",
    ],
    silent: true, // Reduce console output in CI
    reporters: process.env.CI ? ["verbose"] : ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "src/__tests__/",
        "scripts/",
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    testTimeout: process.env.CI ? 60000 : 30000, // 60s in CI, 30s locally
    hookTimeout: process.env.CI ? 45000 : 30000, // 45s in CI, 30s locally
    bail: process.env.CI ? 3 : 5, // Stop faster in CI to fail quickly
    pool: "forks", // Use forks for better test isolation and CI/CD reliability
    retry: process.env.CI ? 3 : 2, // More retries in CI
    maxThreads: process.env.CI ? 2 : 4, // Limit threads in CI
    minThreads: 1,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
