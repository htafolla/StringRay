// Test script to demonstrate framework logging
// Run with: npx tsx test-logging.ts

import { frameworkLogger } from "./src/framework-logger.js";

async function runTest() {
  console.log("🧪 Testing StrRay Framework Logging System");
  console.log("==========================================");

  // Simulate framework component activity
  await frameworkLogger.log("test-runner", "logging system test started", "info");

  await frameworkLogger.log("codex-injector", "test hook execution", "success", { tool: "write" });
  await frameworkLogger.log("processor-manager", "test processor execution", "success", { operation: "validate" });
  await frameworkLogger.log("state-manager", "test state operation", "success", { key: "test" });
  await frameworkLogger.log("boot-orchestrator", "test boot sequence", "success");

  await frameworkLogger.log("test-runner", "logging system test completed", "success");

  // Display rundown
  frameworkLogger.printRundown();

  console.log("\n✅ Logging test completed. Check above output for framework activity.");
}

runTest();