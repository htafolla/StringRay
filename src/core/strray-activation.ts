/**
 * 0xRay Framework Activation Module
 *
 * This module handles activation of 0xRay framework components
 * during OpenCode initialization.
 */

import { frameworkLogger } from "../core/framework-logger.js";
import { ensureCriticalComponents } from "../architect/architectural-integrity.js";
import { validateRegistryConsistency } from "../agents/registry.js";

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
  const jobId = `activation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const activationConfig = { ...defaultStringRayConfig, ...config };

  // Banner display moved to init.sh execution in plugin
  // Framework activation proceeds quietly

  frameworkLogger.log(
    "stringray-activation",
    "beginning 0xRay framework activation",
    "info",
    { jobId, ...activationConfig },
  );

  const registryValidation = validateRegistryConsistency();
  if (!registryValidation.valid) {
    frameworkLogger.log(
      "stringray-activation",
      "registry-validation-failed",
      "warning",
      { errors: registryValidation.errors },
    );
  }

  try {
    if (activationConfig.enableCodexInjection) {
      await activateCodexInjection(jobId);
    }

    if (activationConfig.enableHooks) {
      await activateHooks(jobId);
    }

    if (activationConfig.enableOrchestrator) {
      await activateOrchestrator(jobId);
    }

    if (activationConfig.enableBootOrchestrator) {
      await activateBootOrchestrator(jobId);
    }

    if (activationConfig.enableStateManagement) {
      await activateStateManagement(jobId);
    }

    if (activationConfig.enableProcessors) {
      await activateProcessors(jobId);
    }

    if (activationConfig.enablePostProcessor) {
      await activatePostProcessor(jobId);
    }

    // Ensure architectural integrity - critical components must always be active
    await ensureCriticalComponents();

    // Loading display moved to init.sh for dramatic line-by-line presentation

    frameworkLogger.log(
      "stringray-activation",
      "0xRay framework activation completed successfully",
      "success",
      { jobId },
    );
  } catch (error) {
    await frameworkLogger.log(
      "stringray-activation",
      "framework-activation-failed",
      "error",
      { jobId, error: String(error) },
    );
    throw error;
  }
}

async function activateCodexInjection(jobId: string): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating codex injection",
    "info",
    { jobId },
  );

  const { createStringRayCodexInjectorHook } = await import("./codex-injector.js");
  const hook = createStringRayCodexInjectorHook();

  globalThis.strRayHooks = globalThis.strRayHooks || [];
  globalThis.strRayHooks.push(hook);

  frameworkLogger.log(
    "stringray-activation",
    "codex injection activated",
    "success",
    { jobId, hookName: hook.name },
  );
}

async function activateHooks(jobId: string): Promise<void> {
  try {
    frameworkLogger.log(
      "stringray-activation",
      "activating 0xRay hooks",
      "info",
      { jobId },
    );

    // Create and register the Codex injector hook
    const { createStringRayCodexInjectorHook } = await import("./codex-injector");
    const hook = createStringRayCodexInjectorHook();
    
    // Store hook globally for OpenCode to pick up
    globalThis.strRayHooks = globalThis.strRayHooks || [];
    (globalThis.strRayHooks as Array<import("../types/global.js").StringRayHook>).push(hook);

    frameworkLogger.log(
      "stringray-activation",
      "0xRay hooks activated",
      "success",
      { 
        jobId, 
        hookName: hook.name,
        hooksRegistered: globalThis.strRayHooks!.length 
      },
    );
  } catch (error) {
    await frameworkLogger.log(
      "stringray-activation",
      "hooks activation failed",
      "error",
      { jobId, error: String(error) },
    );
  }
}

async function activateBootOrchestrator(jobId: string): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating boot orchestrator",
    "info",
    { jobId },
  );

  const { bootOrchestrator } = await import("./boot-orchestrator");

  await bootOrchestrator.executeBootSequence();

  frameworkLogger.log(
    "stringray-activation",
    "boot orchestrator activated",
    "success",
    { jobId },
  );
}

async function activateStateManagement(jobId: string): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating state management",
    "info",
    { jobId },
  );

  const { StringRayStateManager } = await import("../state/state-manager");
  const stateManager = new StringRayStateManager();

  // Store the state manager instance globally for framework use
  globalThis.strRayStateManager = stateManager;

  frameworkLogger.log(
    "stringray-activation",
    "state management activated",
    "success",
    { jobId },
  );
}

async function activateOrchestrator(jobId: string): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating 0xRay orchestrator",
    "info",
    { jobId },
  );

  const { strRayOrchestrator } = await import("./orchestrator");

  // Also activate the multi-agent orchestration coordinator
  const { multiAgentOrchestrationCoordinator } =
    await import("../orchestrator/multi-agent-orchestration-coordinator");

  frameworkLogger.log(
    "stringray-activation",
    "0xRay orchestrator and multi-agent coordination activated",
    "success",
    { jobId },
  );
}

async function activateProcessors(jobId: string): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating processor pipeline",
    "info",
    { jobId },
  );

  const { ProcessorManager } = await import("../processors/processor-manager");
  const { StringRayStateManager } = await import("../state/state-manager");

  const stateManager = new StringRayStateManager();
  const processorManager = new ProcessorManager(stateManager);

  // Store the processor manager instance globally for framework use
  globalThis.strRayProcessorManager = processorManager;

  frameworkLogger.log(
    "stringray-activation",
    "processor pipeline activated",
    "success",
    { jobId },
  );
}

async function activatePostProcessor(jobId: string): Promise<void> {
  frameworkLogger.log(
    "stringray-activation",
    "activating post-processor system",
    "info",
    { jobId },
  );

  const { PostProcessor } = await import("../postprocessor/PostProcessor");

  // Get existing state manager (should be initialized by boot orchestrator)
  const stateManager = globalThis.strRayStateManager;
  if (!stateManager) {
    throw new Error(
      "State manager not initialized - boot orchestrator must run first",
    );
  }

  const postProcessor = new PostProcessor(stateManager, null, {});

  globalThis.strRayPostProcessor = postProcessor;

  frameworkLogger.log(
    "stringray-activation",
    "post-processor system activated",
    "success",
    { jobId },
  );

  const { pathResolver } = await import("../utils/path-resolver.js");
  globalThis.strRayPathResolver = pathResolver;

  frameworkLogger.log(
    "stringray-activation",
    "path resolver activated",
    "success",
    { jobId },
  );

  const { CodexInjector } = await import("./codex-injector.js");
  const codexInjector = new CodexInjector();
  globalThis.strRayCodexInjector = codexInjector;

  frameworkLogger.log(
    "stringray-activation",
    "codex injector activated",
    "success",
    { jobId },
  );
}
