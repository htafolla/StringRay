/**
 * RuleRegistry Unit Tests
 *
 * Comprehensive test coverage for the RuleRegistry class.
 * Tests all public methods and edge cases.
 *
 * @module enforcement/core/__tests__
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RuleRegistry } from "../rule-registry.js";
import { RuleDefinition } from "../../types.js";

describe("RuleRegistry", () => {
  let registry: RuleRegistry;

  // Test helper to create a valid rule
  const createTestRule = (id: string, overrides?: Partial<RuleDefinition>): RuleDefinition => ({
    id,
    name: `Test Rule ${id}`,
    description: `Test description for ${id}`,
    category: "code-quality",
    severity: "warning",
    enabled: true,
    validator: async () => ({ passed: true, message: "OK" }),
    ...overrides,
  });

  beforeEach(() => {
    registry = new RuleRegistry();
  });

  describe("constructor", () => {
    it("should create an empty registry", () => {
      expect(registry.getRuleCount()).toBe(0);
      expect(registry.getRules()).toEqual([]);
    });
  });

  describe("addRule", () => {
    it("should add a rule to the registry", () => {
      const rule = createTestRule("test-1");
      registry.addRule(rule);

      expect(registry.getRuleCount()).toBe(1);
      expect(registry.getRule("test-1")).toBe(rule);
    });

    it("should add multiple rules", () => {
      registry.addRule(createTestRule("test-1"));
      registry.addRule(createTestRule("test-2"));
      registry.addRule(createTestRule("test-3"));

      expect(registry.getRuleCount()).toBe(3);
    });

    it("should throw error when adding duplicate rule", () => {
      const rule = createTestRule("duplicate");
      registry.addRule(rule);

      expect(() => registry.addRule(createTestRule("duplicate"))).toThrow(
        'Rule with ID "duplicate" already exists in registry'
      );
    });

    it("should throw error with correct message for duplicate", () => {
      const rule = createTestRule("my-rule");
      registry.addRule(rule);

      try {
        registry.addRule(createTestRule("my-rule"));
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("my-rule");
      }
    });
  });

  describe("getRules", () => {
    it("should return empty array for empty registry", () => {
      const rules = registry.getRules();
      expect(rules).toEqual([]);
      expect(rules.length).toBe(0);
    });

    it("should return all rules as array", () => {
      const rule1 = createTestRule("test-1");
      const rule2 = createTestRule("test-2");
      registry.addRule(rule1);
      registry.addRule(rule2);

      const rules = registry.getRules();
      expect(rules).toHaveLength(2);
      expect(rules).toContain(rule1);
      expect(rules).toContain(rule2);
    });

    it("should return new array on each call (immutable)", () => {
      registry.addRule(createTestRule("test-1"));
      const rules1 = registry.getRules();
      const rules2 = registry.getRules();

      expect(rules1).not.toBe(rules2);
      expect(rules1).toEqual(rules2);
    });
  });

  describe("getRule", () => {
    it("should return undefined for non-existent rule", () => {
      const result = registry.getRule("non-existent");
      expect(result).toBeUndefined();
    });

    it("should return rule by ID", () => {
      const rule = createTestRule("find-me");
      registry.addRule(rule);

      const result = registry.getRule("find-me");
      expect(result).toBe(rule);
    });

    it("should return undefined after rule removal", () => {
      registry.addRule(createTestRule("temp"));
      registry.removeRule("temp");

      expect(registry.getRule("temp")).toBeUndefined();
    });
  });

  describe("enableRule", () => {
    it("should return false for non-existent rule", () => {
      const result = registry.enableRule("non-existent");
      expect(result).toBe(false);
    });

    it("should enable a disabled rule", () => {
      registry.addRule(createTestRule("disabled", { enabled: false }));
      expect(registry.isRuleEnabled("disabled")).toBe(false);

      const result = registry.enableRule("disabled");
      expect(result).toBe(true);
      expect(registry.isRuleEnabled("disabled")).toBe(true);
    });

    it("should keep enabled rule enabled", () => {
      registry.addRule(createTestRule("enabled", { enabled: true }));
      expect(registry.isRuleEnabled("enabled")).toBe(true);

      const result = registry.enableRule("enabled");
      expect(result).toBe(true);
      expect(registry.isRuleEnabled("enabled")).toBe(true);
    });
  });

  describe("disableRule", () => {
    it("should return false for non-existent rule", () => {
      const result = registry.disableRule("non-existent");
      expect(result).toBe(false);
    });

    it("should disable an enabled rule", () => {
      registry.addRule(createTestRule("enabled", { enabled: true }));
      expect(registry.isRuleEnabled("enabled")).toBe(true);

      const result = registry.disableRule("enabled");
      expect(result).toBe(true);
      expect(registry.isRuleEnabled("enabled")).toBe(false);
    });

    it("should keep disabled rule disabled", () => {
      registry.addRule(createTestRule("disabled", { enabled: false }));
      expect(registry.isRuleEnabled("disabled")).toBe(false);

      const result = registry.disableRule("disabled");
      expect(result).toBe(true);
      expect(registry.isRuleEnabled("disabled")).toBe(false);
    });
  });

  describe("isRuleEnabled", () => {
    it("should return false for non-existent rule", () => {
      expect(registry.isRuleEnabled("non-existent")).toBe(false);
    });

    it("should return true for enabled rule", () => {
      registry.addRule(createTestRule("enabled", { enabled: true }));
      expect(registry.isRuleEnabled("enabled")).toBe(true);
    });

    it("should return false for disabled rule", () => {
      registry.addRule(createTestRule("disabled", { enabled: false }));
      expect(registry.isRuleEnabled("disabled")).toBe(false);
    });

    it("should reflect state changes", () => {
      registry.addRule(createTestRule("toggle"));
      expect(registry.isRuleEnabled("toggle")).toBe(true);

      registry.disableRule("toggle");
      expect(registry.isRuleEnabled("toggle")).toBe(false);

      registry.enableRule("toggle");
      expect(registry.isRuleEnabled("toggle")).toBe(true);
    });
  });

  describe("getRuleCount", () => {
    it("should return 0 for empty registry", () => {
      expect(registry.getRuleCount()).toBe(0);
    });

    it("should return correct count after adding rules", () => {
      registry.addRule(createTestRule("test-1"));
      expect(registry.getRuleCount()).toBe(1);

      registry.addRule(createTestRule("test-2"));
      expect(registry.getRuleCount()).toBe(2);

      registry.addRule(createTestRule("test-3"));
      expect(registry.getRuleCount()).toBe(3);
    });

    it("should return correct count after removing rules", () => {
      registry.addRule(createTestRule("test-1"));
      registry.addRule(createTestRule("test-2"));
      expect(registry.getRuleCount()).toBe(2);

      registry.removeRule("test-1");
      expect(registry.getRuleCount()).toBe(1);

      registry.removeRule("test-2");
      expect(registry.getRuleCount()).toBe(0);
    });
  });

  describe("getRuleStats", () => {
    it("should return zero stats for empty registry", () => {
      const stats = registry.getRuleStats();
      expect(stats).toEqual({
        totalRules: 0,
        enabledRules: 0,
        disabledRules: 0,
        ruleCategories: {},
      });
    });

    it("should calculate correct statistics", () => {
      registry.addRule(createTestRule("r1", { category: "code-quality", enabled: true }));
      registry.addRule(createTestRule("r2", { category: "code-quality", enabled: false }));
      registry.addRule(createTestRule("r3", { category: "security", enabled: true }));

      const stats = registry.getRuleStats();
      expect(stats.totalRules).toBe(3);
      expect(stats.enabledRules).toBe(2);
      expect(stats.disabledRules).toBe(1);
      expect(stats.ruleCategories).toEqual({
        "code-quality": 2,
        "security": 1,
      });
    });

    it("should update stats after state changes", () => {
      registry.addRule(createTestRule("r1", { enabled: true }));
      registry.addRule(createTestRule("r2", { enabled: true }));

      let stats = registry.getRuleStats();
      expect(stats.enabledRules).toBe(2);
      expect(stats.disabledRules).toBe(0);

      registry.disableRule("r1");
      stats = registry.getRuleStats();
      expect(stats.enabledRules).toBe(1);
      expect(stats.disabledRules).toBe(1);
    });
  });

  describe("hasRule", () => {
    it("should return false for empty registry", () => {
      expect(registry.hasRule("any")).toBe(false);
    });

    it("should return false for non-existent rule", () => {
      registry.addRule(createTestRule("exists"));
      expect(registry.hasRule("does-not-exist")).toBe(false);
    });

    it("should return true for existing rule", () => {
      registry.addRule(createTestRule("exists"));
      expect(registry.hasRule("exists")).toBe(true);
    });

    it("should return false after rule removal", () => {
      registry.addRule(createTestRule("temp"));
      expect(registry.hasRule("temp")).toBe(true);

      registry.removeRule("temp");
      expect(registry.hasRule("temp")).toBe(false);
    });
  });

  describe("removeRule", () => {
    it("should return false for non-existent rule", () => {
      const result = registry.removeRule("non-existent");
      expect(result).toBe(false);
    });

    it("should remove existing rule and return true", () => {
      registry.addRule(createTestRule("to-remove"));
      expect(registry.hasRule("to-remove")).toBe(true);

      const result = registry.removeRule("to-remove");
      expect(result).toBe(true);
      expect(registry.hasRule("to-remove")).toBe(false);
    });

    it("should decrease rule count", () => {
      registry.addRule(createTestRule("r1"));
      registry.addRule(createTestRule("r2"));
      expect(registry.getRuleCount()).toBe(2);

      registry.removeRule("r1");
      expect(registry.getRuleCount()).toBe(1);
    });
  });

  describe("clearRules", () => {
    it("should clear empty registry without error", () => {
      registry.clearRules();
      expect(registry.getRuleCount()).toBe(0);
    });

    it("should remove all rules", () => {
      registry.addRule(createTestRule("r1"));
      registry.addRule(createTestRule("r2"));
      registry.addRule(createTestRule("r3"));
      expect(registry.getRuleCount()).toBe(3);

      registry.clearRules();

      expect(registry.getRuleCount()).toBe(0);
      expect(registry.getRules()).toEqual([]);
      expect(registry.getRule("r1")).toBeUndefined();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex workflow: add, enable/disable, remove", () => {
      // Add rules
      registry.addRule(createTestRule("r1", { enabled: true }));
      registry.addRule(createTestRule("r2", { enabled: true }));
      registry.addRule(createTestRule("r3", { enabled: false }));

      expect(registry.getRuleCount()).toBe(3);

      // Disable some
      registry.disableRule("r1");
      expect(registry.isRuleEnabled("r1")).toBe(false);
      expect(registry.isRuleEnabled("r2")).toBe(true);

      // Enable another
      registry.enableRule("r3");
      expect(registry.isRuleEnabled("r3")).toBe(true);

      // Remove one
      registry.removeRule("r2");
      expect(registry.getRuleCount()).toBe(2);
      expect(registry.hasRule("r2")).toBe(false);

      // Verify stats
      const stats = registry.getRuleStats();
      expect(stats.totalRules).toBe(2);
      expect(stats.enabledRules).toBe(1); // Only r3 is enabled
      expect(stats.disabledRules).toBe(1); // r1 is disabled
    });

    it("should support different categories", () => {
      registry.addRule(createTestRule("r1", { category: "code-quality" }));
      registry.addRule(createTestRule("r2", { category: "security" }));
      registry.addRule(createTestRule("r3", { category: "performance" }));
      registry.addRule(createTestRule("r4", { category: "code-quality" }));

      const stats = registry.getRuleStats();
      expect(stats.ruleCategories["code-quality"]).toBe(2);
      expect(stats.ruleCategories["security"]).toBe(1);
      expect(stats.ruleCategories["performance"]).toBe(1);
    });

    it("should maintain rule references (not copies)", () => {
      const rule = createTestRule("original");
      registry.addRule(rule);

      const retrieved = registry.getRule("original");
      expect(retrieved).toBe(rule); // Same reference

      // Modifying through registry affects original
      if (retrieved) {
        retrieved.enabled = false;
      }
      expect(rule.enabled).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle rules with same properties but different IDs", () => {
      const rule1 = createTestRule("id-1", { name: "Same Name" });
      const rule2 = createTestRule("id-2", { name: "Same Name" });

      registry.addRule(rule1);
      registry.addRule(rule2);

      expect(registry.getRuleCount()).toBe(2);
    });

    it("should handle empty string rule ID", () => {
      const rule = createTestRule("");
      registry.addRule(rule);

      expect(registry.hasRule("")).toBe(true);
      expect(registry.getRule("")).toBe(rule);
    });

    it("should handle special characters in rule ID", () => {
      const specialIds = ["rule:with:colons", "rule-with-dashes", "rule.with.dots", "rule/with/slashes"];

      specialIds.forEach((id) => {
        registry.addRule(createTestRule(id));
      });

      specialIds.forEach((id) => {
        expect(registry.hasRule(id)).toBe(true);
      });
    });

    it("should handle multiple rapid operations", () => {
      // Rapid add/remove cycles
      for (let i = 0; i < 10; i++) {
        registry.addRule(createTestRule(`rapid-${i}`));
      }
      expect(registry.getRuleCount()).toBe(10);

      for (let i = 0; i < 10; i++) {
        registry.removeRule(`rapid-${i}`);
      }
      expect(registry.getRuleCount()).toBe(0);
    });

    it("should handle large number of rules", () => {
      const count = 100;
      for (let i = 0; i < count; i++) {
        registry.addRule(createTestRule(`bulk-${i}`));
      }

      expect(registry.getRuleCount()).toBe(count);
      expect(registry.getRules()).toHaveLength(count);

      const stats = registry.getRuleStats();
      expect(stats.totalRules).toBe(count);
    });
  });
});
