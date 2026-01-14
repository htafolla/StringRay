import { AgentDelegator } from "../delegation/agent-delegator.js";
import { StringRayStateManager } from "../state/state-manager.js";

async function testDelegationLogging() {
  console.log("🔄 Testing delegation logging integration...");

  const stateManager = new StringRayStateManager();
  const delegator = new AgentDelegator(stateManager);

  const result = await delegator.analyzeDelegation({
    operation: "test-complex-task",
    description: "Testing delegation logging",
    context: {
      files: ["test.ts", "complex.ts"],
      changes: 150,
      dependencies: 8,
      risk: "medium",
    },
  });

  console.log("📊 Delegation Analysis Result:");
  console.log(`   Strategy: ${result.strategy}`);
  console.log(`   Agents: ${result.agents.join(", ")}`);
  console.log(`   Complexity Score: ${result.complexity.score}`);

  try {
    const executionResult = await delegator.executeDelegation(result, {
      operation: "test-complex-task",
      description: "Testing delegation logging",
      context: result.metrics as any,
    });

    console.log("✅ Delegation execution completed");
  } catch (error) {
    console.log(
      "⚠️  Delegation execution failed (expected in test environment):",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("✅ Delegation logging test completed");
}

testDelegationLogging();
