/**
 * StringRay AI v1.1.1 - Phase 2 Advanced Regression Testing System
 *
 * Enhanced performance regression testing with statistical analysis, trend detection,
 * and intelligent baseline management for continuous optimization.
 *
 * Key Features:
 * - Statistical significance analysis for regression detection
 * - Trend analysis with confidence intervals
 * - Intelligent baseline updates with outlier detection
 * - Performance anomaly detection using statistical methods
 * - Historical data analysis with seasonal trends
 * - Automated regression alerts with severity classification
 *
 * @version 2.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import { PerformanceRegressionTest, RegressionTestResult, PerformanceBaseline } from "./performance-regression-tester";
export interface StatisticalAnalysis {
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    min: number;
    max: number;
    quartiles: [number, number, number];
    confidenceInterval: [number, number];
    sampleSize: number;
    outliers: number[];
    skewness: number;
    kurtosis: number;
}
export interface TrendAnalysis {
    direction: "improving" | "degrading" | "stable";
    slope: number;
    rSquared: number;
    confidence: number;
    changePoints: number[];
    seasonality: boolean;
    seasonalPeriod?: number;
}
export interface RegressionAlert {
    id: string;
    timestamp: number;
    testName: string;
    type: "regression" | "improvement" | "anomaly" | "trend-change";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    metrics: {
        current: number;
        baseline: number;
        deviation: number;
        statisticalSignificance: number;
    };
    recommendations: string[];
    automated: boolean;
    resolved: boolean;
}
export interface EnhancedRegressionTestResult extends Omit<RegressionTestResult, "expectedDuration"> {
    expectedDuration: number | undefined;
    statisticalAnalysis: StatisticalAnalysis;
    trendAnalysis: TrendAnalysis;
    anomalyScore: number;
    confidenceLevel: number;
    historicalContext: {
        percentileRank: number;
        comparedToLastWeek: number;
        comparedToLastMonth: number;
    };
    alerts: RegressionAlert[];
}
export interface IntelligentBaseline extends PerformanceBaseline {
    statisticalModel: StatisticalAnalysis;
    trendModel: TrendAnalysis;
    lastUpdateReason: "manual" | "automatic" | "statistical" | "trend-based";
    updateHistory: Array<{
        timestamp: number;
        reason: string;
        oldValue: number;
        newValue: number;
        confidence: number;
    }>;
    outlierThreshold: number;
    adaptationRate: number;
    minimumSamples: number;
}
/**
 * Phase 2 Advanced Regression Testing System
 */
export declare class AdvancedRegressionTestingSystem extends EventEmitter {
    private baselineFile;
    private baselines;
    private historicalData;
    private alerts;
    private statisticalWindow;
    private anomalyThreshold;
    constructor(baselineFile?: string);
    /**
     * Run enhanced regression test with statistical analysis
     */
    runEnhancedRegressionTest(test: PerformanceRegressionTest): Promise<EnhancedRegressionTestResult>;
    /**
     * Perform comprehensive statistical analysis
     */
    private performStatisticalAnalysis;
    /**
     * Analyze performance trends
     */
    private analyzeTrends;
    /**
     * Calculate anomaly score using z-score
     */
    private calculateAnomalyScore;
    /**
     * Calculate statistical significance (p-value approximation)
     */
    private calculateStatisticalSignificance;
    /**
     * Calculate confidence level in the result
     */
    private calculateConfidenceLevel;
    /**
     * Generate historical context
     */
    private generateHistoricalContext;
    /**
     * Generate alerts based on analysis
     */
    private generateAlerts;
    /**
     * Update baseline if statistical conditions are met
     */
    private updateBaselineIfNeeded;
    /**
     * Create initial baseline
     */
    private createInitialBaseline;
    /**
     * Get historical data for a test
     */
    private getHistoricalData;
    /**
     * Update historical data for a test
     */
    private updateHistoricalData;
    /**
     * Load baselines from file
     */
    private loadBaselines;
    /**
     * Save baselines to file
     */
    private saveBaselines;
    /**
     * Get empty statistical analysis
     */
    private getEmptyStatisticalAnalysis;
    /**
     * Get empty trend analysis
     */
    private getEmptyTrendAnalysis;
    /**
     * Get active alerts
     */
    getActiveAlerts(): RegressionAlert[];
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): boolean;
    /**
     * Get baseline for a test
     */
    getBaseline(testName: string): IntelligentBaseline | undefined;
    /**
     * Export analysis data
     */
    exportAnalysis(): any;
}
export declare const advancedRegressionTesting: AdvancedRegressionTestingSystem;
//# sourceMappingURL=advanced-regression-testing.d.ts.map