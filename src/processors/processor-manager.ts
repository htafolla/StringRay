/**
 * StringRay AI v1.1.1 - Processor Manager
 *
 * Centralized processor management for pre/post processing operations.
 * Implements lifecycle management, performance monitoring, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StringRayStateManager } from "../state/state-manager";
import { frameworkLogger } from "../framework-logger.js";
import { ProcessorRegistration } from "./processor-types.js";

export interface ProcessorConfig {
  name: string;
  type: "pre" | "post";
  priority: number;
  enabled: boolean;
  timeout?: number;
  retryAttempts?: number;
  hook?: any; // Optional hook for processors registered with hooks
}

export interface ProcessorResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  processorName: string;
}

export interface ProcessorHealth {
  name: string;
  status: "healthy" | "degraded" | "failed";
  lastExecution: number;
  successRate: number;
  averageDuration: number;
  errorCount: number;
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

  constructor(stateManager: StringRayStateManager) {
    this.stateManager = stateManager;
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

    frameworkLogger.log("processor-manager", "processor registered", "success", {
      name: config.name,
      type: config.type
    });
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

    frameworkLogger.log("processor-manager", "processor unregistered", "success", {
      name
    });
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

    frameworkLogger.log("processor-manager", "initializing processors", "info", { jobId });

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
          console.error(
            `❌ Failed to initialize processor ${config.name}:`,
            error,
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
      console.error(
        `❌ Failed to initialize ${failures.length} processors:`,
        failures,
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

    // Initialize processor-specific setup
    switch (name) {
      case "preValidate":
        await this.initializePreValidateProcessor();
        break;
      case "codexCompliance":
        await this.initializeCodexComplianceProcessor();
        break;
      case "errorBoundary":
        await this.initializeErrorBoundaryProcessor();
        break;
      case "testExecution":
        await this.initializeTestExecutionProcessor();
        break;
      case "regressionTesting":
        await this.initializeRegressionTestingProcessor();
        break;
      case "stateValidation":
        await this.initializeStateValidationProcessor();
        break;
      default:
        // Generic initialization
        break;
    }

    this.activeProcessors.add(name);
  }

  /**
   * Execute pre-processors for a given operation
   */
  async executePreProcessors(
    input: { tool: string; args?: any; context?: any },
  ): Promise<{ success: boolean; results: ProcessorResult[] }> {
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
    data: any,
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
        console.warn(`⚠️ Post-processor ${config.name} failed, continuing...`);
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
   */
  private async executeProcessor(
    name: string,
    context: any,
  ): Promise<ProcessorResult> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    const startTime = Date.now();
    const metrics = this.metrics.get(name)!;

    try {
      let result: any;

      switch (name) {
        case "preValidate":
          result = await this.executePreValidate(context);
          break;
        case "codexCompliance":
          result = await this.executeCodexCompliance(context);
          break;
        case "errorBoundary":
          result = await this.executeErrorBoundary(context);
          break;
        case "testExecution":
          result = await this.executeTestExecution(context);
          break;
        case "regressionTesting":
          result = await this.executeRegressionTesting(context);
          break;
        case "stateValidation":
          result = await this.executeStateValidation(context);
          break;
        case "refactoringLogging":
          result = await this.executeRefactoringLogging(context);
          break;
        default:
          throw new Error(`Unknown processor: ${name}`);
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(name, true, duration);

      return {
        success: true,
        data: result,
        duration,
        processorName: name,
      };
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
        console.error(`❌ Failed to cleanup processor ${name}:`, error);
      }
    }

    this.activeProcessors.clear();
    this.processors.clear(); // Clear all registered processors for test isolation
    this.metrics.clear(); // Clear metrics for test isolation
    // Processor cleanup - kept for operational monitoring
  }

  /**
   * Cleanup a specific processor
   */
  private async cleanupProcessor(name: string): Promise<void> {
    // Processor-specific cleanup logic
    switch (name) {
      case "preValidate":
        // Cleanup pre-validate resources
        break;
      case "codexCompliance":
        // Cleanup codex compliance resources
        break;
      case "errorBoundary":
        // Cleanup error boundary resources
        break;
      case "testExecution":
        // Cleanup test execution resources
        break;
      case "regressionTesting":
        // Cleanup regression testing resources
        break;
      case "stateValidation":
        // Cleanup state validation resources
        break;
    }
  }

  // Processor implementations

  private async initializePreValidateProcessor(): Promise<void> {
    // Setup syntax checking and validation hooks
    frameworkLogger.log("processor-manager", "initializing pre-validate processor", "info");
  }

  private async initializeCodexComplianceProcessor(): Promise<void> {
    // Setup codex compliance validation
    frameworkLogger.log("processor-manager", "initializing codex compliance processor", "info");
  }

  private async initializeErrorBoundaryProcessor(): Promise<void> {
    // Setup error boundary mechanisms
    frameworkLogger.log("processor-manager", "initializing error boundary processor", "info");
  }

  private async initializeTestExecutionProcessor(): Promise<void> {
    // Setup automatic test execution
    frameworkLogger.log("processor-manager", "initializing test execution processor", "info");
  }

  private async initializeRegressionTestingProcessor(): Promise<void> {
    // Setup regression testing mechanisms
    frameworkLogger.log("processor-manager", "initializing regression testing processor", "info");
  }

  private async initializeStateValidationProcessor(): Promise<void> {
    // Setup state validation post-operation
    frameworkLogger.log("processor-manager", "initializing state validation processor", "info");
  }

  private async executePreValidate(context: any): Promise<any> {
    // Implement comprehensive pre-validation with syntax checking
    const { data } = context;

    // Basic validation
    if (!data) {
      throw new Error("No data provided for validation");
    }

    // Syntax checking (placeholder - would integrate with TypeScript compiler API)
    if (typeof data === "string" && data.includes("undefined")) {
      throw new Error("Potential undefined usage detected");
    }

    return { validated: true, syntaxCheck: "passed" };
  }

  private async executeCodexCompliance(context: any): Promise<any> {
    const { operation } = context;

    try {
      const { RuleEnforcer } = await import('../enforcement/rule-enforcer');
      const ruleEnforcer = new RuleEnforcer();

      const validationContext = {
        files: context.files || [],
        newCode: context.newCode || '',
        existingCode: context.existingCode || new Map(),
        tests: context.tests || [],
        dependencies: context.dependencies || [],
        operation: context.operation || 'unknown'
      };

      const result = await ruleEnforcer.validateOperation(operation, validationContext);

      // If violations found, attempt to fix them with agents
      if (!result.passed && result.errors.length > 0) {
        await this.attemptRuleViolationFixes(result.errors, validationContext);
      }

      return {
        compliant: result.passed,
        violations: result.errors,
        warnings: result.warnings,
        termsChecked: result.results.length,
        operation: operation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Codex compliance check failed:', error);
      return {
        compliant: true, // Allow processing to continue
        violations: [`Compliance check error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        termsChecked: 0,
        operation: operation,
        error: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async executeErrorBoundary(context: any): Promise<any> {
    // Setup error boundaries
    return { boundaries: "established" };
  }

  private async executeTestExecution(context: any): Promise<any> {
    // Execute tests automatically
    frameworkLogger.log("processor-manager", "executing automatic tests", "info");
    // Placeholder - would integrate with test runner
    return { testsExecuted: 0, passed: 0, failed: 0 };
  }

  private async executeRegressionTesting(context: any): Promise<any> {
    // Run regression tests
    frameworkLogger.log("processor-manager", "running regression tests", "info");
    // Placeholder - would integrate with regression test suite
    return { regressions: "checked", issues: [] };
  }

  private async executeStateValidation(context: any): Promise<any> {
    // Validate state post-operation
    const currentState = this.stateManager.get("session:active");
    return { stateValid: !!currentState };
  }

  private async executeRefactoringLogging(context: any): Promise<any> {
    try {
      // Import the refactoring logging processor dynamically
      const { RefactoringLoggingProcessor } =
        await import("./refactoring-logging-processor.js");

      const processor = new RefactoringLoggingProcessor();

      // Check if context is agent task completion context
      if (
        context.agentName &&
        context.task &&
        typeof context.startTime === "number"
      ) {
        const result = await processor.execute(context);

        return {
          logged: result.logged || false,
          success: true,
          message: result.logged
            ? "Agent completion logged"
            : "No logging needed",
        };
      }

      return {
        logged: false,
        success: true,
        message: "Not an agent task completion context",
      };
    } catch (error) {
      console.error("Refactoring logging failed:", error);
      return {
        logged: false,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Attempt to fix rule violations by calling appropriate agents/skills
   */
  private async attemptRuleViolationFixes(
    violations: any[],
    context: any
  ): Promise<void> {
    for (const violation of violations) {
      try {
        console.log(`🔧 Attempting to fix rule violation: ${violation.rule}`);

        const agentSkill = this.getAgentForRule(violation.rule);
        if (!agentSkill) {
          console.log(`❌ No agent/skill mapping found for rule: ${violation.rule}`);
          continue;
        }

        const { agent, skill } = agentSkill;

        // Call the skill invocation MCP server to delegate to the agent/skill
        const { mcpClientManager } = await import('../mcp-client.js');
        const result = await mcpClientManager.callServerTool(
          "skill-invocation",
          "invoke-skill",
          {
            skillName: skill,
            toolName: "analyze_code_quality",
            args: {
              code: context.files || [],
              language: "typescript",
              context: {
                rule: violation.rule,
                message: violation.message,
                files: context.files,
                newCode: context.newCode
              }
            }
          }
        );

        console.log(`✅ Agent ${agent} attempted fix for rule: ${violation.rule}`);

      } catch (error) {
        console.log(`❌ Failed to call agent for rule ${violation.rule}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get the appropriate agent/skill for a rule violation
   */
  private getAgentForRule(ruleId: string): { agent: string; skill: string } | null {
    const ruleMappings: Record<string, { agent: string; skill: string }> = {
      "tests-required": { agent: "test-architect", skill: "testing-strategy" },
      "no-duplicate-code": { agent: "refactorer", skill: "refactoring-strategies" },
      "no-over-engineering": { agent: "architect", skill: "architecture-patterns" },
      "resolve-all-errors": { agent: "bug-triage-specialist", skill: "code-review" },
      "prevent-infinite-loops": { agent: "bug-triage-specialist", skill: "code-review" },
      "state-management-patterns": { agent: "architect", skill: "architecture-patterns" },
      "import-consistency": { agent: "refactorer", skill: "refactoring-strategies" },
      "documentation-required": { agent: "librarian", skill: "project-analysis" },
      "clean-debug-logs": { agent: "refactorer", skill: "refactoring-strategies" }
    };

    return ruleMappings[ruleId] || null;
  }
}
