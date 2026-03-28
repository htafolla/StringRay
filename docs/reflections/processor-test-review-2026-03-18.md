# Processor Test Quality Review

**Date:** March 18, 2026  
**Session:** ses_2fe2366beffeqy154d0NTj3YLY  
**File Reviewed:** `src/processors/implementations/implementations.test.ts`  
**Test Status:** 38 passing, 3 failing

---

## Executive Summary

This review examines the test suite for the polymorphic processor implementation pattern in the StringRay framework. The test architecture demonstrates solid foundational patterns but has gaps in mocking external dependencies, leading to test instability and failures in CI environments.

**Key Finding:** The TestExecutionProcessor performs synchronous child_process execution that times out in test environments, and two other processors (CodexComplianceProcessor, VersionComplianceProcessor) execute real validation logic against project files rather than mocked responses.

---

## 1. Test Architecture Decisions

### 1.1 Polymorphic Processor Pattern

The codebase implements a **polymorphic processor pattern** where each processor extends either `PreProcessor` or `PostProcessor` base classes. This is a significant improvement over the legacy switch-statement anti-pattern.

```
┌─────────────────────────────────────────────────────────────┐
│                    BaseProcessor                            │
│  - execute(context): Promise<ProcessorResult>               │
│  - run(context): Promise<unknown> [abstract]                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   PreProcessor                   PostProcessor
   (type: "pre")                 (type: "post")
        │                             │
   ┌─────┴─────┐                ┌─────┴─────┐
   │           │                │           │
   │  PreValidate │            │  TestExecution │
   │  CodexCompliance│        │  RegressionTesting│
   │  VersionCompliance│       │  StateValidation │
   │  ErrorBoundary │          │  CoverageAnalysis │
   └─────────────┘             │  RefactoringLogging│
                              │  TestAutoCreation │
                              │  AgentsMdValidation│
                              └─────────────────┘
```

### 1.2 Current Test Structure

```typescript
describe("Processor Implementations", () => {
  // ProcessorRegistry tests (unit)
  // Individual processor tests (mostly integration)
  // All 11 Processors tests (validation)
});
```

**What's Working Well:**

| Pattern | Description | Example |
|---------|-------------|---------|
| Registry isolation | Each test gets fresh `ProcessorRegistry` via `beforeEach` | Lines 31-33 |
| Property validation | Tests verify `name`, `type`, `priority` match expectations | Lines 83-88 |
| Execute result shape | Tests verify `ProcessorResult` has required fields | Lines 91-100 |
| Type assertions | Uses `as Record<string, unknown>` for data access | Lines 107, 182 |

### 1.3 Why Tests Pass (33 initially, 38 after fixes)

The following processor tests pass because their implementations are **unit-testable** without external dependencies:

- **PreValidateProcessor** — Pure function, no side effects
- **ErrorBoundaryProcessor** — Returns static config, no I/O
- **StateValidationProcessor** — Checks global state (may be undefined), no I/O
- **RefactoringLoggingProcessor** — Writes to filesystem (side effect, but predictable)
- **RegressionTestingProcessor** — Placeholder implementation, no real logic
- **CoverageAnalysisProcessor** — Placeholder, always returns success
- **TestAutoCreationProcessor** — Delegates to external processor (no mock, but external processor is lightweight)
- **AgentsMdValidationProcessor** — Delegates to external processor (no mock, but external processor handles missing files gracefully)

---

## 2. Why 3 Tests Still Fail

### 2.1 TestExecutionProcessor — Timeout (5000ms exceeded)

**Location:** Lines 196-209

**Problem:**
```typescript
// This test calls the real processor...
const result = await processor.execute(context);

// ...which executes npx vitest run synchronously
const result = await execAsync(testCommand, {
  cwd,
  timeout: 120000, // 2 minute timeout
});
```

**Root Cause Chain:**
```
TestExecutionProcessor.execute()
  └─> run(context)
      └─> detectProjectLanguage(cwd)  // Real file system access
      └─> buildTypeScriptTestCommand()  // Real fs.existsSync()
      └─> execAsync("npx vitest run ...")  // Real child process
          └─> Blocks for 5+ seconds (vitest startup + test execution)
```

**Why This Wasn't Caught:**
- The test environment has vitest installed and a working test suite
- In isolation (without proper context), vitest runs all tests
- The default vitest timeout in the test runner is 5000ms
- The processor's own 120000ms timeout doesn't help — the test runner times out first

**Session Context (ses_2fe2366beffeqy154d0NTj3YLY):**
The test was written assuming the processor would be fast. However, even with a fast test suite, the overhead of spawning a child process, loading vitest, and running tests exceeds the 5-second test timeout.

### 2.2 CodexComplianceProcessor — Validation Failure

**Location:** Lines 119-138

**Problem:**
```typescript
const result = await processor.execute({
  operation: "write",
  filePath: "/test/file.ts",
});

// The processor calls:
const validationResult = await ruleEnforcer.validateOperation(operation, validationContext);

if (!validationResult.passed) {
  throw new Error(`Codex compliance failed: ${errors}`);
}
```

**Root Cause:**
The `RuleEnforcer` performs actual validation against the codebase. In the test environment, the validation rules may not pass (e.g., missing AGENTS.md, invalid code patterns, etc.).

**Error received:**
```
AssertionError: expected false to be true
// result.success === false because RuleEnforcer.validateOperation() returned { passed: false }
```

### 2.3 VersionComplianceProcessor — Version Mismatch

**Location:** Lines 148-157

**Problem:**
```typescript
const result = await processor.execute({ operation: "commit" });

// The processor calls:
const result = await processor.validateVersionCompliance();

if (!result.compliant) {
  throw new Error(`Version compliance failed: ${errors}`);
}
```

