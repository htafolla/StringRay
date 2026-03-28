/**
 * Processor Test ESLint Rules
 * 
 * Rules specifically for processor test files to ensure proper mocking
 * and prevent external dependency issues from reaching CI.
 * 
 * @version 1.0.0
 * @module tests/config/processor-test-rules
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    // === STANDARD TYPE-SAFETY RULES ===

    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/ban-types": "off",

    // === EXISTING RULES (preserved) ===

    "no-console": "off",
    "no-debugger": "off",
    "no-case-declarations": "off",
    "no-useless-escape": "off",
    "no-inner-declarations": "off",
    "no-useless-catch": "off",
    "prefer-const": "warn",
    "no-var": "error",

  },
  overrides: [
    {
      files: ["src/processors/**/*.test.ts"],
      rules: {
        // Stricter rules for processor test files
        "no-console": "warn",
        "@typescript-eslint/no-unused-vars": "error",
      },
    },
  ],
  ignorePatterns: ["dist/", "node_modules/", "coverage/"],
};
