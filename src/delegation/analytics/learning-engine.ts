/**
 * Learning Engine
 *
 * P9 learning system - analyzes patterns, detects drift, and improves routing.
 * Extracted from task-skill-router.ts as part of Phase 2 refactoring.
 *
 * @version 1.0.0
 * @since 2026-03-12
 */

import {
  P9LearningStats,
  PatternDriftAnalysis,
  LearningResult,
  AdaptiveThresholds,
} from '../config/types.js';

/**
 * LearningEngine class
 *
 * Active implementation for P9 learning capabilities:
 * - Pattern drift detection
 * - Automatic routing refinement
 * - Success rate learning
 * - Adaptive confidence thresholds
 */
export class LearningEngine {
  private enabled: boolean;
  private learningHistory: Array<{
    timestamp: Date;
    patternsAnalyzed: number;
    adaptations: number;
    successRate: number;
  }> = [];

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * Get P9 learning statistics
   */
  getP9LearningStats(): P9LearningStats {
    const totalLearnings = this.learningHistory.length;
    const avgLearningTime =
      totalLearnings > 0
        ? this.learningHistory.reduce((sum, h) => sum + (h.patternsAnalyzed || 0), 0) /
          totalLearnings
        : 0;

    const lastHistory = this.learningHistory[totalLearnings - 1];

    return {
      totalLearnings,
      successRate: this.calculateOverallSuccessRate(),
      lastLearning: lastHistory?.timestamp ?? null,
      averageLearningTime: avgLearningTime,
      enabled: this.enabled,
    };
  }

  /**
   * Calculate overall success rate from outcome tracker
   */
  private calculateOverallSuccessRate(): number {
    try {
      const { routingOutcomeTracker } = require('./outcome-tracker.js');
      const outcomes = routingOutcomeTracker.getOutcomes();
      if (outcomes.length === 0) return 1.0;
      
      const successes = outcomes.filter((o: any) => o.success).length;
      return successes / outcomes.length;
    } catch {
      return 1.0;
    }
  }

  /**
   * Get pattern drift analysis from performance tracker
   */
  getPatternDriftAnalysis(): PatternDriftAnalysis {
    if (!this.enabled) {
      return {
        driftDetected: false,
        affectedPatterns: [],
        severity: 'low',
      };
    }

    try {
      const { patternPerformanceTracker } = require('../../analytics/pattern-performance-tracker.js');
      const driftAnalyses = patternPerformanceTracker.getAllDriftAnalyses();
      const significantDrift = driftAnalyses.filter((a: any) => a.drifted);

      return {
        driftDetected: significantDrift.length > 0,
        affectedPatterns: significantDrift.map((a: any) => a.patternId),
        severity: significantDrift.length > 5 ? 'high' : significantDrift.length > 0 ? 'medium' : 'low',
      };
    } catch {
      return {
        driftDetected: false,
        affectedPatterns: [],
        severity: 'low',
      };
    }
  }

  /**
   * Get adaptive thresholds based on learned data
   */
  getAdaptiveThresholds(): AdaptiveThresholds {
    if (!this.enabled) {
      return {
        overall: {
          confidenceMin: 0.7,
          confidenceMax: 0.95,
          frequencyMin: 5,
          frequencyMax: 100,
        },
      };
    }

    try {
      const { patternPerformanceTracker } = require('../../analytics/pattern-performance-tracker.js');
      return patternPerformanceTracker.calculateAdaptiveThresholds();
    } catch {
      return {
        overall: {
          confidenceMin: 0.7,
          confidenceMax: 0.95,
          frequencyMin: 5,
          frequencyMax: 100,
        },
      };
    }
  }

