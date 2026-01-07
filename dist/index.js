/**
 * StrRay Framework v1.0.0
 *
 * Main entry point for the StrRay Framework.
 * Provides access to core codex injection and context loading functionality.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
// Core codex functionality - always loaded
export * from "./codex-injector";
export * from "./context-loader";
// Lazy-loaded advanced features for bundle optimization
export const loadOrchestrator = () => import("./orchestrator");
export const loadBootOrchestrator = () => import("./boot-orchestrator");
export const loadStateManagement = () => import("./state");
export const loadHooks = () => import("./hooks");
// Re-export commonly used functions and classes (core only)
export { createStrRayCodexInjectorHook, getCodexStats, clearCodexCache } from "./codex-injector";
export { StrRayContextLoader, strRayContextLoader } from "./context-loader";
// Lazy-loaded advanced exports
export const loadAdvancedFeatures = async () => {
    const [orchestrator, bootOrchestrator] = await Promise.all([
        import("./orchestrator"),
        import("./boot-orchestrator")
    ]);
    return {
        StrRayOrchestrator: orchestrator.StrRayOrchestrator,
        strRayOrchestrator: orchestrator.strRayOrchestrator,
        BootOrchestrator: bootOrchestrator.BootOrchestrator,
        bootOrchestrator: bootOrchestrator.bootOrchestrator
    };
};
//# sourceMappingURL=index.js.map