**Root Cause:**
The `VersionComplianceProcessor` validates actual version files in the project:
- `package.json` version
- `npm` version
- `uvm` version (if present)
- README version

If any of these are out of sync (common in development), validation fails.

---

## 3. Recommendations for Fixing the Remaining 3 Tests

### 3.1 Fix TestExecutionProcessor

**Strategy:** Mock all external dependencies

```typescript
describe("TestExecutionProcessor", () => {
  beforeEach(() => {
    // Reset modules before each test to ensure fresh mocks
    vi.resetModules();
  });

  it("should execute successfully with mocked language detection and exec", async () => {
    // Step 1: Mock language detector
    vi.mock("../../utils/language-detector.js", () => ({
      detectProjectLanguage: vi.fn().mockReturnValue({
        language: "TypeScript",
        testFramework: "Vitest",
        testCommand: "vitest run",
      }),
    }));

    // Step 2: Mock child_process
    vi.mock("child_process", () => ({
      exec: vi.fn(),
    }));

    // Step 3: Mock fs for buildTypeScriptTestCommand
    vi.mock("fs", () => ({
      existsSync: vi.fn().mockReturnValue(false),
    }));

    // Step 4: Import after mocks are set
    const { exec } = await import("child_process");
    const processor = new TestExecutionProcessor();

    // Step 5: Configure exec mock
    (exec as any).mockImplementation((cmd: string, opts: any, cb: Function) => {
      cb(null, { stdout: "Tests: 2 passed, 0 failed", stderr: "" });
    });

    // Act
    const result = await processor.execute({
      operation: "test",
      filePath: "/test/test.spec.ts",
    });

    // Assert
    expect(result.processorName).toBe("testExecution");
    expect(result.data).toBeDefined();
    const data = result.data as any;
    expect(data.testsExecuted).toBeGreaterThanOrEqual(0);
  });

  it("should handle exec errors gracefully", async () => {
    vi.mock("child_process", () => ({
      exec: vi.fn().mockImplementation((cmd: string, opts: any, cb: Function) => {
        cb({ code: 1, message: "Test failed" }, null, "stderr output");
      }),
    }));

    vi.mock("../../utils/language-detector.js", () => ({
      detectProjectLanguage: vi.fn().mockReturnValue({
        language: "TypeScript",
        testFramework: "Vitest",
        testCommand: "vitest run",
      }),
    }));

    const processor = new TestExecutionProcessor();
    const result = await processor.execute({ operation: "test" });

    // Should return result, not throw
    expect(result.processorName).toBe("testExecution");
    expect(result.data).toBeDefined();
  });

  it("should skip execution when language detection fails", async () => {
    vi.mock("../../utils/language-detector.js", () => ({
      detectProjectLanguage: vi.fn().mockReturnValue(null),
    }));

    const processor = new TestExecutionProcessor();
    const result = await processor.execute({ operation: "test" });

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.testsExecuted).toBe(0);
    expect(data.message).toContain("Language detection failed");
  });
});
```

**Alternative: Mock the entire processor**

```typescript
// In tests that don't care about execution details:
vi.mock("./test-execution-processor.js", () => ({
  TestExecutionProcessor: vi.fn().mockImplementation(() => ({
    name: "testExecution",
    type: "post",
    priority: 40,
    enabled: true,
    execute: vi.fn().mockResolvedValue({
      success: true,
      processorName: "testExecution",
      duration: 10,
      data: { testsExecuted: 0, passed: 0, failed: 0 },
    }),
  })),
}));
```

### 3.2 Fix CodexComplianceProcessor

**Strategy:** Mock RuleEnforcer

```typescript
describe("CodexComplianceProcessor", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should pass when validation succeeds", async () => {
    vi.mock("../../enforcement/rule-enforcer.js", () => ({
      RuleEnforcer: vi.fn().mockImplementation(() => ({
        validateOperation: vi.fn().mockResolvedValue({
          passed: true,
          errors: [],
          warnings: [],
          results: [
            { rule: "naming-convention", passed: true },
            { rule: "documentation", passed: true },
          ],
        }),
      })),
    }));

    const processor = new CodexComplianceProcessor();
    const result = await processor.execute({
      operation: "write",
      filePath: "/test/file.ts",
    });

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.passed).toBe(true);
    expect(data.rulesChecked).toBe(2);
  });

  it("should fail when validation fails", async () => {
    vi.mock("../../enforcement/rule-enforcer.js", () => ({
      RuleEnforcer: vi.fn().mockImplementation(() => ({
        validateOperation: vi.fn().mockResolvedValue({
          passed: false,
          errors: ["Missing JSDoc comments"],
          warnings: ["Consider adding type annotations"],
          results: [
            { rule: "documentation", passed: false },
          ],
        }),
      })),
    }));

    const processor = new CodexComplianceProcessor();
    const result = await processor.execute({
      operation: "write",
      filePath: "/test/file.ts",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Codex compliance failed");
  });
});
```

### 3.3 Fix VersionComplianceProcessor

**Strategy:** Mock external processor class

```typescript
describe("VersionComplianceProcessor", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should pass when versions are compliant", async () => {
    vi.mock("../version-compliance-processor.js", () => ({
      VersionComplianceProcessor: vi.fn().mockImplementation(() => ({
        validateVersionCompliance: vi.fn().mockResolvedValue({
          compliant: true,
          npmVersion: "1.0.0",
          uvmVersion: "1.0.0",
          pkgVersion: "1.0.0",
          errors: [],
          warnings: [],
        }),
      })),
    }));

    const processor = new VersionComplianceProcessor();
    const result = await processor.execute({ operation: "commit" });

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.compliant).toBe(true);
  });

  it("should fail when versions are non-compliant", async () => {
    vi.mock("../version-compliance-processor.js", () => ({
      VersionComplianceProcessor: vi.fn().mockImplementation(() => ({
        validateVersionCompliance: vi.fn().mockResolvedValue({
          compliant: false,
          npmVersion: "1.0.0",
          uvmVersion: "2.0.0",
          pkgVersion: "1.0.0",
          errors: ["Version mismatch: uvm (2.0.0) vs package.json (1.0.0)"],
          warnings: [],
        }),
      })),
    }));

    const processor = new VersionComplianceProcessor();
    const result = await processor.execute({ operation: "commit" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Version compliance failed");
  });
});
```

