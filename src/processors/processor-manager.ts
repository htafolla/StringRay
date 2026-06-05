import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { ProcessorRegistration, ProcessorHook, PreValidateContext, PostValidateContext, ProcessorExecutionResult, ProcessorContext } from "./processor-types.js";
import { IProcessor, BaseProcessor } from "./processor-interfaces.js";
import { readdir } from "fs/promises";
import { join, basename } from "path";

export interface StaggerPolicy {
  minIntervalMs: number;
}

export interface ProcessorConfig {
  name: string;
  type: "pre" | "post";
  priority: number;
  enabled: boolean;
  timeout?: number;
  retryAttempts?: number;
  hook?: ProcessorHook;
  stagger?: StaggerPolicy;
}

export interface ProcessorResult {
  success: boolean;
  data?: unknown;
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

type ProcessorFactory = {
  execute: (context: Record<string, unknown>) => Promise<unknown>;
  init?: () => Promise<void>;
};

export class ProcessorManager {
  private processors = new Map<string, ProcessorConfig>();
  private metrics = new Map<string, ProcessorMetrics>();
  private stateManager: StringRayStateManager;
  private activeProcessors = new Set<string>();
  private factories = new Map<string, ProcessorFactory>();
  private lastExecutionTime = new Map<string, number>();

  constructor(stateManager: StringRayStateManager) {
    this.stateManager = stateManager;
    this.registerBuiltInFactories();
  }

  registerProcessorInstance(processor: IProcessor): boolean {
    if (this.factories.has(processor.name)) {
      return false;
    }

    this.factories.set(processor.name, {
      execute: async (ctx) => {
        const result = await processor.execute(ctx as ProcessorContext);
        return result.data;
      },
    });

    frameworkLogger.log("processor-manager", "auto-discovered-processor", "info", {
      name: processor.name,
      type: processor.type,
      priority: processor.priority,
    });

    return true;
  }

  async discoverProcessors(directory?: string): Promise<string[]> {
    const dir = directory || join(__dirname, "implementations");
    const discovered: string[] = [];

    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return discovered;
    }

