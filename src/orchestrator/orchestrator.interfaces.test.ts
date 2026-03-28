/**
 * Tests for Orchestrator type interfaces
 *
 * @version 1.0.0
 * @since 2026-03-23
 */

import { describe, it, expect } from "vitest";
import {
  OrchestratorConfig,
  TaskDefinition,
  TaskResult,
  TaskExecutionResult,
  TestFailureContext,
  HealingStrategy,
  ConsolidationResult,
} from "./orchestrator.js";

describe("Orchestrator Interfaces", () => {
  describe("OrchestratorConfig", () => {
    it("should define valid configuration", () => {
      const config: OrchestratorConfig = {
        maxConcurrentTasks: 5,
        taskTimeout: 300000,
        conflictResolutionStrategy: "majority_vote",
      };

      expect(config.maxConcurrentTasks).toBe(5);
      expect(config.taskTimeout).toBe(300000);
      expect(config.conflictResolutionStrategy).toBe("majority_vote");
    });

    it("should support different conflict resolution strategies", () => {
      const strategies: OrchestratorConfig["conflictResolutionStrategy"][] = [
        "majority_vote",
        "expert_priority",
        "consensus",
      ];

      strategies.forEach((strategy) => {
        const config: OrchestratorConfig = {
          maxConcurrentTasks: 3,
          taskTimeout: 60000,
          conflictResolutionStrategy: strategy,
        };
        expect(config.conflictResolutionStrategy).toBe(strategy);
      });
    });
  });

  describe("TaskDefinition", () => {
    it("should define minimal task", () => {
      const task: TaskDefinition = {
        id: "task-1",
        description: "Test task",
        subagentType: "testing-lead",
      };

      expect(task.id).toBe("task-1");
      expect(task.subagentType).toBe("testing-lead");
    });

    it("should include optional priority and dependencies", () => {
      const task: TaskDefinition = {
        id: "task-2",
        description: "Complex task",
        subagentType: "orchestrator",
        priority: "high",
        dependencies: ["task-1", "task-0"],
      };

      expect(task.priority).toBe("high");
      expect(task.dependencies).toEqual(["task-1", "task-0"]);
    });
  });

  describe("TaskResult", () => {
    it("should represent successful result", () => {
      const result: TaskResult = {
        success: true,
        result: { fixesApplied: 5 },
        duration: 1000,
      };

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it("should represent failed result", () => {
      const result: TaskResult = {
        success: false,
        error: "Task execution failed",
        duration: 500,
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Task execution failed");
    });
  });

  describe("TaskExecutionResult", () => {
    it("should contain healing metrics", () => {
      const result: TaskExecutionResult = {
        fixesApplied: 10,
        testsOptimized: 5,
        performanceImprovement: 25,
        recommendations: ["Improve test coverage", "Reduce complexity"],
      };

      expect(result.fixesApplied).toBe(10);
      expect(result.testsOptimized).toBe(5);
      expect(result.recommendations).toHaveLength(2);
    });

    it("should support arbitrary additional properties", () => {
      const result: TaskExecutionResult = {
        fixesApplied: 3,
        customField: "custom-value",
      };

      expect((result as any).customField).toBe("custom-value");
    });
  });

  describe("TestFailureContext", () => {
    it("should capture test failure information", () => {
      const context: TestFailureContext = {
        failedTests: ["test-1", "test-2"],
        timeoutIssues: ["test-3"],
        performanceIssues: ["test-4"],
        flakyTests: ["test-5"],
        errorLogs: ["Error: timeout"],
        testExecutionTime: 120000,
      };

      expect(context.failedTests).toHaveLength(2);
      expect(context.timeoutIssues).toHaveLength(1);
      expect(context.testExecutionTime).toBe(120000);
    });

    it("should include optional session ID", () => {
      const context: TestFailureContext = {
        failedTests: [],
        timeoutIssues: [],
        performanceIssues: [],
        flakyTests: [],
        errorLogs: [],
        testExecutionTime: 60000,
        sessionId: "session-123",
      };

      expect(context.sessionId).toBe("session-123");
    });
  });

  describe("HealingStrategy", () => {
    it("should define low complexity strategy", () => {
      const strategy: HealingStrategy = {
        priorityLevel: "low",
        agentsNeeded: ["testing-lead"],
        estimatedTime: 5,
        complexityScore: 20,
        healingApproach: "simple",
      };

      expect(strategy.priorityLevel).toBe("low");
      expect(strategy.healingApproach).toBe("simple");
    });

    it("should define critical complexity strategy", () => {
      const strategy: HealingStrategy = {
        priorityLevel: "critical",
        agentsNeeded: [
          "orchestrator",
          "architect",
          "security-auditor",
          "testing-lead",
          "refactorer",
          "bug-triage-specialist",
        ],
        estimatedTime: 90,
        complexityScore: 85,
        healingApproach: "enterprise",
      };

      expect(strategy.priorityLevel).toBe("critical");
      expect(strategy.agentsNeeded).toHaveLength(6);
      expect(strategy.healingApproach).toBe("enterprise");
    });
  });

  describe("ConsolidationResult", () => {
    it("should aggregate healing results", () => {
      const result: ConsolidationResult = {
        success: true,
        fixesApplied: 15,
        testsOptimized: 8,
        performanceImprovement: 30,
        recommendations: ["Add more tests", "Refactor complex code"],
        summary: "Auto-healing completed successfully",
      };

      expect(result.success).toBe(true);
      expect(result.fixesApplied).toBe(15);
      expect(result.performanceImprovement).toBe(30);
    });

    it("should handle partial success", () => {
      const result: ConsolidationResult = {
        success: false,
        fixesApplied: 5,
        testsOptimized: 2,
        performanceImprovement: 10,
        recommendations: ["Manual review needed"],
        summary: "Auto-healing partially completed",
      };

      expect(result.success).toBe(false);
      expect(result.fixesApplied).toBe(5);
    });
  });
});
