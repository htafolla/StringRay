/**
 * StringRay AI v1.1.1 - Performance Budget Enforcement System
 *
 * Comprehensive performance testing and monitoring system that enforces
 * Universal Development Codex performance budget requirements.
 *
 * Performance Budget Requirements:
 * - Bundle size <2MB (gzipped <700KB)
 * - First Contentful Paint <2s
 * - Time to Interactive <5s
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
export declare const PERFORMANCE_BUDGET: {
    readonly bundleSize: {
        readonly uncompressed: number;
        readonly gzipped: number;
    };
    readonly webVitals: {
        readonly firstContentfulPaint: 2000;
        readonly timeToInteractive: 5000;
        readonly largestContentfulPaint: 2500;
        readonly cumulativeLayoutShift: 0.1;
        readonly firstInputDelay: 100;
    };
    readonly runtime: {
        readonly memoryUsage: number;
        readonly startupTime: 100;
        readonly testExecutionTime: 5000;
    };
};
export interface BundleSizeMetrics {
    totalSize: number;
    gzippedSize: number;
    fileCount: number;
    largestFile: {
        name: string;
        size: number;
        gzippedSize: number;
    };
    breakdown: Array<{
        name: string;
        size: number;
        gzippedSize: number;
        percentage: number;
    }>;
}
export interface WebVitalsMetrics {
    firstContentfulPaint: number;
    timeToInteractive: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timestamp: number;
}
export interface RuntimePerformanceMetrics {
    memoryUsage: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    startupTime: number;
    cpuUsage: number;
    timestamp: number;
}
export interface PerformanceBudgetViolation {
    metric: string;
    actual: number;
    budget: number;
    percentage: number;
    severity: "warning" | "error" | "critical";
    recommendation: string;
}
export interface PerformanceReport {
    timestamp: number;
    bundleSize: BundleSizeMetrics;
    webVitals: WebVitalsMetrics | null;
    runtime: RuntimePerformanceMetrics;
    violations: PerformanceBudgetViolation[];
    recommendations: string[];
    overallStatus: "pass" | "warning" | "fail";
}
/**
 * Comprehensive performance budget enforcement system
 */
export declare class PerformanceBudgetEnforcer extends EventEmitter {
    private reports;
    private monitoringActive;
    private alertThresholds;
    constructor();
    /**
     * Setup event handlers for performance monitoring
     */
    private setupEventHandlers;
    /**
     * Analyze bundle size against performance budget
     */
    analyzeBundleSize(distPath?: string): Promise<BundleSizeMetrics>;
    /**
     * Measure web vitals (simulated for server-side framework)
     * In a real web application, this would use the Web Vitals library
     */
    measureWebVitals(): Promise<WebVitalsMetrics>;
    /**
     * Measure runtime performance metrics
     */
    measureRuntimePerformance(): RuntimePerformanceMetrics;
    /**
     * Check performance budget compliance
     */
    checkBudgetCompliance(bundleSize: BundleSizeMetrics, webVitals: WebVitalsMetrics | null, runtime: RuntimePerformanceMetrics): PerformanceBudgetViolation[];
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport(): Promise<PerformanceReport>;
    /**
     * Generate performance optimization recommendations
     */
    private generateRecommendations;
    /**
     * Handle performance violations
     */
    private handleViolation;
    /**
     * Handle budget exceeded events
     */
    private handleBudgetExceeded;
    /**
     * Start continuous performance monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Get historical performance reports
     */
    getReports(limit?: number): PerformanceReport[];
    /**
     * Export performance data for analysis
     */
    exportPerformanceData(): {
        reports: PerformanceReport[];
        summary: {
            totalReports: number;
            averageViolations: number;
            mostCommonViolation: string;
            trend: "improving" | "stable" | "degrading";
        };
    };
}
export declare const performanceBudgetEnforcer: PerformanceBudgetEnforcer;
//# sourceMappingURL=performance-budget-enforcer.d.ts.map