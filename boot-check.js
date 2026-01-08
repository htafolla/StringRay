#!/usr/bin/env node

/**
 * StrRay Framework v1.0.0 - Boot Check Script
 *
 * Validates orchestrator-first boot sequence and enforcement activation.
 * Ensures backward compatibility and proper initialization.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import fs from "fs";
import path from "path";

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function checkOrchestratorFirstLoading() {
  log("🔍 Checking orchestrator-first loading...");

  try {
    const initScript = fs.readFileSync(".opencode/init.sh", "utf8");
    const orchestratorFirst = initScript.includes('AGENTS=("orchestrator"');

    if (orchestratorFirst) {
      log("✅ Orchestrator is loaded first in agent initialization");
      return true;
    } else {
      log("❌ Orchestrator is not prioritized in agent loading");
      return false;
    }
  } catch (error) {
    log(`❌ Failed to check orchestrator loading: ${error.message}`);
    return false;
  }
}

function checkBootOrchestratorIntegration() {
  log("🔍 Checking BootOrchestrator integration...");

  try {
    const bootOrchestratorExists = fs.existsSync("src/boot-orchestrator.ts");

    if (bootOrchestratorExists) {
      log("✅ BootOrchestrator class exists");
    } else {
      log("❌ BootOrchestrator class missing");
      return false;
    }

    const orchestratorExists = fs.existsSync("src/orchestrator.ts");

    if (orchestratorExists) {
      log("✅ StrRayOrchestrator class exists");
    } else {
      log("❌ StrRayOrchestrator class missing");
      return false;
    }

    const initScript = fs.readFileSync(".opencode/init.sh", "utf8");
    const hasBootOrchestratorCall = initScript.includes("BootOrchestrator");

    if (hasBootOrchestratorCall) {
      log("✅ BootOrchestrator integration in init.sh");
      return true;
    } else {
      log("❌ BootOrchestrator not integrated in init.sh");
      return false;
    }
  } catch (error) {
    log(`❌ Failed to check BootOrchestrator integration: ${error.message}`);
    return false;
  }
}

function checkEnforcementActivation() {
  log("🔍 Checking automatic enforcement activation...");

  try {
    const bootOrchestratorContent = fs.readFileSync(
      "src/boot-orchestrator.ts",
      "utf8",
    );
    const hasEnforcementLogic =
      bootOrchestratorContent.includes("enableEnforcement");

    if (hasEnforcementLogic) {
      log("✅ Automatic enforcement activation implemented");
      return true;
    } else {
      log("❌ Automatic enforcement activation missing");
      return false;
    }
  } catch (error) {
    log(`❌ Failed to check enforcement activation: ${error.message}`);
    return false;
  }
}

function checkCodexComplianceBootTime() {
  log("🔍 Checking codex compliance at boot time...");

  try {
    const bootOrchestratorContent = fs.readFileSync(
      "src/boot-orchestrator.ts",
      "utf8",
    );
    const hasCodexCompliance = bootOrchestratorContent.includes(
      "activateCodexCompliance",
    );

    if (hasCodexCompliance) {
      log("✅ Codex compliance checking at boot time implemented");
      return true;
    } else {
      log("❌ Codex compliance checking at boot time missing");
      return false;
    }
  } catch (error) {
    log(`❌ Failed to check codex compliance: ${error.message}`);
    return false;
  }
}

function checkBackwardCompatibility() {
  log("🔍 Checking backward compatibility...");

  try {
    const initScript = fs.readFileSync(".opencode/init.sh", "utf8");
    const requiredAgents = [
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect",
    ];

    let missingAgents = [];
    for (const agent of requiredAgents) {
      if (!initScript.includes(`"${agent}"`)) {
        missingAgents.push(agent);
      }
    }

    if (missingAgents.length === 0) {
      log("✅ All required agents present (backward compatibility maintained)");
      return true;
    } else {
      log(`❌ Missing agents: ${missingAgents.join(", ")}`);
      return false;
    }
  } catch (error) {
    log(`❌ Failed to check backward compatibility: ${error.message}`);
    return false;
  }
}

function main() {
  log("🚀 StrRay Boot Check: Validating orchestrator-first boot sequence");
  log("========================================================");

  const checks = [
    { name: "Orchestrator-first loading", func: checkOrchestratorFirstLoading },
    {
      name: "BootOrchestrator integration",
      func: checkBootOrchestratorIntegration,
    },
    {
      name: "Automatic enforcement activation",
      func: checkEnforcementActivation,
    },
    {
      name: "Codex compliance at boot time",
      func: checkCodexComplianceBootTime,
    },
    { name: "Backward compatibility", func: checkBackwardCompatibility },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    log(`\\n--- ${check.name} ---`);
    try {
      if (check.func()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ Check failed with error: ${error.message}`);
      failed++;
    }
  }

  log("\\n========================================================");
  log(`Boot Check Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    log("✅ All boot sequence validations passed!");
    process.exit(0);
  } else {
    log("❌ Boot sequence validation failed!");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkOrchestratorFirstLoading,
  checkBootOrchestratorIntegration,
  checkEnforcementActivation,
  checkCodexComplianceBootTime,
  checkBackwardCompatibility,
};
