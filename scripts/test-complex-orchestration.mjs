#!/usr/bin/env node

/**
 * Complex Multi-Agent Orchestration Test
 * Tests complex multi-agent orchestration with interdependent tasks
 */

(async () => {
  try {
    console.log("Testing complex multi-agent orchestration...");

    // Import the orchestrator
    const { StringRayOrchestrator } = await import("stringray-ai");

    // Create orchestrator instance
    const orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 3,
    });

    // Execute complex task with multiple agents
    const result = await orchestrator.executeComplexTask(
      "Design and implement a user authentication system with database integration, API endpoints, and frontend components",
      [
        {
          id: "architect-task",
          description: "Design the authentication system architecture",
          subagentType: "architect",
          priority: "high",
        },
        {
          id: "security-task",
          description: "Implement security measures and validation",
          subagentType: "security-auditor",
          priority: "high",
        },
        {
          id: "code-task",
          description: "Generate the actual implementation code",
          subagentType: "enforcer",
          priority: "medium",
        },
      ],
    );

    console.log(
      "Complex orchestration test result:",
      result.length > 0 ? "PASSED" : "FAILED",
    );
    console.log("Tasks completed:", result.length);

    process.exit(result.length > 0 ? 0 : 1);
  } catch (error) {
    console.error("Complex orchestration test failed:", error.message);
    process.exit(1);
  }
})();
