#!/usr/bin/env node

/**
 * StringRay AI v1.0.7 - Processor Activation Test Script
 *
 * Manual test script to verify processor activation functionality.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { BootOrchestrator } from "../dist/boot-orchestrator.js";

async function testProcessorActivation() {
  console.log("🧪 Testing Processor Activation...");

  try {
    const bootOrchestrator = new BootOrchestrator({
      processorActivation: true,
      enableEnforcement: false,
      sessionManagement: false,
      agentLoading: false,
    });

    const result = await bootOrchestrator.executeBootSequence();

    console.log("Boot Result:", {
      success: result.success,
      orchestratorLoaded: result.orchestratorLoaded,
      processorsActivated: result.processorsActivated,
      errors: result.errors,
    });

    if (result.success && result.processorsActivated) {
      console.log("✅ Processor activation test PASSED");

      // Test processor health
      const status = bootOrchestrator.getBootStatus();
      console.log("Boot Status:", status);

      return true;
    } else {
      console.log("❌ Processor activation test FAILED");
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return false;
  }
}

// Run the test
testProcessorActivation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
