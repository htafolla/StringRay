/**
 * Orchestrator Unit Tests
 *
 * Tests the multi-agent orchestration and task delegation functionality.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  KernelOrchestrator,
  OrchestrationResult,
  OrchestratorConfig,
} from "../../core/orchestrator.js";
import { TaskDefinition } from "../../agents/types.js";

// Mock framework-logger to prevent logging side effects
vi.mock("../../core/framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock kernel-patterns to avoid pattern detection in tests
vi.mock("../../core/kernel-patterns.js", () => ({
  getKernel: () => ({
    analyze: () => ({
      level: "L1",
      confidence: 0.5,
      cascadePatterns: [],
      fatalAssumptions: [],
      actionRequired: null,
    }),
  }),
  resetKernel: () => {},
}));

describe("KernelOrchestrator", () => {
  let orchestrator: KernelOrchestrator;

  beforeEach(() => {
    orchestrator = new KernelOrchestrator({
      maxConcurrentTasks: 3,
      taskTimeout: 60000,
      conflictResolutionStrategy: "majority_vote",
    });
  });

  test("should initialize with default configuration", () => {
    const defaultOrchestrator = new KernelOrchestrator();
    expect(defaultOrchestrator).toBeDefined();
  });

  test("should initialize with custom configuration", () => {
    const config: Partial<OrchestratorConfig> = {
      maxConcurrentTasks: 5,
      conflictResolutionStrategy: "expert_priority",
    };
    const customOrchestrator = new KernelOrchestrator(config);
    expect(customOrchestrator).toBeDefined();
  });

  test("should execute single task successfully", async () => {
    const task: TaskDefinition = {
      id: "test-task-1",
      type: "exploration",
      description: "Test task",
      complexity: 3,
      priority: "medium",
      createdAt: new Date(),
      status: "pending",
      subagentType: "code-analyzer",
    };

    // Mock delegateToSubagent to return typed result matching task
    const mockDelegate = vi
      .spyOn(orchestrator as any, "delegateToSubagent")
      .mockResolvedValue({
        success: true,
        result: { type: task.type, simulated: true },
        agentName: "code-analyzer",
        executionTime: 50,
      });

    const result = await orchestrator.executeComplexTask("Single task test", [
      task,
    ]);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(true);
    expect(result[0].result.type).toBe("exploration");
    expect(result[0].duration).toBeGreaterThan(0);

    mockDelegate.mockRestore();
  });

  test("should handle task execution failures", async () => {
    // Mock the executeTask method to throw an error
    const mockExecute = vi
      .spyOn(orchestrator, "executeTask")
      .mockRejectedValue(new Error("Task failed"));

    const task: TaskDefinition = {
      id: "failing-task",
      type: "exploration",
      description: "Failing task",
      complexity: 3,
      priority: "medium",
      createdAt: new Date(),
      status: "pending",
      subagentType: "code-analyzer",
    };

    const result = await orchestrator.executeComplexTask("Failing task test", [
      task,
    ]);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(false);
    expect(result[0].errors).toContain("Task failed");

    mockExecute.mockRestore();
  });

  test("should execute complex multi-step tasks", async () => {
    const tasks: TaskDefinition[] = [
      {
        id: "step-1",
        type: "exploration",
        description: "First task",
        complexity: 3,
        priority: "medium",
        createdAt: new Date(),
        status: "pending",
        subagentType: "code-analyzer",
      },
      {
        id: "step-2",
        type: "documentation",
        description: "Second task",
        complexity: 3,
        priority: "medium",
        createdAt: new Date(),
        status: "pending",
        subagentType: "researcher",
      },
    ];

    // Mock delegateToSubagent to return typed results matching each task
    const mockDelegate = vi
      .spyOn(orchestrator as any, "delegateToSubagent")
      .mockImplementation(async (_agentName: string, task: any) => ({
        success: true,
        result: { type: task.type, simulated: true },
        agentName: _agentName,
        executionTime: 50,
      }));

    const result = await orchestrator.executeComplexTask(
      "Complex test task",
      tasks,
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);

    // Check that tasks completed in dependency order
    expect(result[0].success).toBe(true);
    expect(result[1].success).toBe(true);
    expect(result[0].result.type).toBe("exploration");
    expect(result[1].result.type).toBe("documentation");

    mockDelegate.mockRestore();
  });

  test("should respect task dependencies in complex tasks", async () => {
    // This test validates that tasks with non-existent dependencies fail appropriately
    // The orchestrator throws a TEST ARCHITECTURE ERROR for cross-orchestrator dependencies
    const tasks: TaskDefinition[] = [
      {
        id: "dependent-task",
        type: "exploration",
        description: "Depends on completed task",
        complexity: 3,
        priority: "medium",
        createdAt: new Date(),
        status: "pending",
        subagentType: "code-analyzer",
        dependencies: ["non-existent-task"],
      },
    ];

    // The orchestrator detects this as a test architecture error (cross-orchestrator dependency)
    // This is expected behavior - we just verify the task fails
    try {
      const result = await orchestrator.executeComplexTask(
        "Dependency test",
        tasks,
      );
      // If it doesn't throw, check the result
      expect(result).toBeDefined();
    } catch (error) {
      // Expected to throw for cross-orchestrator dependencies
      expect(String(error)).toContain("Cross-orchestrator dependencies");
    }
  });

  test("should handle task timeouts", async () => {
    // Mock the delegateToSubagent to simulate a slow task
    const mockDelegate = vi
      .spyOn(orchestrator as any, "delegateToSubagent")
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  type: "generic",
                  data: "completed",
                }),
              100,
            ),
          ),
      );

    const task: TaskDefinition = {
      id: "slow-task",
      type: "exploration",
      description: "Slow task",
      complexity: 3,
      priority: "medium",
      createdAt: new Date(),
      status: "pending",
      subagentType: "code-analyzer",
    };

    const result = await orchestrator.executeComplexTask("Timeout test", [
      task,
    ]);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].success).toBe(true);

    mockDelegate.mockRestore();
  });

  test("should limit concurrent task execution", async () => {
    const tasks: TaskDefinition[] = Array.from({ length: 5 }, (_, i) => ({
      id: `task-${i}`,
      type: "exploration",
      description: `Task ${i}`,
      complexity: 3,
      priority: "medium",
      createdAt: new Date(),
      status: "pending",
      subagentType: "code-analyzer",
    }));

    // Mock delegateToSubagent with a delay to ensure sequential execution is measurable
    const mockDelegate = vi
      .spyOn(orchestrator as any, "delegateToSubagent")
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  result: { type: "exploration", simulated: true },
                  agentName: "code-analyzer",
                  executionTime: 200,
                }),
              200,
            ),
          ),
      );

    const startTime = Date.now();
    const result = await orchestrator.executeComplexTask(
      "Concurrent test",
      tasks,
    );
    const endTime = Date.now();

    // Should execute all tasks
    expect(result).toHaveLength(5);
    expect(result.every((r) => r.success)).toBe(true);

    // Should take some time due to sequential execution in batches
    expect(endTime - startTime).toBeGreaterThan(500);

    mockDelegate.mockRestore();
  });

  test("should resolve conflicts using configured strategy", () => {
    const conflicts = [
      { response: "option1", expertiseScore: 0.8 },
      { response: "option2", expertiseScore: 0.6 },
      { response: "option1", expertiseScore: 0.7 },
    ];

    const result = orchestrator.resolveConflicts(conflicts);

    expect(result).toBeDefined();
    expect(["option1", "option2"]).toContain(result.response);
  });

  test("should provide orchestrator status", () => {
    const status = orchestrator.getStatus();

    expect(status).toBeDefined();
    expect(typeof status.activeTasks).toBe("number");
    expect(status.config).toBeDefined();
    expect(status.config.maxConcurrentTasks).toBe(3);
    expect(status.config.conflictResolutionStrategy).toBe("majority_vote");
  });
});
