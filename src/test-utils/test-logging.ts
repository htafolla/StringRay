// Test script to demonstrate framework logging
// Run with: npx tsx test-logging.ts

import { frameworkLogger, generateJobId } from "../framework-logger.js";

async function runTest() {
  // Test logging header - kept as console.log for test visibility
  console.log("==========================================");

  const jobId = generateJobId('test-logging-system');

  // Simulate framework component activity
  await frameworkLogger.log(
    "test-runner",
    "logging system test started",
    "info",
    {},
    undefined, // sessionId
    jobId,
  );

  await frameworkLogger.log(
    "codex-injector",
    "test hook execution",
    "success",
    { tool: "write" },
    undefined, // sessionId
    jobId,
  );
  await frameworkLogger.log(
    "processor-manager",
    "test processor execution",
    "success",
    { operation: "validate" },
    undefined, // sessionId
    jobId,
  );
  await frameworkLogger.log(
    "state-manager",
    "test state operation",
    "success",
    { key: "test" },
    undefined, // sessionId
    jobId,
  );
  await frameworkLogger.log(
    "boot-orchestrator",
    "test boot sequence",
    "success",
    {},
    undefined, // sessionId
    jobId,
  );

  await frameworkLogger.log(
    "test-runner",
    "logging system test completed",
    "success",
    {},
    undefined, // sessionId
    jobId,
  );

  // Display rundown
  frameworkLogger.printRundown();

  console.log(
    "\n✅ Logging test completed. Check above output for framework activity.",
  );
}

runTest();