  /**
   * Trigger P9 learning process
   */
  async triggerLearning(): Promise<LearningResult> {
    if (!this.enabled) {
      return {
        learningStarted: false,
        patternsAnalyzed: 0,
        adaptations: 0,
      };
    }

    try {
      // Import dependencies
      const { routingOutcomeTracker } = await import('./outcome-tracker.js');
      const { patternPerformanceTracker } = await import('../../analytics/pattern-performance-tracker.js');
      const { emergingPatternDetector } = await import('../../analytics/emerging-pattern-detector.js');
      const { patternLearningEngine } = await import('../../analytics/pattern-learning-engine.js');

      // Reload fresh data from disk
      routingOutcomeTracker.reloadFromDisk();
      
      const outcomes = routingOutcomeTracker.getOutcomes();
      const patternMetrics = patternPerformanceTracker.getAllPatternMetrics();
      
      // Detect emerging patterns
      const emergentResult = emergingPatternDetector.detectEmergingPatterns(
        outcomes.map((o: any) => ({
          taskId: o.taskId,
          taskDescription: o.taskDescription || o.taskId,
          routedAgent: o.routedAgent,
          routedSkill: o.routedSkill,
          confidence: o.confidence,
          timestamp: new Date(o.timestamp),
          success: o.success ?? false
        }))
      );
      
      // Learn from data - filter outcomes with success defined and cast type
      const existingMappings: any[] = [];
      const validOutcomes = outcomes
        .filter((o) => o.success !== undefined)
        .map((o) => ({
          taskId: o.taskId,
          taskDescription: o.taskDescription || o.taskId,
          routedAgent: o.routedAgent,
          routedSkill: o.routedSkill,
          confidence: o.confidence,
          success: o.success as boolean
        }));
      const learningResult = patternLearningEngine.learnFromData(validOutcomes, existingMappings);
      
      const patternsAnalyzed = patternMetrics.length + emergentResult.emergentPatterns.length;
      const adaptations = learningResult.newPatterns.length + 
                           learningResult.modifiedPatterns.length + 
                           learningResult.removedPatterns.length;

      // Record in history
      this.learningHistory.push({
        timestamp: new Date(),
        patternsAnalyzed,
        adaptations,
        successRate: this.calculateOverallSuccessRate(),
      });

      return {
        learningStarted: true,
        patternsAnalyzed,
        adaptations,
      };
    } catch (error) {
      console.error('Learning engine error:', error);
      return {
        learningStarted: false,
        patternsAnalyzed: 0,
        adaptations: 0,
      };
    }
  }

  /**
   * Enable or disable learning
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if learning is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get learning history
   */
  getLearningHistory(): Array<{
    timestamp: Date;
    patternsAnalyzed: number;
    adaptations: number;
    successRate: number;
  }> {
    return [...this.learningHistory];
  }

  /**
   * Clear learning history
   */
  clearHistory(): void {
    this.learningHistory = [];
  }

  /**
   * Analyze a specific pattern for optimization opportunities
   */
  analyzePattern(patternId: string): {
    optimized: boolean;
    recommendations: string[];
    confidence: number;
  } {
    try {
      const { patternPerformanceTracker } = require('../../analytics/pattern-performance-tracker.js');
      const metrics = patternPerformanceTracker.getPatternMetrics(patternId);
      
      if (!metrics) {
        return { optimized: false, recommendations: ['Pattern not found'], confidence: 0 };
      }

      const recommendations: string[] = [];
      
      if (metrics.successRate < 0.7) {
        recommendations.push('Low success rate - consider adjusting confidence threshold');
      }
      if (metrics.totalUsages > 20 && metrics.successRate < 0.5) {
        recommendations.push('Pattern consistently underperforming - consider removal');
      }
      if (metrics.avgConfidence < 0.6) {
        recommendations.push('Low average confidence - verify keyword mapping');
      }

      return {
        optimized: recommendations.length === 0,
        recommendations,
        confidence: Math.min(1, metrics.totalUsages / 30),
      };
    } catch {
      return { optimized: false, recommendations: [], confidence: 0.5 };
    }
  }

  /**
   * Suggest routing improvements based on learning
   */
  suggestImprovements(): Array<{
    type: 'mapping' | 'threshold' | 'confidence';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    const suggestions: Array<{
      type: 'mapping' | 'threshold' | 'confidence';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    try {
      const { patternPerformanceTracker } = require('../../analytics/pattern-performance-tracker.js');
      const metrics = patternPerformanceTracker.getAllPatternMetrics();

      for (const metric of metrics) {
        if (metric.totalUsages < 5) continue;

        if (metric.successRate < 0.6 && metric.totalUsages >= 10) {
          suggestions.push({
            type: 'mapping',
            description: `Pattern ${metric.patternId} has low success rate (${(metric.successRate * 100).toFixed(0)}%)`,
            impact: metric.totalUsages > 20 ? 'high' : 'medium',
          });
        }

        if (metric.avgConfidence < 0.5) {
          suggestions.push({
            type: 'confidence',
            description: `Pattern ${metric.patternId} has low confidence (${(metric.avgConfidence * 100).toFixed(0)}%)`,
            impact: 'medium',
          });
        }
      }
    } catch {
      // Silent fail
    }

    return suggestions;
  }
}

/**
 * Global learning engine instance (enabled by default)
 */
export const learningEngine = new LearningEngine(true);
