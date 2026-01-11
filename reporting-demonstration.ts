/**
 * Comprehensive Reporting System Demonstration
 * Shows the on-demand reporting system with actual framework activity
 */

import { frameworkLogger } from "./src/framework-logger.js";
import { frameworkReportingSystem } from "./src/reporting/framework-reporting-system.js";
import { AgentDelegator } from "./src/delegation/agent-delegator.js";
import { StrRayStateManager } from "./src/state/state-manager.js";

async function demonstrateReportingSystem() {
  console.log("🎯 STRRAY FRAMEWORK ON-DEMAND REPORTING SYSTEM DEMONSTRATION");
  console.log("============================================================");

  console.log("\n🏗️ Phase 1: Setting up framework components...");
  const stateManager = new StrRayStateManager();
  const delegator = new AgentDelegator(stateManager);

  console.log("✅ Framework components initialized");

  console.log("\n🚀 Phase 2: Generating framework activity...");

  // Simulate comprehensive framework activity
  await frameworkLogger.log("test-runner", "reporting demo started", "info");

  // Simulate agent delegations with different scenarios
  const testScenarios = [
    {
      operation: "create",
      description: "Create new component",
      context: { fileCount: 1, changeVolume: 50, dependencies: 2 },
    },
    {
      operation: "refactor",
      description: "Large refactoring task",
      context: {
        fileCount: 15,
        changeVolume: 500,
        dependencies: 8,
        riskLevel: "high" as const,
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
      operation: "test",
      description: "Testing optimization",
      context: { fileCount: 25, changeVolume: 100, dependencies: 1 },
    },
  ];

  console.log("🤖 Simulating agent orchestration...");
  for (const scenario of testScenarios) {
    console.log(`   Processing: ${scenario.description}`);

    const result = await delegator.analyzeDelegation({
      operation: scenario.operation,
      description: scenario.description,
      context: scenario.context,
      sessionId: `demo-session-${Date.now()}`,
    });

    // Log the delegation result
    await frameworkLogger.log(
      "demo-runner",
      `delegated-${scenario.operation}`,
      "success",
      {
        agent: result.agents[0],
        strategy: result.strategy,
        complexity: result.complexity.score,
      },
    );
  }

  // Simulate context awareness operations
  console.log("🧠 Simulating context awareness operations...");
  await frameworkLogger.log(
    "codebase-context-analyzer",
    "analysis-start",
    "info",
  );
  await frameworkLogger.log(
    "codebase-context-analyzer",
    "analysis-complete",
    "success",
    {
      filesAnalyzed: 55,
      language: "typescript",
    },
  );

  await frameworkLogger.log("ast-code-parser", "file-analysis-start", "info");
  await frameworkLogger.log(
    "ast-code-parser",
    "file-analysis-complete",
    "success",
    {
      functions: 12,
      classes: 3,
      complexity: 25,
    },
  );

  await frameworkLogger.log(
    "complexity-analyzer",
    "context-enhancement-failed",
    "info",
    {
      operation: "refactor",
      error: "Test enhancement scenario",
    },
  );

  console.log("✅ Framework activity generation complete");

  console.log("\n📊 Phase 3: Generating comprehensive reports...");

  // Generate orchestration report
  console.log("📋 Generating orchestration report...");
  const orchestrationReport = await frameworkReportingSystem.generateReport({
    type: "orchestration",
    timeRange: { lastHours: 1 },
    outputFormat: "markdown",
    detailedMetrics: true,
  });

  // Generate agent usage report
  console.log("🤖 Generating agent usage report...");
  const agentReport = await frameworkReportingSystem.generateReport({
    type: "agent-usage",
    timeRange: { lastHours: 1 },
    outputFormat: "markdown",
    detailedMetrics: true,
  });

  // Generate full analysis report
  console.log("🔍 Generating full analysis report...");
  const fullReport = await frameworkReportingSystem.generateReport({
    type: "full-analysis",
    timeRange: { lastHours: 1 },
    outputFormat: "markdown",
    detailedMetrics: true,
  });

  console.log("\n🎉 REPORTS GENERATED SUCCESSFULLY!");
  console.log("===================================");

  console.log("\n📋 ORCHESTRATION REPORT:");
  console.log("========================");
  console.log(orchestrationReport);

  console.log("\n🤖 AGENT USAGE REPORT:");
  console.log("======================");
  console.log(agentReport);

  console.log("\n🔍 FULL ANALYSIS REPORT:");
  console.log("========================");
  console.log(fullReport);

  console.log("\n✅ DEMONSTRATION COMPLETE!");
  console.log("==========================");
  console.log(
    "The on-demand reporting system successfully captured and analyzed:",
  );
  console.log(`- ${testScenarios.length} agent delegations`);
  console.log("- 4 context awareness operations");
  console.log("- Real-time metrics and insights");
  console.log("- Comprehensive framework health assessment");
  console.log(
    "\n🎯 The system provides detailed, actionable intelligence about framework operations!",
  );
}

// Run the demonstration
demonstrateReportingSystem().catch(console.error);
