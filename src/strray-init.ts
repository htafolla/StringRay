/**
 * StrRay Framework Initialization
 *
 * This file integrates StrRay framework activation directly into oh-my-opencode's
 * core initialization process.
 */

// Import and activate StrRay framework during oh-my-opencode startup
import { activateStrRayFramework } from "./strray-activation.js";
import { frameworkLogger } from "./framework-logger.js";

// Initialize StrRay framework when oh-my-opencode starts
export async function initializeStrRay(): Promise<void> {
  try {
    await activateStrRayFramework();
    frameworkLogger.log(
      "strray-init",
      "StrRay framework initialized successfully",
      "success",
    );
  } catch (error: unknown) {
    frameworkLogger.log(
      "strray-init",
      "StrRay framework initialization failed",
      "error",
      error,
    );
    // Don't throw - allow oh-my-opencode to continue without StrRay
    console.warn(
      "⚠️ StrRay framework failed to initialize:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Auto-initialize when this module is imported
initializeStrRay();
