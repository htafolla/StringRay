/**
 * Performance Monitoring Dashboard
 *
 * Real-time performance monitoring dashboard with historical analytics,
 * alerting, and performance budget visualization.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import {
  PerformanceBudgetEnforcer,
  PerformanceReport,
  PERFORMANCE_BUDGET,
} from "./performance-budget-enforcer.js";
import { PerformanceRegressionTester } from "./performance-regression-tester.js";
import { frameworkLogger } from "../core/framework-logger.js";

export interface DashboardMetrics {
  timestamp: number;
  bundleSize: {
    current: number;
    budget: number;
    trend: "improving" | "stable" | "degrading";
    history: Array<{ timestamp: number; value: number }>;
  };
  runtime: {
    memoryUsage: number;
    cpuUsage: number;
    startupTime: number;
    history: Array<{ timestamp: number; memory: number; cpu: number }>;
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
  recommendations: string[];
}

export interface DashboardConfig {
  updateInterval: number;
  historyRetention: number; // hours
  alertThresholds: {
    budgetViolation: "warning" | "error";
    regressionThreshold: number; // percentage
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
export class PerformanceMonitoringDashboard extends EventEmitter {
  private config: DashboardConfig;
  private metrics: DashboardMetrics;
  private budgetEnforcer: PerformanceBudgetEnforcer;
  private regressionTester: PerformanceRegressionTester;
  private updateTimer?: NodeJS.Timeout | undefined;
  private isRunning = false;

  constructor(
    config: Partial<DashboardConfig> = {},
    budgetEnforcer?: PerformanceBudgetEnforcer,
    regressionTester?: PerformanceRegressionTester,
  ) {
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
  private initializeMetrics(): DashboardMetrics {
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
      recommendations: [],
    };
  }

  /**
   * Setup event handlers for real-time updates
   */
  private setupEventHandlers(): void {
    this.budgetEnforcer.on("violation", (violation) => {
      this.addAlert({
        id: `budget-${violation.metric}-${Date.now()}`,
        type: "budget",
        severity: violation.severity as "warning" | "error" | "critical",
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
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    // Performance dashboard messages - consider migrating to frameworkLogger for operational monitoring
  }

  /**
   * Stop the monitoring dashboard
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Update all dashboard metrics
   */
  private async updateMetrics(): Promise<void> {
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

      // Generate predictive analytics and recommendations
      this.generatePredictiveAnalytics();

      this.metrics.timestamp = timestamp;
      this.emit("metrics-updated", this.metrics);
    } catch (error) {
      frameworkLogger.log("performance-dashboard", "metrics-update-failed", "error", { error });
      this.emit("error", error);
    }
  }

  /**
   * Update bundle size metrics
   */
  private async updateBundleSizeMetrics(timestamp: number): Promise<void> {
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
      this.metrics.bundleSize.history = this.metrics.bundleSize.history.filter(
        (h) => timestamp - h.timestamp < retentionMs,
      );
    } catch (error) {
      frameworkLogger.log("performance-dashboard", "bundle-size-update-failed", "warning", { error });
    }
  }

  /**
   * Update runtime performance metrics
   */
  private updateRuntimeMetrics(timestamp: number): void {
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
    this.metrics.runtime.history = this.metrics.runtime.history.filter(
      (h) => timestamp - h.timestamp < retentionMs,
    );
  }

  /**
   * Update web vitals metrics
   */
  private async updateWebVitalsMetrics(timestamp: number): Promise<void> {
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
      this.metrics.webVitals.history = this.metrics.webVitals.history.filter(
        (h) => timestamp - h.timestamp < retentionMs,
      );
    } catch (error) {
      frameworkLogger.log("performance-dashboard", "web-vitals-update-failed", "warning", { error });
    }
  }

  /**
   * Update regression testing metrics
   */
  private updateRegressionMetrics(): void {
    const regressionData = this.regressionTester.exportResults();

    this.metrics.regressions.totalTests = regressionData.summary.totalTests;
    this.metrics.regressions.failedTests = regressionData.results.filter(
      (r) => r.status === "fail",
    ).length;
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
  private calculateTrend(metricType: "bundleSize"): void {
    const history = this.metrics.bundleSize.history;
    if (history.length < 3) {
      this.metrics.bundleSize.trend = "stable";
      return;
    }

    const recent = history.slice(-3);
    const values = recent.map((h) => h.value);
    if (
      values.length >= 3 &&
      values[0] !== undefined &&
      values[1] !== undefined &&
      values[2] !== undefined
    ) {
      const avgFirst = (values[0] + values[1]) / 2;
      const avgLast = (values[1] + values[2]) / 2;

      if (avgLast < avgFirst * 0.95) {
        this.metrics.bundleSize.trend = "improving";
      } else if (avgLast > avgFirst * 1.05) {
        this.metrics.bundleSize.trend = "degrading";
      } else {
        this.metrics.bundleSize.trend = "stable";
      }
    }
  }

  /**
   * Clean old history data
   */
  private cleanOldHistory(): void {
    const retentionMs = this.config.historyRetention * 60 * 60 * 1000;
    const now = Date.now();

    this.metrics.bundleSize.history = this.metrics.bundleSize.history.filter(
      (h) => now - h.timestamp < retentionMs,
    );

    this.metrics.runtime.history = this.metrics.runtime.history.filter(
      (h) => now - h.timestamp < retentionMs,
    );

    this.metrics.webVitals.history = this.metrics.webVitals.history.filter(
      (h) => now - h.timestamp < retentionMs,
    );
  }

  /**
   * Detect performance anomalies
   */
  private detectAnomalies(): void {
    // Simple anomaly detection based on standard deviations
    this.detectBundleSizeAnomalies();
    this.detectRuntimeAnomalies();
    this.detectWebVitalsAnomalies();
  }

  /**
   * Detect bundle size anomalies
   */
  private detectBundleSizeAnomalies(): void {
    const history = this.metrics.bundleSize.history;
    if (history.length < 5) return;

    const values = history.map((h) => h.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
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
  private detectRuntimeAnomalies(): void {
    const history = this.metrics.runtime.history;
    if (history.length < 5) return;

    const memoryValues = history.map((h) => h.memory);
    const memoryMean =
      memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
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
  private detectWebVitalsAnomalies(): void {
    const history = this.metrics.webVitals.history;
    if (history.length < 5) return;

    const fcpValues = history.map((h) => h.fcp);
    const fcpMean = fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length;
    const latestFCP = fcpValues[fcpValues.length - 1];

    if (
      latestFCP !== undefined &&
      latestFCP > PERFORMANCE_BUDGET.webVitals.firstContentfulPaint
    ) {
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
   * Generate predictive performance forecasts and optimization recommendations
   */
  private generatePredictiveAnalytics(): void {
    this.predictPerformanceTrends();
    this.generateOptimizationRecommendations();
  }

  /**
   * Predict performance trends using linear regression
   */
  private predictPerformanceTrends(): void {
    const history = this.metrics.bundleSize.history;
    if (history.length < 5) return;

    // Simple linear regression for trend prediction
    const n = history.length;
    const xSum = history.reduce((sum, _, i) => sum + i, 0);
    const ySum = history.reduce((sum, h) => sum + h.value, 0);
    const xySum = history.reduce((sum, h, i) => sum + i * h.value, 0);
    const x2Sum = history.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    // Predict next 3 data points
    const predictions = [];
    for (let i = 0; i < 3; i++) {
      const predictedValue = slope * (n + i) + intercept;
      predictions.push({
        timestamp: Date.now() + (i + 1) * this.config.updateInterval,
        predictedValue,
      });
    }

    // Check if trend indicates budget violation
    const currentEntry = history[history.length - 1];
    if (!currentEntry) return;
    const currentSize = currentEntry.value;
    const budget = PERFORMANCE_BUDGET.bundleSize.uncompressed;
    const projectedViolation = predictions.find(
      (p) => p.predictedValue > budget,
    );

    if (projectedViolation && slope > 0) {
      this.addAlert({
        id: `prediction-budget-violation-${Date.now()}`,
        type: "budget",
        severity: "warning",
        message: `Projected bundle size violation in ${Math.ceil((projectedViolation.timestamp - Date.now()) / this.config.updateInterval)} updates: ${(projectedViolation.predictedValue / 1024).toFixed(1)}KB (budget: ${(budget / 1024).toFixed(1)}KB)`,
        timestamp: Date.now(),
        resolved: false,
      });
    }
  }

  /**
   * Generate actionable optimization recommendations
   */
  private generateOptimizationRecommendations(): void {
    const recommendations: string[] = [];

    // Bundle size recommendations
    const currentSize = this.metrics.bundleSize.current;
    const budget = PERFORMANCE_BUDGET.bundleSize.uncompressed;

    if (currentSize > budget * 0.9) {
      recommendations.push(
        "Consider code splitting to reduce initial bundle size",
      );
      recommendations.push(
        "Review and optimize large dependencies using webpack-bundle-analyzer",
      );
      recommendations.push(
        "Implement lazy loading for non-critical components",
      );
    }

    // Memory recommendations
    const avgMemory =
      this.metrics.runtime.history
        .slice(-10)
        .reduce((sum, h) => sum + h.memory, 0) /
      Math.max(1, this.metrics.runtime.history.length);

    if (avgMemory > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push(
        "Implement memory pool optimizations for frequent allocations",
      );
      recommendations.push(
        "Consider using WeakMap/WeakSet for large object caches",
      );
      recommendations.push("Review event listeners for potential memory leaks");
    }

    // Web vitals recommendations
    if (
      this.metrics.webVitals.fcp >
      PERFORMANCE_BUDGET.webVitals.firstContentfulPaint
    ) {
      recommendations.push(
        "Optimize critical rendering path and reduce blocking resources",
      );
      recommendations.push("Consider implementing critical CSS inlining");
      recommendations.push("Review and optimize font loading strategy");
    }

    if (
      this.metrics.webVitals.tti >
      PERFORMANCE_BUDGET.webVitals.timeToInteractive
    ) {
      recommendations.push("Defer non-critical JavaScript execution");
      recommendations.push("Optimize main thread work and reduce long tasks");
      recommendations.push(
        "Consider implementing virtual scrolling for large lists",
      );
    }

    // Store recommendations in metrics
    this.metrics.recommendations = recommendations;

    // Emit recommendations event
    this.emit("recommendations-updated", recommendations);
  }

  /**
   * Add an alert to the dashboard
   */
  private addAlert(alert: DashboardMetrics["alerts"][0]): void {
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
  private sendNotification(
    alert: DashboardMetrics["alerts"][0],
    jobId?: string,
  ): void {
    if (this.config.notifications.webhook) {
      // Send webhook notification
      this.sendWebhookNotification(alert, jobId);
    }

    // Additional notification methods can be implemented here
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    alert: DashboardMetrics["alerts"][0],
    jobId?: string,
  ): Promise<void> {
    try {
      // In a real implementation, this would make an HTTP request
      await frameworkLogger.log(
        "performance-dashboard",
        "webhook-notification",
        "info",
        { jobId, message: alert.message },
      );
    } catch (error) {
      frameworkLogger.log("performance-dashboard", "webhook-failed", "error", { error });
    }
  }

  /**
   * Get current dashboard metrics
   */
  getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): DashboardMetrics["alerts"] {
    return this.metrics.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Check if the dashboard is currently running
   */
  isMonitoringActive(): boolean {
    return this.isRunning;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
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
  async generateReport(): Promise<PerformanceReport> {
    return await this.budgetEnforcer.generatePerformanceReport();
  }

  /**
   * Export dashboard data for analysis
   */
  async exportData(): Promise<{
    config: DashboardConfig;
    metrics: DashboardMetrics;
    performanceReport: PerformanceReport;
    regressionData: any;
  }> {
    return {
      config: this.config,
      metrics: this.metrics,
      performanceReport:
        this.budgetEnforcer.getReports(1)[0] ||
        (await this.budgetEnforcer.generatePerformanceReport()),
      regressionData: this.regressionTester.exportResults(),
    };
  }
}

// Export singleton instance
export const performanceDashboard = new PerformanceMonitoringDashboard();
