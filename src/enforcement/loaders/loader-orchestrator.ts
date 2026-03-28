/**
 * Loader Orchestrator
 * 
 * Coordinates multiple rule loaders to load rules from various sources.
 * Manages loader execution, error handling, and rule aggregation.
 * 
 * Phase 4 refactoring: Extracted loader orchestration from RuleEnforcer
 * 
 * @module loaders/loader-orchestrator
 * @version 1.0.0
 */

import { frameworkLogger } from "../../core/framework-logger.js";
import { IRuleLoader, RuleDefinition } from "../types.js";
import { CodexLoader } from "./codex-loader.js";
import { AgentTriageLoader } from "./agent-triage-loader.js";
import { ProcessorLoader } from "./processor-loader.js";
import { AgentsMdValidationLoader } from "./agents-md-validation-loader.js";

/**
 * Options for LoaderOrchestrator configuration.
 */
export interface LoaderOrchestratorOptions {
  /** Whether to continue loading if one loader fails */
  continueOnError?: boolean;
  /** Whether to log loader activity */
  enableLogging?: boolean;
}

/**
 * Result from the orchestrator's load operation.
 */
export interface LoaderOrchestratorResult {
  /** All loaded rules */
  rules: RuleDefinition[];
  /** Number of successful loaders */
  successfulLoaders: number;
  /** Number of failed loaders */
  failedLoaders: number;
  /** Loader-specific results */
  loaderResults: Map<string, { success: boolean; ruleCount: number; error?: string }>;
}

/**
 * Orchestrates multiple rule loaders to load rules from various sources.
 * 
 * @example
 * ```typescript
 * const orchestrator = new LoaderOrchestrator();
 * const result = await orchestrator.loadAllRules();
 * console.log(`Loaded ${result.rules.length} rules from ${result.successfulLoaders} loaders`);
 * ```
 */
export class LoaderOrchestrator {
  private loaders: IRuleLoader[] = [];
  private options: LoaderOrchestratorOptions;

  /**
   * Create a new LoaderOrchestrator.
   * @param options - Configuration options
   */
  constructor(options: LoaderOrchestratorOptions = {}) {
    this.options = {
      continueOnError: true,
      enableLogging: true,
      ...options,
    };

    // Register default loaders
    this.registerDefaultLoaders();
  }

  /**
   * Register the default set of loaders.
   */
  private registerDefaultLoaders(): void {
    this.loaders = [
      new CodexLoader(),
      new AgentTriageLoader(),
      new ProcessorLoader(),
      new AgentsMdValidationLoader(),
    ];
  }

  /**
   * Load all rules from all available loaders.
   * @returns Promise resolving to orchestrator result
   */
  async loadAllRules(): Promise<LoaderOrchestratorResult> {
    const allRules: RuleDefinition[] = [];
    const loaderResults = new Map<string, { success: boolean; ruleCount: number; error?: string }>();
    let successfulLoaders = 0;
    let failedLoaders = 0;

    for (const loader of this.loaders) {
      try {
        const isAvailable = await loader.isAvailable();
        
        if (!isAvailable) {
          if (this.options.enableLogging) {
            await frameworkLogger.log(
              "loader-orchestrator",
              "loader-not-available",
              "info",
              {
                message: `Loader ${loader.name} not available, skipping`,
                loader: loader.name,
              }
            );
          }
          loaderResults.set(loader.name, { success: true, ruleCount: 0 });
          continue;
        }

        const rules = await loader.load();
        allRules.push(...rules);
        successfulLoaders++;
        loaderResults.set(loader.name, { success: true, ruleCount: rules.length });

        if (this.options.enableLogging) {
          await frameworkLogger.log(
            "loader-orchestrator",
            "loader-success",
            "success",
            {
              message: `Loader ${loader.name} loaded ${rules.length} rules`,
              loader: loader.name,
              ruleCount: rules.length,
            }
          );
        }
      } catch (error) {
        failedLoaders++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        loaderResults.set(loader.name, { success: false, ruleCount: 0, error: errorMessage });

        if (this.options.enableLogging) {
          await frameworkLogger.log(
            "loader-orchestrator",
            "loader-failed",
            "error",
            {
              message: `Loader ${loader.name} failed: ${errorMessage}`,
              loader: loader.name,
              error: errorMessage,
            }
          );
        }

        if (!this.options.continueOnError) {
          throw error;
        }
      }
    }

    const result: LoaderOrchestratorResult = {
      rules: allRules,
      successfulLoaders,
      failedLoaders,
      loaderResults,
    };

    if (this.options.enableLogging) {
      await frameworkLogger.log(
        "loader-orchestrator",
        "load-complete",
        "success",
        {
          message: `Loaded ${allRules.length} rules from ${successfulLoaders} loaders (${failedLoaders} failed)`,
          totalRules: allRules.length,
          successfulLoaders,
          failedLoaders,
        }
      );
    }

    return result;
  }

  /**
   * Register a custom loader.
   * @param loader - Loader to register
   */
  registerLoader(loader: IRuleLoader): void {
    this.loaders.push(loader);
  }

  /**
   * Get all registered loaders.
   * @returns Array of registered loaders
   */
  getLoaders(): IRuleLoader[] {
    return [...this.loaders];
  }

  /**
   * Get loader by name.
   * @param name - Loader name
   * @returns Loader instance or undefined
   */
  getLoader(name: string): IRuleLoader | undefined {
    return this.loaders.find((loader) => loader.name === name);
  }

  /**
   * Remove a loader by name.
   * @param name - Loader name
   * @returns True if loader was removed
   */
  removeLoader(name: string): boolean {
    const index = this.loaders.findIndex((loader) => loader.name === name);
    if (index >= 0) {
      this.loaders.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear all registered loaders.
   */
  clearLoaders(): void {
    this.loaders = [];
  }

  /**
   * Get count of registered loaders.
   * @returns Number of loaders
   */
  getLoaderCount(): number {
    return this.loaders.length;
  }
}