---

## 4. Test Patterns That Work Well

### 4.1 ProcessorRegistry Tests (Lines 35-80)

**Pattern:** Pure unit tests with no external dependencies

```typescript
describe("ProcessorRegistry", () => {
  let registry: ProcessorRegistry;

  beforeEach(() => {
    registry = new ProcessorRegistry(); // Fresh instance per test
  });

  it("should register and retrieve processors", () => {
    const processor = new PreValidateProcessor();
    registry.register(processor);
    expect(registry.get("preValidate")).toBe(processor);
  });
});
```

**Why it works:** `ProcessorRegistry` is a simple class with no external dependencies. Tests are fast, deterministic, and isolated.

### 4.2 Property Validation Pattern (Lines 83-88)

```typescript
it("should have correct properties", () => {
  const processor = new PreValidateProcessor();
  expect(processor.name).toBe("preValidate");
  expect(processor.type).toBe("pre");
  expect(processor.priority).toBe(10);
  expect(processor.enabled).toBe(true);
});
```

**Why it works:** Properties are compile-time constants. Tests verify the class contract without executing any logic.

### 4.3 Result Shape Validation Pattern (Lines 91-100)

```typescript
it("should execute successfully", async () => {
  const processor = new PreValidateProcessor();
  const context: ProcessorContext = { operation: "test" };

  const result = await processor.execute(context);

  expect(result.success).toBe(true);
  expect(result.processorName).toBe("preValidate");
  expect(result.duration).toBeGreaterThanOrEqual(0);
});
```

**Why it works:** Verifies the `ProcessorResult` interface is satisfied. Uses `toBeGreaterThanOrEqual(0)` for timing to avoid flaky failures from microsecond differences.

### 4.4 Collection Validation Pattern (Lines 364-443)

```typescript
describe("All 11 Processors", () => {
  it("should have unique names for all processors", () => {
    const processorInstances = [
      new PreValidateProcessor(),
      // ... all 11 processors
    ];

    const names = processorInstances.map((p) => p.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(names.length);
  });

  it("should have valid types (pre or post) for all processors", () => {
    processorInstances.forEach((processor) => {
      expect(["pre", "post"]).toContain(processor.type);
    });
  });
});
```

**Why it works:** Single source of truth for processor metadata. Catches naming collisions and type errors at test time.

---

## 5. Rules and Validators for Future Processor Tests

### 5.1 Mandatory Mocking Rules

```typescript
// Add to project test guidelines (e.g., CONTRIBUTING.md or testing-best-practices.md)

/**
 * PROCESSOR TESTING RULES
 * =======================
 * 
 * 1. MANDATORY MOCKING
 * 
 * Any processor that uses the following MUST be mocked in tests:
 * 
 * | External Dependency    | Mock Module                    | Reason                        |
 * |-----------------------|--------------------------------|-------------------------------|
 * | child_process.exec    | vi.mock("child_process")       | Prevents actual command execution |
 * | fs.readFileSync       | vi.mock("fs")                  | Prevents filesystem dependencies |
 * | RuleEnforcer          | vi.mock("../../enforcement/...")| Prevents external validation   |
 * | External processors   | vi.mock("../processor-name.js")| Prevents cascading failures    |
 * 
 * 2. TIMEOUT HANDLING
 * 
 * Tests that call processors with async operations should:
 * - Set appropriate timeout: it("...", async () => { ... }, 30000)
 * - OR mock the underlying async operations
 * 
 * 3. PRIORITY VALIDATION
 * 
 * When adding new processors, update priority tests with explicit values:
 * 
 * // GOOD
 * expect(processor.priority).toBe(25);
 * 
 * // BAD - too loose
 * expect(processor.priority).toBeGreaterThan(0);
 */

```

### 5.2 Test Template for New Processors

```typescript
/**
 * Test template for new processors
 * Copy this template when adding new processors
 */
describe("NewProcessor", () => {
  describe("property validation", () => {
    it("should have correct name", () => {
      const processor = new NewProcessor();
      expect(processor.name).toBe("newProcessor");
    });

    it("should have correct type", () => {
      const processor = new NewProcessor();
      expect(processor.type).toBe("pre"); // or "post"
    });

    it("should have correct priority", () => {
      const processor = new NewProcessor();
      expect(processor.priority).toBe(XX); // Set explicit priority
    });

    it("should be enabled by default", () => {
      const processor = new NewProcessor();
      expect(processor.enabled).toBe(true);
    });
  });

  describe("execution", () => {
    // Mock any external dependencies BEFORE importing processor
    beforeEach(() => {
      vi.resetModules();
      
      // Mock pattern 1: Simple mock
      vi.mock("./new-processor-dependency.js", () => ({
        SomeDependency: vi.fn().mockImplementation(() => ({
          doSomething: vi.fn().mockResolvedValue({ success: true }),
        })),
      }));

      // Mock pattern 2: Static mock
      vi.mock("child_process", () => ({
        exec: vi.fn().mockImplementation((cmd, opts, cb) => {
          cb(null, { stdout: "ok", stderr: "" });
        }),
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should execute successfully with valid context", async () => {
      const processor = new NewProcessor();
      const result = await processor.execute({
        operation: "create",
        filePath: "/test/file.ts",
      });

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("newProcessor");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should return structured data", async () => {
      const processor = new NewProcessor();
      const result = await processor.execute({ operation: "test" });

      expect(result.data).toBeDefined();
      // Add specific data assertions
    });

    it("should handle errors gracefully", async () => {
      // Set up error mock scenario
      const processor = new NewProcessor();
      const result = await processor.execute({ operation: "fail" });

      // Either expect success:false OR let error propagate (based on design)
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### 5.3 ESLint Rules to Add

```javascript
// .eslintrc.js - Add to existing config
module.exports = {
  rules: {
    // Warn when tests call processors that need mocking
    "no-restricted-imports": [
      "error",
      {
        name: "./processors/implementations/test-execution-processor",
        message: "TestExecutionProcessor requires mocking child_process. Use vi.mock() before import.",
      },
    ],
  },
};

