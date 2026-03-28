/**
 * Pattern Performance Tracker for P9 - ADAPTIVE_PATTERN_LEARNING
 *
 * Monitors pattern effectiveness over time, detects pattern drift,
 * and provides metrics for adaptive kernel modifications.
 *
 * @version 1.0.0
 * @since 2026-03-05
 */

import { frameworkLogger } from "../core/framework-logger.js";
import type { PatternDriftInfo, AdaptiveThresholds } from "../core/kernel-patterns.js";
import * as fs from "fs";
import * as path from "path";

export interface PatternMetrics {
  patternId: string;
  totalUsages: number;
  successfulUsages: number;
  failedUsages: number;
  successRate: number;
  avgConfidence: number;
  avgResponseTime: number;
  lastUpdated: Date;
  timeSeries: Array<{
    timestamp: Date;
    successRate: number;
    avgConfidence: number;
    usageCount: number;
  }>;
}

export interface PatternDriftAnalysis {
  drifted: boolean;
  patternId: string;
  currentMetrics: PatternMetrics;
  historicalBaseline: PatternMetrics;
  driftMagnitude: number;
  driftDirection: 'increasing' | 'decreasing' | 'unstable';
  confidence: number;
  recommendedAction: string;
}

export interface SystemPerformanceSummary {
  overallSuccessRate: number;
  overallAvgConfidence: number;
  totalPatternsTracked: number;
  patternsWithDrift: string[];
  patternsNeedingAttention: string[];
  recommendations: string[];
}

export class PatternPerformanceTracker {
  private patternMetrics: Map<string, PatternMetrics> = new Map();
  private readonly maxTimeSeriesPoints = 1000;
  private readonly driftThreshold = 0.15; // 15% change triggers drift detection
  private readonly minSamplesForDrift = 10;
  private readonly baselineWindowSize = 100;

  /**
   * Track performance metrics for a pattern
   */
  trackPatternPerformance(
    patternId: string,
    outcome: {
      success: boolean;
      confidence: number;
      responseTime?: number;
      complexity?: number;
    }
  ): void {
    const existing = this.patternMetrics.get(patternId);

    if (!existing) {
      // Initialize new pattern metrics
      this.patternMetrics.set(patternId, {
        patternId,
        totalUsages: 1,
        successfulUsages: outcome.success ? 1 : 0,
        failedUsages: outcome.success ? 0 : 1,
        successRate: outcome.success ? 1 : 0,
        avgConfidence: outcome.confidence,
        avgResponseTime: outcome.responseTime || 0,
        lastUpdated: new Date(),
        timeSeries: [{
          timestamp: new Date(),
          successRate: outcome.success ? 1 : 0,
          avgConfidence: outcome.confidence,
          usageCount: 1
        }]
      });
    } else {
      // Update existing metrics
      existing.totalUsages++;
      if (outcome.success) {
        existing.successfulUsages++;
      } else {
        existing.failedUsages++;
      }

      // Update success rate
      existing.successRate = existing.successfulUsages / existing.totalUsages;

      // Update average confidence (exponential moving average)
      existing.avgConfidence = (existing.avgConfidence * 0.7) + (outcome.confidence * 0.3);

      // Update average response time
      if (outcome.responseTime !== undefined) {
        existing.avgResponseTime = (existing.avgResponseTime * 0.8) + (outcome.responseTime * 0.2);
      }

      existing.lastUpdated = new Date();

      // Add to time series
      existing.timeSeries.push({
        timestamp: new Date(),
        successRate: existing.successRate,
        avgConfidence: existing.avgConfidence,
        usageCount: existing.totalUsages
      });

      // Trim time series if too large
      if (existing.timeSeries.length > this.maxTimeSeriesPoints) {
        existing.timeSeries = existing.timeSeries.slice(-this.maxTimeSeriesPoints);
      }
    }

    frameworkLogger.log(
      "pattern-performance-tracker",
      "metrics-updated",
      "debug",
      {
        patternId,
        successRate: this.patternMetrics.get(patternId)?.successRate,
        avgConfidence: this.patternMetrics.get(patternId)?.avgConfidence
      },
      undefined
    );

    // Persist to disk
    this.saveToDisk();
  }

