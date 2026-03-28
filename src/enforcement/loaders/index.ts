/**
 * Rule Loaders Module
 * 
 * This module provides rule loading capabilities for the StringRay framework.
 * Loaders encapsulate the logic for loading rules from various sources.
 * 
 * Phase 4 refactoring: Extracted async rule loading from RuleEnforcer
 * 
 * @module loaders
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * import { 
 *   LoaderOrchestrator, 
 *   CodexLoader, 
 *   AgentTriageLoader,
 *   IRuleLoader 
 * } from './enforcement/loaders/index.js';
 * 
 * // Use the orchestrator to load all rules
 * const orchestrator = new LoaderOrchestrator();
 * const result = await orchestrator.loadAllRules();
 * 
 * // Or use individual loaders
 * const codexLoader = new CodexLoader();
 * if (await codexLoader.isAvailable()) {
 *   const codexRules = await codexLoader.load();
 * }
 * ```
 */

// Base loader
export { BaseLoader } from "./base-loader.js";

// Concrete loaders
export { CodexLoader } from "./codex-loader.js";
export { AgentTriageLoader } from "./agent-triage-loader.js";
export { ProcessorLoader } from "./processor-loader.js";
export { AgentsMdValidationLoader } from "./agents-md-validation-loader.js";

// Orchestrator
export {
  LoaderOrchestrator,
  type LoaderOrchestratorOptions,
  type LoaderOrchestratorResult,
} from "./loader-orchestrator.js";