// Or use a custom rule in a separate file:
```

### 5.4 Vitest Configuration for Processor Tests

```typescript
// vitest.config.ts - Add processor-specific config
export default defineConfig({
  test: {
    // Timeout for processor tests (higher due to async operations)
    timeout: 30000,
    
    // Setup files that run before processor tests
    setupFiles: ["<rootDir>/tests/setup/processor-mocks.ts"],
    
    // Exclude tests that require special handling
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/implementations.integration.test.ts", // Integration tests separate
    ],
  },
});
```

```typescript
// tests/setup/processor-mocks.ts
// Global mocks for processor tests

// Mock framework logger to prevent console output during tests
vi.mock("../src/core/framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock state manager for processors that access it
vi.mock("../src/core/state-manager.js", () => ({
  stateManager: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockReturnValue(false),
  },
}));
```

### 5.5 CI/CD Pipeline Validation

```yaml
# .github/workflows/test.yml - Add processor test validation
jobs:
  processor-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run processor unit tests
        run: npx vitest run src/processors/implementations/implementations.test.ts --reporter=verbose
        
        # Fail if tests take longer than 60 seconds (indicates missing mocks)
      - name: Check test execution time
        run: |
          TIME=$(npx vitest run src/processors/implementations/implementations.test.ts 2>&1 | grep "Duration" | awk '{print $2}')
          if [ "$TIME" -gt 60 ]; then
            echo "Tests took ${TIME}s - possible missing mocks!"
            exit 1
          fi
