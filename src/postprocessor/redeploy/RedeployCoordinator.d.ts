/**
 * Redeploy Coordinator for Post-Processor
 */
import { FixResult, PostProcessorContext } from "../types";
export interface RedeployResult {
    success: boolean;
    deploymentId: string;
    commitSha: string;
    environment: string;
    duration: number;
    error?: string;
    rollbackPerformed?: boolean;
    canaryResults?: CanaryResult[];
}
export interface CanaryResult {
    phase: number;
    trafficPercentage: number;
    success: boolean;
    metrics: {
        responseTime: number;
        errorRate: number;
        throughput: number;
    };
    duration: number;
}
export interface RedeployConfig {
    maxRetries: number;
    retryDelay: number;
    backoffStrategy: "linear" | "exponential";
    canaryEnabled: boolean;
    canaryPhases: number;
    canaryTrafficIncrement: number;
    healthCheckTimeout: number;
    rollbackOnFailure: boolean;
}
export declare class RedeployCoordinator {
    private config;
    constructor(config?: Partial<RedeployConfig>);
    /**
     * Execute redeployment with fixes
     */
    executeRedeploy(context: PostProcessorContext, fixResult: FixResult): Promise<RedeployResult>;
    /**
     * Validate pre-deployment requirements
     */
    private validatePreDeployment;
    /**
     * Execute deployment with retry logic
     */
    private deployWithRetry;
    /**
     * Execute canary deployment with progressive traffic rollout
     */
    private executeCanaryDeployment;
    /**
     * Execute direct deployment (no canary)
     */
    private executeDirectDeployment;
    /**
     * Deploy to canary environment
     */
    private deployToCanary;
    /**
     * Monitor canary health during deployment
     */
    private monitorCanaryHealth;
    /**
     * Check if canary metrics indicate healthy deployment
     */
    private isCanaryHealthy;
    /**
     * Wait between canary phases
     */
    private waitBetweenPhases;
    /**
     * Promote canary deployment to production
     */
    private promoteToProduction;
    /**
     * Validate post-deployment health
     */
    private validatePostDeployment;
    /**
     * Rollback deployment on failure
     */
    private rollbackDeployment;
    /**
     * Calculate wait time before retry using backoff strategy
     */
    private waitBeforeRetry;
}
//# sourceMappingURL=RedeployCoordinator.d.ts.map