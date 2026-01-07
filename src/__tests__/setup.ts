// Global test setup for StrRay Framework tests
import { beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';

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
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.STRRAY_TEST_MODE = 'true';
});

afterAll(() => {
  // Clean up test environment
  delete process.env.STRRAY_TEST_MODE;
});

// Reset console methods after each test
afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Create a temporary directory for file operations
  createTempDir: () => {
    const crypto = require('crypto');
    const os = require('os');
    const path = require('path');
    return path.join(os.tmpdir(), `strray-test-${crypto.randomBytes(8).toString('hex')}`);
  },

  // Clean up temporary directory
  cleanupTempDir: (dirPath: string) => {
    const fs = require('fs');
    const path = require('path');
    
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  },

  // Create mock codex content
  createMockCodexContent: (version = '1.2.20') => {
    return `# Universal Development Codex v${version}

**Version**: ${version}
**Last Updated**: 2026-01-06
**Purpose**: Systematic error prevention and production-ready development framework

## Overview

This codex defines the 30+ mandatory terms that guide AI-assisted development under the StrRay Framework.

### Core Terms (1-10)

#### 1. Progressive Prod-Ready Code

All code must be production-ready from the first commit.

#### 2. No Patches/Boiler/Stubs/Bridge Code

Prohibit temporary patches and boilerplate code.

#### 7. Resolve All Errors (90% Runtime Prevention)

Zero-tolerance for unresolved errors.

#### 8. Prevent Infinite Loops

Guarantee termination in all iterative processes.

#### 11. Type Safety First

Never use \`any\`, \`@ts-ignore\`, or \`@ts-expect-error\`.

## Error Prevention Target

**Error Prevention Target**: 99.6% (systematic runtime error prevention through zero-tolerance policies and comprehensive validation).
`;
  },

  // Mock file system operations
  mockFs: {
    existsSync: (path: string) => true,
    readFileSync: (path: string, encoding: string) => global.testUtils.createMockCodexContent(),
    writeFileSync: () => {},
    mkdirSync: () => {},
    rmSync: () => {},
  },
};

// Extend expect with custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidCodexTerm(): T;
    toHaveCodexViolations(): T;
    toBeCompliantWithCodex(): T;
  }
}

// Custom matchers
expect.extend({
  toBeValidCodexTerm(received: any) {
    const pass = received &&
                 typeof received === 'object' &&
                 typeof received.number === 'number' &&
                 typeof received.description === 'string' &&
                 ['core', 'extended', 'architecture', 'advanced'].includes(received.category);

    return {
      message: () => `expected ${received} to be a valid codex term`,
      pass,
    };
  },

  toHaveCodexViolations(received: any) {
    const pass = received &&
                 Array.isArray(received.violations) &&
                 received.violations.length > 0;

    return {
      message: () => `expected ${received} to have codex violations`,
      pass,
    };
  },

  toBeCompliantWithCodex(received: any) {
    const pass = received &&
                 typeof received.compliant === 'boolean' &&
                 received.compliant === true;

    return {
      message: () => `expected ${received} to be compliant with codex`,
      pass,
    };
  },
});
