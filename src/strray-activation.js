/**
 * StringRay Framework Activation Module
 *
 * This module handles activation of StringRay framework components
 * during oh-my-opencode initialization.
 */
import { frameworkLogger } from "./framework-logger";
import { ensureCriticalComponents } from "./architectural-integrity";
export const defaultStringRayConfig = {
    enableOrchestrator: true,
    enableBootOrchestrator: true,
    enableStateManagement: true,
    enableHooks: true,
    enableCodexInjection: true,
    enableProcessors: true,
    enablePostProcessor: true,
};
export async function activateStringRayFramework(config = {}) {
    const jobId = `activation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const activationConfig = { ...defaultStringRayConfig, ...config };
    // Banner display moved to init.sh execution in plugin
    // Framework activation proceeds quietly
    frameworkLogger.log("stringray-activation", "beginning StringRay framework activation", "info", { jobId, ...activationConfig });
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
        frameworkLogger.log("stringray-activation", "StringRay framework activation completed successfully", "success", { jobId });
    }
    catch (error) {
        console.error("❌ StringRay Framework activation failed:", error);
        frameworkLogger.log("stringray-activation", "StringRay framework activation failed", "error", { jobId, error });
        throw error;
    }
}
async function activateCodexInjection(jobId) {
    frameworkLogger.log("stringray-activation", "activating codex injection", "info", { jobId });
    const { createStringRayCodexInjectorHook } = await import("./codex-injector.js");
    const hook = createStringRayCodexInjectorHook();
    globalThis.strRayHooks = globalThis.strRayHooks || [];
    frameworkLogger.log("stringray-activation", "codex injection activated", "success", { jobId });
}
async function activateHooks(jobId) {
    // Temporarily disabled hooks activation to prevent import errors
    // frameworkLogger.log("stringray-activation", "activating StringRay hooks", "info", { jobId });
    // const { loadHooks } = await import("./index.js");
    // await loadHooks();
    // frameworkLogger.log("stringray-activation", "StringRay hooks activated", "success", { jobId });
}
async function activateBootOrchestrator(jobId) {
    frameworkLogger.log("stringray-activation", "activating boot orchestrator", "info", { jobId });
    const { bootOrchestrator } = await import("./boot-orchestrator.js");
    await bootOrchestrator.executeBootSequence();
    frameworkLogger.log("stringray-activation", "boot orchestrator activated", "success", { jobId });
}
async function activateStateManagement(jobId) {
    frameworkLogger.log("stringray-activation", "activating state management", "info", { jobId });
    const { StringRayStateManager } = await import("./state/state-manager.js");
    const stateManager = new StringRayStateManager();
    // Store the state manager instance globally for framework use
    globalThis.strRayStateManager = stateManager;
    frameworkLogger.log("stringray-activation", "state management activated", "success", { jobId });
}
async function activateOrchestrator(jobId) {
    frameworkLogger.log("stringray-activation", "activating StringRay orchestrator", "info", { jobId });
    const { strRayOrchestrator } = await import("./orchestrator.js");
    // Also activate the multi-agent orchestration coordinator
    const { multiAgentOrchestrationCoordinator } = await import("./orchestrator/multi-agent-orchestration-coordinator.js");
    frameworkLogger.log("stringray-activation", "StringRay orchestrator and multi-agent coordination activated", "success", { jobId });
}
async function activateProcessors(jobId) {
    frameworkLogger.log("stringray-activation", "activating processor pipeline", "info", { jobId });
    const { ProcessorManager } = await import("./processors/processor-manager.js");
    const { StringRayStateManager } = await import("./state/state-manager.js");
    const stateManager = new StringRayStateManager();
    const processorManager = new ProcessorManager(stateManager);
    // Store the processor manager instance globally for framework use
    globalThis.strRayProcessorManager = processorManager;
    frameworkLogger.log("stringray-activation", "processor pipeline activated", "success", { jobId });
}
async function activatePostProcessor(jobId) {
    frameworkLogger.log("stringray-activation", "activating post-processor system", "info", { jobId });
    const { PostProcessor } = await import("./postprocessor/PostProcessor.js");
    // Get existing state manager (should be initialized by boot orchestrator)
    const stateManager = globalThis.strRayStateManager;
    if (!stateManager) {
        throw new Error("State manager not initialized - boot orchestrator must run first");
    }
    // Create post-processor with optional session monitor
    // Session monitor may not be available in plugin context
    const postProcessor = new PostProcessor(stateManager, null, {});
    // Store the post-processor instance globally for framework use
    globalThis.strRayPostProcessor = postProcessor;
    frameworkLogger.log("stringray-activation", "post-processor system activated", "success", { jobId });
}
//# sourceMappingURL=strray-activation.js.map