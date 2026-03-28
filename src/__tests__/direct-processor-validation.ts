/**
 * Direct Processor Validation Tests
 * 
 * This script tests each pre/post processor directly to verify
 * they work correctly in the enforcement pipeline.
 * 
 * Run with: npx tsx src/__tests__/direct-processor-validation.ts
 */

import { StringRayStateManager } from "../state/state-manager.js";
import { ProcessorManager } from "../processors/processor-manager.js";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPreValidate(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing preValidate processor...");
  
  try {
    // Test with no data (should skip gracefully)
    const result1 = await (pm as any).executePreValidate({});
    console.log("  ✓ No data test:", result1);
    
    // Test with valid data
    const result2 = await (pm as any).executePreValidate({
      data: "function test() { return true; }",
      filePath: "/test/file.ts"
    });
    console.log("  ✓ Valid data test:", result2);
    
    // Test with undefined usage (should throw)
    try {
      await (pm as any).executePreValidate({
        data: "const x = undefined;",
        filePath: "/test/file.ts"
      });
      console.log("  ✗ Should have thrown for undefined usage");
    } catch (e: any) {
      console.log("  ✓ Correctly caught undefined usage:", e.message);
    }
    
    console.log("  ✅ preValidate processor: WORKING");
  } catch (error) {
    console.error("  ❌ preValidate processor FAILED:", error);
  }
}

