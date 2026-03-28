/**
 * Global Processor Mocks
 * 
 * These mocks are automatically applied to all processor tests.
 * They provide safe defaults that can be overridden in individual tests.
 * 
 * @version 1.0.0
 * @module tests/setup/global-processor-mocks
 */

import { vi } from "vitest";

/**
 * Mock framework logger to prevent console output during tests
 * and provide predictable logging behavior.
 */
vi.mock("../src/core/framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
    success: vi.fn().mockResolvedValue(undefined),
  },
}));

/**
 * Mock state manager for processors that access global state.
 */
vi.mock("../src/core/state-manager.js", () => ({
  stateManager: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockReturnValue(false),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

/**
 * Default mock for fs module.
 * Individual tests can override specific methods.
 */
vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue(""),
  writeFileSync: vi.fn().mockReturnValue(undefined),
  appendFileSync: vi.fn().mockReturnValue(undefined),
  mkdirSync: vi.fn().mockReturnValue(undefined),
  rmSync: vi.fn().mockReturnValue(undefined),
  readdirSync: vi.fn().mockReturnValue([]),
  unlinkSync: vi.fn().mockReturnValue(undefined),
  statSync: vi.fn().mockReturnValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 0,
    mtime: new Date(),
  }),
}));

/**
 * Default mock for child_process.
 * Individual tests MUST override this with specific behaviors.
 */
vi.mock("child_process", () => ({
  exec: vi.fn().mockImplementation(
    (command: string, options: any, callback: Function) => {
      // Default: succeed with empty output - tests should override this
      callback(null, { stdout: "", stderr: "" });
    },
  ),
  execSync: vi.fn().mockReturnValue(""),
  spawn: vi.fn().mockReturnValue({
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  }),
}));

/**
 * Default mock for util module.
 */
vi.mock("util", () => ({
  promisify: vi.fn().mockImplementation((fn: Function) => {
    return async (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (err: Error | null, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  }),
}));

/**
 * Default mock for language-detector.
 */
vi.mock("../src/utils/language-detector.js", () => ({
  detectProjectLanguage: vi.fn().mockReturnValue({
    language: "TypeScript",
    testFramework: "Vitest",
    testCommand: "vitest run",
    testFilePattern: "*.test.ts",
    configFiles: ["vitest.config.ts"],
  }),
}));

/**
 * Helper function to reset processor mocks between tests.
 * Call this in beforeEach when you need to reconfigure mocks.
 */
export const resetProcessorMocks = () => {
  const fs = require("fs");
  const child_process = require("child_process");
  const languageDetector = require("../src/utils/language-detector");

  // Reset fs mocks
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue("");
  fs.writeFileSync.mockReturnValue(undefined);
  fs.appendFileSync.mockReturnValue(undefined);

  // Reset child_process mocks
  child_process.exec.mockImplementation(
    (command: string, options: any, callback: Function) => {
      callback(null, { stdout: "", stderr: "" });
    },
  );

  // Reset language detector mocks
  languageDetector.detectProjectLanguage.mockReturnValue({
    language: "TypeScript",
    testFramework: "Vitest",
    testCommand: "vitest run",
  });
};
