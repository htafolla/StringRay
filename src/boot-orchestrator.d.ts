/**
 * StringRay AI v1.1.1 - Boot Orchestrator
 *
 * Implements orchestrator-first boot sequence with automatic enforcement activation.
 * Coordinates the initialization of all framework components in the correct order.
 *
 * @version 1.1.2
 * @since 2026-01-07
 */
import { StringRayStateManager } from "./state/state-manager";
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
export declare class BootOrchestrator {
    private contextLoader;
    private stateManager;
    private processorManager;
    private config;
    constructor(config?: Partial<BootSequenceConfig>, stateManager?: StringRayStateManager);
    /**
     * Initialize delegation system components
     */
    private initializeDelegationSystem;
    /**
     * Load orchestrator as the first component
     */
    private loadOrchestrator;
    /**
     * Initialize session management system
     */
    private initializeSessionManagement;
    /**
     * Activate pre/post processors
     */
    private activateProcessors;
    /**
     * Load remaining agents after orchestrator
     */
    private loadRemainingAgents;
    /**
     * Enable automatic enforcement activation
     */
    private enableEnforcement;
    /**
     * Activate codex compliance checking during boot
     */
    private activateCodexCompliance;
    private initializeSecurityComponents;
    private finalizeSecurityIntegration;
    private runInitialSecurityAudit;
    /**
     * Validate processor health during boot
     */
    private validateProcessorHealth;
    /**
     * Get current boot status information
     */
    getBootStatus(): BootResult;
    /**
     * Set up comprehensive memory monitoring and alerting
     */
    private setupMemoryMonitoring;
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
    };
    /**
     * Execute the boot sequence (internal framework initialization)
     */
    executeBootSequence(): Promise<BootResult>;
    /**
     * Load StringRay configuration from Python ConfigManager
     */
    private loadStringRayConfiguration;
}
export declare const bootOrchestrator: BootOrchestrator;
//# sourceMappingURL=boot-orchestrator.d.ts.map