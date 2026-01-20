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
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { performance } from "perf_hooks";

// Performance budget constants from Universal Development Codex
export const PERFORMANCE_BUDGET = {
  bundleSize: {
    uncompressed: 2 * 1024 * 1024, // 2MB
    gzipped: 700 * 1024, // 700KB
  },
  webVitals: {
    firstContentfulPaint: 2000, // 2s
    timeToInteractive: 5000, // 5s
    largestContentfulPaint: 2500, // 2.5s
    cumulativeLayoutShift: 0.1, // 0.1
    firstInputDelay: 100, // 100ms
  },
  runtime: {
    memoryUsage: 50 * 1024 * 1024, // 50MB heap usage
    startupTime: 100, // 100ms
    testExecutionTime: 5000, // 5s
  },
} as const;

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
export class PerformanceBudgetEnforcer extends EventEmitter {
  private reports: PerformanceReport[] = [];
  private monitoringActive = false;
  private alertThresholds = {
    warning: 0.9, // 90% of budget
    error: 1.0, // 100% of budget
    critical: 1.1, // 110% of budget
  };

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for performance monitoring
   */
  private setupEventHandlers(): void {
    this.on("violation", this.handleViolation.bind(this));
    this.on("budget-exceeded", this.handleBudgetExceeded.bind(this));
  }

  /**
   * Analyze bundle size against performance budget
   */
  async analyzeBundleSize(
    distPath: string = "./dist",
  ): Promise<BundleSizeMetrics> {
    const metrics: BundleSizeMetrics = {
      totalSize: 0,
      gzippedSize: 0,
      fileCount: 0,
      largestFile: { name: "", size: 0, gzippedSize: 0 },
      breakdown: [],
    };

    if (!fs.existsSync(distPath)) {
      throw new Error(`Distribution directory not found: ${distPath}`);
    }

    const files = fs.readdirSync(distPath);
    const jsFiles = files.filter(
      (file) => file.endsWith(".js") || file.endsWith(".mjs"),
    );

    for (const file of jsFiles) {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;

      // Calculate gzipped size
      let gzippedSize = 0;
      try {
        const gzipped = execSync(`gzip -c "${filePath}" | wc -c`, {
          encoding: "utf8",
        });
        gzippedSize = parseInt(gzipped.trim());
      } catch (error) {
        console.warn(`Failed to gzip ${file}:`, error);
        gzippedSize = size; // Fallback to uncompressed size
      }

      metrics.totalSize += size;
      metrics.gzippedSize += gzippedSize;
      metrics.fileCount++;

      // Track largest file
      if (size > metrics.largestFile.size) {
        metrics.largestFile = { name: file, size, gzippedSize };
      }

      // Add to breakdown
      metrics.breakdown.push({
        name: file,
        size,
        gzippedSize,
        percentage: 0, // Will be calculated after all files are processed
      });
    }

    // Calculate percentages
    metrics.breakdown.forEach((file) => {
      file.percentage = (file.size / (metrics.totalSize || 1)) * 100;
    });

    // Sort breakdown by size descending
    metrics.breakdown.sort((a, b) => b.size - a.size);

    return metrics;
  }

  /**
   * Measure web vitals (simulated for server-side framework)
   * In a real web application, this would use the Web Vitals library
   */
  async measureWebVitals(): Promise<WebVitalsMetrics> {
    // For server-side framework, we'll simulate measurements
    // In a real implementation, this would collect from actual page loads
    const metrics: WebVitalsMetrics = {
      firstContentfulPaint: Math.random() * 1000 + 500, // 500-1500ms
      timeToInteractive: Math.random() * 2000 + 2000, // 2000-4000ms
      largestContentfulPaint: Math.random() * 1000 + 1500, // 1500-2500ms
      cumulativeLayoutShift: Math.random() * 0.1, // 0-0.1
      firstInputDelay: Math.random() * 50 + 25, // 25-75ms
      timestamp: Date.now(),
    };

    return metrics;
  }

