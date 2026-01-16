// Test utilities and mocks for StringRay Framework testing

import * as fs from "fs";
import * as path from "path";
import { vi } from "vitest";
import { CodexContext, CodexTerm } from "../../context-loader";

/**
 * Mock file system utilities for testing
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  constructor() {
    this.reset();
  }

  /**
   * Add a mock file
   */
  addFile(filePath: string, content: string): void {
    this.files.set(path.resolve(filePath), content);
  }

  /**
   * Add a mock directory
   */
  addDirectory(dirPath: string): void {
    this.directories.add(path.resolve(dirPath));
  }

  /**
   * Reset the mock file system
   */
  reset(): void {
    this.files.clear();
    this.directories.clear();

    // Add default test directory
    this.addDirectory("/test/project");
  }

  /**
   * Get mock fs implementation
   */
  getMockFs(): typeof fs {
    return {
      existsSync: (filePath: string) => {
        const resolved = path.resolve(filePath);
        return this.files.has(resolved) || this.directories.has(resolved);
      },
      readFileSync: (filePath: string, encoding: string) => {
        const resolved = path.resolve(filePath);
        const content = this.files.get(resolved);
        if (!content) {
          throw new Error(`File not found: ${filePath}`);
        }
        return content;
      },
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
    } as any;
  }

  /**
   * Get mock path implementation
   */
  getMockPath(): typeof path {
    return {
      join: (...args: string[]) => args.join("/"),
      resolve: (...args: string[]) => path.join(...args),
      basename: (filePath: string) => {
        const parts = filePath.split("/");
        return parts[parts.length - 1];
      },
      dirname: (filePath: string) => {
        const parts = filePath.split("/");
        parts.pop();
        return parts.join("/");
      },
      extname: path.extname,
      relative: path.relative,
      isAbsolute: path.isAbsolute,
      normalize: path.normalize,
    } as any;
  }
}

/**
 * Mock codex content generators
 */
