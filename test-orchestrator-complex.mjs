#!/usr/bin/env node

/**
 * Complex Orchestrator Routing Test
 * Tests advanced orchestrator functionality including dependencies and multiple agents
 */

console.log("🧪 COMPLEX ORCHESTRATOR ROUTING TEST");
console.log("=====================================\n");

async function testComplexOrchestratorRouting() {
  try {
    // Import the orchestrator
    const { StringRayOrchestrator } = await import("./node_modules/strray-ai/dist/plugin/orchestrator.js");

    console.log("✅ Orchestrator imported successfully");

    // Create orchestrator instance with different config
    const orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 3,
      taskTimeout: 45000,
      conflictResolutionStrategy: "majority_vote"
    });

    console.log("✅ Orchestrator instance created with advanced config");

    // Define complex test tasks with dependencies
    const complexTasks = [
      {
        id: "design-phase",
        description: "Create system architecture design",
        subagentType: "architect",
        priority: "high"
      },
      {
        id: "code-review",
        description: "Review the architecture design",
        subagentType: "code-reviewer",
        priority: "high",
        dependencies: ["design-phase"]
      },
      {
        id: "security-audit",
        description: "Perform security audit on design",
        subagentType: "security-auditor",
        priority: "medium",
        dependencies: ["design-phase"]
      },
      {
        id: "testing-setup",
        description: "Set up comprehensive testing strategy",
        subagentType: "test-architect",
        priority: "medium",
        dependencies: ["code-review"]
      },
      {
        id: "documentation",
        description: "Create technical documentation",
        subagentType: "librarian",
        priority: "low",
        dependencies: ["code-review", "security-audit"]
      }
    ];

    console.log("🔄 Executing complex orchestrator workflow...");
    console.log(`📋 Tasks: ${complexTasks.length} (with dependencies)`);

    // Execute complex workflow
    const results = await orchestrator.executeComplexTask(
      "Complex Multi-Agent Workflow Test",
      complexTasks,
      "test-session-complex"
    );

    console.log("✅ Complex workflow execution completed");

    // Validate results
    const allSuccessful = results.every(r => r.success);
    const correctCount = results.length === 5;
    const hasDuration = results.every(r => r.duration > 0);
    const hasValidResults = results.every(r => r.result && typeof r.result === 'object');

    console.log(`📊 Results: ${results.length} tasks executed`);
    console.log(`✅ All successful: ${allSuccessful}`);
    console.log(`✅ Correct count: ${correctCount}`);
    console.log(`✅ Has duration: ${hasDuration}`);
    console.log(`✅ Valid results: ${hasValidResults}`);

    // Check dependency resolution
    const designPhase = results.find(r => r.result?.id === "design-phase");
    const codeReview = results.find(r => r.result?.id === "code-review");
    const securityAudit = results.find(r => r.result?.id === "security-audit");

    const dependenciesResolved = designPhase && codeReview && securityAudit &&
      designPhase.success && codeReview.success && securityAudit.success;

    console.log(`✅ Dependencies resolved: ${dependenciesResolved}`);

    if (allSuccessful && correctCount && hasDuration && hasValidResults && dependenciesResolved) {
      console.log("\n🎉 COMPLEX ORCHESTRATOR TEST PASSED!");
      console.log("✅ Advanced task routing working");
      console.log("✅ Dependency resolution functional");
      console.log("✅ Multi-agent coordination successful");
      console.log("✅ Complex workflows executing correctly");
      process.exit(0);
    } else {
      console.log("\n❌ COMPLEX ORCHESTRATOR TEST FAILED!");
      console.log("❌ Some tasks failed or dependencies not resolved");
      console.log("Results:", results.map(r => ({
        taskId: r.result?.id,
        success: r.success,
        duration: r.duration
      })));
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Complex test failed with error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testComplexOrchestratorRouting();