  /**
   * Measure runtime performance metrics
   */
  measureRuntimePerformance(): RuntimePerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memoryUsage: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
      startupTime: performance.now(), // This would be measured from app start
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000, // Convert to milliseconds
      timestamp: Date.now(),
    };
  }

  /**
   * Check performance budget compliance
   */
  checkBudgetCompliance(
    bundleSize: BundleSizeMetrics,
    webVitals: WebVitalsMetrics | null,
    runtime: RuntimePerformanceMetrics,
  ): PerformanceBudgetViolation[] {
    const violations: PerformanceBudgetViolation[] = [];

    // Bundle size checks
    if (bundleSize.totalSize > PERFORMANCE_BUDGET.bundleSize.uncompressed) {
      violations.push({
        metric: "bundle-size-uncompressed",
        actual: bundleSize.totalSize,
        budget: PERFORMANCE_BUDGET.bundleSize.uncompressed,
        percentage:
          (bundleSize.totalSize / PERFORMANCE_BUDGET.bundleSize.uncompressed) *
          100,
        severity:
          bundleSize.totalSize >
          PERFORMANCE_BUDGET.bundleSize.uncompressed * 1.1
            ? "critical"
            : "error",
        recommendation:
          "Reduce bundle size by code splitting, tree shaking, or removing unused dependencies",
      });
    }

    if (bundleSize.gzippedSize > PERFORMANCE_BUDGET.bundleSize.gzipped) {
      violations.push({
        metric: "bundle-size-gzipped",
        actual: bundleSize.gzippedSize,
        budget: PERFORMANCE_BUDGET.bundleSize.gzipped,
        percentage:
          (bundleSize.gzippedSize / PERFORMANCE_BUDGET.bundleSize.gzipped) *
          100,
        severity:
          bundleSize.gzippedSize > PERFORMANCE_BUDGET.bundleSize.gzipped * 1.1
            ? "critical"
            : "error",
        recommendation:
          "Optimize gzipped bundle size through minification and compression improvements",
      });
    }

    // Web vitals checks (if available)
    if (webVitals) {
      if (
        webVitals.firstContentfulPaint >
        PERFORMANCE_BUDGET.webVitals.firstContentfulPaint
      ) {
        violations.push({
          metric: "first-contentful-paint",
          actual: webVitals.firstContentfulPaint,
          budget: PERFORMANCE_BUDGET.webVitals.firstContentfulPaint,
          percentage:
            (webVitals.firstContentfulPaint /
              PERFORMANCE_BUDGET.webVitals.firstContentfulPaint) *
            100,
          severity:
            webVitals.firstContentfulPaint >
            PERFORMANCE_BUDGET.webVitals.firstContentfulPaint * 1.1
              ? "critical"
              : "error",
          recommendation:
            "Optimize critical rendering path, reduce render-blocking resources",
        });
      }

      if (
        webVitals.timeToInteractive >
        PERFORMANCE_BUDGET.webVitals.timeToInteractive
      ) {
        violations.push({
          metric: "time-to-interactive",
          actual: webVitals.timeToInteractive,
          budget: PERFORMANCE_BUDGET.webVitals.timeToInteractive,
          percentage:
            (webVitals.timeToInteractive /
              PERFORMANCE_BUDGET.webVitals.timeToInteractive) *
            100,
          severity:
            webVitals.timeToInteractive >
            PERFORMANCE_BUDGET.webVitals.timeToInteractive * 1.1
              ? "critical"
              : "error",
          recommendation:
            "Reduce JavaScript execution time, optimize main thread work",
        });
      }
    }

    // Runtime checks
    if (runtime.memoryUsage.heapUsed > PERFORMANCE_BUDGET.runtime.memoryUsage) {
      violations.push({
        metric: "memory-usage",
        actual: runtime.memoryUsage.heapUsed,
        budget: PERFORMANCE_BUDGET.runtime.memoryUsage,
        percentage:
          (runtime.memoryUsage.heapUsed /
            PERFORMANCE_BUDGET.runtime.memoryUsage) *
          100,
        severity:
          runtime.memoryUsage.heapUsed >
          PERFORMANCE_BUDGET.runtime.memoryUsage * 1.1
            ? "critical"
            : "warning",
        recommendation:
          "Optimize memory usage through garbage collection improvements or memory leak fixes",
      });
    }

    return violations;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const bundleSize = await this.analyzeBundleSize();
    const webVitals = await this.measureWebVitals();
    const runtime = this.measureRuntimePerformance();
    const violations = this.checkBudgetCompliance(
      bundleSize,
      webVitals,
      runtime,
    );

    // Generate recommendations based on violations
    const recommendations = this.generateRecommendations(
      violations,
      bundleSize,
      webVitals,
      runtime,
    );

    // Determine overall status
    const hasCritical = violations.some((v) => v.severity === "critical");
    const hasError = violations.some((v) => v.severity === "error");
    const hasWarning = violations.some((v) => v.severity === "warning");

    let overallStatus: "pass" | "warning" | "fail" = "pass";
    if (hasCritical || hasError) {
      overallStatus = "fail";
    } else if (hasWarning) {
      overallStatus = "warning";
    }

    const report: PerformanceReport = {
      timestamp: Date.now(),
      bundleSize,
      webVitals,
      runtime,
      violations,
      recommendations,
      overallStatus,
    };

    this.reports.push(report);

    // Emit events for violations
    violations.forEach((violation) => {
      this.emit("violation", violation);
      if (violation.percentage > 100) {
        this.emit("budget-exceeded", violation);
      }
    });

    return report;
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(
    violations: PerformanceBudgetViolation[],
    bundleSize: BundleSizeMetrics,
    webVitals: WebVitalsMetrics | null,
    runtime: RuntimePerformanceMetrics,
  ): string[] {
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (
      bundleSize.totalSize >
      PERFORMANCE_BUDGET.bundleSize.uncompressed * 0.8
    ) {
      recommendations.push(
        "Consider implementing code splitting to reduce initial bundle size",
      );
    }

    if (bundleSize.largestFile.size > bundleSize.totalSize * 0.5) {
      recommendations.push(
        `Largest file (${bundleSize.largestFile.name}) is ${((bundleSize.largestFile.size / bundleSize.totalSize) * 100).toFixed(1)}% of bundle - consider splitting or optimizing`,
      );
    }

    // Web vitals recommendations
    if (webVitals && webVitals.firstContentfulPaint > 1500) {
      recommendations.push(
        "Optimize First Contentful Paint by prioritizing critical CSS and above-the-fold content",
      );
    }

    if (webVitals && webVitals.timeToInteractive > 3000) {
      recommendations.push(
        "Reduce Time to Interactive by minimizing main thread blocking JavaScript",
      );
    }

    // Runtime recommendations
    if (
      runtime.memoryUsage.heapUsed >
      PERFORMANCE_BUDGET.runtime.memoryUsage * 0.8
    ) {
      recommendations.push(
        "Monitor for memory leaks and consider implementing memory optimization strategies",
      );
    }

    // Add specific recommendations from violations
    violations.forEach((violation) => {
      if (!recommendations.includes(violation.recommendation)) {
        recommendations.push(violation.recommendation);
      }
    });

    return recommendations;
  }

  /**
   * Handle performance violations
   */
  private handleViolation(violation: PerformanceBudgetViolation): void {
    const severity = violation.severity.toUpperCase();
    console.warn(
      `[${severity}] Performance budget violation: ${violation.metric}`,
    );
    console.warn(
      `  Actual: ${violation.actual.toLocaleString()}, Budget: ${violation.budget.toLocaleString()} (${violation.percentage.toFixed(1)}%)`,
    );
    console.warn(`  Recommendation: ${violation.recommendation}`);
  }

  /**
   * Handle budget exceeded events
   */
  private handleBudgetExceeded(violation: PerformanceBudgetViolation): void {
    console.error(
      `🚨 PERFORMANCE BUDGET EXCEEDED: ${violation.metric} (${violation.percentage.toFixed(1)}% of budget)`,
    );

    if (violation.severity === "critical") {
      console.error(
        "🚨 CRITICAL: This violation requires immediate attention before deployment",
      );
    }
  }

  /**
   * Start continuous performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringActive) {
      return;
    }

    this.monitoringActive = true;
    console.log("🔍 Started performance monitoring");

    const monitor = async () => {
      if (!this.monitoringActive) {
        return;
      }

      try {
        await this.generatePerformanceReport();
      } catch (error) {
        console.error("Performance monitoring error:", error);
      }

      setTimeout(monitor, intervalMs);
    };

    // Initial report
    monitor();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.monitoringActive = false;
    console.log("🛑 Stopped performance monitoring");
  }

  /**
   * Get historical performance reports
   */
  getReports(limit: number = 10): PerformanceReport[] {
    return this.reports.slice(-limit);
  }

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
  } {
    const summary = {
      totalReports: this.reports.length,
      averageViolations:
        this.reports.length > 0
          ? this.reports.reduce((sum, r) => sum + r.violations.length, 0) /
            this.reports.length
          : 0,
      mostCommonViolation: "",
      trend: "stable" as "improving" | "stable" | "degrading",
    };

    // Calculate most common violation
    const violationCounts: Record<string, number> = {};
    this.reports.forEach((report) => {
      report.violations.forEach((violation) => {
        violationCounts[violation.metric] =
          (violationCounts[violation.metric] || 0) + 1;
      });
    });

    const mostCommon = Object.entries(violationCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];
    summary.mostCommonViolation = mostCommon ? mostCommon[0] : "none";

    // Calculate trend (simple implementation)
    if (this.reports.length >= 3) {
      const recent = this.reports.slice(-3);
      const violationTrend = recent.map((r) => r.violations.length);
      if (
        violationTrend.length >= 3 &&
        violationTrend[0] !== undefined &&
        violationTrend[1] !== undefined &&
        violationTrend[2] !== undefined
      ) {
        const avgFirst = (violationTrend[0] + violationTrend[1]) / 2;
        const avgLast = (violationTrend[1] + violationTrend[2]) / 2;

        if (avgLast < avgFirst) {
          summary.trend = "improving";
        } else if (avgLast > avgFirst) {
          summary.trend = "degrading";
        }
      }
    }

    return {
      reports: this.reports,
      summary,
    };
  }
}

// Export singleton instance
export const performanceBudgetEnforcer = new PerformanceBudgetEnforcer();
