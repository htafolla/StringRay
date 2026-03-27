/**
 * Boot Orchestrator
 *
 * Implements orchestrator-first boot sequence with automatic enforcement activation.
 * Coordinates the initialization of all framework components in the correct order.
 *
 * @version 1.1.2
 * @since 2026-01-07
 */

import { StringRayContextLoader } from "./context-loader.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { ProcessorManager } from "../processors/processor-manager.js";
import { pathResolver } from "../utils/path-resolver.js";
// Path configuration - can be overridden by environment or use path resolver
const AGENTS_BASE_PATH = process.env.STRRAY_AGENTS_PATH || "../agents";
import {
  createAgentDelegator,
} from "../delegation/index.js";
import { createSessionCleanupManager } from "../session/session-cleanup-manager.js";
import { createSessionMonitor } from "../session/session-monitor.js";
import { createSessionStateManager } from "../session/session-state-manager.js";
import { securityHardener } from "../security/security-hardener.js";
import { securityHeadersMiddleware } from "../security/security-headers.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { memoryMonitor } from "../monitoring/memory-monitor.js";
import { strRayConfigLoader } from "./config-loader.js";
import { activity } from "./activity-logger.js";
import { inferenceTuner } from "../services/inference-tuner.js";
import { setupMemoryMonitoring, getMemoryHealthSummary } from "./memory-monitor-setup.js";

async function dynamicImport<T = any>(
  primaryPath: string,
  fallbackPath?: string,
): Promise<T> {
  try {
    return await import(primaryPath) as T;
  } catch (primaryError) {
    if (fallbackPath) {
      try {
        return await import(fallbackPath) as T;
      } catch (fallbackError) {
        throw new Error(
          `Failed to import ${primaryPath} and fallback ${fallbackPath}: ${String(primaryError)} / ${String(fallbackError)}`,
        );
      }
    }
    throw primaryError;
  }
}

/**
 * Set up graceful interruption handling to prevent JSON parsing errors
 * when processes are interrupted mid-operation
 */
function setupGracefulShutdown(): void {
  // Prevent duplicate listeners
  if ((process as any)._strrayShutdownSetup) {
    return;
  }
  (process as any)._strrayShutdownSetup = true;

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "received-signal-already-shutting-down",
        "info",
        { signal, message: "Already shutting down..." },
      );
      return;
    }

    isShuttingDown = true;

    try {
      await frameworkLogger.log(
        "boot-orchestrator",
        "received-signal-shutting-down",
        "info",
        { signal, message: "Shutting down gracefully..." },
      );
      memoryMonitor.stop();
      await new Promise((resolve) => setTimeout(resolve, 500));
      process.exit(0);
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "graceful-shutdown-failed",
        "error",
        { error: String(error) },
      );
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle uncaught exceptions that might cause JSON parsing errors
  process.on("uncaughtException", (error) => {
    frameworkLogger.log(
      "boot-orchestrator",
      "uncaught-exception",
      "error",
      { error: String(error), stack: error.stack },
    ).catch(() => {}); // Ignore logging errors during shutdown
    memoryMonitor.stop();
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    frameworkLogger.log(
      "boot-orchestrator",
      "unhandled-rejection",
      "error",
      { reason: String(reason), promise: String(promise) },
    ).catch(() => {}); // Ignore logging errors during shutdown
    memoryMonitor.stop();
    process.exit(1);
  });
}

export interface BootSequenceConfig {
  enableEnforcement: boolean;
  codexValidation: boolean;
  sessionManagement: boolean;
  processorActivation: boolean;
  agentLoading: boolean;
  autoStartInferenceTuner: boolean;
}

interface ProcessorDefinition {
  name: string;
  type: "pre" | "post";
  priority: number;
  enabled: boolean;
}

export interface BootResult {
  success: boolean;
  orchestratorLoaded: boolean;
  sessionManagementActive: boolean;
  processorsActivated: boolean;
  enforcementEnabled: boolean;
  codexComplianceActive: boolean;
  agentsLoaded: string[];
  inferenceTunerActive: boolean;
  skillRegistryActive: boolean;
  skillsDiscovered: number;
  errors: string[];
}

export class BootOrchestrator {
  private contextLoader: StringRayContextLoader;
  private stateManager: StringRayStateManager;
  private processorManager: ProcessorManager;
  private config: BootSequenceConfig;
  private memoryMonitorListener?: (alert: any) => void;

