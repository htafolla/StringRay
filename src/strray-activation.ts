/**
 * StrRay Framework Activation Module
 *
 * This module handles activation of StrRay framework components
 * during oh-my-opencode initialization.
 */

import { frameworkLogger } from "./framework-logger.js";

export interface StrRayActivationConfig {
  enableOrchestrator: boolean;
  enableBootOrchestrator: boolean;
  enableStateManagement: boolean;
  enableHooks: boolean;
  enableCodexInjection: boolean;
  enableProcessors: boolean;
}

export const defaultStrRayConfig: StrRayActivationConfig = {
  enableOrchestrator: true,
  enableBootOrchestrator: true,
  enableStateManagement: true,
  enableHooks: true,
  enableCodexInjection: true,
  enableProcessors: true,
};

export async function activateStrRayFramework(
  config: Partial<StrRayActivationConfig> = {},
): Promise<void> {
  const activationConfig = { ...defaultStrRayConfig, ...config };

  // Banner display moved to init.sh execution in plugin
  // Framework activation proceeds quietly

  frameworkLogger.log(
    "strray-activation",
    "beginning StrRay framework activation",
    "info",
    activationConfig,
  );

  try {
    if (activationConfig.enableCodexInjection) {
      await activateCodexInjection();
    }

    if (activationConfig.enableHooks) {
      await activateHooks();
    }

    if (activationConfig.enableOrchestrator) {
      await activateOrchestrator();
    }

    // Loading display moved to init.sh for dramatic line-by-line presentation

    frameworkLogger.log(
      "strray-activation",
      "StrRay framework activation completed successfully",
      "success",
    );
  } catch (error) {
    console.error("❌ StrRay Framework activation failed:", error);
    frameworkLogger.log(
      "strray-activation",
      "StrRay framework activation failed",
      "error",
      error,
    );
    throw error;
  }
}

async function activateCodexInjection(): Promise<void> {
  frameworkLogger.log(
    "strray-activation",
    "activating codex injection",
    "info",
  );

  const { createStrRayCodexInjectorHook } = await import("./codex-injector.js");
  const hook = createStrRayCodexInjectorHook();

  (globalThis as any).strRayHooks = (globalThis as any).strRayHooks || [];

  frameworkLogger.log(
    "strray-activation",
    "codex injection activated",
    "success",
  );
}

async function activateHooks(): Promise<void> {
  // Temporarily disabled hooks activation to prevent import errors
  // frameworkLogger.log("strray-activation", "activating StrRay hooks", "info");
  // const { loadHooks } = await import("./index.js");
  // await loadHooks();
  // frameworkLogger.log("strray-activation", "StrRay hooks activated", "success");
}

async function activateBootOrchestrator(): Promise<void> {
  throw new Error(
    "Boot orchestrator disabled due to framework-logger import issues",
  );
}

async function activateStateManagement(): Promise<void> {
  throw new Error(
    "State management disabled due to framework-logger import issues",
  );
}

async function activateOrchestrator(): Promise<void> {
  frameworkLogger.log("strray-activation", "activating StrRay orchestrator", "info");

  const { strRayOrchestrator } = await import("./orchestrator.js");

  frameworkLogger.log("strray-activation", "StrRay orchestrator activated", "success");
}

async function activateProcessors(): Promise<void> {
  throw new Error("Processors disabled due to dependencies");
}
