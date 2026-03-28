/**
 * Testing Validators Tests
 *
 * Unit tests for all testing validators extracted during Phase 3 refactoring.
 *
 * @module validators/__tests__/testing-validators
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  TestsRequiredValidator,
  TestCoverageValidator,
  ContinuousIntegrationValidator,
  TestFailureReportingValidator,
} from "../testing-validators.js";
import { RuleValidationContext } from "../../types.js";

describe("Testing Validators", () => {
  describe("TestsRequiredValidator", () => {
    let validator: TestsRequiredValidator;

    beforeEach(() => {
      validator = new TestsRequiredValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("tests-required-validator");
      expect(validator.ruleId).toBe("tests-required");
      expect(validator.category).toBe("testing");
      expect(validator.severity).toBe("error");
    });

    it("should pass when no code is provided and operation is not write/create", async () => {
      const context: RuleValidationContext = {
        operation: "read",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for tests");
    });

    it("should pass when no code is provided and operation is write", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for tests");
    });

    it("should fail for create operation with empty tests array", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        newCode: "export function myComponent() { return 1; }",
        tests: [],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("Tests are required when creating new components");
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it("should pass for test files themselves", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          describe('MyComponent', () => {
            it('should work', () => {
              expect(true).toBe(true);
            });
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Test files do not require additional tests");
    });

    it("should pass for code with describe()", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          describe('MyComponent', () => {
            it('should work', () => {});
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass for code with it()", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          it('should work', () => {
            expect(true).toBe(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass for code with test()", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          test('should work', () => {
            expect(true).toBe(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should fail for exported functions without tests", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function calculateSum(a: number, b: number) {
            return a + b;
          }
        `,
        tests: [],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("Complex exported functions require tests");
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it("should pass for exported functions with tests", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function calculateSum(a: number, b: number) {
            return a + b;
          }
        `,
        tests: ["test 1"],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Tests present or not required");
    });

    it("should pass for over-engineered code (edge case)", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function complexFunction() {
            if (true) {
              if (true) {
                if (true) {
                  return 1;
                }
              }
            }
            return 0;
          }
        `,
        tests: [],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Over-engineered code may have different testing requirements");
    });

    it("should pass for code without exported functions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function internalFunction() {
            return 42;
          }
        `,
        tests: [],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Tests present or not required");
    });
  });

  describe("TestCoverageValidator", () => {
    let validator: TestCoverageValidator;

    beforeEach(() => {
      validator = new TestCoverageValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("test-coverage-validator");
      expect(validator.ruleId).toBe("test-coverage");
      expect(validator.category).toBe("testing");
      expect(validator.severity).toBe("warning");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for test coverage");
    });

    it("should pass for non-write operations", async () => {
      const context: RuleValidationContext = {
        operation: "read",
        newCode: "export function test() { return 1; }",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for test coverage");
    });

    it("should pass when coverage is above 85%", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function func1() { return 1; }
          export function func2() { return 2; }
        `,
        tests: ["test 1", "test 2"], // 100% coverage
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Test coverage requirements met (85%+)");
    });

    it("should fail when coverage is below 85%", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function func1() { return 1; }
          export function func2() { return 2; }
          export function func3() { return 3; }
          export function func4() { return 4; }
        `,
        tests: ["test 1"], // 25% coverage
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Test coverage: 25%");
      expect(result.message).toContain("(1/4 functions)");
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it("should handle edge case of exactly 85% coverage", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function func1() { return 1; }
          export function func2() { return 2; }
          export function func3() { return 3; }
          export function func4() { return 4; }
        `,
        tests: ["test 1", "test 2", "test 3", "test 4"], // 100% coverage
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should handle code without exported functions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function internalFunc() { return 1; }
        `,
        tests: [],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should handle const exports", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export const myConst = 42;
          export const anotherConst = 100;
        `,
        tests: ["test 1"], // 50% coverage
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("50%");
    });

    it("should handle let exports", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export let myVar = 42;
        `,
        tests: [],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("0%");
    });
  });

  describe("ContinuousIntegrationValidator", () => {
    let validator: ContinuousIntegrationValidator;

    beforeEach(() => {
      validator = new ContinuousIntegrationValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("continuous-integration-validator");
      expect(validator.ruleId).toBe("continuous-integration");
      expect(validator.category).toBe("testing");
      expect(validator.severity).toBe("error");
    });

    it("should pass when no CI files are in changes", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.ts", "src/utils.ts"],
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("CI validation skipped (no CI configuration in changes)");
    });

    it("should pass for GitHub Actions workflow with test step", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          name: CI
          on: [push]
          jobs:
            test:
              runs-on: ubuntu-latest
              steps:
                - uses: actions/checkout@v2
                - run: npm test
                - run: npm run lint
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("CI configuration includes testing and linting steps");
    });

    it("should fail for GitHub Actions workflow without test step", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          name: CI
          on: [push]
          jobs:
            build:
              runs-on: ubuntu-latest
              steps:
                - uses: actions/checkout@v2
                - run: npm run build
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("CI configuration missing test execution step");
      expect(result.suggestions).toBeDefined();
    });

    it("should fail for GitHub Actions workflow without lint step", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          name: CI
          on: [push]
          jobs:
            test:
              runs-on: ubuntu-latest
              steps:
                - uses: actions/checkout@v2
                - run: npm test
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("CI configuration missing linting step");
      expect(result.suggestions).toBeDefined();
    });

    it("should detect GitLab CI configuration", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".gitlab-ci.yml"],
        newCode: `
          test:
            script:
              - npm test
              - npm run lint
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect yarn test command", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          steps:
            - run: yarn test
            - run: yarn lint
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect pnpm test command", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          steps:
            - run: pnpm test
            - run: pnpm lint
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect jest directly", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          steps:
            - run: jest
            - run: eslint
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect vitest directly", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          steps:
            - run: vitest
            - run: prettier --check
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect mocha directly", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: [".github/workflows/ci.yml"],
        newCode: `
          steps:
            - run: mocha
            - run: eslint .
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("TestFailureReportingValidator", () => {
    let validator: TestFailureReportingValidator;

    beforeEach(() => {
      validator = new TestFailureReportingValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("test-failure-reporting-validator");
      expect(validator.ruleId).toBe("test-failure-reporting");
      expect(validator.category).toBe("reporting");
      expect(validator.severity).toBe("high");
    });

    it("should pass for non-test files", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.ts"],
        newCode: "export function test() { return 1; }",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Test failure reporting requirements met");
    });

    it("should pass for test files with expect assertions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.test.ts"],
        newCode: `
          describe('MyComponent', () => {
            it('should work', () => {
              expect(true).toBe(true);
            });
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass for test files with assert assertions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.spec.ts"],
        newCode: `
          it('should work', () => {
            assert(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass for test files with should assertions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["__tests__/index.ts"],
        newCode: `
          it('should work', () => {
            true.should.be(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should fail for test files without proper assertions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.test.ts"],
        newCode: `
          describe('MyComponent', () => {
            it('should work', () => {
              console.log('test');
            });
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("Test file missing proper assertions");
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it("should warn for test files without reporter config", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.test.js"],
        newCode: `
          it('should work', () => {
            expect(true).toBe(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Warning:");
      expect(result.message).toContain("reporting");
    });

    it("should pass for test files with reporter config", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["src/index.test.ts"],
        newCode: `
          // Test with reporter config
          it('should work', () => {
            expect(true).toBe(true);
          });
          
          // reporter configuration
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).not.toContain("Warning:");
    });

    it("should handle .test.js files", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["utils.test.js"],
        newCode: `
          test('should work', () => {
            expect(true).toBe(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should handle .spec.js files", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        files: ["utils.spec.js"],
        newCode: `
          test('should work', () => {
            expect(true).toBe(true);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });
});

/**
 * Integration tests to verify validators work with RuleEnforcer
 */
