/**
 * Processor Manager
 *
 * Centralized processor management for pre/post processing operations.
 * Implements lifecycle management, performance monitoring, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { ProcessorRegistration, ProcessorHook, ProcessorResult } from "./processor-types.js";
import {
  detectProjectLanguage,
  getTestFilePath,
  buildTestCommand,
  ProjectLanguage,
} from "../utils/language-detector.js";
import { exec } from "child_process";
import { promisify } from "util";
import { ProcessorRegistry, IProcessor, ProcessorContext } from "./processor-interfaces.js";
import {
  PreValidateProcessor,
  LogProtectionProcessor,
  CodexComplianceProcessor,
  VersionComplianceProcessor,
  ErrorBoundaryProcessor,
  TestExecutionProcessor,
  RegressionTestingProcessor,
  StateValidationProcessor,
  RefactoringLoggingProcessor,
  TestAutoCreationProcessor,
  CoverageAnalysisProcessor,
  AgentsMdValidationProcessor,
  InferenceImprovementProcessor,
} from "./implementations/index.js";

const execAsync = promisify(exec);

export interface ProcessorConfig {
  name: string;
  type: "pre" | "post";
  priority: number;
  enabled: boolean;
  timeout?: number;
  retryAttempts?: number;
  hook?: ProcessorHook;
}

export interface ProcessorHealth {
  name: string;
  status: "healthy" | "degraded" | "failed";
  lastExecution: number;
  successRate: number;
  averageDuration: number;
  errorCount: number;
}

export interface ProcessorContextValidation {
  valid: boolean;
  errors: string[];
}

export interface PostProcessorData {
  operation: string;
  data?: unknown;
  preResults?: ProcessorResult[];
  tool?: string;
  directory?: string;
  filePath?: string;
}

export interface LegacyContext {
  [key: string]: unknown;
}

export interface TestExecutionResult {
  testsExecuted: number;
  passed: number;
  failed: number;
  exitCode?: number;
  output?: string;
  success: boolean;
  error?: string;
  duration?: number;
}

export interface GenericTestResult {
  testsExecuted?: number;
  passed?: number;
  failed?: number;
  exitCode?: number;
  output?: string;
  success: boolean;
  regressions?: string[];
  issues?: string[];
  stateValid?: boolean;
  logged?: boolean;
  message?: string;
  coverage?: unknown;
  data?: unknown;
  error?: string | boolean;
  timestamp?: string;
  checkedAt?: string;
  blocked?: boolean;
  errors?: string[];
  warnings?: string[];
  compliant?: boolean;
  violations?: string[];
  termsChecked?: number;
  boundaries?: string;
  operation?: string;
}

export interface ProcessorMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecutionTime: number;
  healthStatus: ProcessorHealth["status"];
}

export class ProcessorManager {
  private processors = new Map<string, ProcessorConfig>();
  private metrics = new Map<string, ProcessorMetrics>();
  private stateManager: StringRayStateManager;
  private activeProcessors = new Set<string>();
  private registry: ProcessorRegistry;

  constructor(stateManager: StringRayStateManager) {
    this.stateManager = stateManager;
    this.registry = new ProcessorRegistry();
    this.registerAllProcessors();
  }

  /**
   * Register all processor implementations in the registry
   */
  private registerAllProcessors(): void {
    // Pre-processors
    this.registry.register(new PreValidateProcessor());
    this.registry.register(new LogProtectionProcessor());
    this.registry.register(new CodexComplianceProcessor());
    this.registry.register(new VersionComplianceProcessor());
    this.registry.register(new ErrorBoundaryProcessor());

    // Post-processors
    this.registry.register(new TestExecutionProcessor());
    this.registry.register(new RegressionTestingProcessor());
    this.registry.register(new StateValidationProcessor());
    this.registry.register(new RefactoringLoggingProcessor());
    this.registry.register(new TestAutoCreationProcessor());
    this.registry.register(new CoverageAnalysisProcessor());
    this.registry.register(new AgentsMdValidationProcessor());
    this.registry.register(new InferenceImprovementProcessor());

    frameworkLogger.log(
      "processor-manager",
      "processors-registered",
      "success",
      { count: this.registry.getAll().length },
    );
  }

  /**
   * Register a processor with the manager
   */
  registerProcessorWithHook(registration: ProcessorRegistration): void {
    const config: ProcessorConfig = {
      name: registration.name,
      type: registration.type,
      priority: registration.hook.priority,
      enabled: registration.hook.enabled,
    };

    // Register the config
    this.registerProcessor(config);

    // Store the hook for later execution
    this.processors.set(registration.name, {
      ...config,
      hook: registration.hook,
    });
  }

  registerProcessor(config: ProcessorConfig): void {
    // Validate processor name
    if (!config.name || config.name.trim().length === 0) {
      throw new Error("Processor name cannot be empty");
    }

    if (config.name.includes(" ")) {
      throw new Error("Processor name must be a valid identifier (no spaces)");
    }

    // Allow hyphens, underscores, and dots as they are commonly used in processor names
    // Only reject spaces which are definitely invalid

    // Validate processor type
    if (config.type !== "pre" && config.type !== "post") {
      throw new Error('Processor type must be either "pre" or "post"');
    }

    // Validate priority
    if (config.priority < 0) {
      throw new Error("Processor priority must be non-negative");
    }

    if (this.processors.has(config.name)) {
      throw new Error(`Processor ${config.name} is already registered`);
    }

    this.processors.set(config.name, config);
    this.metrics.set(config.name, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      lastExecutionTime: 0,
      healthStatus: "healthy",
    });

    frameworkLogger.log(
      "processor-manager",
      "processor registered",
      "success",
      {
        name: config.name,
        type: config.type,
      },
    );
  }

  /**
   * Unregister a processor
   */
  unregisterProcessor(name: string): void {
    if (!this.processors.has(name)) {
      throw new Error(`Processor ${name} is not registered`);
    }

    this.processors.delete(name);
    this.metrics.delete(name);
    this.activeProcessors.delete(name);

    frameworkLogger.log(
      "processor-manager",
      "processor unregistered",
      "success",
      {
        name,
      },
    );
  }

  /**
   * Initialize all registered processors
   */
  async initializeProcessors(): Promise<boolean> {
    const jobId = `init-processors-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    frameworkLogger.log(
      "processor-manager",
      "initializeProcessors called",
      "info",
      {
        jobId,
        totalProcessors: this.processors.size,
        enabledProcessors: Array.from(this.processors.values()).filter(
          (p) => p.enabled,
        ).length,
      },
    );

    frameworkLogger.log(
      "processor-manager",
      "initializing processors",
      "info",
      { jobId },
    );

    const initPromises = Array.from(this.processors.values())
      .filter((p) => p.enabled)
      .map(async (config) => {
        try {
          await this.initializeProcessor(config.name);
          frameworkLogger.log(
            "processor-manager",
            "processor initialized successfully",
            "success",
            { jobId, processor: config.name },
          );
          return { name: config.name, success: true };
        } catch (error) {
          frameworkLogger.log(
            "processor-manager",
            "processor initialization failed",
            "error",
            {
              jobId,
              processor: config.name,
              error: error instanceof Error ? error.message : String(error),
            },
          );
          await frameworkLogger.log(
            "processor-manager",
            "processor-initialization-failed",
            "error",
            {
              processor: config.name,
              error: error instanceof Error ? error.message : String(error),
            },
          );
          return {
            name: config.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

    const results = await Promise.all(initPromises);
    const failures = results.filter((r) => !r.success);

    if (failures.length > 0) {
      await frameworkLogger.log(
        "processor-manager",
        "multiple-processor-initialization-failed",
        "error",
        { failureCount: failures.length, failures: failures.map(f => f.name) },
      );
      return false;
    }

    // Processor initialization - kept for operational monitoring
    return true;
  }

  /**
   * Initialize a specific processor
   */
  private async initializeProcessor(name: string): Promise<void> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    // Check if processor exists in registry (new system)
    // NOTE: Test processors registered via registerProcessor() may not be in registry
    const hasRegistryProcessor = this.registry.has(name);

    // Processor initialization is handled by the constructor in the registry pattern.
    // Legacy initialization methods (deprecated) are kept only for processors
    // that were registered via the old hook system.
    if (!hasRegistryProcessor) {
      frameworkLogger.log(
        "processor-manager",
        "legacy-processor-initialization",
        "info",
        { processor: name, message: "Using legacy initialization path" },
      );
    }

    this.activeProcessors.add(name);
  }

  /**
   * Execute pre-processors for a given operation
   */
  async executePreProcessors(input: {
    tool: string;
    args?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }): Promise<{ success: boolean; results: ProcessorResult[] }> {
    const jobId = `execute-pre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { tool, args, context } = input;

    frameworkLogger.log(
      "processor-manager",
      "executePreProcessors called",
      "debug",
      {
        jobId,
        tool,
        processorCount: Array.from(this.processors.values()).filter(
          (p) => p.type === "pre" && p.enabled,
        ).length,
      },
    );

    const preProcessors = Array.from(this.processors.values())
      .filter((p) => p.type === "pre" && p.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: ProcessorResult[] = [];

    for (const config of preProcessors) {
      const result = await this.executeProcessor(config.name, context);
      results.push(result);

      // Log failures but continue execution for graceful error handling
      if (!result.success) {
        frameworkLogger.log(
          "processor-manager",
          "pre-processor failed",
          "info",
          {
            jobId,
            processor: config.name,
            tool,
            error: result.error,
          },
        );
      } else {
        frameworkLogger.log(
          "processor-manager",
          "pre-processor succeeded",
          "success",
          {
            jobId,
            processor: config.name,
            tool,
            duration: result.duration,
          },
        );
      }
    }

    const overallSuccess = results.every((r) => r.success);

    frameworkLogger.log(
      "processor-manager",
      "executePreProcessors completed",
      "debug",
      {
        jobId,
        tool,
        totalResults: results.length,
        successCount: results.filter((r) => r.success).length,
        overallSuccess,
      },
    );

    return {
      success: overallSuccess,
      results,
    };
  }

  /**
   * Execute post-processors for a given operation
   */
  async executePostProcessors(
    operation: string,
    data: PostProcessorData,
    preResults: ProcessorResult[],
  ): Promise<ProcessorResult[]> {
    const jobId = `execute-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    frameworkLogger.log(
      "processor-manager",
      "executePostProcessors called",
      "debug",
      {
        jobId,
        operation,
        preResultCount: preResults.length,
        processorCount: Array.from(this.processors.values()).filter(
          (p) => p.type === "post" && p.enabled,
        ).length,
      },
    );

    const postProcessors = Array.from(this.processors.values())
      .filter((p) => p.type === "post" && p.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: ProcessorResult[] = [];

    for (const config of postProcessors) {
      const result = await this.executeProcessor(config.name, {
        operation,
        data,
        preResults,
      });
      results.push(result);

      // Continue execution even if post-processors fail
      if (!result.success) {
        frameworkLogger.log(
          "processor-manager",
          "post-processor failed",
          "error",
          {
            jobId,
            processor: config.name,
            operation,
            error: result.error,
          },
        );
      } else {
        frameworkLogger.log(
          "processor-manager",
          "post-processor succeeded",
          "success",
          {
            jobId,
            processor: config.name,
            operation,
            duration: result.duration,
          },
        );
      }
    }

    frameworkLogger.log(
      "processor-manager",
      "executePostProcessors completed",
      "debug",
      {
        jobId,
        operation,
        totalResults: results.length,
        successCount: results.filter((r) => r.success).length,
      },
    );

    return results;
  }

   /**
    * Execute a specific processor
    * FIX: Issue #4 - Add context validation before execution
    */
  private async executeProcessor(
    name: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProcessorResult> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    // Default to empty object if context is undefined
    const safeContext = context ?? {};

    // ADD: Validate context before execution (skip if not an object)
    if (safeContext && typeof safeContext === 'object' && !Array.isArray(safeContext)) {
      const validationResult = this.validateProcessorContext(name, safeContext);
      if (!validationResult.valid) {
        await frameworkLogger.log(
          "processor-manager",
          "context-validation-failed",
          "info",
          {
            processor: name,
            errors: validationResult.errors,
          },
        );
        // Continue but log the validation issues
      }
    }

    const startTime = Date.now();
     const metrics = this.metrics.get(name)!;

    try {
      let result: unknown;

      // Try new registry-based processors first
      const processor = this.registry.get(name);
      if (processor) {
        const processorResult = await processor.execute(safeContext as ProcessorContext);
        const duration = Date.now() - startTime;
        this.updateMetrics(name, processorResult.success, duration);

        const resultObj: ProcessorResult = {
          success: processorResult.success,
          data: processorResult.data,
          duration,
          processorName: name,
        };
        
        if (processorResult.error) {
          resultObj.error = processorResult.error;
        }
        
        return resultObj;
      }

      // No registry processor found - this shouldn't happen if all processors
      // are properly registered. Throw an error to identify configuration issues.
      // Legacy fallback was removed - all processors must use the registry pattern.
      throw new Error(
        `Processor '${name}' not found in registry. ` +
        `All processors must be registered via ProcessorRegistry. ` +
        `Legacy switch-based execution has been removed.`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(name, false, duration);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        processorName: name,
      };
    }
  }

  /**
   * Update processor metrics
   */
  private updateMetrics(
    name: string,
    success: boolean,
    duration: number,
  ): void {
    const metrics = this.metrics.get(name)!;
    metrics.totalExecutions++;
    metrics.lastExecutionTime = Date.now();

    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update rolling average duration
    const totalDuration =
      metrics.averageDuration * (metrics.totalExecutions - 1) + duration;
    metrics.averageDuration = totalDuration / metrics.totalExecutions;

    // Update health status
    const successRate = metrics.successfulExecutions / metrics.totalExecutions;
    metrics.healthStatus =
      successRate > 0.95
        ? "healthy"
        : successRate > 0.8
          ? "degraded"
          : "failed";
  }

  /**
   * Get processor health status
   */
  getProcessorHealth(): ProcessorHealth[] {
    return Array.from(this.activeProcessors).map((name) => {
      const config = this.processors.get(name)!;
      const metrics = this.metrics.get(name)!;

      const totalExecutions = metrics.totalExecutions || 1; // Avoid division by zero
      return {
        name,
        status: metrics.healthStatus,
        lastExecution: metrics.lastExecutionTime,
        successRate: metrics.successfulExecutions / totalExecutions,
        averageDuration: metrics.averageDuration,
        errorCount: metrics.failedExecutions,
      };
    });
  }

  /**
   * Validate processor context before execution
   * FIX: Issue #4 - Add context validation
   */
  private validateProcessorContext(
    processorName: string,
    context: LegacyContext,
  ): ProcessorContextValidation {
    const errors: string[] = [];

    // Skip validation if context is not an object (e.g., string test data)
    if (!context || typeof context !== 'object') {
      return { valid: true, errors: [] };
    }

    // Check for required fields based on processor type
    // Skip validation entirely if context is not a proper object
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return { valid: true, errors: [] };
    }

    // Skip if context.data is not an object (e.g., it's a string from test)
    const contextData = context.data;
    if (contextData && typeof contextData !== 'object') {
      return { valid: true, errors: [] };
    }

    const dataObj = contextData as Record<string, unknown> | undefined;
    const requiredFields: Record<string, string[]> = {
      preValidate: ["operation"],
      codexCompliance: ["operation", "files"],
      testAutoCreation: ["tool", "operation"],
      versionCompliance: ["operation"],
      errorBoundary: ["operation"],
      testExecution: ["tool"],
      regressionTesting: ["operation"],
      stateValidation: ["operation"],
      agentsMdValidation: ["tool", "operation"],
    };

    const required = requiredFields[processorName] || [];

    for (const field of required) {
      const fieldExistsInContext = field in context;
      const fieldExistsInData = dataObj && field in dataObj;
      if (!fieldExistsInContext && !fieldExistsInData) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Log validation result
    if (errors.length > 0) {
      frameworkLogger.log(
        "processor-manager",
        "context-validation-warnings",
        "info",
        {
          processor: processorName,
          errors,
          contextKeys: Object.keys(context),
        },
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Resolve processor conflicts
   */
  resolveProcessorConflicts(conflicts: ProcessorResult[]): ProcessorResult {
    if (conflicts.length === 0) {
      throw new Error("No conflicts to resolve");
    }

    const successful = conflicts.find((c) => c.success);
    if (successful) {
      return successful;
    }

    return conflicts[0]!;
  }

  /**
   * Cleanup all processors
   */
  async cleanupProcessors(): Promise<void> {
    frameworkLogger.log("processor-manager", "cleaning up processors", "info");

    for (const name of this.activeProcessors) {
      try {
        await this.cleanupProcessor(name);
      } catch (error) {
        await frameworkLogger.log(
          "processor-manager",
          "processor-cleanup-failed",
          "error",
          { processor: name, error: String(error) },
        );
      }
    }

    this.activeProcessors.clear();
    this.processors.clear(); // Clear all registered processors for test isolation
    this.metrics.clear(); // Clear metrics for test isolation
    // Processor cleanup - kept for operational monitoring
  }

  /**
   * Cleanup a specific processor
   * In the registry pattern, cleanup is handled by the processor itself
   * if it implements a cleanup method. The manager just tracks active state.
   */
  private async cleanupProcessor(name: string): Promise<void> {
    // No processor-specific cleanup needed in the registry pattern.
    // Processors handle their own resources via the constructor/cleanup lifecycle.
    frameworkLogger.log(
      "processor-manager",
      "processor-cleanup",
      "info",
      { processor: name },
    );
  }

}
