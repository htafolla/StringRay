import { describe, it, expect, beforeEach } from "vitest";
import { StrRayOrchestrator, TaskDefinition } from "../../../orchestrator.js";

describe("Basic Orchestrator Functionality", () => {
  let orchestrator: StrRayOrchestrator;

  beforeEach(() => {
    orchestrator = new StrRayOrchestrator({
      maxConcurrentTasks: 2,
      taskTimeout: 10000,
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
    expect(results[0].success).toBe(true);
    expect(results[0].result.type).toBe("design");
    expect(results[0].duration).toBeGreaterThan(0);
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
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.every((r) => r.duration > 0)).toBe(true);
  });

  it("should handle empty task list", async () => {
    const results = await orchestrator.executeComplexTask("Empty test", []);

    expect(results).toHaveLength(0);
  });
});
