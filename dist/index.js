/**
 * StrRay Framework v1.0.0
 *
 * Main entry point for the StrRay Framework.
 * Provides access to core codex injection and context loading functionality.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
// Export core codex functionality
export * from "./codex-injector";
export * from "./context-loader";
// Export state management (if needed)
export * from "./state";
// Export hooks (if needed) 
export * from "./hooks";
// Re-export commonly used functions and classes
export { createStrRayCodexInjectorHook, getCodexStats, clearCodexCache } from "./codex-injector";
export { StrRayContextLoader, strRayContextLoader } from "./context-loader";
//# sourceMappingURL=index.js.map