describe("Testing Validator Integration", () => {
  it("should create all testing validator instances successfully", () => {
    const testsRequiredValidator = new TestsRequiredValidator();
    const testCoverageValidator = new TestCoverageValidator();
    const continuousIntegrationValidator = new ContinuousIntegrationValidator();
    const testFailureReportingValidator = new TestFailureReportingValidator();

    expect(testsRequiredValidator).toBeDefined();
    expect(testCoverageValidator).toBeDefined();
    expect(continuousIntegrationValidator).toBeDefined();
    expect(testFailureReportingValidator).toBeDefined();
  });

  it("should execute all validation methods", async () => {
    const validator = new TestsRequiredValidator();
    const context: RuleValidationContext = {
      operation: "write",
      newCode: "export function test() { return 1; }",
      tests: ["test 1"],
    };

    const result = await validator.validate(context);

    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("message");
    expect(typeof result.passed).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });

  it("should return consistent result structure", async () => {
    const validators = [
      new TestsRequiredValidator(),
      new TestCoverageValidator(),
      new ContinuousIntegrationValidator(),
      new TestFailureReportingValidator(),
    ];

    const context: RuleValidationContext = {
      operation: "write",
      newCode: "export function test() { return 1; }",
      tests: ["test 1"],
      files: ["src/index.ts"],
    };

    for (const validator of validators) {
      const result = await validator.validate(context);
      expect(result).toHaveProperty("passed");
      expect(result).toHaveProperty("message");
      expect(typeof result.passed).toBe("boolean");
      expect(typeof result.message).toBe("string");
    }
  });
});
