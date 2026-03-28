/**
 * Code Quality Validators Tests
 *
 * Unit tests for all code quality validators extracted during Phase 3 refactoring.
 *
 * @module validators/__tests__/code-quality-validators
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  NoDuplicateCodeValidator,
  ContextAnalysisIntegrationValidator,
  MemoryOptimizationValidator,
  DocumentationRequiredValidator,
  NoOverEngineeringValidator,
  CleanDebugLogsValidator,
  ConsoleLogUsageValidator,
} from "../code-quality-validators.js";
import { RuleValidationContext } from "../../types.js";

describe("Code Quality Validators", () => {
  describe("NoDuplicateCodeValidator", () => {
    let validator: NoDuplicateCodeValidator;

    beforeEach(() => {
      validator = new NoDuplicateCodeValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("no-duplicate-code-validator");
      expect(validator.ruleId).toBe("no-duplicate-code");
      expect(validator.category).toBe("code-quality");
      expect(validator.severity).toBe("error");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to check for duplicates");
    });

    it("should pass for unique code", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: "function calculateSum(a: number, b: number) { return a + b; }",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No duplicate code detected");
    });

    it("should pass for alternative implementations", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function formatDate(date: Date) {
            return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Alternative date formatting implementation allowed");
    });
  });

  describe("ContextAnalysisIntegrationValidator", () => {
    let validator: ContextAnalysisIntegrationValidator;

    beforeEach(() => {
      validator = new ContextAnalysisIntegrationValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("context-analysis-integration-validator");
      expect(validator.ruleId).toBe("context-analysis-integration");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("warning");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for context integration");
    });

    it("should pass for non-write operations", async () => {
      const context: RuleValidationContext = {
        operation: "read",
        newCode: "some code",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass for components using useContext", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function MyComponent() {
            const value = useContext(MyContext);
            return <div>{value}</div>;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Component properly uses context patterns");
    });

    it("should fail for broken components without context", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function BrokenComponent() {
            return <div>Hello</div>;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("Component missing context integration");
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe("MemoryOptimizationValidator", () => {
    let validator: MemoryOptimizationValidator;

    beforeEach(() => {
      validator = new MemoryOptimizationValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("memory-optimization-validator");
      expect(validator.ruleId).toBe("memory-optimization");
      expect(validator.category).toBe("performance");
      expect(validator.severity).toBe("warning");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for memory optimization");
    });

    it("should pass for performance-critical code", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          // Performance-critical function
          function optimizedProcess() {
            // Implementation
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Performance-critical code allowed");
    });

    it("should fail for inefficient patterns", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function inefficient() {
            const arr = [];
            arr.push(1);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("Memory inefficient patterns detected");
    });
  });

  describe("DocumentationRequiredValidator", () => {
    let validator: DocumentationRequiredValidator;

    beforeEach(() => {
      validator = new DocumentationRequiredValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("documentation-required-validator");
      expect(validator.ruleId).toBe("documentation-required");
      expect(validator.category).toBe("code-quality");
      expect(validator.severity).toBe("error");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for documentation");
    });

    it("should fail for non-write operations", async () => {
      const context: RuleValidationContext = {
        operation: "read",
        newCode: "some code",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should fail for code without documentation violations", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          export function myFunction() {
            return 42;
          }
          
          export interface MyInterface {
            name: string;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Documentation violations");
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe("NoOverEngineeringValidator", () => {
    let validator: NoOverEngineeringValidator;

    beforeEach(() => {
      validator = new NoOverEngineeringValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("no-over-engineering-validator");
      expect(validator.ruleId).toBe("no-over-engineering");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for over-engineering");
    });

    it("should pass for test files", async () => {
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
      expect(result.message).toBe("Test files may have different structure requirements");
    });

    it("should pass for performance-critical code", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          // Critical path optimization
          function optimizedLoop() {
            // Implementation
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Performance-critical code allowed");
    });

    it("should fail for excessive abstractions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          abstract class Base {}
          interface IService {}
          class A extends Base implements IService {}
          class B extends Base implements IService {}
          class C extends Base implements IService {}
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Over-engineering detected");
    });

    it("should fail for excessive nesting", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function deeplyNested() {
            if (true) {
              if (true) {
                if (true) {
                  if (true) {
                    if (true) {
                      return 1;
                    }
                  }
                }
              }
            }
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Excessive nesting depth");
    });
  });

  describe("CleanDebugLogsValidator", () => {
    let validator: CleanDebugLogsValidator;

    beforeEach(() => {
      validator = new CleanDebugLogsValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("clean-debug-logs-validator");
      expect(validator.ruleId).toBe("clean-debug-logs");
      expect(validator.category).toBe("code-quality");
      expect(validator.severity).toBe("error");
    });

    it("should return placeholder result", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: "some code",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Clean debug logs validation placeholder");
    });
  });

  describe("ConsoleLogUsageValidator", () => {
    let validator: ConsoleLogUsageValidator;

    beforeEach(() => {
      validator = new ConsoleLogUsageValidator();
    });

    it("should have correct metadata", () => {
      expect(validator.id).toBe("console-log-usage-validator");
      expect(validator.ruleId).toBe("console-log-usage");
      expect(validator.category).toBe("code-quality");
      expect(validator.severity).toBe("error");
    });

    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: undefined,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for console.log usage");
    });

    it("should pass for valid code", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: "function validFunction() { return 42; }",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Console log usage follows proper guidelines");
    });
  });
});

/**
 * Integration tests to verify validators work with RuleEnforcer
 */
describe("Validator Integration", () => {
  it("should create validator instances successfully", () => {
    const noDuplicateCodeValidator = new NoDuplicateCodeValidator();
    const contextIntegrationValidator = new ContextAnalysisIntegrationValidator();
    const memoryValidator = new MemoryOptimizationValidator();
    const documentationValidator = new DocumentationRequiredValidator();
    const noOverEngineeringValidator = new NoOverEngineeringValidator();
    const cleanDebugLogsValidator = new CleanDebugLogsValidator();
    const consoleLogUsageValidator = new ConsoleLogUsageValidator();

    expect(noDuplicateCodeValidator).toBeDefined();
    expect(contextIntegrationValidator).toBeDefined();
    expect(memoryValidator).toBeDefined();
    expect(documentationValidator).toBeDefined();
    expect(noOverEngineeringValidator).toBeDefined();
    expect(cleanDebugLogsValidator).toBeDefined();
    expect(consoleLogUsageValidator).toBeDefined();
  });

  it("should execute validation methods", async () => {
    const validator = new NoDuplicateCodeValidator();
    const context: RuleValidationContext = {
      operation: "write",
      newCode: "function test() { return 1; }",
    };

    const result = await validator.validate(context);

    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("message");
    expect(typeof result.passed).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });
});
