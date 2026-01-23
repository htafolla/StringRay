/**
 * StringRay AI v1.1.1 - Complexity Analyzer
 *
 * Assesses operation complexity to determine optimal agent delegation strategy.
 * Implements metrics-based complexity scoring for intelligent task distribution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export interface ComplexityMetrics {
    fileCount: number;
    changeVolume: number;
    operationType: "create" | "modify" | "refactor" | "analyze" | "debug" | "test";
    dependencies: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    estimatedDuration: number;
}
export interface ComplexityScore {
    score: number;
    level: "simple" | "moderate" | "complex" | "enterprise";
    recommendedStrategy: "single-agent" | "multi-agent" | "orchestrator-led";
    estimatedAgents: number;
    reasoning: string[];
}
export interface ComplexityThresholds {
    simple: number;
    moderate: number;
    complex: number;
    enterprise: number;
}
export declare class ComplexityAnalyzer {
    private thresholds;
    private operationWeights;
    private riskMultipliers;
    /**
     * Analyze operation complexity and return detailed metrics
     */
    analyzeComplexity(operation: string, context: any): ComplexityMetrics;
    /**
     * Calculate complexity score and delegation strategy
     */
    calculateComplexityScore(metrics: ComplexityMetrics): ComplexityScore;
    updateThresholds(performanceData: any): void;
    /**
     * Get current complexity thresholds
     */
    getThresholds(): ComplexityThresholds;
    /**
     * Set custom complexity thresholds
     */
    setThresholds(thresholds: Partial<ComplexityThresholds>): void;
    private calculateFileCount;
    private calculateChangeVolume;
    private determineOperationType;
    private calculateDependencies;
    private assessRiskLevel;
    private estimateDuration;
    private generateReasoning;
}
export declare const complexityAnalyzer: ComplexityAnalyzer;
//# sourceMappingURL=complexity-analyzer.d.ts.map