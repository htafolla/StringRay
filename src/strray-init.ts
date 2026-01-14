/**
 * StringRay Framework Initialization
 *
 * This file integrates StringRay framework activation directly into oh-my-opencode's
 * core initialization process.
 */

// Import and activate StringRay framework during oh-my-opencode startup
import { activateStringRayFramework } from "./strray-activation.js";
import { frameworkLogger } from "./framework-logger.js";

// Initialize StringRay framework when oh-my-opencode starts
export async function initializeStringRay(): Promise<void> {
  try {
    await activateStringRayFramework();
    frameworkLogger.log(
      "stringray-init",
      "StringRay framework initialized successfully",
      "success",
    );
  } catch (error: unknown) {
    frameworkLogger.log(
      "stringray-init",
      "StringRay framework initialization failed",
      "error",
      error,
    );
    // Don't throw - allow oh-my-opencode to continue without StringRay
    console.warn(
      "⚠️ StringRay framework failed to initialize:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Auto-initialize when this module is imported
initializeStringRay();
