// Global test setup for StringRay Framework tests
import { beforeAll, afterAll, beforeEach, afterEach, expect } from "vitest";

// Global type declarations
declare global {
  var testUtils: {
    createTempDir: () => string;
    cleanupTempDir: (dirPath: string) => void;
    createMockCodexContent: (version?: string) => string;
    mockFs: {
      existsSync: (path: string) => boolean;
      readFileSync: (path: string, encoding: string) => string;
      writeFileSync: () => void;
      mkdirSync: () => void;
      rmSync: () => void;
    };
  };
}

// Mock console methods to reduce noise during testing

beforeAll(() => {
  // Set up test environment
  process.env.NODE_ENV = "test";
  process.env.STRRAY_TEST_MODE = "true";

  // Create required directories for tests
  const fs = require("fs");
  const path = require("path");

  const requiredDirs = [
    ".opencode",
    ".opencode/agents",
    ".opencode/logs",
    ".strray",
    "src",
    "dist/plugin/mcps",
  ];

  requiredDirs.forEach((dir) => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Create required config files for tests
  const codexContent = global.testUtils.createMockCodexContent();
  const codexPath = path.resolve(".strray/codex.json");
  if (!fs.existsSync(codexPath)) {
    fs.writeFileSync(codexPath, codexContent);
  }

  const ohMyOpencodeConfig = {
    plugin: "./dist/plugin/plugins/stringray-codex-injection.js",
    agents: ["enforcer", "architect", "orchestrator"],
  };
  const ohMyOpencodePath = path.resolve(".opencode/oh-my-opencode.json");
  if (!fs.existsSync(ohMyOpencodePath)) {
    fs.writeFileSync(
      ohMyOpencodePath,
      JSON.stringify(ohMyOpencodeConfig, null, 2),
    );
  }
});

afterAll(() => {
  // Clean up test environment
  delete process.env.STRRAY_TEST_MODE;
});

// Reset console methods after each test
afterEach(() => {});

// Global test utilities
global.testUtils = {
  // Create a temporary directory for file operations
  createTempDir: () => {
    const crypto = require("crypto");
    const os = require("os");
    const path = require("path");
    return path.join(
      os.tmpdir(),
      `strray-test-${crypto.randomBytes(8).toString("hex")}`,
    );
  },

  // Clean up temporary directory
  cleanupTempDir: (dirPath: string) => {
    const fs = require("fs");
    const path = require("path");

    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  },

  // Create mock codex content
  createMockCodexContent: (version = "1.2.20") => {
    return JSON.stringify({
      version: version,
      lastUpdated: "2026-01-06",
      errorPreventionTarget: 0.996,
      terms: {
        "1": {
          number: 1,
          title: "Progressive Prod-Ready Code",
          description:
            "All code must be production-ready from the first commit.",
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "2": {
          number: 2,
          title: "No Patches/Boiler/Stubs/Bridge Code",
          description: "Prohibit temporary patches and boilerplate code.",
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "7": {
          number: 7,
          title: "Resolve All Errors (90% Runtime Prevention)",
          description: "Zero-tolerance for unresolved errors.",
          category: "core",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "8": {
          number: 8,
          title: "Prevent Infinite Loops",
          description: "Guarantee termination in all iterative processes.",
          category: "core",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "11": {
          number: 11,
          title: "Type Safety First",
          description:
            "Never use \`any\`, \`@ts-ignore\`, or \`@ts-expect-error\`.",
          category: "extended",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
      },
      interweaves: ["Error Prevention Interweave"],
      lenses: ["Code Quality Lens"],
      principles: ["SOLID Principles"],
      antiPatterns: ["Spaghetti code"],
      validationCriteria: {
        "All functions have implementations": false,
        "No TODO comments in production code": false,
      },
      frameworkAlignment: {
        "oh-my-opencode": "v1.1.1",
      },
    });
  },

  // Mock file system operations
  mockFs: {
    existsSync: (path: string) => true,
    readFileSync: (path: string, encoding: string) =>
      global.testUtils.createMockCodexContent(),
    writeFileSync: () => {},
    mkdirSync: () => {},
    rmSync: () => {},
  },
};

// Extend expect with custom matchers
declare module "vitest" {
  interface Assertion<T = any> {
    toBeValidCodexTerm(): T;
    toHaveCodexViolations(): T;
    toBeCompliantWithCodex(): T;
  }
}

// Custom matchers
expect.extend({
  toBeValidCodexTerm(received: any) {
    const pass =
      received &&
      typeof received === "object" &&
      typeof received.number === "number" &&
      typeof received.description === "string" &&
      ["core", "extended", "architecture", "advanced"].includes(
        received.category,
      );

    return {
      message: () => `expected ${received} to be a valid codex term`,
      pass,
    };
  },

  toHaveCodexViolations(received: any) {
    const pass =
      received &&
      Array.isArray(received.violations) &&
      received.violations.length > 0;

    return {
      message: () => `expected ${received} to have codex violations`,
      pass,
    };
  },

  toBeCompliantWithCodex(received: any) {
    const pass =
      received &&
      typeof received.compliant === "boolean" &&
      received.compliant === true;

    return {
      message: () => `expected ${received} to be compliant with codex`,
      pass,
    };
  },
});