    for (const file of files) {
      const isJs = file.endsWith(".js");
      const isTs = file.endsWith(".ts");
      if ((!isJs && !isTs) || file.includes(".test.") || file.includes(".spec.") || file.includes(".d.ts")) {
        continue;
      }

      try {
        const baseName = basename(file, isJs ? ".js" : ".ts");
        const modulePath = `./implementations/${baseName}.js`;
        const mod = await import(modulePath);

        for (const exportValue of Object.values(mod)) {
          if (typeof exportValue === "function" && exportValue.prototype) {
            try {
              const deps = (exportValue as typeof BaseProcessor).dependencies;
              const instance = deps && deps.length > 0
                ? this.instantiateWithDeps(exportValue as new (...args: unknown[]) => IProcessor, deps)
                : new (exportValue as new () => IProcessor)();

              if (
                instance &&
                typeof instance.name === "string" &&
                instance.name.length > 0 &&
                (instance.type === "pre" || instance.type === "post") &&
                typeof instance.priority === "number" &&
                typeof instance.execute === "function"
              ) {
                this.registerProcessorInstance(instance);
                discovered.push(instance.name);
              }
            } catch {
              // Constructor may require arguments we can't resolve — skip
            }
          }
        }
      } catch (error) {
        frameworkLogger.log("processor-manager", "discovery-import-failed", "warning", {
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    frameworkLogger.log("processor-manager", "processor-discovery-complete", "info", {
      scanned: files.length,
      discovered: discovered.length,
      names: discovered,
    });

    return discovered;
  }

  private instantiateWithDeps(
    Ctor: new (...args: unknown[]) => IProcessor,
    deps: ReadonlyArray<import("./processor-interfaces.js").ProcessorDependency>,
  ): IProcessor | null {
    const resolved: unknown[] = [];
    for (const dep of deps) {
      if (dep === "stateManager") {
        resolved.push(this.stateManager);
      } else {
        frameworkLogger.log("processor-manager", "unresolved-dependency", "warning", {
          dependency: dep,
          processor: Ctor.name,
        });
        return null;
      }
    }
    return new Ctor(...resolved);
  }

  private registerBuiltInFactories(): void {
    const f = this.factories;

    f.set("preValidate", {
      execute: async (ctx) => {
        const { PreValidateProcessor } = await import("./implementations/pre-validate-processor.js");
        const p = new PreValidateProcessor();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing pre-validate processor", "info");
      },
    });

    f.set("codexCompliance", {
      execute: async (ctx) => {
        const { CodexComplianceProcessor } = await import("./implementations/codex-compliance-processor.js");
        const p = new CodexComplianceProcessor();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing codex compliance processor", "info");
      },
    });

    f.set("logProtection", {
      execute: async (ctx) => {
        const { LogProtectionProcessor } = await import("./implementations/log-protection-processor.js");
        const p = new LogProtectionProcessor();
        const filePath = (ctx as any).filePath || (ctx as any).toolInput?.args?.filePath;
        const operation = (ctx as any).operation || (ctx as any).toolInput?.args?.operation;
        const result = await p.execute({ filePath, operation } as ProcessorContext);
        return result.data;
      },
    });

    f.set("versionCompliance", {
      execute: async (ctx) => {
        const { VersionComplianceProcessor } = await import("./implementations/version-compliance-processor.js");
        const p = new VersionComplianceProcessor(process.cwd());
        const result = await p.validateVersionCompliance();
        return {
          success: result.compliant,
          errors: result.errors || [],
          warnings: result.warnings || [],
          checkedAt: new Date().toISOString(),
        };
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing version compliance processor", "info");
        try {
          const { VersionComplianceProcessor } = await import("./implementations/version-compliance-processor.js");
          const p = new VersionComplianceProcessor(process.cwd());
          const result = await p.validateVersionCompliance();
          if (!result.compliant) {
            frameworkLogger.log("processor-manager", "version-compliance", "info", {
              message: "Version compliance issues detected - commits may be blocked",
              errors: result.errors,
              warnings: result.warnings,
            });
          } else {
            frameworkLogger.log("processor-manager", "version-compliance", "info", {
              message: `Version compliance verified: NPM ${result.npmVersion}, UVM ${result.uvmVersion}`,
            });
          }
        } catch (error) {
          frameworkLogger.log("processor-manager", "version-compliance-init-error", "error", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    f.set("errorBoundary", {
      execute: async (ctx) => {
        const { ErrorBoundaryProcessor } = await import("./implementations/error-boundary-processor.js");
        const p = new ErrorBoundaryProcessor();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing error boundary processor", "info");
      },
    });

    f.set("testExecution", {
      execute: async (ctx) => {
        const { TestExecutionProcessor } = await import("./implementations/test-execution-processor.js");
        const p = new TestExecutionProcessor();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing test execution processor", "info");
      },
    });

    f.set("regressionTesting", {
      execute: async (ctx) => {
        const { RegressionTestingProcessor } = await import("./implementations/regression-testing-processor.js");
        const p = new RegressionTestingProcessor();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing regression testing processor", "info");
      },
    });

    f.set("stateValidation", {
      execute: async (ctx) => {
        const { StateValidationProcessor } = await import("./implementations/state-validation-processor.js");
        const p = new StateValidationProcessor(this.stateManager);
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing state validation processor", "info");
      },
    });

    f.set("refactoringLogging", {
      execute: async (ctx) => {
        const { RefactoringLoggingProcessorWrapper } = await import("./implementations/refactoring-logging-processor-wrapper.js");
        const p = new RefactoringLoggingProcessorWrapper();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
    });

    f.set("testAutoCreation", {
      execute: async (ctx) => {
        const { testAutoCreationProcessor } = await import("./implementations/test-auto-creation-processor.js");
        const result = await testAutoCreationProcessor.execute(ctx as any);
        return { success: result.success, message: result.message, data: result.data };
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing test auto-creation processor", "info");
      },
    });

    f.set("coverageAnalysis", {
      execute: async (ctx) => {
        const { CoverageAnalysisProcessor } = await import("./implementations/coverage-analysis-processor.js");
        const p = new CoverageAnalysisProcessor();
        const r = await p.execute(ctx as ProcessorContext);
        return r.data;
      },
    });

    f.set("agentsMdValidation", {
      execute: async (ctx) => {
        const { AgentsMdValidationProcessor } = await import("./implementations/agents-md-validation-processor.js");
        const p = new AgentsMdValidationProcessor(process.cwd());
        const result = await p.execute({
          tool: (ctx as any).tool || "validate",
          operation: (ctx as any).operation || "pre-commit",
        });
        return {
          success: result.success,
          blocked: result.blocked,
          message: result.message,
          errors: result.result?.errors || [],
          warnings: result.result?.warnings || [],
          checkedAt: new Date().toISOString(),
        };
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing AGENTS.md validation processor", "info");
        try {
          const { AgentsMdValidationProcessor } = await import("./implementations/agents-md-validation-processor.js");
          const p = new AgentsMdValidationProcessor(process.cwd());
          const result = await p.execute({ tool: "validate", operation: "initialization" });
          if (!result.success && result.blocked) {
            frameworkLogger.log("processor-manager", "agents-md-validation", "info", {
              message: "AGENTS.md validation failed - commit operations may be blocked",
            });
          }
        } catch (error) {
          frameworkLogger.log("processor-manager", "agents-md-validation-init-error", "error", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    f.set("typescriptCompilation", {
      execute: async (ctx) => {
        const { runTypeScriptCompilation } = await import("./implementations/typescript-compilation-processor.js");
        const cwd = (ctx as any).directory || process.cwd();
        return runTypeScriptCompilation(cwd) as unknown as Record<string, unknown>;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing typescript compilation processor", "info");
      },
    });

    f.set("spawnGovernance", {
      execute: async (ctx) => {
        const { runSpawnGovernance } = await import("./implementations/spawn-governance-processor.js");
        return runSpawnGovernance(ctx);
      },
      init: async () => {
        try {
          const { SpawnGovernanceProcessor } = await import("./implementations/spawn-governance-processor.js");
          frameworkLogger.log("processor-manager", "spawn-governance-processor-initialized", "success", {
            maxConcurrent: SpawnGovernanceProcessor.DEFAULT_MAX_CONCURRENT,
          });
        } catch (error) {
          frameworkLogger.log("processor-manager", "spawn-governance-init-failed", "error", {
            error: String(error),
          });
        }
      },
    });

    f.set("performanceBudget", {
      execute: async (ctx) => {
        const { runPerformanceBudgetCheck } = await import("./implementations/performance-budget-processor.js");
        return runPerformanceBudgetCheck(ctx as unknown as PreValidateContext);
      },
      init: async () => {
        try {
          const { PerformanceBudgetProcessor, DEFAULT_PERFORMANCE_BUDGET } =
            await import("./implementations/performance-budget-processor.js");
          frameworkLogger.log("processor-manager", "performance-budget-processor-initialized", "success", {
            config: DEFAULT_PERFORMANCE_BUDGET,
          });
        } catch (error) {
          frameworkLogger.log("processor-manager", "performance-budget-init-failed", "error", {
            error: String(error),
          });
        }
      },
    });

    f.set("asyncPattern", {
      execute: async (ctx) => {
        const { runAsyncPatternCheck } = await import("./implementations/async-pattern-processor.js");
        return runAsyncPatternCheck(ctx as unknown as PreValidateContext);
      },
      init: async () => {
        try {
          frameworkLogger.log("processor-manager", "async-pattern-processor-initialized", "success");
        } catch (error) {
          frameworkLogger.log("processor-manager", "async-pattern-init-failed", "error", {
            error: String(error),
          });
        }
      },
    });

    f.set("consoleLogGuard", {
      execute: async (ctx) => {
        const { runConsoleLogGuard } = await import("./implementations/console-log-guard-processor.js");
        return runConsoleLogGuard(ctx as unknown as PreValidateContext);
      },
      init: async () => {
        try {
          frameworkLogger.log("processor-manager", "console-log-guard-processor-initialized", "success");
        } catch (error) {
          frameworkLogger.log("processor-manager", "console-log-guard-init-failed", "error", {
            error: String(error),
          });
        }
      },
    });

    f.set("nudge", {
      execute: async (ctx) => {
        const { executeNudgeProcessor } = await import("./implementations/nudge-processor.js");
        const result = await executeNudgeProcessor(ctx as ProcessorContext);
        return result.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing nudge processor", "info");
      },
    });

    f.set("consoleLogGuardPost", {
      execute: async (ctx) => {
        const { runConsoleLogGuard } = await import("./implementations/console-log-guard-processor.js");
        return runConsoleLogGuard(ctx as unknown as PostValidateContext);
      },
    });

    f.set("postProcessorChain", {
      execute: async (ctx) => {
        const { runPostProcessorChainValidation } = await import("./implementations/postprocessor-chain-validator.js");
        return runPostProcessorChainValidation(ctx as unknown as PostValidateContext);
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "postprocessor-chain-initialized", "success");
      },
    });

    f.set("commitBatcher", {
      execute: async (ctx) => {
        const { executeCommitBatcherProcessor } = await import("./implementations/commit-batcher-processor.js");
        const result = await executeCommitBatcherProcessor(ctx as ProcessorContext);
        return result.data;
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "initializing commit batcher processor", "info");
      },
    });

    f.set("publishPreflight", {
      execute: async (ctx) => {
        const { PublishPreflightProcessor } = await import("./implementations/publish-preflight-processor.js");
        const p = new PublishPreflightProcessor();
        return p.execute(ctx as unknown as ProcessorContext);
      },
      init: async () => {
        frameworkLogger.log("processor-manager", "publish-preflight-initialized", "success");
      },
    });

    f.set("storytellingTrigger", {
      execute: async (ctx) => {
        const { StorytellingTriggerProcessor } = await import("./implementations/storytelling-trigger-processor.js");
        const p = new StorytellingTriggerProcessor();
        return p.execute(ctx as unknown as ProcessorContext);
      },
    });

    f.set("inferenceImprovement", {
      execute: async (ctx) => {
        const { InferenceImprovementProcessor } = await import("./implementations/inference-improvement-processor.js");
        const p = new InferenceImprovementProcessor();
        return p.execute(ctx as unknown as ProcessorContext);
      },
    });

    f.set("sessionSummary", {
      execute: async (ctx) => {
        const { SessionSummaryProcessor } = await import("./implementations/session-summary-processor.js");
        const p = new SessionSummaryProcessor();
        return p.execute(ctx as unknown as ProcessorContext);
      },
    });

  }

  registerFactory(name: string, factory: ProcessorFactory): void {
    this.factories.set(name, factory);
  }

  registerProcessorWithHook(registration: ProcessorRegistration): void {
    const config: ProcessorConfig = {
      name: registration.name,
      type: registration.type,
      priority: registration.hook.priority,
      enabled: registration.hook.enabled,
    };
    this.registerProcessor(config);
    this.processors.set(registration.name, { ...config, hook: registration.hook });
  }

  registerProcessor(config: ProcessorConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error("Processor name cannot be empty");
    }
    if (config.name.includes(" ")) {
      throw new Error("Processor name must be a valid identifier (no spaces)");
    }
    if (config.type !== "pre" && config.type !== "post") {
      throw new Error('Processor type must be either "pre" or "post"');
    }
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
      type: config.type,
    });
  }

  unregisterProcessor(name: string): void {
    if (!this.processors.has(name)) {
      throw new Error(`Processor ${name} is not registered`);
    }
    this.processors.delete(name);
    this.metrics.delete(name);
    this.activeProcessors.delete(name);

    frameworkLogger.log("processor-manager", "processor unregistered", "success", { name });
  }

  getProcessors(): Map<string, ProcessorConfig> {
    return this.processors;
  }

  async initializeProcessors(): Promise<boolean> {
    const jobId = `init-processors-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    frameworkLogger.log("processor-manager", "initializeProcessors called", "info", {
      jobId,
      totalProcessors: this.processors.size,
      enabledProcessors: Array.from(this.processors.values()).filter((p) => p.enabled).length,
    });

    frameworkLogger.log("processor-manager", "initializing processors", "info", { jobId });

    const initPromises = Array.from(this.processors.values())
      .filter((p) => p.enabled)
      .map(async (config) => {
        try {
          await this.initializeProcessor(config.name);
          frameworkLogger.log("processor-manager", "processor initialized successfully", "success", {
            jobId,
            processor: config.name,
          });
          return { name: config.name, success: true };
        } catch (error) {
          frameworkLogger.log("processor-manager", "processor initialization failed", "error", {
            jobId,
            processor: config.name,
            error: error instanceof Error ? error.message : String(error),
          });
          frameworkLogger.log("processor-manager", "processor-initialization-failed", "error", {
            processor: config.name,
            error: error instanceof Error ? error.message : String(error),
          });
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
      frameworkLogger.log("processor-manager", "batch-initialization-failed", "error", {
        count: failures.length,
        failures: failures.map((f) => f.error).join(", "),
      });
      return false;
    }

    return true;
  }

  private async initializeProcessor(name: string): Promise<void> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    const factory = this.factories.get(name);
    if (factory?.init) {
      await factory.init();
    }

    this.activeProcessors.add(name);
  }

  async executePreProcessors(input: {
    tool: string;
    args?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }): Promise<{ success: boolean; results: ProcessorResult[] }> {
    const jobId = `execute-pre-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { tool, args, context } = input;

    frameworkLogger.log("processor-manager", "executePreProcessors called", "debug", {
      jobId,
      tool,
      processorCount: Array.from(this.processors.values()).filter(
        (p) => p.type === "pre" && p.enabled,
      ).length,
    });

    const preProcessors = Array.from(this.processors.values())
      .filter((p) => p.type === "pre" && p.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (args && typeof args === "object") {
      const promptText =
        (args.prompt as string) ||
        (args.message as string) ||
        (args.content as string) ||
        (args.input as string);
      if (promptText && typeof promptText === "string" && promptText.length > 10) {
        try {
          const { promptSecurityValidator } = await import("../security/prompt-security-validator.js");
          const validation = promptSecurityValidator.validatePrompt(promptText);
          if (!validation.isSafe) {
            frameworkLogger.log("processor-manager", "prompt-security-blocked", "warning", {
              tool,
              riskLevel: validation.riskLevel,
              violations: validation.violations,
            });
            return {
              success: false,
              results: [
                {
                  success: false,
                  processorName: "prompt-security-validator",
                  error: `Prompt security violation: ${validation.violations.join(", ")}`,
                  duration: 0,
                },
              ],
            };
          }
        } catch {
          /* non-blocking */
        }
      }
    }

    const results: ProcessorResult[] = [];

    for (const config of preProcessors) {
      if (config.stagger?.minIntervalMs) {
        const lastExec = this.lastExecutionTime.get(config.name) ?? 0;
        const elapsed = Date.now() - lastExec;
        const remaining = config.stagger.minIntervalMs - elapsed;
        if (remaining > 0) {
          frameworkLogger.log("processor-manager", "stagger-wait", "debug", {
            processor: config.name,
            waitMs: remaining,
            minIntervalMs: config.stagger.minIntervalMs,
          });
          await new Promise((r) => setTimeout(r, remaining));
        }
      }

      const result = await this.executeProcessor(config.name, context);
      results.push(result);
      this.lastExecutionTime.set(config.name, Date.now());

      if (!result.success) {
        frameworkLogger.log("processor-manager", "pre-processor failed", "info", {
          jobId,
          processor: config.name,
          tool,
          error: result.error,
        });
      } else {
        frameworkLogger.log("processor-manager", "pre-processor succeeded", "success", {
          jobId,
          processor: config.name,
          tool,
          duration: result.duration,
        });
      }
    }

    const overallSuccess = results.every((r) => r.success);

    frameworkLogger.log("processor-manager", "executePreProcessors completed", "debug", {
      jobId,
      tool,
      totalResults: results.length,
      successCount: results.filter((r) => r.success).length,
      overallSuccess,
    });

    return { success: overallSuccess, results };
  }

  async executePostProcessors(
    operation: string,
    data: any,
    preResults: ProcessorResult[],
  ): Promise<ProcessorResult[]> {
    const jobId = `execute-post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    frameworkLogger.log("processor-manager", "executePostProcessors called", "debug", {
      jobId,
      operation,
      preResultCount: preResults.length,
      processorCount: Array.from(this.processors.values()).filter(
        (p) => p.type === "post" && p.enabled,
      ).length,
    });

    const postProcessors = Array.from(this.processors.values())
      .filter((p) => p.type === "post" && p.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: ProcessorResult[] = [];

    for (const config of postProcessors) {
      if (config.stagger?.minIntervalMs) {
        const lastExec = this.lastExecutionTime.get(config.name) ?? 0;
        const elapsed = Date.now() - lastExec;
        const remaining = config.stagger.minIntervalMs - elapsed;
        if (remaining > 0) {
          frameworkLogger.log("processor-manager", "stagger-wait", "debug", {
            processor: config.name,
            waitMs: remaining,
            minIntervalMs: config.stagger.minIntervalMs,
          });
          await new Promise((r) => setTimeout(r, remaining));
        }
      }

      const result = await this.executeProcessor(config.name, {
        operation,
        data,
        preResults,
      });
      results.push(result);

      if (!result.success) {
        frameworkLogger.log("processor-manager", "post-processor failed", "error", {
          jobId,
          processor: config.name,
          operation,
          error: result.error,
        });
      } else {
        frameworkLogger.log("processor-manager", "post-processor succeeded", "success", {
          jobId,
          processor: config.name,
          operation,
          duration: result.duration,
        });
      }
    }

    frameworkLogger.log("processor-manager", "executePostProcessors completed", "debug", {
      jobId,
      operation,
      totalResults: results.length,
      successCount: results.filter((r) => r.success).length,
    });

    return results;
  }

  private async executeProcessor(
    name: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProcessorResult> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    const safeContext = context ?? {};

    if (safeContext && typeof safeContext === "object" && !Array.isArray(safeContext)) {
      const validationResult = this.validateProcessorContext(name, context);
      if (!validationResult.valid) {
        await frameworkLogger.log("processor-manager", "context-validation-failed", "info", {
          processor: name,
          errors: validationResult.errors,
        });
      }
    }

    const startTime = Date.now();
    const metrics = this.metrics.get(name)!;

    try {
      const factory = this.factories.get(name);
      if (!factory) {
        throw new Error(`Unknown processor: ${name}`);
      }
      const result = await factory.execute(safeContext);

      const duration = Date.now() - startTime;
      this.updateMetrics(name, true, duration);

      return { success: true, data: result, duration, processorName: name };
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

  private updateMetrics(name: string, success: boolean, duration: number): void {
    const metrics = this.metrics.get(name)!;
    metrics.totalExecutions++;
    metrics.lastExecutionTime = Date.now();

    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    const totalDuration = metrics.averageDuration * (metrics.totalExecutions - 1) + duration;
    metrics.averageDuration = totalDuration / metrics.totalExecutions;

    const successRate = metrics.successfulExecutions / metrics.totalExecutions;
    metrics.healthStatus =
      successRate > 0.95 ? "healthy" : successRate > 0.8 ? "degraded" : "failed";
  }

  getProcessorHealth(): ProcessorHealth[] {
    return Array.from(this.activeProcessors).map((name) => {
      const metrics = this.metrics.get(name)!;
      const totalExecutions = metrics.totalExecutions || 1;
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

  private validateProcessorContext(
    processorName: string,
    context: any,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!context || typeof context !== "object") {
      return { valid: true, errors: [] };
    }
    if (Array.isArray(context)) {
      return { valid: true, errors: [] };
    }

    const contextData = context.data;
    if (contextData && typeof contextData !== "object") {
      return { valid: true, errors: [] };
    }

    const requiredFields: Record<string, string[]> = {
      preValidate: ["operation"],
      codexCompliance: ["operation"],
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
      if (!(field in context) && !(field in (context.data || {}))) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (errors.length > 0) {
      frameworkLogger.log("processor-manager", "context-validation-warnings", "info", {
        processor: processorName,
        errors,
        contextKeys: Object.keys(context),
      });
    }

    return { valid: errors.length === 0, errors };
  }

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

  async cleanupProcessors(): Promise<void> {
    frameworkLogger.log("processor-manager", "cleaning up processors", "info");

    for (const name of this.activeProcessors) {
      try {
        await this.cleanupProcessor(name);
      } catch (error) {
        frameworkLogger.log("processor-manager", "processor-cleanup-failed", "error", {
          processor: name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.activeProcessors.clear();
    this.processors.clear();
    this.metrics.clear();
  }

  private async cleanupProcessor(name: string): Promise<void> {
    // Processor-specific cleanup is handled by the processor classes themselves
    void name;
  }
}
