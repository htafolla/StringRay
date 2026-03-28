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
    // === PROCESSOR-SPECIFIC RULES ===

    /**
     * Rule: no-unmocked-processor-execution
     * 
     * Prevents direct execution of processors that have external dependencies
     * without proper mocking. This is a custom rule that should be implemented.
     */
    "no-unmocked-processor-execution": "error",

    /**
     * Rule: processor-execute-in-test
     * 
     * When a processor is instantiated and execute() is called,
     * the test file must have a corresponding vi.mock() call
     * for all external dependencies.
     */
    "processor-execute-in-test": [
      "error",
      {
        requireMocks: [
          "child_process",
          "fs",
          "util",
          "../../utils/language-detector",
          "../../enforcement/rule-enforcer",
          "../../processors/version-compliance-processor",
          "../../processors/test-auto-creation-processor",
          "../../processors/agents-md-validation-processor",
        ],
      },
    ],

    /**
     * Rule: no-direct-child-process-exec
     * 
     * In test files under src/processors/, any import of child_process
     * must be immediately followed by vi.mock() to prevent actual execution.
     */
    "no-direct-child-process-exec": [
      "error",
      {
        message:
          "Do not use child_process.exec directly in processor tests. Use vi.mock() with a mock implementation instead.",
      },
    ],

    /**
     * Rule: mock-cleanup-required
     * 
     * Tests that use vi.mock() must have vi.restoreAllMocks() or
     * vi.clearAllMocks() in afterEach or afterAll hooks.
     */
    "mock-cleanup-required": "warn",

    /**
     * Rule: no-real-fs-in-processor-test
     * 
     * Processor tests should not use fs module directly.
     * Use mocked fs or testUtils.mockFs instead.
     */
    "no-real-fs-in-processor-test": [
      "error",
      {
        message:
          "Do not use fs module directly in processor tests. Use vi.mock('fs') or testUtils.mockFs instead.",
        patterns: [".*/processors/.*\\.test\\.ts$"],
      },
    ],

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
