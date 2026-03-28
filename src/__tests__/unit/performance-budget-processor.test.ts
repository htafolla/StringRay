/**
 * Tests for performance-budget-processor.ts
 *
 * Enforces codex term #28: Performance Budgets.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  PerformanceBudgetProcessor,
  runPerformanceBudgetCheck,
  DEFAULT_PERFORMANCE_BUDGET,
  type PerformanceBudgetConfig,
  type PerformanceViolation,
} from "../../processors/performance-budget-processor.js";

describe("performance-budget-processor", () => {
  let processor: PerformanceBudgetProcessor;

  beforeEach(() => {
    processor = new PerformanceBudgetProcessor();
  });

  // -----------------------------------------------------------------------
  // Small files pass
  // -----------------------------------------------------------------------

  describe("clean code passes", () => {
    it("should pass for small files with simple functions", () => {
      const content = `
function hello(name: string) {
  return "Hello, " + name;
}

function add(a: number, b: number) {
  return a + b;
}
`;
      const violations = processor.checkFile("test.ts", content.trim());
      expect(violations).toHaveLength(0);
    });

    it("should return no violations from checkFunctionComplexity for clean code", () => {
      const content = `function simple() {\n  return 42;\n}`;
      const violations = processor.checkFunctionComplexity(content);
      expect(violations).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Oversized files
  // -----------------------------------------------------------------------

  describe("file size detection", () => {
    it("should detect files that exceed the size budget", () => {
      // Generate content larger than default 10KB
      const bigLine = "x".repeat(200);
      const lines: string[] = [];
      for (let i = 0; i < 60; i++) {
        lines.push(bigLine);
      }
      const content = lines.join("\n");

      const violations = processor.checkFile("big.ts", content);
      const sizeViolation = violations.find((v) => v.type === "fileTooLarge");
      expect(sizeViolation).toBeDefined();
      expect(sizeViolation!.type).toBe("fileTooLarge");
      expect(sizeViolation!.actual).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.maxFileSizeBytes,
      );
    });
  });

  // -----------------------------------------------------------------------
  // Long functions
  // -----------------------------------------------------------------------

  describe("function length detection", () => {
    it("should detect functions longer than the budget", () => {
      // Create a function with >50 lines
      const lines: string[] = ["function longFn() {"];
      for (let i = 0; i < 55; i++) {
        lines.push(`  const x${i} = ${i};`);
      }
      lines.push("}");

      const content = lines.join("\n");
      const violations = processor.checkFunctionComplexity(content);
      const fnViolation = violations.find((v) => v.type === "functionTooLong");
      expect(fnViolation).toBeDefined();
      expect(fnViolation!.actual).toBeGreaterThan(
        DEFAULT_PERFORMANCE_BUDGET.maxFunctionLines,
      );
    });

    it("should not flag functions within the budget", () => {
      const lines: string[] = ["function shortFn() {"];
      for (let i = 0; i < 10; i++) {
        lines.push(`  const x${i} = ${i};`);
      }
      lines.push("}");

      const content = lines.join("\n");
      const violations = processor.checkFunctionComplexity(content);
      const fnViolation = violations.find((v) => v.type === "functionTooLong");
      expect(fnViolation).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Deep nesting
  // -----------------------------------------------------------------------

  describe("nesting depth detection", () => {
    it("should detect deeply nested code", () => {
      const content = `function deeplyNested() {
  if (true) {
    for (let i = 0; i < 10; i++) {
      if (true) {
        while (true) {
          try {
            if (true) {
              // level 6
            }
          } catch (e) {}
        }
      }
    }
  }
}`;

      const violations = processor.checkFunctionComplexity(content);
      const nestViolation = violations.find((v) => v.type === "nestingTooDeep");
      expect(nestViolation).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Custom budgets
  // -----------------------------------------------------------------------

  describe("custom budgets", () => {
    it("should respect custom maxFunctionLines", () => {
      const strict = new PerformanceBudgetProcessor({
        maxFunctionLines: 5,
      });

      const lines: string[] = ["function medium() {"];
      for (let i = 0; i < 10; i++) {
        lines.push(`  const x${i} = ${i};`);
      }
      lines.push("}");

      const content = lines.join("\n");
      const violations = strict.checkFunctionComplexity(content);
      const fnViolation = violations.find((v) => v.type === "functionTooLong");
      expect(fnViolation).toBeDefined();

      // Default processor should NOT flag the same code
      const defaultViolations = processor.checkFunctionComplexity(content);
      const defaultFnViolation = defaultViolations.find(
        (v) => v.type === "functionTooLong",
      );
      expect(defaultFnViolation).toBeUndefined();
    });

    it("should respect custom maxFileSizeBytes", () => {
      const strict = new PerformanceBudgetProcessor({
        maxFileSizeBytes: 100,
      });

      const content = "a".repeat(200);
      const violations = strict.checkFile("tiny.ts", content);
      const sizeViolation = violations.find((v) => v.type === "fileTooLarge");
      expect(sizeViolation).toBeDefined();
    });

    it("should respect custom maxParameters", () => {
      const strict = new PerformanceBudgetProcessor({
        maxParameters: 2,
      });

      const content = `function tooMany(a: string, b: number, c: boolean) {
  return { a, b, c };
}`;

      const violations = strict.checkFunctionComplexity(content);
      const paramViolation = violations.find(
        (v) => v.type === "tooManyParameters",
      );
      expect(paramViolation).toBeDefined();
      expect(paramViolation!.actual).toBe(3);
      expect(paramViolation!.limit).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Violation structure
  // -----------------------------------------------------------------------

  describe("violation structure", () => {
    it("should include required fields on violations", () => {
      const content = `function bad(a,b,c,d,e,f) {\n`;
      for (let i = 0; i < 60; i++) {
        content + `  const x${i} = ${i};\n`;
      }

      const violations = processor.checkFile("test.ts", content);
      for (const v of violations) {
        expect(v).toHaveProperty("type");
        expect(v).toHaveProperty("filePath");
        expect(v).toHaveProperty("message");
        expect(v).toHaveProperty("actual");
        expect(v).toHaveProperty("limit");
        expect(typeof v.actual).toBe("number");
        expect(typeof v.limit).toBe("number");
      }
    });
  });

  // -----------------------------------------------------------------------
  // runPerformanceBudgetCheck (standalone runner)
  // -----------------------------------------------------------------------

  describe("runPerformanceBudgetCheck", () => {
    it("should return success for clean code", async () => {
      const result = await runPerformanceBudgetCheck({
        operation: "write",
        data: "function ok() { return 1; }",
        filesChanged: ["ok.ts"],
      });
      expect(result.success).toBe(true);
      expect(result.processorName).toBe("performance-budget-processor");
    });

    it("should return failure for oversized content", async () => {
      const bigContent = "x".repeat(15_000);
      const result = await runPerformanceBudgetCheck({
        operation: "write",
        data: bigContent,
        filesChanged: ["big.ts"],
      });
      expect(result.success).toBe(false);
      expect(result.result).toBeDefined();
    });
  });
});
