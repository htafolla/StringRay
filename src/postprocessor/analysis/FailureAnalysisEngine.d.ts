/**
 * Failure Analysis Engine for Post-Processor
 */
import { FailureAnalysis, MonitoringResult } from "../types";
export declare class FailureAnalysisEngine {
    constructor();
    /**
     * Analyze CI/CD failure and determine root cause
     */
    analyzeFailure(monitoringResult: MonitoringResult): Promise<FailureAnalysis>;
    /**
     * Classify the type of failure based on monitoring results
     */
    private classifyFailure;
    /**
     * Assess the severity of the failure
     */
    private assessSeverity;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Determine the root cause of the failure
     */
    private determineRootCause;
    /**
     * Generate recommended actions for the failure
     */
    private generateRecommendedActions;
    /**
     * Generate suggested fixes for the failure
     */
    private generateSuggestedFixes;
    /**
     * Initialize analysis patterns and rules
     */
    private initializeAnalysisPatterns;
}
//# sourceMappingURL=FailureAnalysisEngine.d.ts.map