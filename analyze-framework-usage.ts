/**
 * Framework Usage Analysis Script
 * Analyzes StrRay framework logs to understand flow, agents, and usage patterns
 */

import { frameworkLogger } from "./src/framework-logger.js";
import { strRayConfigLoader } from "./src/config-loader.js";
import { AgentDelegator } from "./src/delegation/agent-delegator.js";
import { StrRayStateManager } from "./src/state/state-manager.js";

async function analyzeFrameworkUsage() {
  console.log("🔍 ANALYZING STRRAY FRAMEWORK USAGE PATTERNS");
  console.log("============================================");

  // Load configuration
  console.log("\n📋 Loading framework configuration...");
  const config = strRayConfigLoader.loadConfig();
  console.log(
    `✅ Configuration loaded: ${Object.keys(config).length} settings`,
  );

  // Initialize components
  console.log("\n🏗️ Initializing framework components...");
  const stateManager = new StrRayStateManager();
  const delegator = new AgentDelegator(stateManager);

  // Simulate some framework activity
  console.log("\n🚀 Simulating framework operations...");

  // Test delegation with different scenarios
  const testScenarios = [
    {
      operation: "create",
      description: "Create new component",
      context: { fileCount: 1, changeVolume: 50, dependencies: 2 },
    },
    {
      operation: "refactor",
      description: "Large refactoring task with context awareness",
      context: {
        fileCount: 15,
        changeVolume: 500,
        dependencies: 8,
        riskLevel: "high" as const,
        filePath: "src/delegation/agent-delegator.ts", // Trigger context enhancement
      },
    },
    {
      operation: "debug",
      description: "Complex debugging task",
      context: {
        fileCount: 3,
        changeVolume: 20,
        dependencies: 5,
        riskLevel: "critical" as const,
      },
    },
    {
      operation: "analyze",
      description: "Codebase analysis with context awareness",
      context: {
        fileCount: 25,
        changeVolume: 100,
        dependencies: 1,
        files: ["src/delegation/", "src/monitoring/"], // Trigger codebase analysis
      },
    },
  ];

  for (const scenario of testScenarios) {
    console.log(`\n🎯 Testing scenario: ${scenario.description}`);

    const result = await delegator.analyzeDelegation({
      operation: scenario.operation,
      description: scenario.description,
      context: scenario.context,
      sessionId: `test-session-${Date.now()}`,
    });

    console.log(`   Strategy: ${result.strategy}`);
    console.log(`   Agents: ${result.agents.join(", ")}`);
    console.log(
      `   Complexity Score: ${result.complexity.score} (${result.complexity.level})`,
    );
    console.log(`   Estimated Duration: ${result.estimatedDuration} minutes`);
  }

  // Analyze logs
  console.log("\n📊 FRAMEWORK USAGE ANALYSIS");
  console.log("===========================");

  const recentLogs = frameworkLogger.getRecentLogs(100);
  console.log(`\n📈 Total logged events: ${recentLogs.length}`);

  // Analyze by component
  const componentStats = new Map<
    string,
    { count: number; success: number; error: number }
  >();

  for (const log of recentLogs) {
    if (!componentStats.has(log.component)) {
      componentStats.set(log.component, { count: 0, success: 0, error: 0 });
    }
    const stats = componentStats.get(log.component)!;
    stats.count++;
    if (log.status === "success") stats.success++;
    if (log.status === "error") stats.error++;
  }

  console.log("\n🏗️ COMPONENT USAGE BREAKDOWN:");
  for (const [component, stats] of Array.from(componentStats).sort(
    (a, b) => b[1].count - a[1].count,
  )) {
    const successRate =
      stats.count > 0
        ? ((stats.success / stats.count) * 100).toFixed(1)
        : "0.0";
    console.log(
      `   ${component}: ${stats.count} actions (${successRate}% success, ${stats.error} errors)`,
    );
  }

  // Analyze action patterns
  const actionStats = new Map<string, number>();
  for (const log of recentLogs) {
    const key = `${log.component}:${log.action}`;
    actionStats.set(key, (actionStats.get(key) || 0) + 1);
  }

  console.log("\n⚡ MOST COMMON ACTIONS:");
  for (const [action, count] of Array.from(actionStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)) {
    console.log(`   ${action}: ${count} times`);
  }

  // Analyze temporal patterns
  const timeStats = recentLogs.reduce(
    (acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  console.log("\n⏰ ACTIVITY BY HOUR:");
  for (let hour = 0; hour < 24; hour++) {
    const count = timeStats[hour] || 0;
    if (count > 0) {
      console.log(
        `   ${hour.toString().padStart(2, "0")}:00: ${count} actions`,
      );
    }
  }

  // Framework health check
  const errorLogs = recentLogs.filter((log) => log.status === "error");
  const successRate =
    recentLogs.length > 0
      ? (
          (recentLogs.filter((l) => l.status === "success").length /
            recentLogs.length) *
          100
        ).toFixed(1)
      : "0.0";

  console.log("\n🏥 FRAMEWORK HEALTH:");
  console.log(`   Overall success rate: ${successRate}%`);
  console.log(`   Total errors: ${errorLogs.length}`);
  if (errorLogs.length > 0) {
    console.log("   Recent errors:");
    errorLogs.slice(-3).forEach((error) => {
      console.log(
        `     - ${error.component}:${error.action} (${new Date(error.timestamp).toLocaleTimeString()})`,
      );
    });
  }

  // Agent usage analysis
  const agentLogs = recentLogs.filter(
    (log) => log.agent && log.agent !== "sisyphus",
  );
  console.log("\n🤖 AGENT USAGE:");
  if (agentLogs.length > 0) {
    const agentStats = agentLogs.reduce(
      (acc, log) => {
        acc[log.agent] = (acc[log.agent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [agent, count] of Object.entries(agentStats).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`   ${agent}: ${count} invocations`);
    }
  } else {
    console.log("   No specific agent usage detected in logs");
  }

  console.log("\n✅ Framework usage analysis complete!");
}

// Run the analysis
analyzeFrameworkUsage().catch(console.error);
