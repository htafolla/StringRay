/**
 * StringRay AI v1.1.1 - Phase 2 Automated Performance Benchmarking Suite
 *
 * Enterprise-grade automated performance benchmarking system for continuous optimization
 * and Universal Development Codex v1.1.1 compliance validation.
 *
 * Key Features:
 * - Automated continuous benchmarking with sub-millisecond precision
 * - Advanced metrics collection with trend analysis and anomaly detection
 * - Performance regression testing with statistical significance analysis
 * - Automated optimization recommendations and tracking
 * - CI/CD integration with performance gates and reporting
 * - >85% test coverage with behavioral validation
 *
 * @version 2.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import { BundleSizeMetrics, WebVitalsMetrics, RuntimePerformanceMetrics, PerformanceBudgetViolation } from "./performance-budget-enforcer";
export interface BenchmarkingConfig {
    continuous: {
        enabled: boolean;
        interval: number;
        retentionDays: number;
        anomalyDetection: boolean;
        optimizationTracking: boolean;
    };
    metrics: {
        collection: {
            enabled: boolean;
            precision: "microsecond" | "nanosecond";
            sampling: {
                rate: number;
                duration: number;
            };
        };
        aggregation: {
            enabled: boolean;
            interval: number;
            statistical: boolean;
        };
        export: {
            enabled: boolean;
            format: "json" | "csv" | "prometheus";
            path: string;
        };
    };
    optimization: {
        tracking: boolean;
        recommendations: boolean;
        automation: boolean;
        thresholds: {
            improvement: number;
            regression: number;
        };
    };
    validation: {
        codexCompliance: boolean;
        subMillisecondTargets: boolean;
        coverageThreshold: number;
    };
    ci: {
        gates: boolean;
        reporting: boolean;
        failureThreshold: number;
    };
}
export interface BenchmarkResult {
    id: string;
    timestamp: number;
    type: "continuous" | "regression" | "validation" | "optimization";
    metrics: {
        bundleSize: BundleSizeMetrics;
        webVitals: WebVitalsMetrics | null;
        runtime: RuntimePerformanceMetrics;
        custom: Record<string, number>;
    };
    performance: {
        duration: number;
        memoryDelta: number;
        cpuUsage: number;
    };
    validation: {
        codexCompliance: boolean;
        coverage: number;
        violations: PerformanceBudgetViolation[];
    };
    optimization: {
        recommendations: string[];
        potentialImprovement: number;
        automatedActions: string[];
    };
}
export interface BenchmarkSuite {
    id: string;
    name: string;
    description: string;
    benchmarks: Benchmark[];
    config: BenchmarkingConfig;
    baseline?: BenchmarkResult;
    trends: {
        performance: number[];
        memory: number[];
        violations: number[];
    };
}
export interface Benchmark {
    id: string;
    name: string;
    description: string;
    category: "bundle" | "runtime" | "web-vitals" | "custom";
    function: () => Promise<void> | void;
    timeout: number;
    expectedDuration?: number;
    tolerance: number;
    tags: string[];
}
export interface OptimizationRecommendation {
    id: string;
    timestamp: number;
    benchmarkId: string;
    type: "performance" | "memory" | "bundle" | "code-quality";
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    impact: number;
    effort: "low" | "medium" | "high";
    automated: boolean;
    implementation?: string;
    status: "pending" | "applied" | "rejected" | "in-progress";
}
/**
 * Phase 2 Automated Performance Benchmarking Suite
 */
export declare class AutomatedBenchmarkingSuite extends EventEmitter {
    private config;
    private suites;
    private results;
    private recommendations;
    private isRunning;
    private continuousTimer?;
    private budgetEnforcer;
    private regressionTester;
    private dashboard;
    private ciGates;
    constructor(config?: Partial<BenchmarkingConfig>);
    /**
     * Initialize the benchmarking suite
     */
    initialize(): Promise<void>;
    catch(error: unknown): void;
    /**
     * Start continuous benchmarking
     */
    start(): Promise<void>;
    /**
     * Stop benchmarking
     */
    stop(): void;
    /**
     * Create a new benchmark suite
     */
    createSuite(id: string, name: string, description: string, benchmarks: Benchmark[]): BenchmarkSuite;
    /**
     * Run a benchmark suite
     */
    runSuite(suiteId: string): Promise<BenchmarkResult[]>;
    /**
     * Run a single benchmark with high precision timing
     */
    private runBenchmark;
    /**
     * Generate optimization recommendations based on benchmark results
     */
    private generateRecommendations;
    /**
     * Start continuous benchmarking
     */
    private startContinuousBenchmarking;
    /**
     * Update suite trends with new result
     */
    private updateSuiteTrends;
    /**
     * Calculate test coverage (simplified implementation)
     */
    private calculateTestCoverage;
    /**
     * Load existing benchmark data
     */
    private loadExistingData;
    /**
     * Save benchmark results
     */
    private saveResults;
    /**
     * Export metrics in configured format
     */
    private exportMetrics;
    /**
     * Clean up old benchmark data
     */
    private cleanupOldData;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Get benchmarking statistics
     */
    getStatistics(): any;
    /**
     * Get optimization recommendations
     */
    getRecommendations(status?: "pending" | "applied" | "rejected"): OptimizationRecommendation[];
    /**
     * Apply optimization recommendation
     */
    applyRecommendation(recommendationId: string): Promise<boolean>;
    /**
     * Shutdown the benchmarking suite
     */
    shutdown(): Promise<void>;
}
export declare const automatedBenchmarkingSuite: AutomatedBenchmarkingSuite;
//# sourceMappingURL=automated-benchmarking-suite.d.ts.map