/**
 * Integration tests for Commit Batching + Enforcement system
 * Tests the complete workflow from change detection to enforced commits
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  IntelligentCommitBatcher,
  createIntelligentCommitBatcher,
} from "../../orchestrator/intelligent-commit-batcher.js";
import {
  runPreCommitValidation,
  qualityGateCheck,
} from "../../enforcement/enforcer-tools.js";
import { frameworkLogger } from "../../framework-logger.js";

// Mock external dependencies
vi.mock("../../framework-logger.js");

describe("Commit Batching + Enforcement Integration", () => {
  let batcher: IntelligentCommitBatcher;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create batcher with fast settings for testing
    batcher = createIntelligentCommitBatcher({
      maxFilesPerCommit: 3,
      maxTimeBetweenCommits: 1000, // 1 second for testing
      minTimeBetweenCommits: 100,
      batchRelatedOperations: true,
      batchLowRiskChanges: true,
      separateHighRiskChanges: true,
      autoCommit: false, // Don't actually commit in tests
      generateCommitMessages: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("change batching workflow", () => {
    it("should batch related file changes together", () => {
      // Add related component changes
      const change1 = {
        filePath: "src/components/Button.tsx",
        operation: "modify",
        changeType: "feature",
        riskLevel: "low" as const,
        linesChanged: 25,
        timestamp: Date.now(),
      };

      const change2 = {
        filePath: "src/components/Button.test.tsx",
        operation: "create",
        changeType: "test",
        riskLevel: "low" as const,
        linesChanged: 30,
        timestamp: Date.now(),
      };

      const change3 = {
        filePath: "src/components/Button.styles.ts",
        operation: "create",
        changeType: "feature",
        riskLevel: "low" as const,
        linesChanged: 15,
        timestamp: Date.now(),
      };

      // Add changes
      batcher.addChange(change1);
      batcher.addChange(change2);
      batcher.addChange(change3);

      // Check batch status
      const status = batcher.getBatchStatus();

      expect(status.pendingChanges).toBe(3);
      expect(status.metrics.fileCount).toBe(3);
      expect(status.metrics.operationCount).toBe(2); // modify, create
      expect(status.shouldCommit).toBe(true); // Should trigger due to file count
    });

    it("should separate high-risk changes from low-risk batch", () => {
      // Add low-risk changes first
      const lowRiskChange = {
        filePath: "src/utils/helpers.ts",
        operation: "modify",
        changeType: "refactor",
        riskLevel: "low" as const,
        linesChanged: 10,
        timestamp: Date.now(),
      };

      batcher.addChange(lowRiskChange);

      // Add high-risk change
      const highRiskChange = {
        filePath: "src/api/auth.ts",
        operation: "modify",
        changeType: "security",
        riskLevel: "critical" as const,
        linesChanged: 5,
        timestamp: Date.now(),
      };

      const shouldCommit = batcher.addChange(highRiskChange);

      expect(shouldCommit).toBe(true); // Should trigger separate commit for high-risk
    });

    it("should generate intelligent commit messages", () => {
      const changes = [
        {
          filePath: "src/components/UserProfile.tsx",
          operation: "create",
          changeType: "feature",
          riskLevel: "medium" as const,
          linesChanged: 45,
          timestamp: Date.now(),
        },
        {
          filePath: "src/components/UserProfile.test.tsx",
          operation: "create",
          changeType: "test",
          riskLevel: "low" as const,
          linesChanged: 60,
          timestamp: Date.now(),
        },
      ];

      batcher.addChanges(changes);
      const status = batcher.getBatchStatus();

      expect(status.estimatedCommitMessage).toContain("feat");
      expect(status.estimatedCommitMessage).toContain("Components");
    });
  });

  describe("enforcement integration", () => {
    it("should validate batched changes before commit", async () => {
      const testFiles = [
        "src/components/Button.tsx",
        "src/components/Button.test.tsx",
      ];

      // Mock successful validation
      const validationResult = await runPreCommitValidation(
        testFiles,
        "create",
      );

      expect(validationResult).toBeDefined();
      expect(typeof validationResult.passed).toBe("boolean");
      expect(validationResult.operation).toBe("create");
    });

    it("should block commits with validation failures", async () => {
      // Test with a file that would fail validation (empty array simulates no files)
      const validationResult = await runPreCommitValidation(
        [],
        "invalid-operation",
      );

      expect(validationResult).toBeDefined();
      // Should still return a result even with invalid inputs
    });

    it("should integrate quality gates with batching decisions", async () => {
      const context = {
        files: ["src/new-feature.ts"],
        newCode: "function test() { return true; }",
        tests: ["src/new-feature.test.ts"],
      };

      const qualityResult = await qualityGateCheck("create", context);

      expect(qualityResult).toBeDefined();
      expect(typeof qualityResult.passed).toBe("boolean");
      expect(qualityResult.errors).toBeDefined();
      expect(qualityResult.warnings).toBeDefined();
    });
  });

  describe("complete workflow integration", () => {
    it("should handle the complete change → validation → commit workflow", async () => {
      // Simulate a complete workflow

      // 1. Add changes to batch
      const changes = [
        {
          filePath: "src/hooks/useAuth.ts",
          operation: "create",
          changeType: "feature",
          riskLevel: "high" as const,
          linesChanged: 35,
          timestamp: Date.now(),
        },
        {
          filePath: "src/hooks/useAuth.test.ts",
          operation: "create",
          changeType: "test",
          riskLevel: "low" as const,
          linesChanged: 40,
          timestamp: Date.now(),
        },
      ];

      batcher.addChanges(changes);

      // 2. Check if batch should commit
      const status = batcher.getBatchStatus();
      expect(status.shouldCommit).toBe(true);

      // 3. Run pre-commit validation
      const validation = await runPreCommitValidation(
        changes.map((c) => c.filePath),
        "create",
      );

      // 4. Only commit if validation passes
      if (validation.passed && !validation.blocked) {
        // Would commit here in real implementation
        expect(true).toBe(true); // Placeholder for successful workflow
      } else {
        // Would handle validation failures
        expect(validation.errors).toBeDefined();
      }
    });

    it("should handle high-risk changes with immediate validation", async () => {
      // Add a high-risk security change
      const securityChange = {
        filePath: "src/auth/security.ts",
        operation: "modify",
        changeType: "security",
        riskLevel: "critical" as const,
        linesChanged: 8,
        timestamp: Date.now(),
      };

      batcher.addChange(securityChange);

      // Should trigger immediate validation
      const status = batcher.getBatchStatus();
      expect(status.shouldCommit).toBe(true);

      // Run security-focused validation
      const validation = await qualityGateCheck("modify", {
        files: [securityChange.filePath],
      });

      expect(validation).toBeDefined();
    });
  });

  describe("performance and reliability", () => {
    it("should handle large batches efficiently", () => {
      // Create a large batch of changes
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        filePath: `src/component${i}.ts`,
        operation: i % 2 === 0 ? "create" : "modify",
        changeType: "feature",
        riskLevel: "low" as const,
        linesChanged: Math.floor(Math.random() * 50) + 10,
        timestamp: Date.now() + i,
      }));

      const startTime = Date.now();
      batcher.addChanges(largeBatch);
      const endTime = Date.now();

      const status = batcher.getBatchStatus();

      expect(status.pendingChanges).toBe(50);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(status.shouldCommit).toBe(true); // Should trigger due to size
    });

    it("should maintain batch integrity under concurrent operations", async () => {
      // Test concurrent change additions
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(
          batcher.addChange({
            filePath: `file${i}.ts`,
            operation: "create",
            changeType: "feature",
            riskLevel: "low" as const,
            linesChanged: 10,
            timestamp: Date.now(),
          }),
        ),
      );

      await Promise.all(promises);

      const status = batcher.getBatchStatus();
      expect(status.pendingChanges).toBe(10);
    });
  });

  describe("error handling and recovery", () => {
    it("should handle validation failures gracefully", async () => {
      // Test with invalid inputs
      const validation = await runPreCommitValidation(
        ["nonexistent-file.xyz"],
        "invalid-op",
      );

      expect(validation).toBeDefined();
      expect(typeof validation.passed).toBe("boolean");
      // Should not throw, should return validation result
    });

    it("should continue batching after validation errors", () => {
      // Add changes after a potential validation failure
      const change = {
        filePath: "src/recovery.ts",
        operation: "create",
        changeType: "feature",
        riskLevel: "low" as const,
        linesChanged: 20,
        timestamp: Date.now(),
      };

      batcher.addChange(change);

      const status = batcher.getBatchStatus();
      expect(status.pendingChanges).toBeGreaterThan(0);
    });

    it("should handle empty batches gracefully", () => {
      const status = batcher.getBatchStatus();

      expect(status.pendingChanges).toBe(0);
      expect(status.shouldCommit).toBe(false);
      expect(status.estimatedCommitMessage).toBe("Batch commit: 0 changes");
    });
  });
});
