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
  createSessionCoordinator,
} from "../delegation/index.js";
import { createSessionCleanupManager } from "../session/session-cleanup-manager.js";
import { createSessionMonitor } from "../session/session-monitor.js";
import { createSessionStateManager } from "../session/session-state-manager.js";
import { securityHardener } from "../security/security-hardener.js";
import { securityHeadersMiddleware } from "../security/security-headers.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { memoryMonitor } from "../monitoring/memory-monitor.js";
import { strRayConfigLoader } from "./config-loader.js";

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

  process.on("SIGINT", async () => {
    if (isShuttingDown) {
      process.exit(0);
    }
    isShuttingDown = true;
    try {
      await frameworkLogger.log(
        "boot-orchestrator",
        "-received-sigint-shutting-down-gracefully-",
        "info",
        { message: "Received SIGINT, shutting down gracefully..." },
      );
      // Basic cleanup - orchestrator shutdown handled by process termination
      process.exit(0);
    } catch (error) {
      // Suppress error output in CLI mode to avoid breaking interface
      if (
        process.env.STRRAY_CLI_MODE !== "true" &&
        process.env.OPENCODE_CLI !== "true"
      ) {
        frameworkLogger.log("boot-orchestrator", "shutdown-error", "error", { error, message: "Error during graceful shutdown" });
      }
      process.exit(1);
    }
  });

  process.on("SIGTERM", async () => {
    // Termination signal message kept as console.log

    try {
      memoryMonitor.stop();
      await new Promise((resolve) => setTimeout(resolve, 500));
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions that might cause JSON parsing errors
  process.on("uncaughtException", (error) => {
    // Suppress error output in CLI mode to avoid breaking interface
    if (
      process.env.STRRAY_CLI_MODE !== "true" &&
      process.env.OPENCODE_CLI !== "true"
    ) {
      frameworkLogger.log("boot-orchestrator", "uncaught-exception", "error", { error, message: "Uncaught Exception" });
    }
    memoryMonitor.stop();
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    // Suppress error output in CLI mode to avoid breaking interface
    if (
      process.env.STRRAY_CLI_MODE !== "true" &&
      process.env.OPENCODE_CLI !== "true"
    ) {
      frameworkLogger.log("boot-orchestrator", "unhandled-rejection", "error", { promise, reason, message: "Unhandled Rejection" });
    }
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
}

export interface BootResult {
  success: boolean;
  orchestratorLoaded: boolean;
  sessionManagementActive: boolean;
  processorsActivated: boolean;
  enforcementEnabled: boolean;
  codexComplianceActive: boolean;
  agentsLoaded: string[];
  errors: string[];
}

export class BootOrchestrator {
  private contextLoader: StringRayContextLoader;
  private stateManager: StringRayStateManager;
  private processorManager: ProcessorManager;
  private config: BootSequenceConfig;

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
    this.setupMemoryMonitoring();

    this.config = {
      enableEnforcement: true,
      codexValidation: true,
      sessionManagement: true,
      processorActivation: true,
      agentLoading: true,
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

      const sessionCoordinator = createSessionCoordinator(this.stateManager);
      this.stateManager.set(
        "delegation:session_coordinator",
        sessionCoordinator,
      );

      const defaultSession = sessionCoordinator.initializeSession("default");
      this.stateManager.set("delegation:default_session", defaultSession);

      return true;
    } catch (error) {
      frameworkLogger.log("boot-orchestrator", "delegation-init-failed", "error", { error, message: "Failed to initialize delegation system" });
      return false;
    }
  }

  /**
   * Load orchestrator as the first component
   */
  private async loadOrchestrator(): Promise<boolean> {
    try {
      // Import orchestrator dynamically to ensure it's loaded first
      let orchestratorModule;
      try {
        orchestratorModule = await import("../core/orchestrator");
      } catch (importError) {
        frameworkLogger.log("boot-orchestrator", "orchestrator-load-failed", "error", {
          error: importError,
          message: "Failed to load orchestrator",
        });
        return false;
      }

      const orchestratorInstance = orchestratorModule.strRayOrchestrator;

      if (!orchestratorInstance) {
        frameworkLogger.log("boot-orchestrator", "orchestrator-not-found", "error", { message: "Orchestrator instance not found in module" });
        return false;
      }

      // Store in state manager for later access
      this.stateManager.set("orchestrator", orchestratorInstance);

      return true;
    } catch (error) {
      frameworkLogger.log("boot-orchestrator", "orchestrator-load-failed-outer", "error", { error, message: "Failed to load orchestrator" });
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
      frameworkLogger.log("boot-orchestrator", "session-init-failed", "error", { error, message: "Failed to initialize session management" });
      return false;
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

      // Processor definitions — single source of truth for all registrations
      const PROCESSOR_DEFS: Array<{ name: string; type: "pre" | "post"; priority: number; enabled: boolean }> = [
        { name: "preValidate", type: "pre", priority: 10, enabled: true },
        { name: "typescriptCompilation", type: "pre", priority: 15, enabled: true },
        { name: "codexCompliance", type: "pre", priority: 20, enabled: true },
        { name: "testAutoCreation", type: "pre", priority: 22, enabled: true },
        { name: "versionCompliance", type: "pre", priority: 25, enabled: true },
        { name: "errorBoundary", type: "pre", priority: 30, enabled: true },
        { name: "agentsMdValidation", type: "pre", priority: 35, enabled: true },
        { name: "stateValidation", type: "post", priority: 130, enabled: true },
        { name: "spawnGovernance", type: "pre", priority: 40, enabled: true },
        { name: "performanceBudget", type: "pre", priority: 45, enabled: true },
        { name: "asyncPattern", type: "pre", priority: 50, enabled: true },
        { name: "consoleLogGuard", type: "pre", priority: 55, enabled: true },
        { name: "postProcessorChain", type: "post", priority: 140, enabled: true },
      ];

      for (const def of PROCESSOR_DEFS) {
        this.processorManager.registerProcessor({
          name: def.name,
          type: def.type,
          priority: def.priority,
          enabled: def.enabled,
        });
        frameworkLogger.log(
          "boot-orchestrator",
          `registered ${def.name} processor`,
          "success",
          { jobId },
        );
      }

      // Skip refactoring logging processor - not available in this build
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
      frameworkLogger.log(
        "boot-orchestrator",
        "activateProcessors failed",
        "error",
        { jobId, error },
      );
      frameworkLogger.log("boot-orchestrator", "activate-processors-failed", "error", { error, message: "Failed to activate processors" });
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
          frameworkLogger.log("boot-orchestrator", "agent-class-not-found", "warning", { agentName, message: `Agent class not found in module: ${agentName}` });
        }
      } catch (error) {
        frameworkLogger.log("boot-orchestrator", "agent-load-failed", "warning", {
          agentName,
          error: error instanceof Error ? error.message : String(error),
          message: `Failed to load agent ${agentName}`,
        });
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
      frameworkLogger.log("boot-orchestrator", "enforcement-failed", "error", { error, message: "Failed to enable enforcement" });
      return false;
    }
  }

  /**
   * Activate codex compliance checking during boot
   */
  private async activateCodexCompliance(): Promise<boolean> {
    try {
      // Initialize codex injector if not already done
      let codexInjector = this.stateManager.get("processor:codex_injector");
      if (!codexInjector) {
        // Import and initialize codex injector
        // Try import with .js extension first (for Node.js/test environment)
        let CodexInjector;
        try {
          ({ CodexInjector } = await import("./codex-injector"));
        } catch (importError) {
          frameworkLogger.log("boot-orchestrator", "codex-injector-load-failed", "error", { error: importError, message: "Failed to load codex injector" });
          return false;
        }
        codexInjector = new CodexInjector();
        this.stateManager.set("processor:codex_injector", codexInjector);
      }

      // Enable compliance validation
      this.stateManager.set("compliance:active", true);
      this.stateManager.set("compliance:validator", codexInjector);
      this.stateManager.set("compliance:activated_at", Date.now());

      return true;
    } catch (error) {
      frameworkLogger.log("boot-orchestrator", "codex-compliance-failed", "error", { error, message: "Failed to activate codex compliance" });
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
      frameworkLogger.log("boot-orchestrator", "security-init-failed", "error", { error, message: "Failed to initialize security components" });
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
      frameworkLogger.log("boot-orchestrator", "security-finalize-failed", "error", { error, message: "Failed to finalize security integration" });
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
        frameworkLogger.log("boot-orchestrator", "low-security-score", "warning", {
          score: result.score,
          message: `Initial security score: ${result.score}/100 (target: 80+)`,
        });
      }

      return result;
    } catch (error) {
      frameworkLogger.log("boot-orchestrator", "security-audit-failed", "error", { error, message: "Failed to run initial security audit" });
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
        frameworkLogger.log("boot-orchestrator", "processor-health-failed", "error", {
          failedProcessors: failedProcessors.map((p) => p.name),
          message: `${failedProcessors.length} processors failed health check`,
        });
        return false;
      }

      const degradedProcessors = healthStatus.filter(
        (h) => h.status === "degraded",
      );
      if (degradedProcessors.length > 0) {
        frameworkLogger.log("boot-orchestrator", "processors-degraded", "warning", {
          degradedProcessors: degradedProcessors.map((p) => p.name),
          message: `${degradedProcessors.length} processors are degraded`,
        });
      }

      return true;
    } catch (error) {
      frameworkLogger.log("boot-orchestrator", "processor-health-validation-failed", "error", { error, message: "Processor health validation failed" });
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
      agentsLoaded: Array.isArray(agentsLoaded) ? agentsLoaded : [],
      errors,
    };
  }

  /**
   * Set up comprehensive memory monitoring and alerting
   */
  private setupMemoryMonitoring(): void {
    // Start memory monitor
    memoryMonitor.start();

    // CRITICAL FIX: Only add alert listener once to prevent memory leak
    // Each BootOrchestrator instantiation was adding duplicate listeners
    let currentListenerCount = 0;
    try {
      if (typeof memoryMonitor.listenerCount === "function") {
        currentListenerCount = memoryMonitor.listenerCount("alert");
      } else if (
        memoryMonitor.listeners &&
        typeof memoryMonitor.listeners === "function"
      ) {
        currentListenerCount = memoryMonitor.listeners("alert").length;
      }
    } catch (e) {
      // Fallback: assume no listeners if we can't determine count
      currentListenerCount = 0;
    }

    if (currentListenerCount === 0) {
      // First time setup - add the memory alert handler
      memoryMonitor.on("alert", (alert: any) => {
        const level =
          alert.severity === "critical"
            ? "error"
            : alert.severity === "high"
              ? "warn"
              : "info";

        frameworkLogger.log(
          "boot-orchestrator",
          `🚨 MEMORY ALERT: ${alert.message}`,
          "error",
        );

        // Store alert in state for dashboard access
        const alerts = (this.stateManager.get("memory:alerts") as any[]) || [];
        alerts.push({
          ...alert,
          timestamp: Date.now(),
        });

        // Keep only last 100 alerts
        if (alerts.length > 100) {
          alerts.shift();
        }

        this.stateManager.set("memory:alerts", alerts);

        // Log recommendations
        alert.details.recommendations.forEach((rec: string) => {
          frameworkLogger.log("boot-orchestrator", `💡 ${rec}`, "info");
        });
      });
    }

    // Log initial memory status
    const initialStats = memoryMonitor.getCurrentStats();
    frameworkLogger.log(
      "boot-orchestrator",
      `🧠 Initial memory: ${initialStats.heapUsed.toFixed(1)}MB heap, ${initialStats.heapTotal.toFixed(1)}MB total`,
      "info",
    );

    // Store initial memory baseline
    this.stateManager.set("memory:baseline", initialStats);
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
    const summary = memoryMonitor.getSummary();
    const issues: string[] = [];

    // Check for memory issues
    if (summary.current.heapUsed > 400) {
      issues.push(
        `Critical heap usage: ${summary.current.heapUsed.toFixed(1)}MB`,
      );
    } else if (summary.current.heapUsed > 200) {
      issues.push(`High heap usage: ${summary.current.heapUsed.toFixed(1)}MB`);
    }

    if (summary.trend === "increasing") {
      issues.push("Memory usage trending upward - potential leak detected");
    }

    if (summary.peak.heapUsed > 500) {
      issues.push(
        `Peak usage exceeded safe limits: ${summary.peak.heapUsed.toFixed(1)}MB`,
      );
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics: summary,
    };
  }

  /**
   * Execute the boot sequence (internal framework initialization)
   */
  async executeBootSequence(): Promise<BootResult> {
    const jobId = `boot-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

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
        version: "1.15.18",
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
      frameworkLogger.log("boot-orchestrator", "config-load-warning", "warning", { error, message: "Failed to load StringRay configuration" });
      // Continue with defaults if loading fails
    }
  }
}

// Export singleton instance
export const bootOrchestrator = new BootOrchestrator();
