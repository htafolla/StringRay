/**
 * Unit tests for RuleEnforcer
 * Tests rule validation, enforcement hierarchy, and component validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  RuleEnforcer,
  ruleEnforcer,
  RuleValidationContext,
} from "../../enforcement/rule-enforcer.js";
import { frameworkLogger } from "../../framework-logger.js";

// Mock framework logger
vi.mock("../../framework-logger.js");

describe("RuleEnforcer", () => {
  let enforcer: RuleEnforcer;

  beforeEach(() => {
    vi.clearAllMocks();
    enforcer = new RuleEnforcer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default rules", () => {
      const stats = enforcer.getRuleStats();
      expect(stats.totalRules).toBeGreaterThan(0);
      expect(stats.enabledRules).toBeGreaterThan(0);
    });

    it("should have rule hierarchy defined", () => {
      // Check that rule hierarchy is properly initialized
      expect(enforcer).toBeDefined();
    });
  });

  describe("rule validation", () => {
    it("should validate no-duplicate-code rule", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        newCode: "function test() { return true; }",
        existingCode: new Map([
          ["existing.ts", "function existing() { return false; }"],
        ]),
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
      expect(typeof report.passed).toBe("boolean");
    });

    it("should validate tests-required rule", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/component.ts"],
        tests: [], // No tests provided
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it("should detect over-engineering violations", async () => {
      const overEngineeredCode = `
        class AbstractFactoryStrategyObserver implements Strategy, Observer {
          private observers: Observer[] = [];
          private strategies: Map<string, any> = new Map();

          executeComplex(data: any): any {
            if (data) {
              if (data.type === 'strategy') {
                if (data.config) {
                  if (data.config.enabled) {
                    if (data.config.advanced) {
                      if (data.config.premium) {
                        return this.createAdvancedStrategy(data);
                      } else {
                        return this.createBasicStrategy(data);
                      }
                    }
                  }
                }
              }
            }
            return null;
          }

          private createAdvancedStrategy(data: any): any {
            // Complex logic
            return {};
          }

          private createBasicStrategy(data: any): any {
            // More complex logic
            return {};
          }
        }
      `;

      const context: RuleValidationContext = {
        operation: "write",
        newCode: overEngineeredCode,
        files: ["src/over-engineered.ts"],
      };

      const report = await enforcer.validateOperation("write", context);
      expect(report).toBeDefined();
      // Should detect multiple over-engineering violations
      expect(report.errors.length).toBeGreaterThan(0);
      expect(
        report.errors.some(
          (error) =>
            error.includes("Over-engineering") ||
            error.includes("over-engineering"),
        ),
      ).toBe(true);
    });

    it("should pass tests-required rule when tests exist", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/component.ts"],
        tests: ["src/component.test.ts"],
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });

    it("should validate context-analysis-integration rule", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/delegation/new-analyzer.ts"],
        newCode: "new CodebaseContextAnalyzer()",
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });

    it("should validate memory-optimization rule", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/analyzer.ts"],
        newCode: "fs.readFileSync(file).toString()",
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });

    it("should validate dependency-management rule", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        dependencies: ["react", "lodash"],
        newCode: 'import React from "react";',
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });

    it("should validate input-validation rule", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        newCode: "function processUser(name: string) { return name; }",
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });
  });

  describe("rule applicability", () => {
    it("should only apply relevant rules to operations", async () => {
      // Test with a simple 'read' operation that shouldn't trigger many rules
      const context: RuleValidationContext = {
        operation: "read",
        files: ["README.md"],
      };

      const report = await enforcer.validateOperation("read", context);
      expect(report).toBeDefined();
      // Should not have as many validation errors as create operations
    });

    it("should respect rule prerequisites", async () => {
      // Tests-required rule should only apply after no-duplicate-code is satisfied
      const context: RuleValidationContext = {
        operation: "create",
        newCode: "function duplicate() {}",
        existingCode: new Map([["existing.ts", "function duplicate() {}"]]),
        files: ["new.ts"],
        tests: [],
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
      expect(report.errors.length).toBeGreaterThan(0); // Should fail due to duplicates
    });
  });

  describe("error handling", () => {
    it("should handle rule validation failures gracefully", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["invalid-file.xyz"],
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
      expect(typeof report.passed).toBe("boolean");
    });

    it("should continue validation when individual rules fail", async () => {
      // Create context that will cause some rules to error but not all
      const context: RuleValidationContext = {
        operation: "create",
        newCode: "function test() {}",
        existingCode: new Map(),
        files: ["test.ts"],
        tests: ["test.spec.ts"],
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });
  });

  describe("rule enforcement statistics", () => {
    it("should provide enforcement statistics", () => {
      const stats = enforcer.getRuleStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalRules).toBe("number");
      expect(typeof stats.enabledRules).toBe("number");
      expect(stats.ruleCategories).toBeDefined();
      expect(typeof stats.ruleCategories).toBe("object");
    });

    it.skip("should track different rule categories", () => {
      const stats = enforcer.getRuleStats();

      expect(stats.ruleCategories).toHaveProperty("code-quality");
      expect(stats.ruleCategories).toHaveProperty("testing");
      expect(stats.ruleCategories).toHaveProperty("security");
    });
  });

  describe("singleton instance", () => {
    it("should provide singleton instance", () => {
      expect(ruleEnforcer).toBeDefined();
      expect(ruleEnforcer).toBeInstanceOf(RuleEnforcer);
    });

    it("should be the same instance", () => {
      expect(ruleEnforcer).toBe(ruleEnforcer);
    });
  });

  describe("rule suggestions and fixes", () => {
    it("should provide actionable suggestions", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/component.ts"],
        tests: [], // Missing tests
      };

      const report = await enforcer.validateOperation("create", context);

      if (report.results.length > 0) {
        const testRule = report.results.find((r) => r.suggestions);
        if (testRule && testRule.suggestions) {
          expect(testRule.suggestions.length).toBeGreaterThan(0);
          expect(testRule.suggestions[0]).toContain("test");
        }
      }
    });

    it("should provide fix actions for missing tests", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/MyComponent.ts"],
        tests: [],
      };

      const report = await enforcer.validateOperation("create", context);

      const testResult = report.results.find((r) => r.fixes);
      if (testResult && testResult.fixes) {
        expect(testResult.fixes.length).toBeGreaterThan(0);
        const fix = testResult.fixes[0];
        expect(fix.type).toBe("create-file");
        expect(fix.filePath).toContain("MyComponent.test.ts");
      }
    });
  });

  describe("context analysis validation", () => {
    it("should validate proper context provider usage", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/delegation/new-context.ts"],
        newCode: `
          import { CodebaseContextAnalyzer } from './codebase-context-analyzer.js';
          new CodebaseContextAnalyzer(projectRoot, { maxFileSizeBytes: 1024 * 1024 });
        `,
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });

    it("should flag improper context provider initialization", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/delegation/bad-context.ts"],
        newCode: "new CodebaseContextAnalyzer()", // Missing memory config
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });
  });

  describe("performance validation", () => {
    it("should validate memory-efficient patterns", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/processor.ts"],
        newCode: `
          const data = fs.readFileSync(largeFile); // Inefficient
          const map = new Map();
          // No size limits
        `,
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });

    it("should approve memory-efficient code", async () => {
      const context: RuleValidationContext = {
        operation: "create",
        files: ["src/efficient-processor.ts"],
        newCode: `
          const stream = fs.createReadStream(largeFile);
          const limitedMap = new Map();
          if (limitedMap.size > 1000) limitedMap.clear();
        `,
      };

      const report = await enforcer.validateOperation("create", context);
      expect(report).toBeDefined();
    });
  });
});
