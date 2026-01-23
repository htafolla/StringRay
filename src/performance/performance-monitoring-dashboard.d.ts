/**
 * StringRay AI v1.1.1 - Performance Monitoring Dashboard
 *
 * Real-time performance monitoring dashboard with historical analytics,
 * alerting, and performance budget visualization.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import { PerformanceBudgetEnforcer, PerformanceReport } from "./performance-budget-enforcer";
import { PerformanceRegressionTester } from "./performance-regression-tester";
export interface DashboardMetrics {
    timestamp: number;
    bundleSize: {
        current: number;
        budget: number;
        trend: "improving" | "stable" | "degrading";
        history: Array<{
            timestamp: number;
            value: number;
        }>;
    };
    runtime: {
        memoryUsage: number;
        cpuUsage: number;
        startupTime: number;
        history: Array<{
            timestamp: number;
            memory: number;
            cpu: number;
        }>;
    };
    webVitals: {
        fcp: number;
        tti: number;
        lcp: number;
        cls: number;
        fid: number;
        history: Array<{
            timestamp: number;
            fcp: number;
            tti: number;
            lcp: number;
            cls: number;
            fid: number;
        }>;
    };
    regressions: {
        totalTests: number;
        failedTests: number;
        averageDeviation: number;
        recentResults: Array<{
            testName: string;
            duration: number;
            deviation: number;
            status: "pass" | "warning" | "fail";
        }>;
    };
    alerts: Array<{
        id: string;
        type: "budget" | "regression" | "anomaly";
        severity: "info" | "warning" | "error" | "critical";
        message: string;
        timestamp: number;
        resolved: boolean;
    }>;
}
export interface DashboardConfig {
    updateInterval: number;
    historyRetention: number;
    alertThresholds: {
        budgetViolation: "warning" | "error";
        regressionThreshold: number;
        anomalySensitivity: "low" | "medium" | "high";
    };
    notifications: {
        email: boolean;
        slack: boolean;
        webhook: string | null;
    };
}
/**
 * Performance monitoring dashboard
 */
export declare class PerformanceMonitoringDashboard extends EventEmitter {
    private config;
    private metrics;
    private budgetEnforcer;
    private regressionTester;
    private updateTimer?;
    private isRunning;
    constructor(config?: Partial<DashboardConfig>, budgetEnforcer?: PerformanceBudgetEnforcer, regressionTester?: PerformanceRegressionTester);
    /**
     * Initialize dashboard metrics structure
     */
    private initializeMetrics;
    /**
     * Setup event handlers for real-time updates
     */
    private setupEventHandlers;
    /**
     * Start the monitoring dashboard
     */
    start(): void;
    /**
     * Stop the monitoring dashboard
     */
    stop(): void;
    /**
     * Update all dashboard metrics
     */
    private updateMetrics;
    /**
     * Update bundle size metrics
     */
    private updateBundleSizeMetrics;
    /**
     * Update runtime performance metrics
     */
    private updateRuntimeMetrics;
    /**
     * Update web vitals metrics
     */
    private updateWebVitalsMetrics;
    /**
     * Update regression testing metrics
     */
    private updateRegressionMetrics;
    /**
     * Calculate trend for a metric
     */
    private calculateTrend;
    /**
     * Clean old history data
     */
    private cleanOldHistory;
    /**
     * Detect performance anomalies
     */
    private detectAnomalies;
    /**
     * Detect bundle size anomalies
     */
    private detectBundleSizeAnomalies;
    /**
     * Detect runtime performance anomalies
     */
    private detectRuntimeAnomalies;
    /**
     * Detect web vitals anomalies
     */
    private detectWebVitalsAnomalies;
    /**
     * Add an alert to the dashboard
     */
    private addAlert;
    /**
     * Send notification for alert
     */
    private sendNotification;
    /**
     * Send webhook notification
     */
    private sendWebhookNotification;
    /**
     * Get current dashboard metrics
     */
    getMetrics(): DashboardMetrics;
    /**
     * Get active alerts
     */
    getActiveAlerts(): DashboardMetrics["alerts"];
    /**
     * Check if the dashboard is currently running
     */
    isMonitoringActive(): boolean;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): boolean;
    /**
     * Generate performance report
     */
    generateReport(): Promise<PerformanceReport>;
    /**
     * Export dashboard data for analysis
     */
    exportData(): Promise<{
        config: DashboardConfig;
        metrics: DashboardMetrics;
        performanceReport: PerformanceReport;
        regressionData: any;
    }>;
}
export declare const performanceDashboard: PerformanceMonitoringDashboard;
//# sourceMappingURL=performance-monitoring-dashboard.d.ts.map