export class MockCodexGenerator {
  /**
   * Generate a complete mock codex content
   */
  static createCompleteCodex(version = "1.2.20"): string {
    return JSON.stringify({
      version: version,
      lastUpdated: "2026-01-06",
      errorPreventionTarget: 0.996,
      terms: {
        "1": {
          number: 1,
          title: "Progressive Prod-Ready Code",
          description:
            "All code must be production-ready from the first commit. No placeholder, stub, or incomplete implementations.",
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "2": {
          number: 2,
          title: "No Patches/Boiler/Stubs/Bridge Code",
          description:
            'Prohibit temporary patches that are "meant to be fixed later"',
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "3": {
          number: 3,
          title: "Do Not Over-Engineer the Solution",
          description: "Solutions should be simple and direct.",
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "medium",
        },
        "7": {
          number: 7,
          title: "Resolve All Errors (90% Runtime Prevention)",
          description:
            "Zero-tolerance for unresolved errors: TODO, FIXME, XXX comments are blocking violations.",
          category: "core",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "8": {
          number: 8,
          title: "Prevent Infinite Loops",
          description:
            "Guarantee termination in all iterative processes: while(true), for(;;) are blocking violations.",
          category: "core",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "11": {
          number: 11,
          title: "Type Safety First",
          description:
            "Never use \`any\`, \`@ts-ignore\`, or \`@ts-expect-error\` - these are high-priority violations.",
          category: "extended",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "12": {
          number: 12,
          title: "Early Returns and Guard Clauses",
          description:
            "Validate inputs at function boundaries with early returns.",
          category: "extended",
          zeroTolerance: false,
          enforcementLevel: "medium",
        },
        "15": {
          number: 15,
          title: "Separation of Concerns",
          description:
            "Keep UI separate from business logic, isolate side effects.",
          category: "extended",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "21": {
          number: 21,
          title: "Dependency Injection",
          description:
            "Pass dependencies as parameters, avoid hardcoded dependencies.",
          category: "architecture",
          zeroTolerance: false,
          enforcementLevel: "medium",
        },
        "24": {
          number: 24,
          title: "Single Responsibility Principle",
          description: "Each class/module should have one reason to change.",
          category: "architecture",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "26": {
          number: 26,
          title: "Test Coverage >85%",
          description: "Maintain 85%+ behavioral test coverage.",
          category: "architecture",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "31": {
          number: 31,
          title: "Async/Await Over Callbacks",
          description:
            "Use async/await for asynchronous code, avoid callback hell.",
          category: "advanced",
          zeroTolerance: false,
          enforcementLevel: "medium",
        },
        "32": {
          number: 32,
          title: "Proper Error Handling",
          description:
            "Never ignore errors, provide context in error messages.",
          category: "advanced",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "35": {
          number: 35,
          title: "Version Control Best Practices",
          description:
            "Atomic commits, descriptive commit messages, use feature branches.",
          category: "advanced",
          zeroTolerance: false,
          enforcementLevel: "medium",
        },
      },
      interweaves: ["Error Prevention Interweave", "Performance Interweave"],
      lenses: ["Code Quality Lens", "Maintainability Lens"],
      principles: ["SOLID Principles", "DRY Principles"],
      antiPatterns: ["Spaghetti code", "God classes"],
      validationCriteria: {
        "All functions have implementations": false,
        "No TODO comments in production code": false,
        "TypeScript compilation succeeds": true,
      },
      frameworkAlignment: {
        "oh-my-opencode": "v2.12.0",
        "strray-framework": "v1.0.9",
      },
    });
  }

  /**
   * Generate minimal codex content for testing
   */
  static createMinimalCodex(): string {
    return JSON.stringify({
      version: "1.2.20",
      lastUpdated: "2026-01-06",
      errorPreventionTarget: 0.996,
      terms: {
        "1": {
          number: 1,
          title: "Progressive Prod-Ready Code",
          description: "All code must be production-ready.",
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "7": {
          number: 7,
          title: "Resolve All Errors",
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
      },
      interweaves: [],
      lenses: [],
      principles: [],
      antiPatterns: [],
      validationCriteria: {},
      frameworkAlignment: {},
    });
  }

  /**
   * Generate codex with specific violations for testing
   */
  static createCodexWithViolations(): string {
    return JSON.stringify({
      version: "1.2.20",
      lastUpdated: "2026-01-06",
      errorPreventionTarget: 0.996,
      terms: {
        "1": {
          number: 1,
          title: "Progressive Prod-Ready Code",
          description: "All code must be production-ready.",
          category: "core",
          zeroTolerance: false,
          enforcementLevel: "high",
        },
        "7": {
          number: 7,
          title: "Resolve All Errors",
          description:
            "Zero-tolerance for unresolved errors - TODO and FIXME are violations.",
          category: "core",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "8": {
          number: 8,
          title: "Prevent Infinite Loops",
          description: "Guarantee termination - while(true) is a violation.",
          category: "core",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
        "11": {
          number: 11,
          title: "Type Safety First",
          description: "Never use \`any\` or type suppressions.",
          category: "extended",
          zeroTolerance: true,
          enforcementLevel: "blocking",
        },
      },
      interweaves: [],
      lenses: [],
      principles: [],
      antiPatterns: [],
      validationCriteria: {},
      frameworkAlignment: {},
    });
  }

  /**
   * Generate invalid codex content for error testing
   */
  static createInvalidCodex(): string {
    return JSON.stringify({
      invalid: "codex",
      noVersion: true,
      noTerms: true,
    });
  }
}

/**
 * Mock context creation utilities
 */
export class MockContextFactory {
  /**
   * Create a mock codex context
   */
  static createMockContext(
    overrides: Partial<CodexContext> = {},
  ): CodexContext {
    const defaultContext: CodexContext = {
      version: "1.2.20",
      lastUpdated: new Date().toISOString(),
      terms: new Map([
        [
          1,
          {
            number: 1,
            description:
              "Progressive Prod-Ready Code - All code must be production-ready.",
            category: "core",
            enforcementLevel: "high",
          },
        ],
        [
          7,
          {
            number: 7,
            description:
              "Resolve All Errors - Zero-tolerance for unresolved errors.",
            category: "core",
            zeroTolerance: true,
            enforcementLevel: "blocking",
          },
        ],
        [
          8,
          {
            number: 8,
            description: "Prevent Infinite Loops - Guarantee termination.",
            category: "core",
            zeroTolerance: true,
            enforcementLevel: "blocking",
          },
        ],
        [
          11,
          {
            number: 11,
            description:
              "Type Safety First - Never use any or type suppressions.",
            category: "extended",
            enforcementLevel: "high",
          },
        ],
      ]),
      interweaves: ["Error Prevention Interweave", "Performance Interweave"],
      lenses: ["Code Quality Lens", "Maintainability Lens"],
      principles: ["SOLID Principles", "DRY Principles"],
      antiPatterns: ["Spaghetti code", "God classes"],
      validationCriteria: {
        "All functions have implementations": false,
        "No TODO comments": false,
        "TypeScript compilation succeeds": true,
      },
      frameworkAlignment: {
        "oh-my-opencode": "v2.12.0",
        "StringRay Framework": "v1.0.9",
      },
      errorPreventionTarget: 0.996,
    };

    return { ...defaultContext, ...overrides };
  }

  /**
   * Create a mock codex term
   */
  static createMockTerm(overrides: Partial<CodexTerm> = {}): CodexTerm {
    return {
      number: 1,
      description: "Mock codex term for testing",
      category: "core",
      enforcementLevel: "medium",
      ...overrides,
    };
  }
}

/**
 * Test data factories
 */
export class TestDataFactory {
  /**
   * Create mock validation results
   */
  static createValidationResult(compliant = true, violationCount = 0) {
    const violations = Array.from({ length: violationCount }, (_, i) => ({
      term: MockContextFactory.createMockTerm({ number: i + 1 }),
      reason: `Mock violation ${i + 1}`,
      severity: ["low", "medium", "high", "blocking"][i % 4] as
        | "low"
        | "medium"
        | "high"
        | "blocking",
    }));

    return {
      compliant,
      violations,
      recommendations: compliant ? [] : ["Fix the violations"],
    };
  }

  /**
   * Create mock tool execution data
   */
  static createToolExecution(tool = "read", hasOutput = true) {
    return {
      input: {
        tool,
        args: { filePath: "test.ts" },
      },
      output: hasOutput ? { output: "Mock tool output" } : {},
    };
  }

  /**
   * Create mock session data
   */
  static createSessionData(sessionId = "test-session-123") {
    return {
      sessionId,
      startTime: Date.now(),
      componentStates: {
        contextLoader: "loaded",
        stateManager: "active",
        codexInjector: "ready",
      },
    };
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static measureExecutionTime<T>(fn: () => T): { result: T; duration: number } {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    return {
      result,
      duration: endTime - startTime,
    };
  }

  /**
   * Run performance test with multiple iterations
   */
  static runPerformanceTest<T>(
    fn: () => T,
    iterations = 100,
  ): { results: T[]; totalDuration: number; averageDuration: number } {
    const results: T[] = [];
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      results.push(fn());
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    return {
      results,
      totalDuration,
      averageDuration: totalDuration / iterations,
    };
  }

  /**
   * Assert performance requirements
   */
  static assertPerformance(
    duration: number,
    maxDuration: number,
    operation: string,
  ): void {
    if (duration > maxDuration) {
      throw new Error(
        `${operation} took ${duration}ms, exceeding maximum of ${maxDuration}ms`,
      );
    }
  }
}

/**
 * Memory testing utilities
 */
export class MemoryTestUtils {
  /**
   * Get current memory usage
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Monitor memory usage during operation
   */
  static monitorMemoryUsage<T>(fn: () => T): {
    result: T;
    memoryDelta: number;
  } {
    const beforeMemory = this.getMemoryUsage().heapUsed;
    const result = fn();
    const afterMemory = this.getMemoryUsage().heapUsed;

    return {
      result,
      memoryDelta: afterMemory - beforeMemory,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  static forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * Async testing utilities
 */
export class AsyncTestUtils {
  /**
   * Wait for a specified amount of time
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry an async operation with backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 100,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          await this.delay(delayMs * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Test async operation timeout
   */
  static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }
}
