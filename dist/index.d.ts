/**
 * StrRay Framework v1.0.0
 *
 * Main entry point for the StrRay Framework.
 * Provides access to core codex injection and context loading functionality.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
export * from "./codex-injector.js";
export * from "./context-loader.js";
export declare const loadOrchestrator: () => Promise<typeof import("./orchestrator.js")>;
export declare const loadBootOrchestrator: () => Promise<typeof import("./boot-orchestrator.js")>;
export declare const loadStateManagement: () => Promise<typeof import("./state/index.js")>;
export declare const loadHooks: () => Promise<typeof import("./hooks/index.js")>;
export { createStrRayCodexInjectorHook, getCodexStats, clearCodexCache, } from "./codex-injector.js";
export { StrRayContextLoader, strRayContextLoader } from "./context-loader.js";
export declare const loadAdvancedFeatures: () => Promise<{
    StrRayOrchestrator: typeof import("./orchestrator.js").StrRayOrchestrator;
    strRayOrchestrator: import("./orchestrator.js").StrRayOrchestrator;
    BootOrchestrator: typeof import("./boot-orchestrator.js").BootOrchestrator;
    bootOrchestrator: import("./boot-orchestrator.js").BootOrchestrator;
}>;
//# sourceMappingURL=index.d.ts.map