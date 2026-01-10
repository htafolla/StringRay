/**
 * StrRay Framework Activation Module
 * 
 * This module handles the activation of StrRay framework components
 * during oh-my-opencode initialization.
 */

import { frameworkLogger } from "./framework-logger.js";

export interface StrRayActivationConfig {
  enableOrchestrator: boolean;
  enableBootOrchestrator: boolean;
  enableStateManagement: boolean;
  enableHooks: boolean;
  enableCodexInjection: boolean;
  enableProcessors: boolean;
}

export const defaultStrRayConfig: StrRayActivationConfig = {
  enableOrchestrator: false, // Disable due to start() method issues
  enableBootOrchestrator: true, // Test boot orchestrator
  enableStateManagement: true, // Test state management
  enableHooks: true,
  enableCodexInjection: true,
  enableProcessors: true, // Test processors
};

export async function activateStrRayFramework(config: Partial<StrRayActivationConfig> = {}): Promise<void> {
  const activationConfig = { ...defaultStrRayConfig, ...config };
  
  frameworkLogger.log("strray-activation", "beginning StrRay framework activation", "info", activationConfig);
  
  try {
    // Phase 1: Core initialization
    if (activationConfig.enableCodexInjection) {
      await activateCodexInjection();
    }
    
    if (activationConfig.enableHooks) {
      await activateHooks();
    }
    
    // Phase 2: Main components (disabled due to import issues)
    // Note: Boot orchestrator and state management disabled due to framework-logger import issues
    
    frameworkLogger.log("strray-activation", "StrRay framework activation completed successfully", "success");
    
  } catch (error) {
    frameworkLogger.log("strray-activation", "StrRay framework activation failed", "error", error);
    throw error;
  }
}

async function activateCodexInjection(): Promise<void> {
  frameworkLogger.log("strray-activation", "activating codex injection", "info");
  
  const { createStrRayCodexInjectorHook } = await import("./codex-injector.js");
  const hook = createStrRayCodexInjectorHook();
  
  // TEMPORARY: Register hook globally for testing
  // In production, this should be registered with oh-my-opencode's hook system
  (globalThis as any).strRayHooks = (globalThis as any).strRayHooks || [];
  
  // hook.push(hook);

  
  frameworkLogger.log("strray-activation", "codex injection activated", "success");
}

async function activateHooks(): Promise<void> {
  frameworkLogger.log("strray-activation", "activating StrRay hooks", "info");
  
  const { loadHooks } = await import("./index.js");
  await loadHooks();
  
  frameworkLogger.log("strray-activation", "StrRay hooks activated", "success");
}

// Disabled functions due to import issues
async function activateBootOrchestrator(): Promise<void> {
  throw new Error("Boot orchestrator disabled due to framework-logger import issues");
}

async function activateStateManagement(): Promise<void> {
  throw new Error("State management disabled due to framework-logger import issues");
}

async function activateOrchestrator(): Promise<void> {
  throw new Error("Orchestrator disabled due to start() method issues");
}

async function activateProcessors(): Promise<void> {
  throw new Error("Processors disabled due to dependencies");
}