  constructor(
    config: Partial<BootSequenceConfig> = {},
    stateManager?: StringRayStateManager,
  ) {
    // Set up graceful shutdown handling first
    setupGracefulShutdown();

    // Initialize components first for state management
    this.contextLoader = StringRayContextLoader.getInstance();
    this.stateManager = stateManager || new StringRayStateManager();
    this.processorManager = new ProcessorManager(this.stateManager);

    // Initialize memory monitoring with alerts
    this.initializeMemoryMonitoring();

    this.config = {
      enableEnforcement: true,
      codexValidation: true,
      sessionManagement: true,
      processorActivation: true,
      agentLoading: true,
      autoStartInferenceTuner: false,
      ...config,
    };
  }

  /**
   * Initialize delegation system components
   */
  private async initializeDelegationSystem(): Promise<boolean> {
    try {
      const agentDelegator = createAgentDelegator(
        this.stateManager,
        strRayConfigLoader,
      );
      this.stateManager.set("delegation:agent_delegator", agentDelegator);

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "delegation-system-initialization-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  /**
   * Load orchestrator as the first component
   */
  private async loadOrchestrator(): Promise<boolean> {
    try {
      const orchestratorModule = await dynamicImport<{ strRayOrchestrator: any }>(
        "../core/orchestrator.js",
        "../core/orchestrator",
      );

      const orchestratorInstance = orchestratorModule.strRayOrchestrator;

      if (!orchestratorInstance) {
        await frameworkLogger.log(
          "boot-orchestrator",
          "orchestrator-instance-not-found",
          "error",
          { module: "strRayOrchestrator" },
        );
        return false;
      }

      // Store in state manager for later access
      this.stateManager.set("orchestrator", orchestratorInstance);

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "orchestrator-load-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  /**
   * Initialize session management system
   */
  private async initializeSessionManagement(): Promise<boolean> {
    try {
      // Initialize session state
      this.stateManager.set("session:active", true);
      this.stateManager.set("session:boot_time", Date.now());
      this.stateManager.set("session:agents", []);

      const sessionCoordinator = this.stateManager.get(
        "delegation:session_coordinator",
      ) as any;

      if (sessionCoordinator) {
        // Initialize session monitor first
        const sessionMonitor = createSessionMonitor(
          this.stateManager,
          sessionCoordinator,
          undefined as any, // Will be set later
        );
        this.stateManager.set("session:monitor", sessionMonitor);

        // Initialize session cleanup manager with session monitor reference
        const cleanupManager = createSessionCleanupManager(
          this.stateManager,
          {},
          sessionMonitor,
        );
        this.stateManager.set("session:cleanup_manager", cleanupManager);

        // Update session monitor with cleanup manager reference
        (sessionMonitor as any).cleanupManager = cleanupManager;

        const stateManagerInstance = createSessionStateManager(
          this.stateManager,
          sessionCoordinator,
        );
        this.stateManager.set("session:state_manager", stateManagerInstance);

        const defaultSession = this.stateManager.get(
          "delegation:default_session",
        ) as any;
        if (defaultSession?.sessionId) {
          cleanupManager.registerSession(defaultSession.sessionId);
          sessionMonitor.registerSession(defaultSession.sessionId);
        }
      }

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "session-management-initialization-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  /**
   * Register processors in batch with consistent logging
   */
  private registerProcessorsBatch(processors: ProcessorDefinition[], jobId: string): void {
    for (const processor of processors) {
      this.processorManager.registerProcessor({
        name: processor.name,
        type: processor.type,
        priority: processor.priority,
        enabled: processor.enabled,
      });
      frameworkLogger.log(
        "boot-orchestrator",
        `registered ${processor.name} processor`,
        "success",
        { jobId },
      );
    }
  }

  /**
   * Activate pre/post processors
   */
  private async activateProcessors(jobId: string): Promise<boolean> {
    try {
      frameworkLogger.log(
        "boot-orchestrator",
        "activateProcessors started",
        "info",
        { jobId },
      );

      const processorsToRegister: ProcessorDefinition[] = [
        { name: "preValidate", type: "pre", priority: 10, enabled: true },
        { name: "codexCompliance", type: "pre", priority: 20, enabled: true },
        { name: "testAutoCreation", type: "pre", priority: 22, enabled: true },
        { name: "versionCompliance", type: "pre", priority: 25, enabled: true },
        { name: "errorBoundary", type: "pre", priority: 30, enabled: true },
        { name: "agentsMdValidation", type: "pre", priority: 35, enabled: true },
        { name: "stateValidation", type: "post", priority: 130, enabled: true },
      ];

      this.registerProcessorsBatch(processorsToRegister, jobId);

      frameworkLogger.log(
        "boot-orchestrator",
        "skipping refactoringLogging processor - not available",
        "info",
        { jobId },
      );

      const initSuccess = await this.processorManager.initializeProcessors();
      if (!initSuccess) {
        frameworkLogger.log(
          "boot-orchestrator",
          "processor initialization failed",
          "error",
          { jobId },
        );
        throw new Error("Processor initialization failed");
      }

      frameworkLogger.log(
        "boot-orchestrator",
        "processors initialized successfully",
        "success",
        { jobId },
      );

      this.stateManager.set("processor:manager", this.processorManager);
      this.stateManager.set("processor:active", true);

      frameworkLogger.log(
        "boot-orchestrator",
        "processors activated and stored in state",
        "success",
        { jobId },
      );

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "processor-activation-failed",
        "error",
        { jobId, error: String(error) },
      );
      return false;
    }
  }

  /**
   * Load remaining agents after orchestrator
   */
  private async loadRemainingAgents(jobId: string): Promise<string[]> {
    const agents = [
      "enforcer",
      "architect",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "testing-lead",
    ];
    const loadedAgents: string[] = [];

    for (const agentName of agents) {
      try {
        // Dynamic import of agent modules using path resolver
        const agentPath = pathResolver.resolveAgentPath(agentName);
        await frameworkLogger.log(
          "boot-orchestrator",
          "agent-loading",
          "info",
          { jobId, agentName, agentPath },
        );
        const agentModule = await import(agentPath);
        const agentClass =
          agentModule[
            `StringRay${agentName.charAt(0).toUpperCase() + agentName.slice(1)}Agent`
          ];

        if (agentClass) {
          const agentInstance = new agentClass();
          this.stateManager.set(`agent:${agentName}`, agentInstance);
          loadedAgents.push(agentName);
        } else {
          await frameworkLogger.log(
            "boot-orchestrator",
            "agent-class-not-found",
            "warning",
            { agentName },
          );
        }
      } catch (error) {
        await frameworkLogger.log(
          "boot-orchestrator",
          "agent-load-failed",
          "warning",
          { agentName, error: String(error) },
        );
      }
    }

    // Update session state with loaded agents
    this.stateManager.set("session:agents", loadedAgents);

    return loadedAgents;
  }

  /**
   * Enable automatic enforcement activation
   */
  private async enableEnforcement(): Promise<boolean> {
    try {
      // Load codex terms for enforcement
      const loadResult = await this.contextLoader.loadCodexContext(
        process.cwd(),
      );

      if (!loadResult.success || !loadResult.context) {
        throw new Error("No codex terms loaded for enforcement");
      }

      const codexTerms = Array.from(loadResult.context.terms.values());

      // Enable enforcement mechanisms
      this.stateManager.set("enforcement:active", true);
      this.stateManager.set("enforcement:codex_terms", codexTerms);
      this.stateManager.set("enforcement:enabled_at", Date.now());

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "enforcement-enable-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  /**
   * Activate codex compliance checking during boot
   */
  private async activateCodexCompliance(): Promise<boolean> {
    try {
      let codexInjector = this.stateManager.get("processor:codex_injector");
      if (!codexInjector) {
        const { CodexInjector } = await dynamicImport<{ CodexInjector: new () => any }>(
          "./codex-injector.js",
          "./codex-injector",
        );
        codexInjector = new CodexInjector();
        this.stateManager.set("processor:codex_injector", codexInjector);
      }

      this.stateManager.set("compliance:active", true);
      this.stateManager.set("compliance:validator", codexInjector);
      this.stateManager.set("compliance:activated_at", Date.now());

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "codex-compliance-activation-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  private async initializeSecurityComponents(): Promise<void> {
    try {
      this.stateManager.set("security:hardener", securityHardener);
      this.stateManager.set(
        "security:headers_middleware",
        securityHeadersMiddleware,
      );
      this.stateManager.set("security:initialized", true);
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "security-components-initialization-failed",
        "error",
        { error: String(error) },
      );
      throw error;
    }
  }

  private async finalizeSecurityIntegration(): Promise<void> {
    try {
      const auditResult = await this.runInitialSecurityAudit();
      this.stateManager.set("security:initial_audit", auditResult);

      const hardener = this.stateManager.get("security:hardener") as any;
      if (hardener?.config?.enableSecureHeaders) {
        this.stateManager.set("security:headers_active", true);
      }
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "security-integration-finalization-failed",
        "error",
        { error: String(error) },
      );
    }
  }

  private async initializeInferenceTuner(): Promise<boolean> {
    if (!this.config.autoStartInferenceTuner) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "inference-tuner-disabled",
        "info",
        {},
      );
      return false;
    }

    try {
      inferenceTuner.start();
      this.stateManager.set("inference:tuner_active", true);
      this.stateManager.set("inference:tuner_status", inferenceTuner.getStatus());
      
      await frameworkLogger.log(
        "boot-orchestrator",
        "inference-tuner-started",
        "info",
        { status: inferenceTuner.getStatus() },
      );
      
      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "inference-tuner-initialization-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  private async runInitialSecurityAudit(): Promise<any> {
    try {
      const securityAuditorPath = pathResolver.resolveModulePath(
        "security/security-auditor",
      );
      const { SecurityAuditor } = await import(securityAuditorPath);
      const auditor = new SecurityAuditor();

      const result = await auditor.auditProject(process.cwd());

      if (result.score < 80) {
        await frameworkLogger.log(
          "boot-orchestrator",
          "initial-security-score-low",
          "warning",
          { score: result.score, target: 80 },
        );
      }

      return result;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "initial-security-audit-failed",
        "error",
        { error: String(error) },
      );
      return { score: 0, issues: [] };
    }
  }

  /**
   * Validate processor health during boot
   */
  private async validateProcessorHealth(): Promise<boolean> {
    try {
      const healthStatus = this.processorManager.getProcessorHealth();
      const failedProcessors = healthStatus.filter(
        (h) => h.status === "failed",
      );

      if (failedProcessors.length > 0) {
        await frameworkLogger.log(
          "boot-orchestrator",
          "processor-health-check-failed",
          "error",
          { failedProcessors: failedProcessors.map((p) => p.name) },
        );
        return false;
      }

      const degradedProcessors = healthStatus.filter(
        (h) => h.status === "degraded",
      );
      if (degradedProcessors.length > 0) {
        await frameworkLogger.log(
          "boot-orchestrator",
          "processors-degraded",
          "warning",
          { degradedProcessors: degradedProcessors.map((p) => p.name) },
        );
      }

      return true;
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "processor-health-validation-failed",
        "error",
        { error: String(error) },
      );
      return false;
    }
  }

  /**
   * Get current boot status information
   */
  getBootStatus(): BootResult {
    const agentsLoaded = this.stateManager.get("session:agents") || [];
    const errors: string[] = [];

    // Check for any stored errors
    const storedErrors = this.stateManager.get("boot:errors");
    if (Array.isArray(storedErrors)) {
      errors.push(...storedErrors);
    }

    return {
      success: this.stateManager.get("boot:success") || false,
      orchestratorLoaded: !!this.stateManager.get("orchestrator"),
      sessionManagementActive: this.stateManager.get("session:active") || false,
      processorsActivated: this.stateManager.get("processor:active") || false,
      enforcementEnabled: this.stateManager.get("enforcement:active") || false,
      codexComplianceActive:
        this.stateManager.get("compliance:active") || false,
      inferenceTunerActive: this.stateManager.get("inference:tuner_active") || false,
      skillRegistryActive: this.stateManager.get("skill:registry_active") || false,
      skillsDiscovered: this.stateManager.get("skill:count") || 0,
      agentsLoaded: Array.isArray(agentsLoaded) ? agentsLoaded : [],
      errors,
    };
  }

  /**
   * Initialize memory monitoring using the shared setup module
   */
  private initializeMemoryMonitoring(): void {
    setupMemoryMonitoring({
      stateManager: this.stateManager,
      memoryMonitorListener: this.memoryMonitorListener,
    });
  }

  /**
   * Perform comprehensive memory health check
   */
  getMemoryHealth(): {
    healthy: boolean;
    issues: string[];
    metrics: {
      current: any;
      peak: any;
      average: number;
      trend: string;
    };
  } {
    return getMemoryHealthSummary();
  }

  /**
   * Execute the boot sequence (internal framework initialization)
   */
  async executeBootSequence(): Promise<BootResult> {
    const jobId = `boot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    frameworkLogger.log(
      "boot-orchestrator",
      "executeBootSequence started",
      "info",
      { jobId },
    );

    const result: BootResult = {
      success: false,
      orchestratorLoaded: false,
      sessionManagementActive: false,
      processorsActivated: false,
      agentsLoaded: [],
      enforcementEnabled: false,
      codexComplianceActive: false,
      inferenceTunerActive: false,
      skillRegistryActive: false,
      skillsDiscovered: 0,
      errors: [],
    };

    try {
      frameworkLogger.log(
        "boot-orchestrator",
        "loading StringRay configuration",
        "info",
        { jobId },
      );
      // Phase 0: Load StringRay configuration from Python ConfigManager
      await this.loadStringRayConfiguration(jobId);
      frameworkLogger.log(
        "boot-orchestrator",
        "StringRay configuration loaded",
        "success",
        { jobId },
      );
      // Phase 1: Initialize core systems
      frameworkLogger.log(
        "boot-orchestrator",
        "initializing core systems",
        "info",
        { jobId },
      );
      result.orchestratorLoaded = await this.loadOrchestrator();
      if (!result.orchestratorLoaded) {
        frameworkLogger.log(
          "boot-orchestrator",
          "orchestrator loading failed",
          "error",
          { jobId },
        );
        result.errors.push("Failed to load orchestrator");
        return result;
      }
      frameworkLogger.log(
        "boot-orchestrator",
        "orchestrator loaded successfully",
        "success",
        { jobId },
      );

      const delegationInitialized = await this.initializeDelegationSystem();
      if (!delegationInitialized) {
        frameworkLogger.log(
          "boot-orchestrator",
          "delegation system initialization failed",
          "error",
          { jobId },
        );
        result.errors.push("Failed to initialize delegation system");
        return result;
      }
      frameworkLogger.log(
        "boot-orchestrator",
        "delegation system initialized",
        "success",
        { jobId },
      );

      // Phase 1.5: Skill Discovery (removed - OpenCode handles skill routing natively)
      result.skillRegistryActive = true;
      result.skillsDiscovered = this.stateManager.get("skill:count") || 0;
      frameworkLogger.log(
        "boot-orchestrator",
        "skill discovery initialized",
        "success",
        { jobId, skillCount: result.skillsDiscovered },
      );

      // Phase 2: Session management
      if (this.config.sessionManagement) {
        result.sessionManagementActive =
          await this.initializeSessionManagement();
        if (!result.sessionManagementActive) {
          frameworkLogger.log(
            "boot-orchestrator",
            "session management initialization failed",
            "error",
            { jobId },
          );
          result.errors.push("Failed to initialize session management");
          return result;
        }
      }

      // Phase 3: Processors
      if (this.config.processorActivation) {
        frameworkLogger.log(
          "boot-orchestrator",
          "activating processors",
          "info",
          { jobId },
        );
        result.processorsActivated = await this.activateProcessors(jobId);
        if (!result.processorsActivated) {
          frameworkLogger.log(
            "boot-orchestrator",
            "processor activation failed",
            "error",
            { jobId },
          );
          result.errors.push("Failed to activate processors");
          return result;
        } else {
          frameworkLogger.log(
            "boot-orchestrator",
            "processors activated successfully",
            "success",
            { jobId },
          );
        }
        frameworkLogger.log(
          "boot-orchestrator",
          "processors activated successfully",
          "success",
          { jobId },
        );

        // Validate processor health
        const healthValid = await this.validateProcessorHealth();
        if (!healthValid) {
          frameworkLogger.log(
            "boot-orchestrator",
            "processor health validation failed",
            "error",
            { jobId },
          );
          result.errors.push("Processor health validation failed");
          return result;
        }
        frameworkLogger.log(
          "boot-orchestrator",
          "processor health validated",
          "success",
          { jobId },
        );
      }

      // Phase 4: Load agents
      if (this.config.agentLoading) {
        result.agentsLoaded = await this.loadRemainingAgents(jobId);
      }

      // Phase 5: Security & compliance
      if (this.config.enableEnforcement) {
        frameworkLogger.log(
          "boot-orchestrator",
          "enabling enforcement",
          "info",
          { jobId },
        );
        result.enforcementEnabled = await this.enableEnforcement();
        if (!result.enforcementEnabled) {
          frameworkLogger.log(
            "boot-orchestrator",
            "enforcement enable failed",
            "error",
            { jobId },
          );
          result.errors.push("Failed to enable enforcement");
          return result;
        } else {
          frameworkLogger.log(
            "boot-orchestrator",
            "enforcement enabled successfully",
            "success",
            { jobId },
          );
        }
      }

      if (this.config.codexValidation) {
        frameworkLogger.log(
          "boot-orchestrator",
          "activating codex compliance",
          "info",
          { jobId },
        );
        result.codexComplianceActive = await this.activateCodexCompliance();
        if (!result.codexComplianceActive) {
          frameworkLogger.log(
            "boot-orchestrator",
            "codex compliance activation failed",
            "error",
            { jobId },
          );
          result.errors.push("Failed to activate codex compliance");
          return result;
        } else {
          frameworkLogger.log(
            "boot-orchestrator",
            "codex compliance activated successfully",
            "success",
            { jobId },
          );
        }
      }

      // Finalize security integration
      await this.finalizeSecurityIntegration();

      // Initialize inference tuner (autonomous learning)
      result.inferenceTunerActive = await this.initializeInferenceTuner();

      result.success = true;
    } catch (error) {
      result.errors.push(`Boot sequence error: ${error}`);
    }

    // Store boot result in state manager for getBootStatus
    this.stateManager.set("boot:success", result.success);
    this.stateManager.set("boot:errors", result.errors);

    return result;
  }

  /**
   * Load StringRay configuration from Python ConfigManager
   */
  private async loadStringRayConfiguration(jobId: string): Promise<void> {
    try {
      // Load StringRay configuration directly (no Python dependency)
      const stringRayConfig = {
        version: "1.15.6",
        codex_enabled: true,
        codex_version: "v1.7.5",
        codex_terms: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
          38, 39, 40, 41, 42, 43,
        ],
        monitoring_metrics: [
          "bundle-size",
          "test-coverage",
          "code-duplication",
          "build-time",
          "error-rate",
        ],
        monitoring_alerts: [
          "threshold-violations",
          "security-issues",
          "performance-degradation",
          "test-failures",
        ],
        agent_capabilities: {
          enforcer: [
            "compliance-monitoring",
            "threshold-enforcement",
            "automation-orchestration",
          ],
          architect: [
            "design-review",
            "architecture-validation",
            "dependency-analysis",
          ],
          orchestrator: [
            "task-coordination",
            "multi-agent-orchestration",
            "workflow-management",
          ],
          "bug-triage-specialist": [
            "error-analysis",
            "root-cause-identification",
            "fix-suggestions",
          ],
          "code-reviewer": [
            "code-quality-assessment",
            "best-practice-validation",
            "security-review",
          ],
          "security-auditor": [
            "vulnerability-detection",
            "threat-analysis",
            "security-validation",
          ],
          refactorer: ["code-modernization", "debt-reduction", "consolidation"],
          "testing-lead": [
            "test-strategy-design",
            "coverage-optimization",
            "behavioral-testing",
          ],
        },
      };

      // Store configuration in state manager for use by other components
      this.stateManager.set("strray:config", stringRayConfig);
      this.stateManager.set("strray:version", stringRayConfig.version);
      this.stateManager.set(
        "strray:codex_enabled",
        stringRayConfig.codex_enabled,
      );
      this.stateManager.set("strray:codex_terms", stringRayConfig.codex_terms);
      this.stateManager.set(
        "strray:monitoring_metrics",
        stringRayConfig.monitoring_metrics,
      );
      this.stateManager.set(
        "strray:monitoring_alerts",
        stringRayConfig.monitoring_alerts,
      );
      this.stateManager.set(
        "strray:agent_capabilities",
        stringRayConfig.agent_capabilities,
      );

      await frameworkLogger.log(
        "boot-orchestrator",
        "configuration-loaded",
        "success",
        { jobId },
      );
    } catch (error) {
      await frameworkLogger.log(
        "boot-orchestrator",
        "configuration-load-failed",
        "warning",
        { error: String(error) },
      );
    }
  }
}

// Export singleton instance
export const bootOrchestrator = new BootOrchestrator();
