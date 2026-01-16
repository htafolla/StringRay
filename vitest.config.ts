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
    testTimeout: 30000,
    hookTimeout: 30000,
    bail: 5, // Stop after 5 test failures - prevents resource waste
    pool: "forks", // Use forks for better test isolation and CI/CD reliability
    retry: 2,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
