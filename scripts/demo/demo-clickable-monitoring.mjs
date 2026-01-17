/**
 * Clickable Agent Monitoring Integration Demo
 * Demonstrates the enhanced multi-agent orchestration with clickable monitoring
 */

import { enhancedMultiAgentOrchestrator } from "../../dist/orchestrator/enhanced-multi-agent-orchestrator.js";

async function demonstrateClickableAgentMonitoring() {
  console.log(
    "🚀 Demonstrating Enhanced Multi-Agent Orchestration with Clickable Monitoring\n",
  );

  // Spawn multiple agents with dependencies
  console.log("📋 Spawning agents with dependency management...\n");

  // Spawn architect agent first (no dependencies)
  const architectAgent = await enhancedMultiAgentOrchestrator.spawnAgent({
    agentType: "architect",
    task: "Design user authentication system architecture",
    priority: "high",
  });

  console.log(
    `✅ Architect agent spawned: ${architectAgent.id} (clickable: ${architectAgent.clickable})\n`,
  );

  // Spawn enforcer agent that depends on architect
  const enforcerAgent = await enhancedMultiAgentOrchestrator.spawnAgent({
    agentType: "enforcer",
    task: "Validate authentication system against codex rules",
    priority: "high",
    dependencies: [architectAgent.id], // Depends on architect completion
  });

  console.log(
    `⏳ Enforcer agent queued: ${enforcerAgent.id} (waiting for dependencies)\n`,
  );

  // Spawn librarian agent (independent)
  const librarianAgent = await enhancedMultiAgentOrchestrator.spawnAgent({
    agentType: "librarian",
    task: "Research authentication best practices and patterns",
    priority: "medium",
  });

  console.log(
    `✅ Librarian agent spawned: ${librarianAgent.id} (clickable: ${librarianAgent.clickable})\n`,
  );

  // Demonstrate monitoring interface
  console.log("📊 Real-time Monitoring Interface:\n");

  // Monitor progress for 10 seconds
  const monitorInterval = setInterval(() => {
    const monitoringData =
      enhancedMultiAgentOrchestrator.getMonitoringInterface();

    console.log("📈 Current Agent Status:");
    Object.entries(monitoringData).forEach(([id, agent]) => {
      const status =
        agent.status === "spawning"
          ? "🔄 Spawning"
          : agent.status === "active"
            ? "⚡ Active"
            : agent.status === "completed"
              ? "✅ Completed"
              : agent.status === "failed"
                ? "❌ Failed"
                : "🚫 Cancelled";

      console.log(
        `  ${id}: ${agent.agentType} - ${status} (${agent.progress}%) ${agent.clickable ? "🖱️ Clickable" : ""}`,
      );
    });
    console.log("");
  }, 2000);

  // Wait for all agents to complete
  await new Promise((resolve) => setTimeout(resolve, 15000));

  clearInterval(monitorInterval);

  // Final status report
  console.log("🏁 Final Agent Status Report:\n");

  const finalStats = enhancedMultiAgentOrchestrator.getStatistics();
  console.log(`📊 Orchestration Statistics:`);
  console.log(`  Active Agents: ${finalStats.activeAgents}`);
  console.log(`  Completed Agents: ${finalStats.completedAgents}`);
  console.log(`  Failed Agents: ${finalStats.failedAgents}`);
  console.log(`  Total Agents Spawned: ${finalStats.totalSpawned}\n`);

  const monitoringData =
    enhancedMultiAgentOrchestrator.getMonitoringInterface();
  console.log("📋 Final Agent Details:");
  Object.entries(monitoringData).forEach(([id, agent]) => {
    const duration =
      agent.endTime && agent.startTime ? agent.endTime - agent.startTime : 0;
    console.log(`  ${id}: ${agent.agentType}`);
    console.log(`    Status: ${agent.status}`);
    console.log(`    Duration: ${duration}ms`);
    console.log(`    Clickable: ${agent.clickable}`);
    console.log(`    Monitorable: ${agent.monitorable}`);
    if (agent.result)
      console.log(
        `    Result: ${typeof agent.result === "object" ? "Complex result" : agent.result}`,
      );
    if (agent.error) console.log(`    Error: ${agent.error}`);
    console.log("");
  });

  // Demonstrate cancellation capability
  console.log("🚫 Demonstrating agent cancellation...\n");

  const cancellableAgent = await enhancedMultiAgentOrchestrator.spawnAgent({
    agentType: "security-auditor",
    task: "Perform comprehensive security audit",
    priority: "high",
  });

  console.log(`✅ Security auditor spawned: ${cancellableAgent.id}\n`);

  // Cancel after 2 seconds
  setTimeout(async () => {
    const cancelled = await enhancedMultiAgentOrchestrator.cancelAgent(
      cancellableAgent.id,
    );
    console.log(
      `🚫 Agent ${cancellableAgent.id} cancellation: ${cancelled ? "SUCCESS" : "FAILED"}\n`,
    );
  }, 2000);

  // Wait for cancellation to complete
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Final cleanup
  await enhancedMultiAgentOrchestrator.shutdown();
  console.log("🔄 Enhanced Multi-Agent Orchestrator shutdown complete");
}

// Run the demonstration
demonstrateClickableAgentMonitoring().catch(console.error);
