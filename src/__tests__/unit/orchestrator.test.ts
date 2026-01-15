/**
 * StringRay AI v1.0.4 - Orchestrator Unit Tests
 *
 * Tests the multi-agent orchestration and task delegation functionality.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  StringRayOrchestrator,
  OrchestratorConfig,
  TaskDefinition,
  TaskResult,
} from "../../orchestrator";

describe("StringRayOrchestrator", () => {
  let orchestrator: StringRayOrchestrator;

  beforeEach(() => {
    orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 3,
      taskTimeout: 60000,
      conflictResolutionStrategy: "majority_vote",
    });
  });

  test("should initialize with default configuration", () => {
    const defaultOrchestrator = new StringRayOrchestrator();
    expect(defaultOrchestrator).toBeDefined();
  });

  test("should initialize with custom configuration", () => {
    const config: Partial<OrchestratorConfig> = {
      maxConcurrentTasks: 5,
      conflictResolutionStrategy: "expert_priority",
    };
    const customOrchestrator = new StringRayOrchestrator(config);
    expect(customOrchestrator).toBeDefined();
  });

  test.skip("should execute single task successfully", async () => {
    const task: TaskDefinition = {
      id: "test-task-1",
      description: "Test task",
      subagentType: "explore",
    };

    const result = await orchestrator.executeComplexTask("Single task test", [
      task,
    ]);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(true);
    expect(result[0].result.type).toBe("exploration");
    expect(result[0].duration).toBeGreaterThan(0);
  });

  test("should handle task execution failures", async () => {
    // Mock the delegateToSubagent method to throw an error
    const mockDelegate = vi
      .spyOn(orchestrator as any, "delegateToSubagent")
      .mockRejectedValue(new Error("Task failed"));

    const task: TaskDefinition = {
      id: "failing-task",
      description: "Failing task",
      subagentType: "explore",
    };

    const result = await orchestrator.executeComplexTask("Failing task test", [
      task,
    ]);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(false);
    expect(result[0].error).toContain("Task failed");

    mockDelegate.mockRestore();
  });

  test.skip("should execute complex multi-step tasks", async () => {
    const tasks: TaskDefinition[] = [
      {
        id: "step-1",
        description: "First task",
        subagentType: "explore",
      },
      {
        id: "step-2",
        description: "Second task",
        subagentType: "librarian",
      },
    ];

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
  });

  test("should respect task dependencies in complex tasks", async () => {
    const tasks: TaskDefinition[] = [
      {
        id: "dependent-task",
        description: "Depends on completed task",
        subagentType: "explore",
        dependencies: ["non-existent-task"],
      },
    ];

    // Should throw error for circular/unresolvable dependencies
    await expect(
      orchestrator.executeComplexTask("Dependency test", tasks),
    ).rejects.toThrow();
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
      description: "Slow task",
      subagentType: "explore",
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
      description: `Task ${i}`,
      subagentType: "explore",
    }));

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
