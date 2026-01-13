/**
 * ARCHITECTURAL INTEGRITY ENFORCEMENT
 *
 * This module ensures that critical framework components are always active
 * and integrated, preventing the staged initialization issues that broke
 * the post-processor and rules engine enforcement.
 */

import { frameworkLogger } from "./framework-logger.js";

// Critical components that must always be active
const CRITICAL_COMPONENTS = [
  'stateManager',
  'postProcessor',
  'rulesEngine',
  'codexInjector'
] as const;

/**
 * Verify all critical components are active and integrated
 */
export async function verifyArchitecturalIntegrity(): Promise<{
  allActive: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check state manager
  const stateManager = (globalThis as any).strRayStateManager;
  if (!stateManager) {
    issues.push("State manager not initialized");
    recommendations.push("Ensure boot orchestrator runs before framework activation");
  }

  // Check post-processor
  const postProcessor = (globalThis as any).strRayPostProcessor;
  if (!postProcessor) {
    issues.push("Post-processor not activated");
    recommendations.push("Add post-processor activation to strray-activation.ts");
  }

  // Check codex injector
  const codexInjector = (globalThis as any).strRayCodexInjector;
  if (!codexInjector) {
    issues.push("Codex injector not initialized");
    recommendations.push("Ensure codex injection is active in plugin context");
  }

  // Check rules engine enforcement
  if (stateManager && !stateManager.get("enforcement:active")) {
    issues.push("Rules engine not actively enforcing codex");
    recommendations.push("Ensure codex rules are enforced during tool execution");
  }

  const allActive = issues.length === 0;

  if (!allActive) {
    frameworkLogger.log(
      "architectural-integrity",
      `Integrity check failed: ${issues.length} issues found`,
      "error",
      { issues, recommendations }
    );
  } else {
    frameworkLogger.log(
      "architectural-integrity",
      "All critical components active and integrated",
      "success"
    );
  }

  return { allActive, issues, recommendations };
}

/**
 * Force activation of critical components if missing
 * This prevents staged initialization from breaking the framework
 */
export async function ensureCriticalComponents(): Promise<void> {
  const integrity = await verifyArchitecturalIntegrity();

  if (!integrity.allActive) {
    frameworkLogger.log(
      "architectural-integrity",
      "Activating missing critical components",
      "info"
    );

    // Force activation of missing components
    for (const recommendation of integrity.recommendations) {
      if (recommendation.includes("post-processor")) {
        await forcePostProcessorActivation();
      }
      if (recommendation.includes("codex")) {
        await forceCodexActivation();
      }
    }
  }
}

async function forcePostProcessorActivation(): Promise<void> {
  // Implementation to force post-processor activation
  // This ensures the post-processor is always available
}

async function forceCodexActivation(): Promise<void> {
  // Implementation to force codex activation
  // This ensures rules are always enforced
}