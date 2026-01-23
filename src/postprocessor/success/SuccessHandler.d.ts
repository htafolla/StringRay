/**
 * Success Handler for Post-Processor
 *
 * Handles successful post-processor operations including metrics collection,
 * notifications, cleanup, and reporting.
 */
export interface SuccessHandlerConfig {
    successConfirmation?: boolean;
    cleanupEnabled?: boolean;
    notificationEnabled?: boolean;
    metricsCollection?: boolean;
}
export interface SuccessMetrics {
    totalDuration: number;
    attempts: number;
    fixesApplied: number;
    monitoringChecks: number;
    redeployments: number;
    timestamp: Date;
}
export interface PostProcessorContext {
    commitSha: string;
    repository: string;
    branch: string;
    author: string;
    files: string[];
    trigger: "git-hook" | "webhook" | "api" | "manual";
    testResults?: {
        unit?: {
            passed: boolean;
            coverage: number;
        };
        integration?: {
            passed: boolean;
            coverage: number;
        };
        e2e?: {
            passed: boolean;
            coverage: number;
        };
        performance?: {
            passed: boolean;
            coverage: number;
        };
    };
}
export interface PostProcessorResult {
    success: boolean;
    commitSha: string;
    sessionId: string;
    attempts: number;
    monitoringResults?: any[];
    fixesApplied?: any[];
    error?: string;
    duration?: number;
}
export declare class SuccessHandler {
    private config;
    constructor(config?: SuccessHandlerConfig);
    /**
     * Handle successful post-processor completion
     */
    handleSuccess(context: PostProcessorContext, result: PostProcessorResult, monitoringResults: any[]): Promise<SuccessMetrics>;
    /**
     * Confirm deployment success
     */
    private confirmSuccess;
    /**
     * Send success notifications
     */
    private sendNotifications;
    /**
     * Perform post-success cleanup
     */
    private performCleanup;
    /**
     * Collect success metrics
     */
    private collectMetrics;
    /**
     * Log success metrics
     */
    private logMetrics;
    /**
     * Generate comprehensive success report
     */
    generateSuccessReport(context: PostProcessorContext, result: PostProcessorResult, metrics: SuccessMetrics): string;
    /**
     * Get current configuration stats
     */
    getStats(): SuccessHandlerConfig;
}
//# sourceMappingURL=SuccessHandler.d.ts.map