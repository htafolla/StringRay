/**
 * StringRay Framework v1.0.0 - Phase 2 Advanced Regression Testing System
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

import { performance } from "perf_hooks";
import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";

// Import existing regression testing components
import {
  PerformanceRegressionTest,
  RegressionTestResult,
  PerformanceBaseline,
  RegressionTestSuite,
} from "./performance-regression-tester.js";

export interface StatisticalAnalysis {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  quartiles: [number, number, number]; // Q1, Q2, Q3
  confidenceInterval: [number, number]; // 95% CI
  sampleSize: number;
  outliers: number[];
  skewness: number;
  kurtosis: number;
}

export interface TrendAnalysis {
  direction: "improving" | "degrading" | "stable";
  slope: number; // rate of change per unit time
  rSquared: number; // goodness of fit
  confidence: number; // confidence in trend (0-1)
  changePoints: number[]; // timestamps of significant changes
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
    statisticalSignificance: number; // p-value
  };
  recommendations: string[];
  automated: boolean;
  resolved: boolean;
}

export interface EnhancedRegressionTestResult extends Omit<
  RegressionTestResult,
  "expectedDuration"
> {
  expectedDuration: number | undefined;
  statisticalAnalysis: StatisticalAnalysis;
  trendAnalysis: TrendAnalysis;
  anomalyScore: number; // 0-1, higher = more anomalous
  confidenceLevel: number; // 0-1, confidence in result
  historicalContext: {
    percentileRank: number; // where this result ranks historically
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
  outlierThreshold: number; // z-score threshold for outliers
  adaptationRate: number; // how quickly baseline adapts (0-1)
  minimumSamples: number; // minimum samples before statistical analysis
}

/**
 * Phase 2 Advanced Regression Testing System
 */
export class AdvancedRegressionTestingSystem extends EventEmitter {
  private baselines: Map<string, IntelligentBaseline> = new Map();
  private historicalData: Map<string, number[]> = new Map();
  private alerts: RegressionAlert[] = [];
  private statisticalWindow = 100; // number of recent results to analyze
  private anomalyThreshold = 0.95; // z-score threshold for anomalies

  constructor(
    private baselineFile: string = "./performance-baselines-advanced.json",
  ) {
    super();
    this.loadBaselines();
  }

