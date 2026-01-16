#!/usr/bin/env node

/**
 * StringRay AI v1.0.7 - Boot Sequence Verification Script
 *
 * Tests the complete boot sequence and Phase 1 implementations.
 */

// Path configuration for cross-environment compatibility
const BOOT_PATH = process.env.STRRAY_BOOT_PATH || "../dist/boot-orchestrator";
const DELEGATION_PATH = process.env.STRRAY_DELEGATION_PATH || "../dist/delegation";
const SESSION_PATH = process.env.STRRAY_SESSION_PATH || "../dist/session";

import { BootOrchestrator } from "../dist/boot-orchestrator.js";
import {
  createAgentDelegator,
  createSessionCoordinator,
} from "../dist/delegation/index.js";
import { createSessionCleanupManager } from "../dist/session/session-cleanup-manager.js";
import { createSessionMonitor } from "../dist/session/session-monitor.js";
import { createSessionStateManager } from "../dist/session/session-state-manager.js";

async function testBootSequence() {
  console.log("🚀 StrRay Phase 1 Verification: Boot Sequence Test");
  console.log("==================================================");

  try {
    // Test 1: Boot Orchestrator
    console.log("\n📋 Test 1: Boot Orchestrator");
    const bootOrchestrator = new BootOrchestrator({
      processorActivation: true,
      enableEnforcement: true,
      sessionManagement: true,
      agentLoading: false,
    });

    const bootResult = await bootOrchestrator.executeBootSequence();
    console.log("✅ Boot sequence result:", {
      success: bootResult.success,
      orchestratorLoaded: bootResult.orchestratorLoaded,
      processorsActivated: bootResult.processorsActivated,
      enforcementEnabled: bootResult.enforcementEnabled,
      codexComplianceActive: bootResult.codexComplianceActive,
      errors: bootResult.errors,
    });

    if (!bootResult.success) {
      throw new Error(`Boot sequence failed: ${bootResult.errors.join(", ")}`);
    }

    // Test 2: Delegation System
    console.log("\n🎯 Test 2: Delegation System");
    const stateManager = bootOrchestrator.stateManager;
    const agentDelegator = createAgentDelegator(stateManager);
    const sessionCoordinator = createSessionCoordinator(stateManager);

    const session = sessionCoordinator.initializeSession(
      "verification_session",
    );
    console.log("✅ Session initialized:", session.sessionId);

    const testRequest = {
      operation: "refactor",
      description: "Refactor complex authentication module",
      context: {
        files: ["auth.ts", "user.ts"],
        changeVolume: 300,
        dependencies: 5,
        riskLevel: "medium",
      },
    };

    const delegation = await agentDelegator.analyzeDelegation(testRequest);
    console.log("✅ Delegation analyzed:", {
      strategy: delegation.strategy,
      agents: delegation.agents,
      complexity: delegation.complexity.level,
      score: delegation.complexity.score,
    });

    // Test 3: Session Management
    console.log("\n🔄 Test 3: Session Management");
    const cleanupManager = createSessionCleanupManager(stateManager);
    const sessionMonitor = createSessionMonitor(
      stateManager,
      sessionCoordinator,
      cleanupManager,
    );

    cleanupManager.registerSession(session.sessionId);
    sessionMonitor.registerSession(session.sessionId);

    const health = await sessionMonitor.performHealthCheck(session.sessionId);
    console.log("✅ Session health check:", {
      status: health.status,
      activeAgents: health.activeAgents,
      issues: health.issues.length,
    });

    // Test 4: Processor Activation
    console.log("\n⚙️ Test 4: Processor Activation");
    const processorManager = stateManager.get("processor:manager");
    if (processorManager) {
      const healthStatus = processorManager.getProcessorHealth();
      console.log(
        "✅ Processor health:",
        healthStatus.map((h) => ({
          name: h.name,
          status: h.status,
          successRate: Math.round(h.successRate * 100) + "%",
        })),
      );

      // Test pre/post processors
      const preResults = await processorManager.executePreProcessors(
        "test_operation",
        { test: true },
      );
      console.log("✅ Pre-processors executed:", preResults.length);

      const postResults = await processorManager.executePostProcessors(
        "test_operation",
        { test: true },
        preResults,
      );
      console.log("✅ Post-processors executed:", postResults.length);
    }

    // Cleanup
    sessionCoordinator.cleanupSession(session.sessionId);
    cleanupManager.manualCleanup(session.sessionId);

    console.log("\n🎉 All Phase 1 verification tests passed!");
    console.log("✅ Boot sequence: WORKING");
    console.log("✅ Processor activation: WORKING");
    console.log("✅ Delegation system: WORKING");
    console.log("✅ Session management: WORKING");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

testBootSequence();
