/**
 * StrRay Framework v1.0.0
 *
 * Main entry point for StrRay Framework.
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
  createStrRayCodexInjectorHook,
  getCodexStats,
  clearCodexCache,
} from "./codex-injector.js";
export { StrRayContextLoader, strRayContextLoader } from "./context-loader.js";

// StrRay Framework Direct Integration
export {
  activateStrRayFramework,
  defaultStrRayConfig,
} from "./strray-activation.js";
// export { initializeStrRay } from "./strray-init.js";
