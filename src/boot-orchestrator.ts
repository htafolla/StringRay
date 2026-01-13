/**
 * StrRay Framework v1.0.0 - Boot Orchestrator
 *
 * Implements orchestrator-first boot sequence with automatic enforcement activation.
 * Coordinates the initialization of all framework components in the correct order.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StrRayContextLoader } from "./context-loader.js";
import { StrRayStateManager } from "./state/state-manager.js";
import { ProcessorManager } from "./processors/processor-manager.js";
import { pathResolver } from "./utils/path-resolver.js";
// Path configuration - can be overridden by environment or use path resolver
const AGENTS_BASE_PATH = process.env.STRRAY_AGENTS_PATH || "../agents";
import {
  createAgentDelegator,
  createSessionCoordinator,
} from "./delegation/index.js";
import { createSessionCleanupManager } from "./session/session-cleanup-manager.js";
import { createSessionMonitor } from "./session/session-monitor.js";
import { createSessionStateManager } from "./session/session-state-manager.js";
import { securityHardener } from "./security/security-hardener.js";
import { securityHeadersMiddleware } from "./security/security-headers.js";
import { frameworkLogger } from "./framework-logger.js";
import { memoryMonitor } from "./monitoring/memory-monitor.js";

/**
 * Set up graceful interruption handling to prevent JSON parsing errors
 * when processes are interrupted mid-operation
 */
