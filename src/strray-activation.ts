/**
 * StringRay Framework Activation Module
 *
 * This module handles activation of StringRay framework components
 * during oh-my-opencode initialization.
 */

import { frameworkLogger } from "./framework-logger.js";
import { ensureCriticalComponents } from "./architectural-integrity.js";

export interface StringRayActivationConfig {
  enableOrchestrator: boolean;
  enableBootOrchestrator: boolean;
  enableStateManagement: boolean;
  enableHooks: boolean;
  enableCodexInjection: boolean;
  enableProcessors: boolean;
  enablePostProcessor: boolean;
}

export const defaultStringRayConfig: StringRayActivationConfig = {
  enableOrchestrator: true,
  enableBootOrchestrator: true,
  enableStateManagement: true,
  enableHooks: true,
  enableCodexInjection: true,
  enableProcessors: true,
  enablePostProcessor: true,
};

export async function activateStringRayFramework(
  config: Partial<StringRayActivationConfig> = {},
): Promise<void> {
  const activationConfig = { ...defaultStringRayConfig, ...config };

  // Banner display moved to init.sh execution in plugin
  // Framework activation proceeds quietly

  frameworkLogger.log(
    "stringray-activation",
    "beginning StringRay framework activation",
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

    if (activationConfig.enableBootOrchestrator) {
      await activateBootOrchestrator();
    }

    if (activationConfig.enableStateManagement) {
      await activateStateManagement();
    }

    if (activationConfig.enableProcessors) {
      await activateProcessors();
    }

    if (activationConfig.enablePostProcessor) {
      await activatePostProcessor();
    }

    // Ensure architectural integrity - critical components must always be active
    await ensureCriticalComponents();

    // Loading display moved to init.sh for dramatic line-by-line presentation

    frameworkLogger.log(
      "stringray-activation",
      "StringRay framework activation completed successfully",
      "success",
    );
  } catch (error) {
    console.error("❌ StringRay Framework activation failed:", error);
    frameworkLogger.log(
      "stringray-activation",
      "StringRay framework activation failed",
      "error",
      error,
    );
    throw error;
  }
}

async function activateCodexInjection(): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating codex injection",
    "info",
  );

  const { createStringRayCodexInjectorHook } = await import("./codex-injector.js");
  const hook = createStringRayCodexInjectorHook();

  (globalThis as any).strRayHooks = (globalThis as any).strRayHooks || [];

  frameworkLogger.log(
    "stringray-activation",
    "codex injection activated",
    "success",
  );
}

async function activateHooks(): Promise<void> {
  // Temporarily disabled hooks activation to prevent import errors
  // frameworkLogger.log("stringray-activation", "activating StringRay hooks", "info");
  // const { loadHooks } = await import("./index.js");
  // await loadHooks();
  // frameworkLogger.log("stringray-activation", "StringRay hooks activated", "success");
}

async function activateBootOrchestrator(): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating boot orchestrator",
    "info",
  );

  const { bootOrchestrator } = await import("./boot-orchestrator.js");

  await bootOrchestrator.executeBootSequence();

  frameworkLogger.log(
    "stringray-activation",
    "boot orchestrator activated",
    "success",
  );
}

async function activateStateManagement(): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating state management",
    "info",
  );

  const { StringRayStateManager } = await import("./state/state-manager.js");
  const stateManager = new StringRayStateManager();

  // Store the state manager instance globally for framework use
  (globalThis as any).strRayStateManager = stateManager;

  frameworkLogger.log(
    "stringray-activation",
    "state management activated",
    "success",
  );
}

async function activateOrchestrator(): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating StringRay orchestrator",
    "info",
  );

  const { strRayOrchestrator } = await import("./orchestrator.js");

  frameworkLogger.log(
    "stringray-activation",
    "StringRay orchestrator activated",
    "success",
  );
}

async function activateProcessors(): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating processor pipeline",
    "info",
  );

  const { ProcessorManager } =
    await import("./processors/processor-manager.js");
  const { StringRayStateManager } = await import("./state/state-manager.js");

  const stateManager = new StringRayStateManager();
  const processorManager = new ProcessorManager(stateManager);

  // Store the processor manager instance globally for framework use
  (globalThis as any).strRayProcessorManager = processorManager;

  frameworkLogger.log(
    "stringray-activation",
    "processor pipeline activated",
    "success",
  );
}

async function activatePostProcessor(): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating post-processor system",
    "info",
  );

  const { PostProcessor } = await import("./postprocessor/PostProcessor.js");

  // Get existing state manager (should be initialized by boot orchestrator)
  const stateManager = (globalThis as any).strRayStateManager as any;
  if (!stateManager) {
    throw new Error(
      "State manager not initialized - boot orchestrator must run first",
    );
  }

  // Create post-processor with optional session monitor
  // Session monitor may not be available in plugin context
  const postProcessor = new PostProcessor(stateManager, null, {});

  // Store the post-processor instance globally for framework use
  (globalThis as any).strRayPostProcessor = postProcessor;

  frameworkLogger.log(
    "stringray-activation",
    "post-processor system activated",
    "success",
  );
}