  /**
   * Detect if a pattern has drifted from its historical baseline
   */
  detectPatternDrift(patternId: string): PatternDriftAnalysis | null {
    const metrics = this.patternMetrics.get(patternId);
    if (!metrics || metrics.totalUsages < this.minSamplesForDrift) {
      return null;
    }

    // Calculate historical baseline (first half of time series)
    const timeSeries = metrics.timeSeries;
    const midpoint = Math.floor(timeSeries.length / 2);
    const historicalData = timeSeries.slice(0, midpoint);
    const recentData = timeSeries.slice(midpoint);

    if (historicalData.length < 5 || recentData.length < 5) {
      return null;
    }

    // Calculate historical baseline
    const historicalSuccessRate = historicalData.reduce((sum, d) => sum + d.successRate, 0) / historicalData.length;
    const historicalAvgConfidence = historicalData.reduce((sum, d) => sum + d.avgConfidence, 0) / historicalData.length;

    // Calculate recent performance
    const recentSuccessRate = recentData.reduce((sum, d) => sum + d.successRate, 0) / recentData.length;
    const recentAvgConfidence = recentData.reduce((sum, d) => sum + d.avgConfidence, 0) / recentData.length;

    // Calculate drift magnitude
    const successRateDrift = Math.abs(recentSuccessRate - historicalSuccessRate);
    const confidenceDrift = Math.abs(recentAvgConfidence - historicalAvgConfidence);
    const driftMagnitude = Math.max(successRateDrift, confidenceDrift);

    // Determine drift direction
    let driftDirection: 'increasing' | 'decreasing' | 'unstable';
    if (recentSuccessRate > historicalSuccessRate + 0.05) {
      driftDirection = 'increasing';
    } else if (recentSuccessRate < historicalSuccessRate - 0.05) {
      driftDirection = 'decreasing';
    } else {
      driftDirection = 'unstable';
    }

    const drifted = driftMagnitude > this.driftThreshold;

    // Determine recommended action
    let recommendedAction = 'continue';
    if (drifted && driftDirection === 'decreasing') {
      recommendedAction = 'recalibrate';
    } else if (drifted && driftMagnitude > 0.25) {
      recommendedAction = 'investigate';
    } else if (driftDirection === 'unstable' && driftMagnitude > 0.1) {
      recommendedAction = 'monitor';
    }

    return {
      drifted,
      patternId,
      currentMetrics: metrics,
      historicalBaseline: {
        patternId,
        totalUsages: historicalData.length,
        successfulUsages: Math.round(historicalData.length * historicalSuccessRate),
        failedUsages: Math.round(historicalData.length * (1 - historicalSuccessRate)),
        successRate: historicalSuccessRate,
        avgConfidence: historicalAvgConfidence,
        avgResponseTime: 0,
        lastUpdated: historicalData[0]?.timestamp || new Date(),
        timeSeries: historicalData
      },
      driftMagnitude,
      driftDirection,
      confidence: Math.min(1, driftMagnitude * 2),
      recommendedAction
    };
  }

