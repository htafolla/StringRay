import { describe, it, expect, beforeEach } from "vitest";
import { StringRayOrchestrator, TaskDefinition } from "../../../orchestrator.js";

describe("Orchestrator Dependency Handling", () => {
  let orchestrator: StringRayOrchestrator;

  beforeEach(() => {
    orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 2,
      taskTimeout: 15000,
    });
  });

  it("should execute tasks with dependencies in correct order", async () => {
    const tasks: TaskDefinition[] = [
      { id: "task-1", description: "Initialize", subagentType: "architect" },
      {
        id: "task-2",
        description: "Process",
        subagentType: "librarian",
        dependencies: ["task-1"],
      },
      {
        id: "task-3",
        description: "Validate",
        subagentType: "enforcer",
        dependencies: ["task-2"],
      },
    ];

    const results = await orchestrator.executeComplexTask(
      "Dependency test",
      tasks,
    );

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);

    // Verify execution order (task-1 before task-2 before task-3)
    const taskOrder = results.map((r) => r.result.id);
    expect(taskOrder.indexOf("task-1")).toBeLessThan(
      taskOrder.indexOf("task-2"),
    );
    expect(taskOrder.indexOf("task-2")).toBeLessThan(
      taskOrder.indexOf("task-3"),
    );
  });

  it("should detect circular dependencies", async () => {
    const circularTasks: TaskDefinition[] = [
      {
        id: "task-a",
        description: "Task A",
        subagentType: "architect",
        dependencies: ["task-c"],
      },
      {
        id: "task-b",
        description: "Task B",
        subagentType: "librarian",
        dependencies: ["task-a"],
      },
      {
        id: "task-c",
        description: "Task C",
        subagentType: "enforcer",
        dependencies: ["task-b"],
      },
    ];

    await expect(
      orchestrator.executeComplexTask(
        "Circular dependency test",
        circularTasks,
      ),
    ).rejects.toThrow("Circular dependency detected");
  });
});
