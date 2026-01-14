/**
 * Context Enhancement Debug Script
 * Debug the context enhancement process to see why it's failing
 */

import { frameworkLogger } from "./src/framework-logger.js";
import { ComplexityAnalyzer } from "./src/delegation/complexity-analyzer.js";
import { CodebaseContextAnalyzer } from "./src/delegation/codebase-context-analyzer.js";
import { ASTCodeParser } from "./src/delegation/ast-code-parser.js";
import { DependencyGraphBuilder } from "./src/delegation/dependency-graph-builder.js";

async function debugContextEnhancement() {
  console.log("🔧 DEBUGGING CONTEXT ENHANCEMENT PROCESS");
  console.log("======================================");

  // Create context providers
  console.log("\n🏗️ Creating context providers...");
  const contextAnalyzer = new CodebaseContextAnalyzer();
  const astParser = new ASTCodeParser();
  const dependencyBuilder = new DependencyGraphBuilder(
    contextAnalyzer,
    astParser,
  );

  console.log("✅ Context providers created");

  // Create complexity analyzer and set providers
  console.log("\n🔗 Setting up complexity analyzer with context providers...");
  const complexityAnalyzer = new ComplexityAnalyzer();
  complexityAnalyzer.setContextProviders(
    contextAnalyzer,
    astParser,
    dependencyBuilder,
  );
  console.log("✅ Context providers connected to complexity analyzer");

  // Test context enhancement with a file path
  console.log("\n🎯 Testing context enhancement with file path...");
  const testContext = {
    fileCount: 5,
    changeVolume: 100,
    dependencies: 3,
    riskLevel: "medium" as const,
    filePath: "src/delegation/agent-delegator.ts",
  };

  console.log("Test context:", testContext);

  try {
    console.log("\n📊 Running complexity analysis with context enhancement...");
    const metrics = await complexityAnalyzer.analyzeComplexity(
      "refactor",
      testContext,
    );
    console.log("✅ Context enhancement succeeded!");
    console.log("Enhanced metrics:", {
      fileCount: metrics.fileCount,
      changeVolume: metrics.changeVolume,
      dependencies: metrics.dependencies,
      riskLevel: metrics.riskLevel,
      estimatedDuration: metrics.estimatedDuration,
    });
  } catch (error) {
    console.log("❌ Context enhancement failed:", error);

    // Check individual components
    console.log("\n🔍 Checking individual context providers...");

    try {
      console.log("Testing CodebaseContextAnalyzer...");
      const analysis = await contextAnalyzer.analyzeCodebase();
      console.log(
        "✅ CodebaseContextAnalyzer works - files:",
        analysis.structure.totalFiles,
      );
    } catch (e) {
      console.log("❌ CodebaseContextAnalyzer failed:", e);
    }

    try {
      console.log("Testing ASTCodeParser...");
      const astAnalysis = await astParser.analyzeFile(
        "src/delegation/agent-delegator.ts",
      );
      console.log(
        "✅ ASTCodeParser works - functions:",
        astAnalysis.structure.functions.length,
      );
    } catch (e) {
      console.log("❌ ASTCodeParser failed:", e);
    }
  }

  // Check logs for any errors
  console.log("\n📋 Checking recent logs for errors...");
  const recentLogs = frameworkLogger.getRecentLogs(20);
  const errorLogs = recentLogs.filter(
    (log) => log.status === "error" || log.action.includes("failed"),
  );

  if (errorLogs.length > 0) {
    console.log("Recent errors:");
    errorLogs.forEach((log) => {
      console.log(
        `  ${log.timestamp} [${log.component}] ${log.action}: ${JSON.stringify(log.details)}`,
      );
    });
  } else {
    console.log("No recent errors found");
  }

  console.log("\n✅ Context enhancement debugging complete!");
}

// Run the debug
debugContextEnhancement().catch(console.error);