```

---

## 6. Migration Path for Current Tests

### Phase 1: Fix Critical Issues (Priority: High)

1. Add mocks for `TestExecutionProcessor` (3 test methods)
2. Add mocks for `CodexComplianceProcessor` (2 test methods)
3. Add mocks for `VersionComplianceProcessor` (1 test method)

**Estimated Time:** 2-3 hours

### Phase 2: Improve Test Quality (Priority: Medium)

1. Add explicit priority value assertions
2. Add error path tests for all processors
3. Create shared test utilities for common mock patterns

**Estimated Time:** 4-6 hours

### Phase 3: Prevent Regression (Priority: Low)

1. Add ESLint rules for processor test patterns
2. Create test template generator
3. Add processor test documentation

**Estimated Time:** 2-3 hours

---

## Appendix: Processor Priority Reference

| Priority | Processor | Type | Notes |
|----------|-----------|------|-------|
| 10 | PreValidateProcessor | pre | First pre-processor |
| 20 | CodexComplianceProcessor | pre | Rule validation |
| 25 | VersionComplianceProcessor | pre | Version checks |
| 30 | ErrorBoundaryProcessor | pre | Error handling setup |
| 40 | TestExecutionProcessor | post | Test runner |
| 45 | RegressionTestingProcessor | post | Regression suite |
| 50 | StateValidationProcessor | post | State consistency |
| 55 | RefactoringLoggingProcessor | post | Logging |
| 60 | TestAutoCreationProcessor | post | Test generation |
| 65 | CoverageAnalysisProcessor | post | Coverage reports |
| 70 | AgentsMdValidationProcessor | post | Agent docs validation |

---

**Document Version:** 1.1 (with Rules and Validators Specification)  
**Reviewed By:** Code Reviewer Agent  
**Session ID:** ses_2fe2366beffeqy154d0NTj3YLY

---

## 7. Rules and Validators Specification

This section defines concrete, actionable rules and validators to prevent the test quality issues identified in this review. All specifications include file paths, exact configurations, and implementation details.

### 7.1 Processor External Dependency Registry

Before defining rules, we must document the exact external dependencies each processor has:

| Processor | Module | Dependency Type | Risk Level |
|-----------|--------|-----------------|------------|
| `TestExecutionProcessor` | `child_process` | Dynamic import: `exec` | **CRITICAL** |
| `TestExecutionProcessor` | `fs` | Dynamic import: `existsSync`, `readFileSync` | HIGH |
| `TestExecutionProcessor` | `util` | Dynamic import: `promisify` | MEDIUM |
| `TestExecutionProcessor` | `language-detector.js` | Dynamic import: `detectProjectLanguage` | HIGH |
| `CodexComplianceProcessor` | `rule-enforcer.js` | Dynamic import: `RuleEnforcer` | **CRITICAL** |
| `VersionComplianceProcessor` | `version-compliance-processor.js` | Dynamic import: `VersionComplianceProcessor` | **CRITICAL** |
| `RefactoringLoggingProcessor` | `fs` | Static import: `existsSync`, `writeFileSync`, `appendFileSync` | HIGH |
| `TestAutoCreationProcessor` | `test-auto-creation-processor.js` | Dynamic import: `testAutoCreationProcessor` | MEDIUM |
| `AgentsMdValidationProcessor` | `agents-md-validation-processor.js` | Dynamic import: `AgentsMdValidationProcessor` | MEDIUM |
| `StateValidationProcessor` | `globalThis.strRayStateManager` | Global access | LOW |
| `ErrorBoundaryProcessor` | None | No external dependencies | NONE |
| `PreValidateProcessor` | None | No external dependencies | NONE |
| `CoverageAnalysisProcessor` | None | Placeholder only | NONE |
| `RegressionTestingProcessor` | None | Placeholder only | NONE |

---

### 7.2 ESLint Rules for Processor Tests

#### 7.2.1 New ESLint Configuration File

Create a dedicated ESLint config for processor tests that extends the existing rules:

```javascript
// tests/config/processor-test-rules.js
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
    "vitest/globals": true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "vitest"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vitest/recommended",
  ],
  rules: {
    // === PROCESSOR-SPECIFIC RULES ===

    /**
     * Rule: no-unmocked-processor-execution
     * 
     * Prevents direct execution of processors that have external dependencies
     * without proper mocking. This is a custom rule that should be implemented.
     * 
     * Configuration:
     * - error: Fails the build if unmocked processor is executed
     * - processors: List of processors requiring mocks
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

    // === VITEST PLUGIN RULES ===

    "vitest/consistent-test-it": ["error", { fn: "test" }],
    "vitest/no-test-prefixes": "error",
    "vitest/valid-expect": "error",
    "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "expect.*"] }],
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
```

#### 7.2.2 Custom ESLint Rule: no-unmocked-processor-execution

Create a custom ESLint rule to detect unmocked processor execution:

```typescript
// tests/config/rules/no-unmocked-processor-execution.ts
/**
 * Custom ESLint Rule: no-unmocked-processor-execution
 * 
 * Detects when processor tests execute processors with external dependencies
 * without proper mocking in place.
 * 
 * @example
 * // BAD - executes TestExecutionProcessor without mocking child_process
 * const processor = new TestExecutionProcessor();
 * await processor.execute(context);
 * 
 * // GOOD - mocks child_process before execution
 * vi.mock("child_process", () => ({
 *   exec: vi.fn().mockImplementation((cmd, opts, cb) => cb(null, { stdout: "", stderr: "" }))
 * }));
 * const processor = new TestExecutionProcessor();
 * await processor.execute(context);
 */

import { Rule } from "eslint";
import { Node, CallExpression, NewExpression } from "@typescript-eslint/parser/dist/types";

const PROCESSORS_REQUIRING_MOCKS = new Map([
  ["TestExecutionProcessor", ["child_process", "fs", "../../utils/language-detector"]],
  ["CodexComplianceProcessor", ["../../enforcement/rule-enforcer"]],
  ["VersionComplianceProcessor", ["../../processors/version-compliance-processor"]],
  ["RefactoringLoggingProcessor", ["fs"]],
  ["TestAutoCreationProcessor", ["../../processors/test-auto-creation-processor"]],
  ["AgentsMdValidationProcessor", ["../../processors/agents-md-validation-processor"]],
]);

export const noUnmockedProcessorExecution: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow execution of processors without mocking their external dependencies",
      category: "Processor Tests",
      recommended: "error",
    },
    fixable: null,
    schema: [
      {
        type: "object",
        properties: {
          allowedProcessors: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    let hasMockForChildProcess = false;
    let hasMockForFS = false;
    let hasMockForRuleEnforcer = false;
    let hasMockForVersionCompliance = false;
    let hasMockForLanguageDetector = false;

    // Track mocks in the file
    const trackMockCall = (node: CallExpression) => {
      const callee = node.callee;
      if (callee.type !== "Identifier") return;

      const arg = node.arguments[0];
      if (!arg || arg.type !== "Literal") return;

      const mockPath = arg.value as string;

      if (mockPath === "child_process") hasMockForChildProcess = true;
      if (mockPath === "fs") hasMockForFS = true;
      if (mockPath.includes("rule-enforcer")) hasMockForRuleEnforcer = true;
      if (mockPath.includes("version-compliance-processor")) hasMockForVersionCompliance = true;
      if (mockPath.includes("language-detector")) hasMockForLanguageDetector = true;
    };

    // Check if processor execute is called without required mocks
    const checkProcessorExecute = (node: CallExpression, processorName: string) => {
      const requiredMocks = PROCESSORS_REQUIRING_MOCKS.get(processorName);
      if (!requiredMocks) return;

      const missingMocks: string[] = [];

      for (const mock of requiredMocks) {
        const hasMock =
          (mock === "child_process" && hasMockForChildProcess) ||
          (mock === "fs" && hasMockForFS) ||
          (mock === "../../enforcement/rule-enforcer" && hasMockForRuleEnforcer) ||
          (mock === "../../processors/version-compliance-processor" && hasMockForVersionCompliance) ||
          (mock === "../../utils/language-detector" && hasMockForLanguageDetector);

        if (!hasMock) {
          missingMocks.push(mock);
        }
      }

      if (missingMocks.length > 0) {
        context.report({
          node,
          message: `"${processorName}" requires mocking: ${missingMocks.join(", ")}`,
          suggest: [
            {
              desc: `Add mocks for ${missingMocks.join(", ")}`,
              fix(fixer) {
                // Provide template for required mocks
                const mockTemplates = missingMocks.map((m) => {
                  if (m === "child_process") {
                    return `vi.mock("child_process", () => ({\n  exec: vi.fn(),\n}));`;
                  }
                  if (m === "fs") {
                    return `vi.mock("fs", () => ({\n  existsSync: vi.fn(),\n  readFileSync: vi.fn(),\n}));`;
                  }
                  return `vi.mock("${m}", () => ({ /* mock here */ }));`;
                });
                return fixer.insertTextBeforeRange(
                  [0, 0],
                  `// Required mocks\n${mockTemplates.join("\n")}\n\n`,
                );
              },
            },
          ],
        });
      }
    };

    return {
      CallExpression: (node) => {
        // Track vi.mock calls
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "vi.mock") {
          trackMockCall(node);
        }

        // Check for processor.execute() calls
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "execute"
        ) {
          const object = callee.object;
          if (object.type === "NewExpression") {
            const processorName = sourceCode.getText(object.callee);
            if (PROCESSORS_REQUIRING_MOCKS.has(processorName)) {
              checkProcessorExecute(node, processorName);
            }
          }
        }
      },

      // Reset tracking at start of each test file's test case
      "CallExpression[callee.name='describe']": () => {
        hasMockForChildProcess = false;
        hasMockForFS = false;
        hasMockForRuleEnforcer = false;
        hasMockForVersionCompliance = false;
        hasMockForLanguageDetector = false;
      },
    };
  },
};
```

---

### 7.3 Vitest Configuration for Processor Tests

#### 7.3.1 Updated Vitest Configuration

```typescript
// tests/config/vitest.config.ts
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [
      "./src/__tests__/setup.ts",
      "./tests/setup/global-processor-mocks.ts",  // NEW: Global mocks for processors
    ],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      "coverage",
      "src/__tests__/plugins/marketplace-service.test.ts",
      "src/__tests__/performance/enterprise-performance-tests.ts",
      // Integration tests should be separate
      "src/processors/**/*.integration.test.ts",
    ],
    silent: true,
    reporters: process.env.CI ? ["verbose"] : ["default"],
    
    // === PROCESSOR-SPECIFIC CONFIG ===
    
    // Stricter timeout for processor tests
    testTimeout: 15000,  // 15s - tests should be fast with mocks
    hookTimeout: 10000,  // 10s for before/after hooks
    
    // Bail configuration - fail fast in CI
    bail: process.env.CI ? 2 : 0,  // Stop after 2 failures in CI
    
    // Pool configuration
    pool: "forks",  // Better isolation between tests
    
    // Retry configuration
    retry: process.env.CI ? 2 : 1,  // Retry once locally, twice in CI
    
    // Thread limits
    maxThreads: process.env.CI ? 2 : 4,
    minThreads: 1,
    
    // Coverage configuration
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
        "tests/setup/",
        "scripts/",
      ],
      thresholds: {
        // Specific thresholds for processor code
        "src/processors/implementations/**": {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90,
        },
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },

    // Unhandled rejection handling
    unhandledErrors: "strict",  // Fail on unhandled rejections
    
    // Environment variables
    env: {
      STRRAY_TEST_MODE: "true",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tests": resolve(__dirname, "./tests"),
    },
  },
});
```

#### 7.3.2 Global Processor Mock Setup

Create a global mock setup file that provides default mocks for all processor tests:

```typescript
// tests/setup/global-processor-mocks.ts
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
      // Default: fail fast - tests should override this
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
```

---

### 7.4 Custom Validators

#### 7.4.1 Processor Mock Coverage Validator

Create a custom validator script that runs before tests to ensure all processors have proper mocks:

```typescript
// tests/validators/processor-mock-validator.ts
/**
 * Processor Mock Coverage Validator
 * 
 * Validates that processor tests have proper mocking for all external dependencies.
 * Run this before the test suite to catch missing mocks early.
 * 
 * Usage:
 *   npx ts-node tests/validators/processor-mock-validator.ts
 * 
 * Exit codes:
 *   0 - All processors have proper mocks
 *   1 - Missing mocks detected
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface MockRequirement {
  processor: string;
  file: string;
  dependencies: string[];
  hasChildProcess: boolean;
  hasFS: boolean;
  hasOtherMocks: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Processors that require mocks
const PROCESSORS_REQUIRING_MOCKS: Record<string, string[]> = {
  "TestExecutionProcessor": ["child_process", "fs", "language-detector"],
  "CodexComplianceProcessor": ["rule-enforcer"],
  "VersionComplianceProcessor": ["version-compliance-processor"],
  "RefactoringLoggingProcessor": ["fs"],
  "TestAutoCreationProcessor": ["test-auto-creation-processor"],
  "AgentsMdValidationProcessor": ["agents-md-validation-processor"],
};

function analyzeTestFile(filePath: string): MockRequirement | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const processorName = Object.keys(PROCESSORS_REQUIRING_MOCKS).find(
    (name) => content.includes(`new ${name}()`),
  );

  if (!processorName) return null;

  const hasChildProcess = /vi\.mock\(["']child_process["']/.test(content);
  const hasFS = /vi\.mock\(["']fs["']/.test(content);
  const hasOtherMocks = /vi\.mock\(/.test(content);

  return {
    processor: processorName,
    file: filePath,
    dependencies: PROCESSORS_REQUIRING_MOCKS[processorName],
    hasChildProcess,
    hasFS,
    hasOtherMocks,
  };
}

function validateMockRequirements(testDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find all processor test files
  const testFiles = execSync(
    `find "${testDir}" -name "*.test.ts" -path "*/processors/*"`,
    { encoding: "utf-8" },
  )
    .split("\n")
    .filter((f) => f.length > 0);

  for (const file of testFiles) {
    const analysis = analyzeTestFile(file);

    if (!analysis) continue;

    // Check for missing mocks
    const missingMocks: string[] = [];

    if (analysis.dependencies.includes("child_process") && !analysis.hasChildProcess) {
      missingMocks.push("child_process");
    }
    if (analysis.dependencies.includes("fs") && !analysis.hasFS) {
      missingMocks.push("fs");
    }

    if (missingMocks.length > 0) {
      errors.push(
        `${path.relative(process.cwd(), file)}: Missing mocks for ${analysis.processor}: ${missingMocks.join(", ")}`,
      );
    }

    // Warnings for incomplete mock coverage
    if (analysis.dependencies.length > 0 && !analysis.hasOtherMocks) {
      warnings.push(
        `${path.relative(process.cwd(), file)}: Processor tests should use vi.mock() for external dependencies`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Main execution
const testDir = path.resolve(__dirname, "../../src/processors");
const result = validateMockRequirements(testDir);

console.log("\n=== Processor Mock Coverage Validation ===\n");

if (result.warnings.length > 0) {
  console.log("Warnings:");
  result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log();
}

if (!result.valid) {
  console.log("Errors:");
  result.errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log("\n❌ Validation failed. Fix missing mocks before running tests.\n");
  process.exit(1);
} else {
  console.log("✅ All processor tests have proper mocks.\n");
  process.exit(0);
}
```

#### 7.4.2 Test Execution Time Validator

Create a validator that checks test execution times to detect missing mocks:

```typescript
// tests/validators/test-timing-validator.ts
/**
 * Test Timing Validator
 * 
 * Analyzes test execution times to detect potential missing mocks.
 * Tests that take too long likely have unmocked external dependencies.
 * 
 * Usage:
 *   npx vitest run --reporter=json | npx ts-node tests/validators/test-timing-validator.ts
 */

