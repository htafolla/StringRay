/**
 * StringRay Post-Processor - Core Infrastructure
 *
 * Automated CI/CD loop orchestration: commit → push → monitor → fix → redeploy → monitor
 * Provides systematic error prevention and deployment automation.
 *
 * @version 1.0.0
 * @since 2026-01-13
 */
import { StringRayStateManager } from "../state/state-manager";
import { SessionMonitor } from "../session/session-monitor";
import { PostProcessorConfig, PostProcessorResult, PostProcessorContext } from "./types";
export declare class PostProcessor {
    private stateManager;
    private sessionMonitor;
    private config;
    private monitoringEngine;
    private failureAnalysisEngine;
    private autoFixEngine;
    private fixValidator;
    private reportValidator;
    private redeployCoordinator;
    private escalationEngine;
    private successHandler;
    private triggers;
    constructor(stateManager: StringRayStateManager, sessionMonitor?: SessionMonitor | null, config?: Partial<PostProcessorConfig>);
    /**
     * Generate automated framework report if conditions are met
     */
    private generateFrameworkReport;
    /**
     * Validate generated reports for hidden issues
     */
    private validateGeneratedReport;
    /**
     * Clean up old reports based on retention policy
     */
    private cleanupOldReports;
    /**
     * Initialize the post-processor system
     */
    initialize(): Promise<void>;
    /**
     * Validate architectural compliance against codex rules
     */
    private validateArchitecturalCompliance;
    private checkSystemIntegrity;
    private checkIntegrationTesting;
    private checkPathResolution;
    private checkFeatureCompleteness;
    /**
     * Rule 50: Path Analysis Guidelines Enforcement
     * Ensures AIs follow path resolution guidelines for all write/edit operations
     * Covers all 3 types of path violations from PATH_RESOLUTION_ANALYSIS.md
     */
    private checkPathAnalysisGuidelines;
    /**
     * Execute the complete post-processor loop
     */
    executePostProcessorLoop(context: PostProcessorContext): Promise<PostProcessorResult>;
    /**
     * Execute the monitoring loop until success or max attempts
     */
    private executeMonitoringLoop;
    /**
     * Redeploy after applying fixes using the RedeployCoordinator
     */
    private redeployWithFixes;
    /**
     * Attempt to apply automatic fixes
     */
    private attemptAutoFix;
    /**
     * Escalate to manual intervention
     */
    private escalateToManualIntervention;
    /**
     * Wait before retry with exponential backoff
     */
    private waitBeforeRetry;
    /**
     * Get post-processor status
     */
    getStatus(): Promise<any>;
    /**
     * Call appropriate agent/skill to fix architectural compliance violations
     */
    private callAgentForArchitecturalFix;
    /**
     * Calculate complexity score for automated report triggering
     */
    private calculateComplexityScore;
    /**
     * Revalidate after agent fix attempt
     */
    private revalidateAfterFix;
}
//# sourceMappingURL=PostProcessor.d.ts.map