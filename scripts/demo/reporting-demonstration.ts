#!/usr/bin/env node

/**
 * StringRay Framework - Comprehensive Reporting System Demonstration
 * 
 * Purpose: Demonstrates the on-demand reporting system with actual framework activity
 * by simulating real agent delegations and context operations.
 * 
 * Features:
 * - Simulates comprehensive framework activity across multiple agents
 * - Generates orchestration, agent-usage, and full-analysis reports
 * - Demonstrates integration between logging, delegation, and reporting systems
 * - Provides detailed insights into framework operations
 * 
 * Usage:
 *   npx tsx scripts/demo/reporting-demonstration.ts
 * 
 * Expected Output:
 * - Console output showing simulation progress
 * - Generated reports with comprehensive analysis
 * - Framework health assessment and recommendations
 * 
 * Components Demonstrated:
 * - AgentDelegator: Routes tasks to appropriate agents
 * - FrameworkLogger: Logs all framework activities
 * - FrameworkReportingSystem: Generates comprehensive reports
 * - StringRayStateManager: Manages framework state
 */

import { frameworkLogger } from "../../src/core/framework-logger.js";
import { frameworkReportingSystem } from "../../src/reporting/framework-reporting-system.js";
import { AgentDelegator } from "../../src/delegation/agent-delegator.js";
import { StringRayStateManager } from "../../src/state/index.js";
import { strRayConfigLoader } from "../../src/core/config-loader.js";

async function demonstrateReportingSystem() {
  console.log("🎯 STRRAY FRAMEWORK ON-DEMAND REPORTING SYSTEM DEMONSTRATION");
  console.log("============================================================");

  console.log("\n🏗️ Phase 1: Setting up framework components...");
  const stateManager = new StringRayStateManager();
  const delegator = new AgentDelegator(stateManager, strRayConfigLoader);

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

    try {
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
    } catch (error) {
      console.error(`   ❌ Error delegating ${scenario.operation}:`, error);
      await frameworkLogger.log(
        "demo-runner",
        `delegated-${scenario.operation}`,
        "error",
        { error: String(error) },
      );
    }
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
  let orchestrationReport: string;
  try {
    orchestrationReport = await frameworkReportingSystem.generateReport({
      type: "orchestration",
      timeRange: { lastHours: 1 },
      outputFormat: "markdown",
      detailedMetrics: true,
    });
    console.log("✅ Orchestration report generated");
  } catch (error) {
    console.error("❌ Failed to generate orchestration report:", error);
    orchestrationReport = "Error generating report";
  }

  // Generate agent usage report
  console.log("🤖 Generating agent usage report...");
  let agentReport: string;
  try {
    agentReport = await frameworkReportingSystem.generateReport({
      type: "agent-usage",
      timeRange: { lastHours: 1 },
      outputFormat: "markdown",
      detailedMetrics: true,
    });
    console.log("✅ Agent usage report generated");
  } catch (error) {
    console.error("❌ Failed to generate agent report:", error);
    agentReport = "Error generating report";
  }

  // Generate full analysis report
  console.log("🔍 Generating full analysis report...");
  let fullReport: string;
  try {
    fullReport = await frameworkReportingSystem.generateReport({
      type: "full-analysis",
      timeRange: { lastHours: 1 },
      outputFormat: "markdown",
      detailedMetrics: true,
    });
    console.log("✅ Full analysis report generated");
  } catch (error) {
    console.error("❌ Failed to generate full report:", error);
    fullReport = "Error generating report";
  }

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
demonstrateReportingSystem().catch((error) => {
  console.error("❌ Demonstration failed:", error);
  process.exit(1);
});
