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
import { PerformanceBudgetEnforcer, PERFORMANCE_BUDGET, } from "./performance-budget-enforcer";
import { PerformanceRegressionTester } from "./performance-regression-tester";
import { frameworkLogger } from "../framework-logger";
/**
 * Performance monitoring dashboard
 */
export class PerformanceMonitoringDashboard extends EventEmitter {
    config;
    metrics;
    budgetEnforcer;
    regressionTester;
    updateTimer;
    isRunning = false;
    constructor(config = {}, budgetEnforcer, regressionTester) {
        super();
        this.config = {
            updateInterval: 30000, // 30 seconds
            historyRetention: 24, // 24 hours
            alertThresholds: {
                budgetViolation: "error",
                regressionThreshold: 15, // 15%
                anomalySensitivity: "medium",
            },
            notifications: {
                email: false,
                slack: false,
                webhook: null,
            },
            ...config,
        };
        this.budgetEnforcer = budgetEnforcer || new PerformanceBudgetEnforcer();
        this.regressionTester =
            regressionTester || new PerformanceRegressionTester();
        this.metrics = this.initializeMetrics();
        this.setupEventHandlers();
    }
    /**
     * Initialize dashboard metrics structure
     */
    initializeMetrics() {
        return {
            timestamp: Date.now(),
            bundleSize: {
                current: 0,
                budget: PERFORMANCE_BUDGET.bundleSize.uncompressed,
                trend: "stable",
                history: [],
            },
            runtime: {
                memoryUsage: 0,
                cpuUsage: 0,
                startupTime: 0,
                history: [],
            },
            webVitals: {
                fcp: 0,
                tti: 0,
                lcp: 0,
                cls: 0,
                fid: 0,
                history: [],
            },
            regressions: {
                totalTests: 0,
                failedTests: 0,
                averageDeviation: 0,
                recentResults: [],
            },
            alerts: [],
        };
    }
    /**
     * Setup event handlers for real-time updates
     */
    setupEventHandlers() {
        this.budgetEnforcer.on("violation", (violation) => {
            this.addAlert({
                id: `budget-${violation.metric}-${Date.now()}`,
                type: "budget",
                severity: violation.severity,
                message: `${violation.metric}: ${violation.percentage.toFixed(1)}% of budget (${violation.actual.toLocaleString()} / ${violation.budget.toLocaleString()})`,
                timestamp: Date.now(),
                resolved: false,
            });
        });
        this.budgetEnforcer.on("budget-exceeded", (violation) => {
            this.emit("budget-exceeded", violation);
        });
    }
    /**
     * Start the monitoring dashboard
     */
    start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        // Performance dashboard messages - consider migrating to frameworkLogger for operational monitoring
    }
    /**
     * Stop the monitoring dashboard
     */
    stop() {
        this.isRunning = false;
    }
    /**
     * Update all dashboard metrics
     */
    async updateMetrics() {
        const jobId = `performance-monitoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            const timestamp = Date.now();
            // Update bundle size metrics
            await this.updateBundleSizeMetrics(timestamp);
            // Update runtime metrics
            this.updateRuntimeMetrics(timestamp);
            // Update web vitals (simulated for now)
            await this.updateWebVitalsMetrics(timestamp);
            // Update regression metrics
            this.updateRegressionMetrics();
            // Clean old history
            this.cleanOldHistory();
            // Check for anomalies
            this.detectAnomalies();
            this.metrics.timestamp = timestamp;
            this.emit("metrics-updated", this.metrics);
        }
        catch (error) {
            console.error("Failed to update dashboard metrics:", error);
            this.emit("error", error);
        }
    }
    /**
     * Update bundle size metrics
     */
    async updateBundleSizeMetrics(timestamp) {
        try {
            const bundleMetrics = await this.budgetEnforcer.analyzeBundleSize();
            const currentSize = bundleMetrics.totalSize;
            // Add to history
            this.metrics.bundleSize.history.push({
                timestamp,
                value: currentSize,
            });
            // Calculate trend
            this.metrics.bundleSize.current = currentSize;
            this.calculateTrend("bundleSize");
            // Keep history within retention period
            const retentionMs = this.config.historyRetention * 60 * 60 * 1000;
            this.metrics.bundleSize.history = this.metrics.bundleSize.history.filter((h) => timestamp - h.timestamp < retentionMs);
        }
        catch (error) {
            console.warn("Failed to update bundle size metrics:", error);
        }
    }
    /**
     * Update runtime performance metrics
     */
    updateRuntimeMetrics(timestamp) {
        const runtimeMetrics = this.budgetEnforcer.measureRuntimePerformance();
        this.metrics.runtime.memoryUsage = runtimeMetrics.memoryUsage.heapUsed;
        this.metrics.runtime.cpuUsage = runtimeMetrics.cpuUsage;
        this.metrics.runtime.startupTime = runtimeMetrics.startupTime;
        // Add to history
        this.metrics.runtime.history.push({
            timestamp,
            memory: runtimeMetrics.memoryUsage.heapUsed,
            cpu: runtimeMetrics.cpuUsage,
        });
        // Keep history within retention period
        const retentionMs = this.config.historyRetention * 60 * 60 * 1000;
        this.metrics.runtime.history = this.metrics.runtime.history.filter((h) => timestamp - h.timestamp < retentionMs);
    }
    /**
     * Update web vitals metrics
     */
    async updateWebVitalsMetrics(timestamp) {
        try {
            const vitalsMetrics = await this.budgetEnforcer.measureWebVitals();
            this.metrics.webVitals.fcp = vitalsMetrics.firstContentfulPaint;
            this.metrics.webVitals.tti = vitalsMetrics.timeToInteractive;
            this.metrics.webVitals.lcp = vitalsMetrics.largestContentfulPaint;
            this.metrics.webVitals.cls = vitalsMetrics.cumulativeLayoutShift;
            this.metrics.webVitals.fid = vitalsMetrics.firstInputDelay;
            // Add to history
            this.metrics.webVitals.history.push({
                timestamp,
                fcp: vitalsMetrics.firstContentfulPaint,
                tti: vitalsMetrics.timeToInteractive,
                lcp: vitalsMetrics.largestContentfulPaint,
                cls: vitalsMetrics.cumulativeLayoutShift,
                fid: vitalsMetrics.firstInputDelay,
            });
            // Keep history within retention period
            const retentionMs = this.config.historyRetention * 60 * 60 * 1000;
            this.metrics.webVitals.history = this.metrics.webVitals.history.filter((h) => timestamp - h.timestamp < retentionMs);
        }
        catch (error) {
            console.warn("Failed to update web vitals metrics:", error);
        }
    }
    /**
     * Update regression testing metrics
     */
    updateRegressionMetrics() {
        const regressionData = this.regressionTester.exportResults();
        this.metrics.regressions.totalTests = regressionData.summary.totalTests;
        this.metrics.regressions.failedTests = regressionData.results.filter((r) => r.status === "fail").length;
        this.metrics.regressions.averageDeviation =
            regressionData.summary.averageDeviation;
        // Keep only recent results (last 10)
        this.metrics.regressions.recentResults = regressionData.results
            .slice(-10)
            .map((r) => ({
            testName: r.testName,
            duration: r.duration,
            deviation: r.deviation,
            status: r.status,
        }));
    }
    /**
     * Calculate trend for a metric
     */
    calculateTrend(metricType) {
        const history = this.metrics.bundleSize.history;
        if (history.length < 3) {
            this.metrics.bundleSize.trend = "stable";
            return;
        }
        const recent = history.slice(-3);
        const values = recent.map((h) => h.value);
        if (values.length >= 3 &&
            values[0] !== undefined &&
            values[1] !== undefined &&
            values[2] !== undefined) {
            const avgFirst = (values[0] + values[1]) / 2;
            const avgLast = (values[1] + values[2]) / 2;
            if (avgLast < avgFirst * 0.95) {
                this.metrics.bundleSize.trend = "improving";
            }
            else if (avgLast > avgFirst * 1.05) {
                this.metrics.bundleSize.trend = "degrading";
            }
            else {
                this.metrics.bundleSize.trend = "stable";
            }
        }
    }
    /**
     * Clean old history data
     */
    cleanOldHistory() {
        const retentionMs = this.config.historyRetention * 60 * 60 * 1000;
        const now = Date.now();
        this.metrics.bundleSize.history = this.metrics.bundleSize.history.filter((h) => now - h.timestamp < retentionMs);
        this.metrics.runtime.history = this.metrics.runtime.history.filter((h) => now - h.timestamp < retentionMs);
        this.metrics.webVitals.history = this.metrics.webVitals.history.filter((h) => now - h.timestamp < retentionMs);
    }
    /**
     * Detect performance anomalies
     */
    detectAnomalies() {
        // Simple anomaly detection based on standard deviations
        this.detectBundleSizeAnomalies();
        this.detectRuntimeAnomalies();
        this.detectWebVitalsAnomalies();
    }
    /**
     * Detect bundle size anomalies
     */
    detectBundleSizeAnomalies() {
        const history = this.metrics.bundleSize.history;
        if (history.length < 5)
            return;
        const values = history.map((h) => h.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const latest = values[values.length - 1];
        if (latest !== undefined) {
            const zScore = Math.abs(latest - mean) / stdDev;
            if (zScore > 2) {
                // 2 standard deviations
                this.addAlert({
                    id: `anomaly-bundle-${Date.now()}`,
                    type: "anomaly",
                    severity: zScore > 3 ? "critical" : "warning",
                    message: `Bundle size anomaly detected: ${latest.toLocaleString()} bytes (${zScore.toFixed(2)}σ from mean)`,
                    timestamp: Date.now(),
                    resolved: false,
                });
            }
        }
    }
    /**
     * Detect runtime performance anomalies
     */
    detectRuntimeAnomalies() {
        const history = this.metrics.runtime.history;
        if (history.length < 5)
            return;
        const memoryValues = history.map((h) => h.memory);
        const memoryMean = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
        const latestMemory = memoryValues[memoryValues.length - 1];
        if (latestMemory !== undefined && latestMemory > memoryMean * 1.5) {
            // 50% above average
            this.addAlert({
                id: `anomaly-memory-${Date.now()}`,
                type: "anomaly",
                severity: latestMemory > memoryMean * 2 ? "critical" : "warning",
                message: `Memory usage spike: ${(latestMemory / 1024 / 1024).toFixed(2)}MB (${((latestMemory / memoryMean - 1) * 100).toFixed(1)}% above average)`,
                timestamp: Date.now(),
                resolved: false,
            });
        }
    }
    /**
     * Detect web vitals anomalies
     */
    detectWebVitalsAnomalies() {
        const history = this.metrics.webVitals.history;
        if (history.length < 5)
            return;
        const fcpValues = history.map((h) => h.fcp);
        const fcpMean = fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length;
        const latestFCP = fcpValues[fcpValues.length - 1];
        if (latestFCP !== undefined &&
            latestFCP > PERFORMANCE_BUDGET.webVitals.firstContentfulPaint) {
            this.addAlert({
                id: `anomaly-fcp-${Date.now()}`,
                type: "anomaly",
                severity: "warning",
                message: `FCP budget violation: ${latestFCP.toFixed(2)}ms (budget: ${PERFORMANCE_BUDGET.webVitals.firstContentfulPaint}ms)`,
                timestamp: Date.now(),
                resolved: false,
            });
        }
    }
    /**
     * Add an alert to the dashboard
     */
    addAlert(alert) {
        this.metrics.alerts.push(alert);
        // Keep only recent alerts (last 100)
        if (this.metrics.alerts.length > 100) {
            this.metrics.alerts = this.metrics.alerts.slice(-100);
        }
        this.emit("alert", alert);
        // Send notifications if configured
        this.sendNotification(alert);
    }
    /**
     * Send notification for alert
     */
    sendNotification(alert, jobId) {
        if (this.config.notifications.webhook) {
            // Send webhook notification
            this.sendWebhookNotification(alert, jobId);
        }
        // Additional notification methods can be implemented here
    }
    /**
     * Send webhook notification
     */
    async sendWebhookNotification(alert, jobId) {
        try {
            // In a real implementation, this would make an HTTP request
            await frameworkLogger.log("performance-dashboard", "webhook-notification", "info", { jobId, message: alert.message });
        }
        catch (error) {
            console.error("Failed to send webhook notification:", error);
        }
    }
    /**
     * Get current dashboard metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.metrics.alerts.filter((alert) => !alert.resolved);
    }
    /**
     * Check if the dashboard is currently running
     */
    isMonitoringActive() {
        return this.isRunning;
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId) {
        const alert = this.metrics.alerts.find((a) => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            this.emit("alert-resolved", alert);
            return true;
        }
        return false;
    }
    /**
     * Generate performance report
     */
    async generateReport() {
        return await this.budgetEnforcer.generatePerformanceReport();
    }
    /**
     * Export dashboard data for analysis
     */
    async exportData() {
        return {
            config: this.config,
            metrics: this.metrics,
            performanceReport: this.budgetEnforcer.getReports(1)[0] ||
                (await this.budgetEnforcer.generatePerformanceReport()),
            regressionData: this.regressionTester.exportResults(),
        };
    }
}
// Export singleton instance
export const performanceDashboard = new PerformanceMonitoringDashboard();
//# sourceMappingURL=performance-monitoring-dashboard.js.map