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
import { createStrRayCodexInjectorHook } from "./codex-injector.js";
import { ProcessorManager } from "./processors/processor-manager.js";
import {
  createAgentDelegator,
  createSessionCoordinator,
} from "./delegation/index.js";
import { createSessionCleanupManager } from "./session/session-cleanup-manager.js";
import { createSessionMonitor } from "./session/session-monitor.js";
import { createSessionStateManager } from "./session/session-state-manager.js";
import { securityHardener } from "./security/security-hardener.js";
import { securityHeadersMiddleware } from "./security/security-headers.js";

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
    this.config = {
      enableEnforcement: true,
      codexValidation: true,
      sessionManagement: true,
      processorActivation: true,
      agentLoading: true,
      ...config,
    };

    this.contextLoader = StrRayContextLoader.getInstance();
    this.stateManager = stateManager || new StrRayStateManager();
    this.processorManager = new ProcessorManager(this.stateManager);
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

      // Initialize session cleanup manager
      const cleanupManager = createSessionCleanupManager(this.stateManager);
      this.stateManager.set("session:cleanup_manager", cleanupManager);

      const sessionCoordinator = this.stateManager.get(
        "delegation:session_coordinator",
      ) as any;

      if (sessionCoordinator) {
        const sessionMonitor = createSessionMonitor(
          this.stateManager,
          sessionCoordinator,
          cleanupManager,
        );
        this.stateManager.set("session:monitor", sessionMonitor);

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
      this.processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      this.processorManager.registerProcessor({
        name: "codexCompliance",
        type: "pre",
        priority: 20,
        enabled: true,
      });

      this.processorManager.registerProcessor({
        name: "errorBoundary",
        type: "pre",
        priority: 30,
        enabled: true,
      });

      // Note: Test execution processors are disabled during boot
      // They should only run during actual tool operations, not initialization
      // this.processorManager.registerProcessor({
      //   name: 'testExecution',
      //   type: 'post',
      //   priority: 110,
      //   enabled: true
      // });

      // this.processorManager.registerProcessor({
      //   name: 'regressionTesting',
      //   type: 'post',
      //   priority: 120,
      //   enabled: true
      // });

      this.processorManager.registerProcessor({
        name: "stateValidation",
        type: "post",
        priority: 130,
        enabled: true,
      });

      const initSuccess = await this.processorManager.initializeProcessors();
      if (!initSuccess) {
        throw new Error("Processor initialization failed");
      }

      this.stateManager.set("processor:manager", this.processorManager);
      this.stateManager.set("processor:active", true);

      return true;
    } catch (error) {
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
        // Dynamic import of agent modules
        const agentModule = await import(`./agents/${agentName}.js`);
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
        const { CodexInjector } = await import("./codex-injector");
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
      const { SecurityAuditor } = await import("./security/security-auditor");
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
      codexComplianceActive: this.stateManager.get("compliance:active") || false,
      agentsLoaded: Array.isArray(agentsLoaded) ? agentsLoaded : [],
      errors,
    };
  }

  /**
   * Execute the boot sequence (internal framework initialization)
   */
  async executeBootSequence(): Promise<BootResult> {
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
      // Phase 1: Initialize core systems
      result.orchestratorLoaded = await this.loadOrchestrator();
      if (!result.orchestratorLoaded) {
        result.errors.push("Failed to load orchestrator");
        return result;
      }

      const delegationInitialized = await this.initializeDelegationSystem();
      if (!delegationInitialized) {
        result.errors.push("Failed to initialize delegation system");
        return result;
      }

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
        result.processorsActivated = await this.activateProcessors();
        if (!result.processorsActivated) {
          result.errors.push("Failed to activate processors");
          return result;
        }

        // Validate processor health
        const healthValid = await this.validateProcessorHealth();
        if (!healthValid) {
          result.errors.push("Processor health validation failed");
          return result;
        }
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
}

// Export singleton instance
export const bootOrchestrator = new BootOrchestrator();
