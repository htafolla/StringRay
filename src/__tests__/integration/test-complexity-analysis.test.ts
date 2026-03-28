/**
 * Integration Test - Complexity Analysis
 *
 * Tests complexity analysis integration with StringRay framework
 */

import { describe, test, expect, beforeEach } from "vitest";
import { complexityAnalyzer } from "../../delegation/complexity-analyzer.js";
import { StringRayStateManager } from "../../state/state-manager.js";

describe("Complexity Analysis Integration", () => {
  let stateManager: StringRayStateManager;

  beforeEach(() => {
    stateManager = new StringRayStateManager("/tmp/test-state");
  });

  test("should analyze simple file complexity correctly", () => {
    const metrics = complexityAnalyzer.analyzeComplexity("edit", {
      files: ["simple.ts"],
      linesChanged: 50,
    });

    const score = complexityAnalyzer.calculateComplexityScore(metrics);
    expect(score.score).toBeGreaterThan(0);
    expect(score.score).toBeLessThan(50); // Updated for new thresholds: simple=15, moderate=25, complex=50
    expect(score.level).toBeDefined();
    expect(["simple", "moderate", "complex"]).toContain(score.level); // Updated for new thresholds
  });

  test("should analyze complex file complexity correctly", () => {
    const metrics = complexityAnalyzer.analyzeComplexity("refactor", {
      files: ["complex.ts"],
      linesChanged: 500,
      dependencyCount: 20,
      riskLevel: "high",
    });

    const score = complexityAnalyzer.calculateComplexityScore(metrics);
    // Score should be significant for complex refactor with high risk
    expect(score.score).toBeGreaterThanOrEqual(10);
    // Should be complex or enterprise level
    expect(["complex", "enterprise"]).toContain(score.level);
  });

  test("should handle edge cases gracefully", () => {
    const metrics = complexityAnalyzer.analyzeComplexity("unknown", {
      files: [],
    });

    const score = complexityAnalyzer.calculateComplexityScore(metrics);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.level).toBeDefined();
  });

  test("should persist complexity metrics to state", () => {
    const metrics = complexityAnalyzer.analyzeComplexity("edit", {
      files: ["test.ts"],
      linesChanged: 25,
    });

    const score = complexityAnalyzer.calculateComplexityScore(metrics);
    stateManager.set(`complexity:edit`, { metrics, score });

    const stored = stateManager.get(`complexity:edit`) as any;
    expect(stored).toBeDefined();
    expect(stored.score).toBeDefined();
  });
});