  /**
   * Get all pattern drift analyses
   */
  getAllDriftAnalyses(): PatternDriftAnalysis[] {
    const analyses: PatternDriftAnalysis[] = [];

    for (const patternId of this.patternMetrics.keys()) {
      const analysis = this.detectPatternDrift(patternId);
      if (analysis) {
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  /**
   * Calculate adaptive confidence thresholds based on performance
   */
   calculateAdaptiveThresholds(): AdaptiveThresholds {
    // Group metrics by agent/skill and calculate thresholds
    const agentMetrics = new Map<string, { successRates: number[]; confidences: number[] }>();
    const skillMetrics = new Map<string, { successRates: number[]; confidences: number[] }>();

    for (const [patternId, metrics] of this.patternMetrics.entries()) {
      // Extract agent/skill from patternId (format: "agent:skill")
      const parts = patternId.includes(':') ? patternId.split(':') : [patternId, 'default'];
      const agent = parts[0] || patternId;
      const skill = parts[1] || 'default';

      if (!agentMetrics.has(agent)) {
        agentMetrics.set(agent, { successRates: [], confidences: [] });
      }
      agentMetrics.get(agent)!.successRates.push(metrics.successRate);
      agentMetrics.get(agent)!.confidences.push(metrics.avgConfidence);

      if (!skillMetrics.has(skill)) {
        skillMetrics.set(skill, { successRates: [], confidences: [] });
      }
      skillMetrics.get(skill)!.successRates.push(metrics.successRate);
      skillMetrics.get(skill)!.confidences.push(metrics.avgConfidence);
    }

    const perAgent: Record<string, { confidenceMin: number; confidenceMax: number; frequencyMin: number; frequencyMax: number; effectivenessMin: number; effectivenessMax: number }> = {};

    // Calculate thresholds for each agent
    for (const [agent, data] of agentMetrics.entries()) {
      if (data.successRates.length > 0) {
        const avgSuccessRate = data.successRates.reduce((a, b) => a + b, 0) / data.successRates.length;
        const avgConfidence = data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length;

        // Threshold is based on performance: higher performance = lower threshold needed
        const threshold = Math.max(0.5, Math.min(0.9, avgSuccessRate * 0.8 + avgConfidence * 0.2));
        perAgent[agent] = {
          confidenceMin: threshold * 0.8,
          confidenceMax: Math.min(0.99, threshold * 1.2),
          frequencyMin: 5,
          frequencyMax: 100,
          effectivenessMin: 0.5,
          effectivenessMax: 1.0
        };
      }
    }

    // Calculate overall threshold
    const allSuccessRates = Array.from(this.patternMetrics.values()).map(m => m.successRate);
    const overallSuccessRate = allSuccessRates.length > 0
      ? allSuccessRates.reduce((a, b) => a + b, 0) / allSuccessRates.length
      : 0.75;

    const overall = Math.max(0.5, Math.min(0.9, overallSuccessRate));

    return {
      perAgent,
      confidenceMin: overall * 0.8,
      confidenceMax: Math.min(0.99, overall * 1.2),
      frequencyMin: 5,
      frequencyMax: 100,
      effectivenessMin: 0.5,
      effectivenessMax: 1.0,
      learningRate: 0.1,
      adaptationWindow: 60
    };
  }

  /**
   * Get system performance summary
   */
  getSystemPerformanceSummary(): SystemPerformanceSummary {
    const allMetrics = Array.from(this.patternMetrics.values());

    if (allMetrics.length === 0) {
      return {
        overallSuccessRate: 0,
        overallAvgConfidence: 0,
        totalPatternsTracked: 0,
        patternsWithDrift: [],
        patternsNeedingAttention: [],
        recommendations: ['No patterns tracked yet']
      };
    }

    // Calculate overall metrics
    const overallSuccessRate = allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length;
    const overallAvgConfidence = allMetrics.reduce((sum, m) => sum + m.avgConfidence, 0) / allMetrics.length;

    // Get patterns with drift
    const driftAnalyses = this.getAllDriftAnalyses();
    const patternsWithDrift = driftAnalyses
      .filter(a => a.drifted)
      .map(a => a.patternId);

    // Get patterns needing attention (low success rate or high drift)
    const patternsNeedingAttention = allMetrics
      .filter(m => m.successRate < 0.6 || m.totalUsages < 5)
      .map(m => m.patternId);

    // Generate recommendations
    const recommendations: string[] = [];
    if (patternsWithDrift.length > 0) {
      recommendations.push(`${patternsWithDrift.length} patterns showing drift - consider recalibration`);
    }
    if (patternsNeedingAttention.length > 0) {
      recommendations.push(`${patternsNeedingAttention.length} patterns need attention due to low performance`);
    }
    if (overallSuccessRate < 0.7) {
      recommendations.push('Overall system performance below target - review routing logic');
    }
    if (recommendations.length === 0) {
      recommendations.push('All patterns performing within normal parameters');
    }

    return {
      overallSuccessRate,
      overallAvgConfidence,
      totalPatternsTracked: allMetrics.length,
      patternsWithDrift,
      patternsNeedingAttention,
      recommendations
    };
  }

  /**
   * Get metrics for a specific pattern
   */
  getPatternMetrics(patternId: string): PatternMetrics | null {
    return this.patternMetrics.get(patternId) || null;
  }

  /**
   * Get all tracked patterns
   */
  getAllPatternMetrics(): PatternMetrics[] {
    return Array.from(this.patternMetrics.values());
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  clear(): void {
    this.patternMetrics.clear();
    frameworkLogger.log(
      "pattern-performance-tracker",
      "cleared",
      "info",
      {},
      undefined
    );
  }

  /**
   * Save metrics to disk for persistence
   */
  saveToDisk(): void {
    try {
      const cwd = process.cwd() || '.';
      const filePath = path.join(cwd, 'logs', 'framework', 'pattern-metrics.json');
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Convert Map to object for JSON serialization
      const metricsObj: Record<string, PatternMetrics> = {};
      for (const [key, value] of this.patternMetrics.entries()) {
        metricsObj[key] = value;
      }
      
      fs.writeFileSync(filePath, JSON.stringify(metricsObj, null, 2));
    } catch (error) {
      // Silent fail - don't break tracking
    }
  }

  /**
   * Load metrics from disk
   */
  loadFromDisk(): void {
    try {
      const cwd = process.cwd() || '.';
      const filePath = path.join(cwd, 'logs', 'framework', 'pattern-metrics.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Convert object back to Map
        for (const [key, value] of Object.entries(data)) {
          this.patternMetrics.set(key, value as PatternMetrics);
        }
      }
    } catch (error) {
      // Silent fail - start fresh
    }
  }
}

// Singleton instance
export const patternPerformanceTracker = new PatternPerformanceTracker();