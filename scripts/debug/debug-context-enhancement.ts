/**
 * Context Enhancement Debug Script
 * Debug the complexity analysis process (UPDATED for consolidated API)
 *
 * NOTE: This script was updated after consolidating complexity analyzers.
 * The setContextProviders() method was removed as part of the consolidation.
 * Context providers are now handled internally by the complexity analyzer.
 */

import { frameworkLogger } from "../../src/core/framework-logger.js";
import { ComplexityAnalyzer } from "../../src/delegation/complexity-analyzer.js";

async function debugComplexityAnalysis() {
  console.log("🔧 DEBUGGING COMPLEXITY ANALYSIS");
  console.log("=================================");

  // Create complexity analyzer
  console.log("\n🏗️ Creating complexity analyzer...");
  const complexityAnalyzer = new ComplexityAnalyzer();
  console.log("✅ Complexity analyzer created");

  // Test complexity analysis with various contexts
  console.log("\n🎯 Testing complexity analysis...");

  const testCases = [
    {
      name: "Simple edit",
      operation: "edit",
      context: {
        files: ["simple.ts"],
        changes: { added: 10, deleted: 5, modified: 0 },
        dependencies: [],
        riskLevel: "low",
      },
    },
    {
      name: "Complex refactor",
      operation: "refactor",
      context: {
        files: ["complex.ts", "utils.ts", "types.ts"],
        changes: { added: 200, deleted: 150, modified: 50 },
        dependencies: ["dep1", "dep2", "dep3", "dep4", "dep5"],
        riskLevel: "high",
        estimatedDuration: 120,
      },
    },
    {
      name: "Debug task",
      operation: "debug",
      context: {
        files: ["buggy.ts"],
        changes: { added: 20, deleted: 10, modified: 5 },
        dependencies: [],
        riskLevel: "critical",
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`   Operation: ${testCase.operation}`);

    try {
      const metrics = complexityAnalyzer.analyzeComplexity(
        testCase.operation,
        testCase.context,
      );

      const score = complexityAnalyzer.calculateComplexityScore(metrics);

      console.log(`   ✅ Analysis complete`);
      console.log(`   📈 Score: ${score.score}/100 (${score.level})`);
      console.log(`   🎯 Strategy: ${score.recommendedStrategy}`);
      console.log(`   👥 Agents: ${score.estimatedAgents}`);
      console.log(`   📝 Reasoning: ${score.reasoning.slice(0, 2).join("; ")}...`);
    } catch (error) {
      console.log(`   ❌ Analysis failed:`, error);
    }
  }

  // Test threshold configuration
  console.log("\n⚙️ Testing threshold configuration...");
  const currentThresholds = complexityAnalyzer.getThresholds();
  console.log("Current thresholds:", currentThresholds);

  console.log("\n✅ Complexity analysis debugging complete!");
  console.log("\n📋 Summary:");
  console.log("   - Complexity analyzer uses consolidated complexity-core.ts");
  console.log("   - Thresholds are unified across delegation and routing");
  console.log("   - Context analysis is handled internally");
}

// Run the debug
debugComplexityAnalysis().catch(console.error);
