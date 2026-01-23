/**
 * StringRay AI v1.1.1 - Performance Benchmarking System
 *
 * Comprehensive performance measurement and analysis system for framework operations.
 * Measures boot sequence, orchestrator tasks, session management, and agent operations.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export interface BenchmarkResult {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    metadata: Record<string, any>;
    error?: string | undefined;
}
export interface PerformanceMetrics {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    p99Duration: number;
    minDuration: number;
    maxDuration: number;
    throughput: number;
}
export interface BootBenchmarkResult {
    totalBootTime: number;
    phaseTimings: Record<string, number>;
    componentLoadTimes: Record<string, number>;
    memoryUsage: {
        beforeBoot: number;
        afterBoot: number;
        peakDuringBoot: number;
    };
    success: boolean;
    errors: string[];
    orchestratorLoadTime?: number;
    delegationInitTime?: number;
    sessionManagementInitTime?: number;
    processorActivationTime?: number;
    agentLoadingTime?: number;
    enforcementActivationTime?: number;
    codexComplianceActivationTime?: number;
}
export interface OrchestratorBenchmarkResult {
    taskExecutionTimes: number[];
    delegationLatencies: number[];
    conflictResolutionTimes: number[];
    concurrentTaskThroughput: number;
    dependencyResolutionTime: number;
    overallSuccess: boolean;
}
export interface SessionBenchmarkResult {
    stateShareLatencies: number[];
    dependencyUpdateTimes: number[];
    groupOperationTimes: number[];
    migrationTimes: number[];
    failoverTimes: number[];
    concurrentSessionOperations: number;
}
export declare class StringRayPerformanceBenchmark {
    private results;
    private activeBenchmarks;
    /**
     * Start a benchmark measurement
     */
    startBenchmark(operation: string, metadata?: Record<string, any>): string;
    /**
     * End a benchmark measurement
     */
    endBenchmark(benchmarkId: string, success?: boolean, error?: string): BenchmarkResult | null;
    /**
     * Benchmark boot sequence performance
     */
    benchmarkBootSequence(bootOrchestrator: any): Promise<BootBenchmarkResult>;
    /**
     * Benchmark orchestrator task execution
     */
    benchmarkOrchestratorTasks(orchestrator: any, taskCount?: number, concurrentTasks?: number): Promise<OrchestratorBenchmarkResult>;
    /**
     * Benchmark session management operations
     */
    benchmarkSessionOperations(sessionStateManager: any, operationCount?: number): Promise<SessionBenchmarkResult>;
    /**
     * Calculate performance metrics from benchmark results
     */
    calculateMetrics(operationFilter?: string): PerformanceMetrics;
    /**
     * Generate comprehensive benchmark report
     */
    generateReport(): {
        summary: PerformanceMetrics;
        bootBenchmark?: BootBenchmarkResult;
        orchestratorBenchmark?: OrchestratorBenchmarkResult;
        sessionBenchmark?: SessionBenchmarkResult;
        recommendations: string[];
    };
    /**
     * Clear all benchmark results
     */
    clearResults(): void;
    /**
     * Export results for external analysis
     */
    exportResults(): BenchmarkResult[];
}
export declare const performanceBenchmark: StringRayPerformanceBenchmark;
//# sourceMappingURL=performance-benchmark.d.ts.map