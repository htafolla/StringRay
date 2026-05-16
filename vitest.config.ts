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
      "src/__tests__/performance/enterprise-performance-tests.ts",
    ],
    silent: true,
    reporters: process.env.CI ? ["verbose"] : ["default"],
    testTimeout: 90000,
    hookTimeout: 180000,
    bail: 0,
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
    retry: process.env.CI ? 3 : 2,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "api": resolve(__dirname, "./api"),
    },
  },
});