import * as fs from "fs";

interface TestResult {
  name: string;
  duration: number;
  passed: boolean;
}

interface TimingAnalysis {
  testFile: string;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  slowTests: TestResult[];
}

const MAX_ACCEPTABLE_DURATION_MS = 5000; // 5 seconds per test
const SLOW_TEST_THRESHOLD_MS = 2000; // 2 seconds = "slow"

function parseVitestJsonOutput(jsonPath: string): TestResult[] {
  const content = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(content);
  
  return data.testResults?.flatMap((file: any) =>
    file.assertions?.map((a: any) => ({
      name: a.title.join(" > "),
      duration: a.duration || 0,
      passed: a.status === "passed",
    })) || [],
  ) || [];
}

function analyzeTimings(results: TestResult[]): TimingAnalysis[] {
  const byFile = new Map<string, TestResult[]>();
  
  for (const result of results) {
    const file = result.name.split(" > ")[0]; // First part is usually the file
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file)!.push(result);
  }

  return Array.from(byFile.entries()).map(([file, tests]) => {
    const durations = tests.map((t) => t.duration);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    
    return {
      testFile: file,
      totalDuration,
      avgDuration: totalDuration / tests.length,
      maxDuration: Math.max(...durations),
      slowTests: tests.filter((t) => t.duration > SLOW_TEST_THRESHOLD_MS),
    };
  });
}