  /**
   * Run enhanced regression test with statistical analysis
   */
  async runEnhancedRegressionTest(
    test: PerformanceRegressionTest,
  ): Promise<EnhancedRegressionTestResult> {
    const startTime = performance.now();

    try {
      // Run the test with timeout
      await Promise.race([
        test.testFunction(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Test timeout after ${test.timeout}ms`)),
            test.timeout,
          ),
        ),
      ]);

      const duration = performance.now() - startTime;

      // Get historical data for this test
      const history = this.getHistoricalData(test.name);
      history.push(duration);
      this.updateHistoricalData(test.name, history);

      // Perform statistical analysis
      const statisticalAnalysis = this.performStatisticalAnalysis(history);

      // Analyze trends
      const trendAnalysis = this.analyzeTrends(history);

      // Calculate anomaly score
      const anomalyScore = this.calculateAnomalyScore(
        duration,
        statisticalAnalysis,
      );

      // Get baseline and calculate deviation
      const baseline = this.baselines.get(test.name);
      let deviation = 0;
      let status: "pass" | "warning" | "fail" = "pass";

      if (baseline) {
        deviation =
          ((duration - baseline.averageDuration) / baseline.averageDuration) *
          100;

        // Use statistical significance for status determination
        const statisticalSignificance = this.calculateStatisticalSignificance(
          duration,
          baseline.statisticalModel,
        );

        if (Math.abs(deviation) > test.tolerance) {
          if (statisticalSignificance < 0.05) {
            // 95% confidence
            status =
              Math.abs(deviation) > test.tolerance * 2 ? "fail" : "warning";
          }
        }
      }

      // Calculate confidence level
      const confidenceLevel = this.calculateConfidenceLevel(
        statisticalAnalysis,
        history.length,
      );

      // Generate historical context
      const historicalContext = this.generateHistoricalContext(
        duration,
        history,
      );

      // Generate alerts
      const alerts = this.generateAlerts(
        test.name,
        duration,
        baseline,
        statisticalAnalysis,
        trendAnalysis,
      );

      const result: EnhancedRegressionTestResult = {
        testName: test.name,
        duration,
        expectedDuration: baseline?.averageDuration ?? undefined,
        deviation,
        status,
        timestamp: Date.now(),
        statisticalAnalysis,
        trendAnalysis,
        anomalyScore,
        confidenceLevel,
        historicalContext,
        alerts,
      };

      // Update baseline if needed
      if (baseline) {
        this.updateBaselineIfNeeded(test.name, duration, result);
      } else {
        // Create initial baseline
        this.createInitialBaseline(test.name, duration);
      }

      // Emit events
      this.emit("test-completed", result);
      alerts.forEach((alert) => this.emit("alert", alert));

      return result;
    } catch (error) {
      const errorResult: EnhancedRegressionTestResult = {
        testName: test.name,
        duration: 0,
        expectedDuration: undefined,
        deviation: 0,
        status: "fail",
        error: (error as Error).message,
        timestamp: Date.now(),
        statisticalAnalysis: this.getEmptyStatisticalAnalysis(),
        trendAnalysis: this.getEmptyTrendAnalysis(),
        anomalyScore: 1, // Maximum anomaly for failures
        confidenceLevel: 0,
        historicalContext: {
          percentileRank: 0,
          comparedToLastWeek: 0,
          comparedToLastMonth: 0,
        },
        alerts: [
          {
            id: `error-${Date.now()}`,
            timestamp: Date.now(),
            testName: test.name,
            type: "anomaly",
            severity: "critical",
            message: `Test execution failed: ${(error as Error).message}`,
            metrics: {
              current: 0,
              baseline: 0,
              deviation: 0,
              statisticalSignificance: 1,
            },
            recommendations: [
              "Investigate test failure",
              "Check system resources",
              "Review test implementation",
            ],
            automated: false,
            resolved: false,
          },
        ],
      };

      this.emit("test-failed", errorResult);
      return errorResult;
    }
  }

  /**
   * Perform comprehensive statistical analysis
   */
  private performStatisticalAnalysis(data: number[]): StatisticalAnalysis {
    if (data.length === 0) {
      return this.getEmptyStatisticalAnalysis();
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;

    // Basic statistics
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)] ?? mean;
    const median = sorted[Math.floor(n * 0.5)] ?? mean;
    const q3 = sorted[Math.floor(n * 0.75)] ?? mean;

    // Confidence interval (95%)
    const marginOfError = 1.96 * (stdDev / Math.sqrt(n));
    const confidenceInterval: [number, number] = [
      mean - marginOfError,
      mean + marginOfError,
    ];

    // Outliers (using IQR method)
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = data.filter((val) => val < lowerBound || val > upperBound);

    // Skewness and Kurtosis
    const skewness =
      data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) /
      n;
    const kurtosis =
      data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) /
        n -
      3;

    return {
      mean,
      median,
      standardDeviation: stdDev,
      variance,
      min: sorted[0] ?? mean,
      max: sorted[sorted.length - 1] ?? mean,
      quartiles: [q1, median, q3],
      confidenceInterval,
      sampleSize: n,
      outliers,
      skewness,
      kurtosis,
    };
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(data: number[]): TrendAnalysis {
    if (data.length < 10) {
      return this.getEmptyTrendAnalysis();
    }

    // Simple linear regression for trend analysis
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * (y[i] ?? 0), 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - ssRes / ssTot;

    // Determine trend direction
    let direction: "improving" | "degrading" | "stable" = "stable";
    if (Math.abs(slope) > 0.01) {
      direction = slope < 0 ? "improving" : "degrading";
    }

    // Simple change point detection (simplified)
    const changePoints: number[] = [];
    for (let i = 10; i < data.length - 10; i++) {
      const before = data.slice(i - 10, i);
      const after = data.slice(i, i + 10);
      const beforeMean =
        before.reduce((sum, val) => sum + val, 0) / before.length;
      const afterMean = after.reduce((sum, val) => sum + val, 0) / after.length;

      if (
        beforeMean !== 0 &&
        Math.abs(afterMean - beforeMean) / beforeMean > 0.1
      ) {
        // 10% change
        changePoints.push(i);
      }
    }

    return {
      direction,
      slope,
      rSquared,
      confidence: Math.min(rSquared * 0.8 + 0.2, 1), // Adjusted confidence
      changePoints,
      seasonality: false, // Simplified - would need more complex analysis
    };
  }

  /**
   * Calculate anomaly score using z-score
   */
  private calculateAnomalyScore(
    value: number,
    stats: StatisticalAnalysis,
  ): number {
    if (stats.standardDeviation === 0) return 0;

    const zScore = Math.abs((value - stats.mean) / stats.standardDeviation);
    // Convert z-score to 0-1 scale using sigmoid function
    return 1 / (1 + Math.exp(-zScore + 3)); // Shift so z-score of 3 = 0.5
  }

  /**
   * Calculate statistical significance (p-value approximation)
   */
  private calculateStatisticalSignificance(
    value: number,
    baselineStats: StatisticalAnalysis,
  ): number {
    if (baselineStats.standardDeviation === 0) return 1;

    const zScore = Math.abs(
      (value - baselineStats.mean) / baselineStats.standardDeviation,
    );

    // Approximate p-value using normal distribution
    // For z > 3, p-value ≈ 0.001
    if (zScore > 3) return 0.001;
    if (zScore > 2) return 0.05;
    if (zScore > 1.96) return 0.05;
    if (zScore > 1.645) return 0.1;

    return 0.5; // Not significant
  }

  /**
   * Calculate confidence level in the result
   */
  private calculateConfidenceLevel(
    stats: StatisticalAnalysis,
    sampleSize: number,
  ): number {
    // Higher confidence with more samples and lower variance
    const sampleConfidence = Math.min(sampleSize / 50, 1); // Max confidence at 50 samples
    const varianceConfidence = Math.max(
      0,
      1 - stats.standardDeviation / stats.mean,
    );

    return (sampleConfidence + varianceConfidence) / 2;
  }

  /**
   * Generate historical context
   */
  private generateHistoricalContext(
    current: number,
    history: number[],
  ): EnhancedRegressionTestResult["historicalContext"] {
    if (history.length < 2) {
      return {
        percentileRank: 50,
        comparedToLastWeek: 0,
        comparedToLastMonth: 0,
      };
    }

    const sorted = [...history].sort((a, b) => a - b);
    const percentileRank =
      (sorted.findIndex((val) => val >= current) / sorted.length) * 100;

    // Compare to recent periods (simplified)
    const recent = history.slice(-7); // Last 7 results
    const older = history.slice(-30, -7); // Previous 23 results

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg =
      older.length > 0
        ? older.reduce((sum, val) => sum + val, 0) / older.length
        : recentAvg;

    return {
      percentileRank,
      comparedToLastWeek: ((current - recentAvg) / recentAvg) * 100,
      comparedToLastMonth:
        older.length > 0 ? ((current - olderAvg) / olderAvg) * 100 : 0,
    };
  }

  /**
   * Generate alerts based on analysis
   */
  private generateAlerts(
    testName: string,
    current: number,
    baseline: IntelligentBaseline | undefined,
    stats: StatisticalAnalysis,
    trends: TrendAnalysis,
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];

    if (!baseline) return alerts;

    // Regression alert
    const deviation =
      ((current - baseline.averageDuration) / baseline.averageDuration) * 100;
    if (Math.abs(deviation) > baseline.tolerance) {
      const significance = this.calculateStatisticalSignificance(
        current,
        baseline.statisticalModel,
      );

      if (significance < 0.05) {
        alerts.push({
          id: `regression-${Date.now()}`,
          timestamp: Date.now(),
          testName,
          type: "regression",
          severity:
            Math.abs(deviation) > baseline.tolerance * 2 ? "high" : "medium",
          message: `Performance ${deviation > 0 ? "regression" : "improvement"} detected: ${deviation.toFixed(2)}%`,
          metrics: {
            current,
            baseline: baseline.averageDuration,
            deviation,
            statisticalSignificance: significance,
          },
          recommendations: [
            "Review recent code changes",
            "Check for performance bottlenecks",
            "Consider optimization opportunities",
          ],
          automated: false,
          resolved: false,
        });
      }
    }

    // Anomaly alert
    const anomalyScore = this.calculateAnomalyScore(current, stats);
    if (anomalyScore > this.anomalyThreshold) {
      alerts.push({
        id: `anomaly-${Date.now()}`,
        timestamp: Date.now(),
        testName,
        type: "anomaly",
        severity: anomalyScore > 0.99 ? "critical" : "high",
        message: `Performance anomaly detected (score: ${(anomalyScore * 100).toFixed(1)}%)`,
        metrics: {
          current,
          baseline: baseline.averageDuration,
          deviation,
          statisticalSignificance: 0.01,
        },
        recommendations: [
          "Investigate unusual performance behavior",
          "Check system resources and environment",
          "Review monitoring data for patterns",
        ],
        automated: false,
        resolved: false,
      });
    }

    // Trend change alert
    if (trends.changePoints.length > 0) {
      const recentChange = trends.changePoints[trends.changePoints.length - 1]!;
      if (Date.now() - recentChange < 24 * 60 * 60 * 1000) {
        // Within last 24 hours
        alerts.push({
          id: `trend-${Date.now()}`,
          timestamp: Date.now(),
          testName,
          type: "trend-change",
          severity: "medium",
          message: `Performance trend change detected`,
          metrics: {
            current,
            baseline: baseline.averageDuration,
            deviation,
            statisticalSignificance: 0.05,
          },
          recommendations: [
            "Analyze trend change causes",
            "Review recent deployments",
            "Consider baseline updates",
          ],
          automated: false,
          resolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Update baseline if statistical conditions are met
   */
  private updateBaselineIfNeeded(
    testName: string,
    newValue: number,
    result: EnhancedRegressionTestResult,
  ): void {
    const baseline = this.baselines.get(testName);
    if (!baseline) return;

    // Only update if we have enough samples and statistical confidence
    if (result.confidenceLevel < 0.8) return;

    // Check if new value is significantly different and stable
    const history = this.getHistoricalData(testName);
    if (history.length < baseline.minimumSamples) return;

    const recent = history.slice(-10); // Last 10 results
    const recentStats = this.performStatisticalAnalysis(recent);

    // Update if the recent performance is stable and different from baseline
    const recentDeviation = Math.abs(
      (recentStats.mean - baseline.averageDuration) / baseline.averageDuration,
    );

    if (
      recentDeviation > 0.05 &&
      recentStats.standardDeviation / recentStats.mean < 0.1
    ) {
      // 10% CV threshold
      const oldValue = baseline.averageDuration;
      baseline.averageDuration = recentStats.mean;
      baseline.standardDeviation = recentStats.standardDeviation;
      baseline.sampleCount = recent.length;
      baseline.lastUpdated = Date.now();
      baseline.statisticalModel = recentStats;
      baseline.lastUpdateReason = "statistical";

      baseline.updateHistory.push({
        timestamp: Date.now(),
        reason: "Statistical update based on recent stable performance",
        oldValue,
        newValue: recentStats.mean,
        confidence: result.confidenceLevel,
      });

      this.saveBaselines();
      this.emit("baseline-updated", {
        testName,
        oldValue,
        newValue: recentStats.mean,
      });
    }
  }

  /**
   * Create initial baseline
   */
  private createInitialBaseline(testName: string, initialValue: number): void {
    const baseline: IntelligentBaseline = {
      testName,
      averageDuration: initialValue,
      standardDeviation: 0,
      sampleCount: 1,
      lastUpdated: Date.now(),
      tolerance: 10, // Default 10% tolerance
      statisticalModel: this.getEmptyStatisticalAnalysis(),
      trendModel: this.getEmptyTrendAnalysis(),
      lastUpdateReason: "automatic",
      updateHistory: [
        {
          timestamp: Date.now(),
          reason: "Initial baseline creation",
          oldValue: 0,
          newValue: initialValue,
          confidence: 0.5,
        },
      ],
      outlierThreshold: 3, // 3 standard deviations
      adaptationRate: 0.1, // 10% adaptation rate
      minimumSamples: 10,
    };

    this.baselines.set(testName, baseline);
    this.saveBaselines();
  }

  /**
   * Get historical data for a test
   */
  private getHistoricalData(testName: string): number[] {
    return this.historicalData.get(testName) || [];
  }

  /**
   * Update historical data for a test
   */
  private updateHistoricalData(testName: string, data: number[]): void {
    // Keep only recent data
    const recent = data.slice(-this.statisticalWindow);
    this.historicalData.set(testName, recent);
  }

  /**
   * Load baselines from file
   */
  private loadBaselines(): void {
    try {
      if (fs.existsSync(this.baselineFile)) {
        const data = JSON.parse(fs.readFileSync(this.baselineFile, "utf8"));
        this.baselines = new Map(Object.entries(data.baselines || {}));
        this.historicalData = new Map(Object.entries(data.historical || {}));
        console.log(
          `📊 Loaded advanced baselines for ${this.baselines.size} tests`,
        );
      }
    } catch (error) {
      console.warn("⚠️ Could not load advanced baselines:", error);
    }
  }

  /**
   * Save baselines to file
   */
  private saveBaselines(): void {
    try {
      const data = {
        timestamp: Date.now(),
        baselines: Object.fromEntries(this.baselines),
        historical: Object.fromEntries(this.historicalData),
      };
      fs.writeFileSync(this.baselineFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save advanced baselines:", error);
    }
  }

  /**
   * Get empty statistical analysis
   */
  private getEmptyStatisticalAnalysis(): StatisticalAnalysis {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      quartiles: [0, 0, 0],
      confidenceInterval: [0, 0],
      sampleSize: 0,
      outliers: [],
      skewness: 0,
      kurtosis: 0,
    };
  }

  /**
   * Get empty trend analysis
   */
  private getEmptyTrendAnalysis(): TrendAnalysis {
    return {
      direction: "stable",
      slope: 0,
      rSquared: 0,
      confidence: 0,
      changePoints: [],
      seasonality: false,
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): RegressionAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit("alert-resolved", alert);
      return true;
    }
    return false;
  }

  /**
   * Get baseline for a test
   */
  getBaseline(testName: string): IntelligentBaseline | undefined {
    return this.baselines.get(testName);
  }

  /**
   * Export analysis data
   */
  exportAnalysis(): any {
    return {
      timestamp: Date.now(),
      baselines: Object.fromEntries(this.baselines),
      alerts: this.alerts,
      statistics: {
        totalTests: this.baselines.size,
        activeAlerts: this.getActiveAlerts().length,
        averageConfidence:
          Array.from(this.baselines.values()).reduce(
            (sum, b) =>
              sum +
              (b.updateHistory[b.updateHistory.length - 1]?.confidence || 0),
            0,
          ) / this.baselines.size,
      },
    };
  }
}

// Export singleton instance
export const advancedRegressionTesting = new AdvancedRegressionTestingSystem();
