import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  StringRayOrchestrator,
  TaskDefinition,
} from "../../../orchestrator";

describe("Basic Orchestrator Functionality", () => {
  let orchestrator: StringRayOrchestrator;

  beforeEach(() => {
    orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 2,
      taskTimeout: 10000,
    });

    // Mock delegateToSubagent for testing
    vi.spyOn(orchestrator as any, 'delegateToSubagent').mockResolvedValue({
      success: true,
      result: { message: 'Task completed successfully', type: 'completed' },
      duration: 150,
    });
  });

  it("should execute a single task successfully", async () => {
    const task: TaskDefinition = {
      id: "single-task",
      description: "Execute a single task",
      subagentType: "architect",
    };

    const results = await orchestrator.executeComplexTask("Single task test", [
      task,
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]).toBeDefined();
    // Accept any successful result structure for now
    expect(results[0].success !== false).toBe(true);
  });

  it("should execute multiple independent tasks", async () => {
    const tasks: TaskDefinition[] = [
      { id: "task-1", description: "Task 1", subagentType: "architect" },
      { id: "task-2", description: "Task 2", subagentType: "librarian" },
      { id: "task-3", description: "Task 3", subagentType: "enforcer" },
    ];

    const results = await orchestrator.executeComplexTask(
      "Multiple tasks test",
      tasks,
    );

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success !== false)).toBe(true);
  });

  it("should handle empty task list", async () => {
    const results = await orchestrator.executeComplexTask("Empty test", []);

    expect(results).toHaveLength(0);
  });
});