function validateTimings(analyses: TimingAnalysis[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const analysis of analyses) {
    if (analysis.maxDuration > MAX_ACCEPTABLE_DURATION_MS) {
      issues.push(
        `${analysis.testFile}: Maximum test duration (${analysis.maxDuration}ms) exceeds threshold (${MAX_ACCEPTABLE_DURATION_MS}ms)`,
      );
    }

    if (analysis.slowTests.length > 0) {
      issues.push(
        `${analysis.testFile}: ${analysis.slowTests.length} slow tests detected (>{SLOW_TEST_THRESHOLD_MS}ms): ${analysis.slowTests.map((t) => t.name).join(", ")}`,
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Main execution
const jsonPath = process.argv[2] || "./vitest-report.json";

try {
  const results = parseVitestJsonOutput(jsonPath);
  const analyses = analyzeTimings(results);
  const validation = validateTimings(analyses);

  console.log("\n=== Test Timing Analysis ===\n");
  
  for (const analysis of analyses) {
    const status = analysis.maxDuration > MAX_ACCEPTABLE_DURATION_MS ? "✗" : "✓";
    console.log(`${status} ${analysis.testFile}`);
    console.log(`  Total: ${analysis.totalDuration}ms | Avg: ${analysis.avgDuration.toFixed(0)}ms | Max: ${analysis.maxDuration}ms`);
    console.log(`  Tests: ${analysis.slowTests.length} slow (>${SLOW_TEST_THRESHOLD_MS}ms)`);
    console.log();
  }

  if (!validation.valid) {
    console.log("Issues detected:");
    validation.issues.forEach((i) => console.log(`  ✗ ${i}`));
    console.log("\n💡 Tip: Slow tests may indicate missing mocks for external dependencies.\n");
    process.exit(1);
  } else {
    console.log("✅ All tests have acceptable execution times.\n");
    process.exit(0);
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") {
    console.log(`Error: Report file not found: ${jsonPath}`);
    console.log("Run tests with JSON reporter: npx vitest run --reporter=json");
    process.exit(1);
  }
  throw error;
}
```

---

### 7.5 CI/CD Pipeline Additions

#### 7.5.1 GitHub Actions Workflow

Add processor test validation to the CI pipeline:

```yaml
# .github/workflows/processor-tests.yml
name: Processor Tests

on:
  push:
    paths:
      - "src/processors/**"
      - "tests/**"
  pull_request:
    paths:
      - "src/processors/**"
      - "tests/**"

jobs:
  validate-processor-mocks:
    name: Validate Processor Mock Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run mock coverage validator
        run: npx ts-node tests/validators/processor-mock-validator.ts

  processor-tests:
    name: Processor Tests
    runs-on: ubuntu-latest
    needs: validate-processor-mocks
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run processor tests
        run: |
          npx vitest run \
            src/processors/implementations/implementations.test.ts \
            --reporter=verbose \
            --coverage \
            --outputFile=./vitest-report.json

      - name: Analyze test timing
        run: npx ts-node tests/validators/test-timing-validator.ts ./vitest-report.json
        continue-on-error: true

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: processor-coverage
          path: coverage/

      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: processor-test-report
          path: vitest-report.json

      - name: Check test execution time
        run: |
          # Get total test time from report
          TIME=$(cat vitest-report.json | jq '[.testResults[].assertions[]?.duration // 0] | add')
          echo "Total test execution time: ${TIME}ms"
          
          if (( $(echo "$TIME > 60000" | bc -l) )); then
            echo "Warning: Tests took longer than 60 seconds"
            echo "This may indicate missing mocks or performance issues"
          fi

  lint-processor-tests:
    name: Lint Processor Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint on processor tests
        run: npx eslint src/processors/**/*.test.ts --config tests/config/processor-test-rules.js
```

#### 7.5.2 Pre-commit Hook

Add a pre-commit hook to validate processor tests before commits:

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Install: cp .git/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "Running processor test pre-commit checks..."

# Check if any processor files were changed
PROCESSOR_CHANGES=$(git diff --cached --name-only | grep -E "src/processors/.*\.test\.ts$")

if [ -z "$PROCESSOR_CHANGES" ]; then
  echo "No processor test changes detected. Skipping..."
  exit 0
fi

echo "Processor test files staged for commit:"
echo "$PROCESSOR_CHANGES"

# Run mock validator
echo ""
echo "Running mock coverage validator..."
npx ts-node tests/validators/processor-mock-validator.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Mock coverage validation failed. Fix missing mocks before committing."
  exit 1
fi

# Quick syntax check (don't run full tests)
echo ""
echo "Running quick syntax check..."
for file in $PROCESSOR_CHANGES; do
  npx tsc --noEmit "$file" 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors in $file"
    exit 1
  fi
done

echo ""
echo "✅ Processor test pre-commit checks passed."

# Optionally run fast tests (comment out if too slow)
# echo ""
# echo "Running fast processor tests..."
# npx vitest run src/processors/implementations/implementations.test.ts --reporter=dot --passWithNoTests
# if [ $? -ne 0 ]; then
#   echo ""
#   echo "❌ Processor tests failed. Fix failures before committing."
#   exit 1
# fi

exit 0
```

---

### 7.6 Implementation Checklist

Use this checklist when creating or modifying processor tests:

```markdown
## Processor Test Checklist

- [ ] **Import vi from vitest**
  ```typescript
  import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
  ```

- [ ] **Call vi.resetModules() in beforeEach for dynamic imports**
  ```typescript
  beforeEach(() => {
    vi.resetModules();
  });
  ```

- [ ] **Add vi.clearAllMocks() or vi.restoreAllMocks() in afterEach**
  ```typescript
  afterEach(() => {
    vi.clearAllMocks();
  });
  ```

- [ ] **Mock child_process before executing TestExecutionProcessor**
  ```typescript
  vi.mock("child_process", () => ({
    exec: vi.fn().mockImplementation((cmd, opts, cb) => {
      cb(null, { stdout: "Tests: 2 passed", stderr: "" });
    }),
  }));
  ```

- [ ] **Mock fs before executing processors that access filesystem**
  ```typescript
  vi.mock("fs", () => ({
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue(""),
  }));
  ```

- [ ] **Mock language-detector for TestExecutionProcessor**
  ```typescript
  vi.mock("../../utils/language-detector.js", () => ({
    detectProjectLanguage: vi.fn().mockReturnValue({
      language: "TypeScript",
      testFramework: "Vitest",
      testCommand: "vitest run",
    }),
  }));
  ```

- [ ] **Mock RuleEnforcer for CodexComplianceProcessor**
  ```typescript
  vi.mock("../../enforcement/rule-enforcer.js", () => ({
    RuleEnforcer: vi.fn().mockImplementation(() => ({
      validateOperation: vi.fn().mockResolvedValue({
        passed: true,
        errors: [],
        warnings: [],
        results: [],
      }),
    })),
  }));
  ```

- [ ] **Mock external processors for VersionComplianceProcessor etc.**
  ```typescript
  vi.mock("../version-compliance-processor.js", () => ({
    VersionComplianceProcessor: vi.fn().mockImplementation(() => ({
      validateVersionCompliance: vi.fn().mockResolvedValue({
        compliant: true,
        errors: [],
        warnings: [],
      }),
    })),
  }));
  ```

- [ ] **Use explicit priority values, not loose comparisons**
  ```typescript
  // Good
  expect(processor.priority).toBe(25);
  
  // Bad
  expect(processor.priority).toBeGreaterThan(0);
  ```

- [ ] **Test result shape, not just success/failure**
  ```typescript
  expect(result).toHaveProperty("processorName");
  expect(result).toHaveProperty("duration");
  expect(result).toHaveProperty("data");
  ```

- [ ] **Add both success and failure test cases**
  ```typescript
  it("should succeed when validation passes", async () => { ... });
  it("should fail when validation fails", async () => { ... });
  ```
```

---

### 7.7 Summary: Rules Application Matrix

| Rule/Validator | Type | When Applied | Enforces |
|---------------|------|-------------|----------|
| `processor-execute-in-test` | ESLint | On save / pre-commit | Mocks exist before processor execution |
| `no-direct-child-process-exec` | ESLint | On save / pre-commit | No raw child_process in tests |
| `no-real-fs-in-processor-test` | ESLint | On save / pre-commit | Use mocked fs |
| `mock-cleanup-required` | ESLint | On save / pre-commit | Cleanup after tests |
| `processor-mock-validator.ts` | Pre-test | Before test suite | All mocks present |
| `test-timing-validator.ts` | Post-test | After test suite | No slow tests |
| `global-processor-mocks.ts` | Vitest setup | Before each test | Safe default mocks |
| `processor-tests.yml` | CI/CD | On PR/push | Full validation pipeline |

---

**Specification Version:** 1.0  
**Last Updated:** 2026-03-18  
**Session ID:** ses_2fe2366beffeqy154d0NTj3YLY
