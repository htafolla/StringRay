/**
 * StrRay Framework v1.0.0
 *
 * Main entry point for the StrRay Framework.
 * Provides access to core codex injection and context loading functionality.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
export * from "./codex-injector";
export * from "./context-loader";
export declare const loadOrchestrator: () => Promise<typeof import("./orchestrator")>;
export declare const loadBootOrchestrator: () => Promise<typeof import("./boot-orchestrator")>;
export declare const loadStateManagement: () => Promise<typeof import("./state")>;
export declare const loadHooks: () => Promise<typeof import("./hooks")>;
export { createStrRayCodexInjectorHook, getCodexStats, clearCodexCache } from "./codex-injector";
export { StrRayContextLoader, strRayContextLoader } from "./context-loader";
export declare const loadAdvancedFeatures: () => Promise<{
    StrRayOrchestrator: typeof import("./orchestrator").StrRayOrchestrator;
    strRayOrchestrator: import("./orchestrator").StrRayOrchestrator;
    BootOrchestrator: typeof import("./boot-orchestrator").BootOrchestrator;
    bootOrchestrator: import("./boot-orchestrator").BootOrchestrator;
}>;
//# sourceMappingURL=index.d.ts.map