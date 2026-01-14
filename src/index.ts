/**
 * StringRay Framework v1.0.0
 *
 * Main entry point for StringRay Framework.
 * Provides access to core codex injection and context loading functionality.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */

// Core codex functionality - always loaded
export * from "./codex-injector.js";
export * from "./context-loader.js";

// Full framework exports
export * from "./orchestrator.js";
export * from "./boot-orchestrator.js";
export * from "./state/index.js";
export * from "./hooks/index.js";

// Core exports only
export {
  createStringRayCodexInjectorHook,
  getCodexStats,
  clearCodexCache,
} from "./codex-injector.js";
export { StringRayContextLoader, strRayContextLoader } from "./context-loader.js";

// StringRay Framework Direct Integration
export {
  activateStringRayFramework,
  defaultStringRayConfig,
} from "./strray-activation.js";
// export { initializeStringRay } from "./strray-init.js";