function setupGracefulShutdown(): void {
  let isShuttingDown = false;

  process.on("SIGINT", async () => {
    if (isShuttingDown) {
      console.log("🔄 Force exit requested...");
      process.exit(1);
    }

    isShuttingDown = true;
    console.log("⏹️  Received interrupt signal, shutting down gracefully...");

    try {
      // Stop memory monitoring
      memoryMonitor.stop();

      // Give ongoing operations a moment to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during graceful shutdown:", error);
      process.exit(1);
    }
  });

  process.on("SIGTERM", async () => {
    console.log("⏹️  Received termination signal, shutting down gracefully...");

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
    console.error("❌ Uncaught Exception:", error);
    memoryMonitor.stop();
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
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
  private contextLoader: StrRayContextLoader;
  private stateManager: StrRayStateManager;
  private processorManager: ProcessorManager;
  private config: BootSequenceConfig;

  constructor(
    config: Partial<BootSequenceConfig> = {},
    stateManager?: StrRayStateManager,
  ) {
    // Set up graceful shutdown handling first
    setupGracefulShutdown();

    // Initialize components first for state management
    this.contextLoader = StrRayContextLoader.getInstance();
    this.stateManager = stateManager || new StrRayStateManager();
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
      const agentDelegator = createAgentDelegator(this.stateManager);
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
      console.error("❌ Failed to initialize delegation system:", error);
      return false;
    }
  }

  /**
   * Load orchestrator as the first component
   */
  private async loadOrchestrator(): Promise<boolean> {
    try {
      // Import orchestrator dynamically to ensure it's loaded first
      const orchestratorModule = await import("./orchestrator.js");
      const orchestratorInstance = orchestratorModule.strRayOrchestrator;

      if (!orchestratorInstance) {
        console.error("❌ Orchestrator instance not found in module");
        return false;
      }

      // Store in state manager for later access
      this.stateManager.set("orchestrator", orchestratorInstance);

      return true;
    } catch (error) {
      console.error("❌ Failed to load orchestrator:", error);
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
      console.error("❌ Failed to initialize session management:", error);
      return false;
    }
  }

  /**
   * Activate pre/post processors
   */
  private async activateProcessors(): Promise<boolean> {
    try {
      frameworkLogger.log(
        "boot-orchestrator",
        "activateProcessors started",
        "info",
      );

      this.processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 10,
        enabled: true,
      });
      frameworkLogger.log(
        "boot-orchestrator",
        "registered preValidate processor",
        "success",
      );

      this.processorManager.registerProcessor({
        name: "codexCompliance",
        type: "pre",
        priority: 20,
        enabled: true,
      });
      frameworkLogger.log(
        "boot-orchestrator",
        "registered codexCompliance processor",
        "success",
      );

      this.processorManager.registerProcessor({
        name: "errorBoundary",
        type: "pre",
        priority: 30,
        enabled: true,
      });
      frameworkLogger.log(
        "boot-orchestrator",
        "registered errorBoundary processor",
        "success",
      );

      this.processorManager.registerProcessor({
        name: "stateValidation",
        type: "post",
        priority: 130,
        enabled: true,
      });
      frameworkLogger.log(
        "boot-orchestrator",
        "registered stateValidation processor",
        "success",
      );

      this.processorManager.registerProcessor({
        name: "refactoringLogging",
        type: "post",
        priority: 140,
        enabled: true,
      });
      frameworkLogger.log(
        "boot-orchestrator",
        "registered refactoringLogging processor",
        "success",
      );

      const initSuccess = await this.processorManager.initializeProcessors();
      if (!initSuccess) {
        frameworkLogger.log(
          "boot-orchestrator",
          "processor initialization failed",
          "error",
        );
        throw new Error("Processor initialization failed");
      }

      frameworkLogger.log(
        "boot-orchestrator",
        "processors initialized successfully",
        "success",
      );

      this.stateManager.set("processor:manager", this.processorManager);
      this.stateManager.set("processor:active", true);

      frameworkLogger.log(
        "boot-orchestrator",
        "processors activated and stored in state",
        "success",
      );

      return true;
    } catch (error) {
      frameworkLogger.log(
        "boot-orchestrator",
        "activateProcessors failed",
        "error",
        error,
      );
      console.error("❌ Failed to activate processors:", error);
      return false;
    }
  }

  /**
   * Load remaining agents after orchestrator
   */
  private async loadRemainingAgents(): Promise<string[]> {
    const agents = [
      "enforcer",
      "architect",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect",
    ];
    const loadedAgents: string[] = [];

    for (const agentName of agents) {
      try {
        // Dynamic import of agent modules using path resolver
        const agentPath = pathResolver.resolveAgentPath(agentName);
        console.log(`🔗 Loading agent ${agentName} from: ${agentPath}`);
        const agentModule = await import(agentPath);
        const agentClass =
          agentModule[
            `StrRay${agentName.charAt(0).toUpperCase() + agentName.slice(1)}Agent`
          ];

        if (agentClass) {
          const agentInstance = new agentClass();
          this.stateManager.set(`agent:${agentName}`, agentInstance);
          loadedAgents.push(agentName);
        } else {
          console.warn(`⚠️ Agent class not found in module: ${agentName}`);
        }
      } catch (error) {
        console.warn(
          `⚠️ Failed to load agent ${agentName}:`,
          error instanceof Error ? error.message : String(error),
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
      console.error("❌ Failed to enable enforcement:", error);
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
          ({ CodexInjector } = await import("./codex-injector.js"));
        } catch (error) {
          // Fallback to import without .js extension (for oh-my-opencode plugin environment)
          ({ CodexInjector } = await import("./codex-injector"));
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
      console.error("❌ Failed to activate codex compliance:", error);
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
      console.error("❌ Failed to initialize security components:", error);
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
      console.error("❌ Failed to finalize security integration:", error);
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
        console.warn(
          `⚠️ Initial security score: ${result.score}/100 (target: 80+)`,
        );
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to run initial security audit:", error);
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
        console.error(
          `❌ ${failedProcessors.length} processors failed health check:`,
          failedProcessors.map((p) => p.name),
        );
        return false;
      }

      const degradedProcessors = healthStatus.filter(
        (h) => h.status === "degraded",
      );
      if (degradedProcessors.length > 0) {
        console.warn(
          `⚠️ ${degradedProcessors.length} processors are degraded:`,
          degradedProcessors.map((p) => p.name),
        );
      }

      return true;
    } catch (error) {
      console.error("❌ Processor health validation failed:", error);
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

    // Set up alert handlers
    memoryMonitor.on("alert", (alert) => {
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
    frameworkLogger.log(
      "boot-orchestrator",
      "executeBootSequence started",
      "info",
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
        "loading StrRay configuration",
        "info",
      );
      // Phase 0: Load StrRay configuration from Python ConfigManager
      await this.loadStrRayConfiguration();
      frameworkLogger.log(
        "boot-orchestrator",
        "StrRay configuration loaded",
        "success",
      );
      // Phase 1: Initialize core systems
      frameworkLogger.log(
        "boot-orchestrator",
        "initializing core systems",
        "info",
      );
      result.orchestratorLoaded = await this.loadOrchestrator();
      if (!result.orchestratorLoaded) {
        frameworkLogger.log(
          "boot-orchestrator",
          "orchestrator loading failed",
          "error",
        );
        result.errors.push("Failed to load orchestrator");
        return result;
      }
      frameworkLogger.log(
        "boot-orchestrator",
        "orchestrator loaded successfully",
        "success",
      );

      const delegationInitialized = await this.initializeDelegationSystem();
      if (!delegationInitialized) {
        frameworkLogger.log(
          "boot-orchestrator",
          "delegation system initialization failed",
          "error",
        );
        result.errors.push("Failed to initialize delegation system");
        return result;
      }
      frameworkLogger.log(
        "boot-orchestrator",
        "delegation system initialized",
        "success",
      );

      // Phase 2: Session management
      if (this.config.sessionManagement) {
        result.sessionManagementActive =
          await this.initializeSessionManagement();
        if (!result.sessionManagementActive) {
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
        );
        result.processorsActivated = await this.activateProcessors();
        if (!result.processorsActivated) {
          frameworkLogger.log(
            "boot-orchestrator",
            "processor activation failed",
            "error",
          );
          result.errors.push("Failed to activate processors");
          return result;
        }
        frameworkLogger.log(
          "boot-orchestrator",
          "processors activated successfully",
          "success",
        );

        // Validate processor health
        const healthValid = await this.validateProcessorHealth();
        if (!healthValid) {
          frameworkLogger.log(
            "boot-orchestrator",
            "processor health validation failed",
            "error",
          );
          result.errors.push("Processor health validation failed");
          return result;
        }
        frameworkLogger.log(
          "boot-orchestrator",
          "processor health validated",
          "success",
        );
      }

      // Phase 4: Load agents
      if (this.config.agentLoading) {
        result.agentsLoaded = await this.loadRemainingAgents();
      }

      // Phase 5: Security & compliance
      if (this.config.enableEnforcement) {
        result.enforcementEnabled = await this.enableEnforcement();
        if (!result.enforcementEnabled) {
          result.errors.push("Failed to enable enforcement");
          return result;
        }
      }

      if (this.config.codexValidation) {
        result.codexComplianceActive = await this.activateCodexCompliance();
        if (!result.codexComplianceActive) {
          result.errors.push("Failed to activate codex compliance");
          return result;
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
   * Load StrRay configuration from Python ConfigManager
   */
  private async loadStrRayConfiguration(): Promise<void> {
    try {
      // Import Python ConfigManager via dynamic import
      const { spawn } = await import("child_process");
      const { promisify } = await import("util");

      // Execute Python script to get configuration
      const pythonScript = `
import sys
import json
sys.path.insert(0, 'src')
from strray.config.manager import ConfigManager

config_manager = ConfigManager()
strray_config = {
    'version': config_manager.get_value('strray_version'),
    'codex_enabled': config_manager.get_value('codex_enabled'),
    'codex_version': config_manager.get_value('codex_version'),
    'codex_terms': config_manager.get_value('codex_terms'),
    'monitoring_metrics': config_manager.get_value('monitoring_metrics'),
    'monitoring_alerts': config_manager.get_value('monitoring_alerts'),
    'agent_capabilities': config_manager.get_value('agent_capabilities')
}
print(json.dumps(strray_config))
`;

      const child = spawn("python3", ["-c", pythonScript], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise((resolve, reject) => {
        child.on("close", (code) => {
          if (code === 0) {
            resolve(undefined);
          } else {
            reject(new Error(`Python config loading failed: ${stderr}`));
          }
        });
        child.on("error", reject);
      });

      if (stdout.trim()) {
        const strrayConfig = JSON.parse(stdout.trim());

        // Store configuration in state manager for use by other components
        this.stateManager.set("strray:config", strrayConfig);
        this.stateManager.set("strray:version", strrayConfig.version);
        this.stateManager.set(
          "strray:codex_enabled",
          strrayConfig.codex_enabled,
        );
        this.stateManager.set("strray:codex_terms", strrayConfig.codex_terms);
        this.stateManager.set(
          "strray:monitoring_metrics",
          strrayConfig.monitoring_metrics,
        );
        this.stateManager.set(
          "strray:monitoring_alerts",
          strrayConfig.monitoring_alerts,
        );
        this.stateManager.set(
          "strray:agent_capabilities",
          strrayConfig.agent_capabilities,
        );

        console.log("✅ StrRay configuration loaded from Python ConfigManager");
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to load StrRay configuration from Python ConfigManager:",
        error,
      );
      // Continue with defaults if Python loading fails
    }
  }
}

// Export singleton instance
export const bootOrchestrator = new BootOrchestrator();