async function testVersionCompliance(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing versionCompliance processor...");
  
  try {
    const result = await (pm as any).executeVersionCompliance({ operation: "test" });
    console.log("  Result:", JSON.stringify(result, null, 2));
    
    if (result.success !== undefined && result.checkedAt) {
      console.log("  ✅ versionCompliance processor: WORKING");
    } else {
      console.log("  ❌ versionCompliance processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ versionCompliance processor FAILED:", error);
  }
}

async function testCodexCompliance(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing codexCompliance processor...");
  
  try {
    const result = await (pm as any).executeCodexCompliance({
      operation: "write",
      files: ["/test/file.ts"],
      newCode: "function test() { return true; }"
    });
    console.log("  Result:", JSON.stringify(result, null, 2));
    
    if (result.compliant !== undefined && result.termsChecked !== undefined) {
      console.log("  ✅ codexCompliance processor: WORKING");
    } else {
      console.log("  ❌ codexCompliance processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ codexCompliance processor FAILED:", error);
  }
}

async function testErrorBoundary(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing errorBoundary processor...");
  
  try {
    const result = await (pm as any).executeErrorBoundary({ operation: "test" });
    console.log("  Result:", result);
    
    if (result.boundaries === "established") {
      console.log("  ✅ errorBoundary processor: WORKING");
    } else {
      console.log("  ❌ errorBoundary processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ errorBoundary processor FAILED:", error);
  }
}

async function testStateValidation(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing stateValidation post-processor...");
  
  try {
    const result = await (pm as any).executeStateValidation({ operation: "test" });
    console.log("  Result:", result);
    
    if (result.stateValid !== undefined) {
      console.log("  ✅ stateValidation processor: WORKING");
    } else {
      console.log("  ❌ stateValidation processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ stateValidation processor FAILED:", error);
  }
}

async function testTestExecution(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing testExecution post-processor...");
  
  try {
    // Test with no file path (runs all tests)
    const result = await (pm as any).executeTestExecution({
      tool: "test",
      directory: process.cwd()
    });
    console.log("  Result - Tests:", result.testsExecuted, "Passed:", result.passed, "Failed:", result.failed);
    
    if (result.testsExecuted !== undefined) {
      console.log("  ✅ testExecution processor: WORKING");
    } else {
      console.log("  ❌ testExecution processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ testExecution processor FAILED:", error);
  }
}

async function testRegressionTesting(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing regressionTesting post-processor...");
  
  try {
    const result = await (pm as any).executeRegressionTesting({ operation: "test" });
    console.log("  Result:", result);
    
    if (result.regressions === "checked") {
      console.log("  ✅ regressionTesting processor: WORKING (placeholder)");
    } else {
      console.log("  ❌ regressionTesting processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ regressionTesting processor FAILED:", error);
  }
}

async function testCoverageAnalysis(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing coverageAnalysis post-processor...");
  
  try {
    const result = await (pm as any).executeCoverageAnalysis({ operation: "test" });
    console.log("  Result:", result);
    
    if (result.success === true) {
      console.log("  ✅ coverageAnalysis processor: WORKING");
    } else {
      console.log("  ❌ coverageAnalysis processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ coverageAnalysis processor FAILED:", error);
  }
}

async function testTestAutoCreation(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing testAutoCreation processor...");
  
  try {
    const result = await (pm as any).executeTestAutoCreation({
      tool: "write",
      operation: "create",
      filePath: "/test/new-feature.ts",
      directory: process.cwd()
    });
    console.log("  Result:", JSON.stringify(result, null, 2));
    
    if (result.success !== undefined) {
      console.log("  ✅ testAutoCreation processor: WORKING");
    } else {
      console.log("  ❌ testAutoCreation processor: INVALID RESPONSE");
    }
  } catch (error) {
    console.error("  ❌ testAutoCreation processor FAILED:", error);
  }
}

async function testPreProcessors(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing executePreProcessors pipeline...");
  
  try {
    const result = await pm.executePreProcessors({
      tool: "write",
      args: { filePath: "/test/file.ts" },
      context: { operation: "write", filePath: "/test/file.ts" }
    });
    
    console.log("  Pre-processors executed:", result.results.length);
    console.log("  Overall success:", result.success);
    
    for (const r of result.results) {
      console.log(`    - ${r.processorName}: ${r.success ? "✅" : "❌"} (${r.duration}ms)`);
      if (!r.success) {
        console.log(`      Error: ${r.error}`);
      }
    }
    
    if (result.results.length > 0) {
      console.log("  ✅ executePreProcessors pipeline: WORKING");
    } else {
      console.log("  ❌ executePreProcessors pipeline: NO PROCESSORS EXECUTED");
    }
  } catch (error) {
    console.error("  ❌ executePreProcessors pipeline FAILED:", error);
  }
}

async function testPostProcessors(pm: ProcessorManager): Promise<void> {
  console.log("\n🧪 Testing executePostProcessors pipeline...");
  
  try {
    const preResults = [
      { success: true, processorName: "preValidate", duration: 10 },
      { success: true, processorName: "codexCompliance", duration: 20 }
    ];
    
    const result = await pm.executePostProcessors(
      "write",
      { filePath: "/test/file.ts", operation: "write" },
      preResults
    );
    
    console.log("  Post-processors executed:", result.length);
    
    for (const r of result) {
      console.log(`    - ${r.processorName}: ${r.success ? "✅" : "❌"} (${r.duration}ms)`);
      if (!r.success) {
        console.log(`      Error: ${r.error}`);
      }
    }
    
    if (result.length > 0) {
      console.log("  ✅ executePostProcessors pipeline: WORKING");
    } else {
      console.log("  ❌ executePostProcessors pipeline: NO PROCESSORS EXECUTED");
    }
  } catch (error) {
    console.error("  ❌ executePostProcessors pipeline FAILED:", error);
  }
}

async function runAllTests(): Promise<void> {
  console.log("=".repeat(60));
  console.log("🔬 DIRECT PROCESSOR VALIDATION TESTS");
  console.log("=".repeat(60));
  
  // Initialize state manager and processor manager
  const stateManager = new StringRayStateManager();
  
  const pm = new ProcessorManager(stateManager);
  
  // Register all processors (same as boot-orchestrator)
  pm.registerProcessor({ name: "preValidate", type: "pre", priority: 10, enabled: true });
  pm.registerProcessor({ name: "codexCompliance", type: "pre", priority: 20, enabled: true });
  pm.registerProcessor({ name: "testAutoCreation", type: "pre", priority: 22, enabled: true });
  pm.registerProcessor({ name: "versionCompliance", type: "pre", priority: 25, enabled: true });
  pm.registerProcessor({ name: "errorBoundary", type: "pre", priority: 30, enabled: true });
  pm.registerProcessor({ name: "agentsMdValidation", type: "pre", priority: 35, enabled: true });
  pm.registerProcessor({ name: "stateValidation", type: "post", priority: 130, enabled: true });
  pm.registerProcessor({ name: "testExecution", type: "post", priority: 10, enabled: true });
  pm.registerProcessor({ name: "coverageAnalysis", type: "post", priority: 20, enabled: true });
  pm.registerProcessor({ name: "regressionTesting", type: "post", priority: 120, enabled: true });
  
  // Initialize processors
  await pm.initializeProcessors();
  
  // Run individual processor tests
  await testPreValidate(pm);
  await testVersionCompliance(pm);
  await testCodexCompliance(pm);
  await testErrorBoundary(pm);
  await testStateValidation(pm);
  await testTestExecution(pm);
  await testRegressionTesting(pm);
  await testCoverageAnalysis(pm);
  await testTestAutoCreation(pm);
  
  // Run pipeline tests
  await testPreProcessors(pm);
  await testPostProcessors(pm);
  
  // Cleanup
  await pm.cleanupProcessors();
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL PROCESSOR VALIDATION TESTS COMPLETED");
  console.log("=".repeat(60));
}

runAllTests().catch(console.error);
