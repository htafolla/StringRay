import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "coverage", "src/__tests__/integration/"],
    coverage: {
      enabled: false, // Disable coverage for unit tests to speed them up
    },
    testTimeout: 5000,
    hookTimeout: 5000,
    bail: 1,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
