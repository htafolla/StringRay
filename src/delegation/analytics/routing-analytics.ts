/**
 * Routing Analytics
 *
 * Provides analytics aggregation and insights generation for routing data.
 * Extracted from task-skill-router.ts as part of Phase 2 refactoring.
 *
 * @version 1.0.0
 * @since 2026-03-12
 */

import {
  DailyAnalyticsSummary,
  RoutingAnalyticsData,
  RoutingRefinementChange,
  RoutingRefinementResult,
  AgentStats,
} from '../config/types.js';
import { RoutingOutcomeTracker } from './outcome-tracker.js';

/**
 * RoutingAnalytics class
 *
 * Aggregates routing data and provides analytics insights.
 * Works with RoutingOutcomeTracker to generate reports and recommendations.
 */
export class RoutingAnalytics {
  constructor(private tracker: RoutingOutcomeTracker) {}

  /**
   * Get daily analytics summary for reporting
   * @returns Daily summary with metrics and insights
   */
  getDailySummary(): DailyAnalyticsSummary {
    const stats = this.tracker.getStats();
    const agentStats = stats.map((data) => ({
      agent: data.agent,
      count: data.total,
      successRate: data.successRate,
    }));

    const topAgents = agentStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalRoutings = agentStats.reduce((sum, a) => sum + a.count, 0);
    const totalSuccesses = stats.reduce((sum, s) => sum + s.successes, 0);
    const averageSuccessRate =
      totalRoutings > 0 ? totalSuccesses / totalRoutings : 0;

    const insights: string[] = [];
    if (totalRoutings > 0 && averageSuccessRate < 0.5) {
      insights.push(
        `Low overall success rate: ${(averageSuccessRate * 100).toFixed(1)}%`
      );
    }

    return {
      totalRoutings,
      averageConfidence: 0.85, // Placeholder for actual confidence calculation
      templateMatchRate: 0.9, // Placeholder for template matching
      successRate: averageSuccessRate,
      topAgents,
      topKeywords: [], // Placeholder for keyword analytics
      insights,
    };
  }

  /**
   * Get full routing analytics data
   * @returns Comprehensive analytics data
   */
  getFullAnalytics(): RoutingAnalyticsData {
    const stats = this.tracker.getStats();
    const totalRoutings = stats.reduce((sum, s) => sum + s.total, 0);
    const overallSuccessRate =
      stats.length > 0
        ? stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length
        : 0;

    return {
      promptPatterns: {
        totalPrompts: totalRoutings,
        templateMatches: Math.floor(totalRoutings * 0.9),
        templateMatchRate: 0.9,
        gaps: [],
        emergingPatterns: [],
      },
      routingPerformance: {
        totalRoutings,
        overallSuccessRate,
        avgConfidence: 0.85,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        recommendations: [],
        agentMetrics: stats.map((data) => ({
          agent: data.agent,
          successRate: data.successRate,
          count: data.total,
        })),
        keywordEffectiveness: [],
        confidenceMetrics: [],
      },
    };
  }

  /**
   * Apply routing refinements based on analytics
   * @param apply Whether to actually apply the changes
   * @returns Refinement result with changes list
   */
  applyRoutingRefinements(apply: boolean): RoutingRefinementResult {
    const changes: RoutingRefinementChange[] = [];

    // Analyze low-performing agents
    const stats = this.tracker.getStats();
    for (const data of stats) {
      if (data.successRate < 0.5 && data.total > 10) {
        changes.push({
          type: 'removed',
          reason: `Low success rate (${(data.successRate * 100).toFixed(
            1
          )}%) with ${data.total} attempts`,
          data: { agent: data.agent },
        });
      }
    }

    if (apply) {
      // Apply the changes here
      // This would modify the mappings in production
      console.log(`Applied ${changes.length} routing refinements`);
    }

    return {
      appliedMappings: apply
        ? changes.filter((c) => c.type === 'added').length
        : 0,
      optimizedMappings: apply
        ? changes.filter((c) => c.type === 'optimized').length
        : 0,
      removedMappings: apply
        ? changes.filter((c) => c.type === 'removed').length
        : 0,
      changes,
    };
  }

  /**
   * Generate insights from routing data
   * @returns Array of insight strings
   */
  generateInsights(): string[] {
    const insights: string[] = [];
    const stats = this.tracker.getStats();

    if (stats.length === 0) {
      insights.push('No routing data available yet');
      return insights;
    }

    // Find most used agent
    const topAgent = stats.reduce((prev, current) =>
      prev.total > current.total ? prev : current
    );
    insights.push(
      `Most used agent: ${topAgent.agent} (${topAgent.total} routes)`
    );

    // Find most successful agent
    const bestAgent = stats.reduce((prev, current) =>
      prev.successRate > current.successRate ? prev : current
    );
    insights.push(
      `Best performing agent: ${bestAgent.agent} (${(
        bestAgent.successRate * 100
      ).toFixed(1)}% success rate)`
    );

    // Find worst performing agent (with at least 5 attempts)
    const agentsWithData = stats.filter((s) => s.total >= 5);
    if (agentsWithData.length > 0) {
      const worstAgent = agentsWithData.reduce((prev, current) =>
        prev.successRate < current.successRate ? prev : current
      );
      if (worstAgent.successRate < 0.7) {
        insights.push(
          `Agent needing attention: ${worstAgent.agent} (${(
            worstAgent.successRate * 100
          ).toFixed(1)}% success rate)`
        );
      }
    }

    // Overall statistics
    const totalRoutes = stats.reduce((sum, s) => sum + s.total, 0);
    const avgSuccess =
      stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length;
    insights.push(`Total routes: ${totalRoutes}`);
    insights.push(`Average success rate: ${(avgSuccess * 100).toFixed(1)}%`);

    return insights;
  }

  /**
   * Get raw statistics from the tracker
   * @returns Record of agent statistics
   */
  getRawStats(): Record<string, { attempts: number; successes: number; successRate: number }> {
    const stats = this.tracker.getStats();
    const result: Record<string, { attempts: number; successes: number; successRate: number }> = {};
    
    for (const stat of stats) {
      result[stat.agent] = {
        attempts: stat.total,
        successes: stat.successes,
        successRate: stat.successRate,
      };
    }
    
    return result;
  }

  /**
   * Compare current performance to historical baseline
   * @returns Comparison metrics
   */
  compareToBaseline(): {
    improved: boolean;
    changePercent: number;
    currentRate: number;
    baselineRate: number;
  } {
    const stats = this.tracker.getStats();
    const currentRate =
      stats.length > 0
        ? stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length
        : 0;

    // Baseline is hardcoded at 70% for now (could be configurable)
    const baselineRate = 0.7;
    const changePercent = ((currentRate - baselineRate) / baselineRate) * 100;

    return {
      improved: currentRate > baselineRate,
      changePercent: Math.abs(changePercent),
      currentRate,
      baselineRate,
    };
  }
}
