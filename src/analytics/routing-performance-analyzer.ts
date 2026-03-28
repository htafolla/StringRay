/**
 * Routing Performance Analyzer for StringRay
 *
 * Analyzes routing success rates, keyword effectiveness, and confidence thresholds.
 * Integrates with RoutingOutcomeTracker to provide comprehensive routing metrics.
 *
 * @version 1.0.0
 * @since 2026-03-05
 */

import type {
  RoutingOutcome,
  RoutingDecision,
  PromptDataPoint,
} from "../delegation/config/types.js";
import { routingOutcomeTracker } from "../delegation/analytics/outcome-tracker.js";

export interface AgentPerformanceMetrics {
  agent: string;
  skill: string;
  totalRoutings: number;
  successfulRoutings: number;
  failedRoutings: number;
  escalatedRoutings: number;
  successRate: number;
  avgConfidence: number;
  avgExecutionTime: number;
  confidenceDistribution: { high: number; medium: number; low: number };
  timeRange: { earliest: Date; latest: Date };
}

export interface KeywordEffectiveness {
  keyword: string;
  totalMatches: number;
  successfulMatches: number;
  failedMatches: number;
  successRate: number;
  avgConfidence: number;
  routedAgent: string;
  routedSkill: string;
  lastUsed: Date;
}

export interface ConfidenceThresholdMetrics {
  threshold: number;
  totalRoutings: number;
  successfulRoutings: number;
  successRate: number;
  escalatedCount: number;
  recommendation: string;
}

export interface RoutingPerformanceReport {
  totalRoutings: number;
  overallSuccessRate: number;
  avgConfidence: number;
  agentMetrics: AgentPerformanceMetrics[];
  keywordEffectiveness: KeywordEffectiveness[];
  confidenceMetrics: ConfidenceThresholdMetrics[];
  timeRange: { start: Date; end: Date };
  recommendations: string[];
}

class RoutingPerformanceAnalyzer {
  private readonly lowConfidenceThreshold = 0.6;
  private readonly mediumConfidenceThreshold = 0.8;
  private readonly minSamplesForMetrics = 5;

  /**
   * Generate comprehensive routing performance report
   */
  generatePerformanceReport(): RoutingPerformanceReport {
    // Reload from disk to get latest outcomes from other processes
    routingOutcomeTracker.reloadFromDisk();
    
    const outcomes = routingOutcomeTracker.getOutcomes();
    const decisions = routingOutcomeTracker.getRoutingDecisions();
    const promptData = routingOutcomeTracker.getPromptData();

    if (outcomes.length === 0) {
      return this.emptyPerformanceReport();
    }

    const agentMetrics = this.calculateAgentMetrics(outcomes, promptData);
    const keywordEffectiveness = this.analyzeKeywordEffectiveness(decisions, outcomes);
    const confidenceMetrics = this.analyzeConfidenceThresholds(outcomes);
    const timeRange = this.calculateTimeRange(outcomes);

    const overallStats = this.calculateOverallStats(outcomes);
    const recommendations = this.generateRecommendations(
      agentMetrics,
      keywordEffectiveness,
      confidenceMetrics,
    );

    return {
      totalRoutings: outcomes.length,
      overallSuccessRate: overallStats.successRate,
      avgConfidence: overallStats.avgConfidence,
      agentMetrics,
      keywordEffectiveness,
      confidenceMetrics,
      timeRange,
      recommendations,
    };
  }

  /**
   * Calculate performance metrics for each agent
   */
  private calculateAgentMetrics(
    outcomes: RoutingOutcome[],
    promptData: PromptDataPoint[],
  ): AgentPerformanceMetrics[] {
    const agentMap = new Map<
      string,
      {
        skill: string;
        total: number;
        successes: number;
        failures: number;
        escalated: number;
        confidenceSum: number;
        executionTimes: number[];
        highConfidence: number;
        mediumConfidence: number;
        lowConfidence: number;
        timestamps: Date[];
      }
    >();

    for (const outcome of outcomes) {
      const agent = outcome.routedAgent;
      const prompt = promptData.find((p) => p.taskId === outcome.taskId);
      const confidence = prompt?.confidence ?? 0;
      const executionTime = prompt?.usageMetadata?.retryCount ?? 0;

      if (!agentMap.has(agent)) {
        agentMap.set(agent, {
          skill: outcome.routedSkill,
          total: 0,
          successes: 0,
          failures: 0,
          escalated: 0,
          confidenceSum: 0,
          executionTimes: [],
          highConfidence: 0,
          mediumConfidence: 0,
          lowConfidence: 0,
          timestamps: [],
        });
      }

      const metrics = agentMap.get(agent)!;
      metrics.total++;
      metrics.confidenceSum += confidence;
      // Ensure timestamp is a Date object
      const ts = outcome.timestamp instanceof Date 
        ? outcome.timestamp 
        : new Date(outcome.timestamp);
      metrics.timestamps.push(ts);

      if (confidence >= this.mediumConfidenceThreshold) {
        metrics.highConfidence++;
      } else if (confidence >= this.lowConfidenceThreshold) {
        metrics.mediumConfidence++;
      } else {
        metrics.lowConfidence++;
      }

      if (outcome.success === true) {
        metrics.successes++;
      } else if (outcome.success === false) {
        metrics.failures++;
      }

      if (confidence < 0.75) {
        metrics.escalated++;
      }

      metrics.executionTimes.push(executionTime);
    }

    return Array.from(agentMap.entries())
      .filter(([, metrics]) => metrics.total >= this.minSamplesForMetrics)
      .map(([agent, metrics]) => {
        const avgExecutionTime =
          metrics.executionTimes.length > 0
            ? metrics.executionTimes.reduce((sum, time) => sum + time, 0) /
              metrics.executionTimes.length
            : 0;

        const timestamps = metrics.timestamps.sort(
          (a, b) => a.getTime() - b.getTime(),
        );

        return {
          agent,
          skill: metrics.skill,
          totalRoutings: metrics.total,
          successfulRoutings: metrics.successes,
          failedRoutings: metrics.failures,
          escalatedRoutings: metrics.escalated,
          successRate: metrics.total > 0 ? metrics.successes / metrics.total : 0,
          avgConfidence: metrics.total > 0 ? metrics.confidenceSum / metrics.total : 0,
          avgExecutionTime,
          confidenceDistribution: {
            high: metrics.highConfidence,
            medium: metrics.mediumConfidence,
            low: metrics.lowConfidence,
          },
          timeRange: {
            earliest: timestamps[0] ?? new Date(),
            latest: timestamps[timestamps.length - 1] ?? new Date(),
          },
        };
      })
      .sort((a, b) => b.totalRoutings - a.totalRoutings);
  }

  /**
   * Analyze effectiveness of keywords
   */
  private analyzeKeywordEffectiveness(
    decisions: RoutingDecision[],
    outcomes: RoutingOutcome[],
  ): KeywordEffectiveness[] {
    const keywordMap = new Map<
      string,
      {
        total: number;
        successes: number;
        failures: number;
        confidenceSum: number;
        agent: string;
        skill: string;
        lastUsed: Date;
      }
    >();

    for (const decision of decisions) {
      const keyword = decision.keywordMatched;
      if (!keyword) continue;

      const outcome = outcomes.find((o) => o.taskId === decision.taskId);
      if (!outcome) continue;

      if (!keywordMap.has(keyword)) {
        keywordMap.set(keyword, {
          total: 0,
          successes: 0,
          failures: 0,
          confidenceSum: 0,
          agent: decision.selectedAgent || 'enforcer',
          skill: decision.selectedSkill || 'code-review',
          lastUsed: decision.executionTime ? new Date() : new Date(),
        });
      }

      const metrics = keywordMap.get(keyword)!;
      metrics.total++;
      metrics.confidenceSum += decision.confidence;

      if (outcome.success === true) {
        metrics.successes++;
      } else if (outcome.success === false) {
        metrics.failures++;
      }
    }

    return Array.from(keywordMap.entries())
      .filter(([, metrics]) => metrics.total >= this.minSamplesForMetrics)
      .map(([keyword, metrics]) => ({
        keyword,
        totalMatches: metrics.total,
        successfulMatches: metrics.successes,
        failedMatches: metrics.failures,
        successRate: metrics.total > 0 ? metrics.successes / metrics.total : 0,
        avgConfidence: metrics.total > 0 ? metrics.confidenceSum / metrics.total : 0,
        routedAgent: metrics.agent,
        routedSkill: metrics.skill,
        lastUsed: metrics.lastUsed,
      }))
      .sort((a, b) => b.totalMatches - a.totalMatches);
  }

  /**
   * Analyze confidence threshold performance
   */
  private analyzeConfidenceThresholds(
    outcomes: RoutingOutcome[],
  ): ConfidenceThresholdMetrics[] {
    const promptData = routingOutcomeTracker.getPromptData();
    const thresholds = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];

    return thresholds.map((threshold) => {
      const belowThresholdOutcomes = outcomes.filter((outcome) => {
        const prompt = promptData.find((p) => p.taskId === outcome.taskId);
        const confidence = prompt?.confidence ?? 1;
        return confidence < threshold;
      });

      const totalRoutings = belowThresholdOutcomes.length;
      const successfulRoutings = belowThresholdOutcomes.filter(
        (o) => o.success === true,
      ).length;
      const successRate =
        totalRoutings > 0 ? successfulRoutings / totalRoutings : 0;
      const escalatedCount = belowThresholdOutcomes.length;

      let recommendation = "Threshold is optimal";
      if (successRate < 0.6 && escalatedCount > totalRoutings * 0.5) {
        recommendation = "Consider lowering threshold to reduce escalations";
      } else if (successRate > 0.9 && escalatedCount < totalRoutings * 0.2) {
        recommendation = "Consider raising threshold to improve routing precision";
      }

      return {
        threshold,
        totalRoutings,
        successfulRoutings,
        successRate,
        escalatedCount,
        recommendation,
      };
    });
  }

  /**
   * Calculate overall routing statistics
   */
  private calculateOverallStats(outcomes: RoutingOutcome[]): {
    successRate: number;
    avgConfidence: number;
  } {
    const successful = outcomes.filter((o) => o.success === true).length;
    const successRate =
      outcomes.length > 0 ? successful / outcomes.length : 0;

    // Confidence is in outcomes, not promptData
    const totalConfidence = outcomes.reduce((sum, o) => sum + (o.confidence || 0), 0);
    const avgConfidence =
      outcomes.length > 0 ? totalConfidence / outcomes.length : 0;

    return { successRate, avgConfidence };
  }

  /**
   * Calculate time range for routing data
   */
  private calculateTimeRange(outcomes: RoutingOutcome[]): {
    start: Date;
    end: Date;
  } {
    if (outcomes.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    const getTime = (ts: Date | string) => {
      const d = ts instanceof Date ? ts : new Date(ts as string);
      return d.getTime();
    };

    const sorted = [...outcomes].sort(
      (a, b) => getTime(a.timestamp) - getTime(b.timestamp),
    );

    const now = new Date();
    const firstOutcome = sorted[0];
    const lastOutcome = sorted[sorted.length - 1];
    
    const firstTs = firstOutcome?.timestamp;
    const lastTs = lastOutcome?.timestamp;
    
    return {
      start: firstTs instanceof Date ? firstTs : (firstTs ? new Date(firstTs as string) : now),
      end: lastTs instanceof Date ? lastTs : (lastTs ? new Date(lastTs as string) : now),
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    agentMetrics: AgentPerformanceMetrics[],
    keywordEffectiveness: KeywordEffectiveness[],
    confidenceMetrics: ConfidenceThresholdMetrics[],
  ): string[] {
    const recommendations: string[] = [];

    const lowPerformingAgents = agentMetrics.filter((a) => a.successRate < 0.7);
    if (lowPerformingAgents.length > 0) {
      recommendations.push(
        `Review performance of ${lowPerformingAgents.length} agents with low success rates: ${lowPerformingAgents.map((a) => a.agent).join(", ")}`,
      );
    }

    const ineffectiveKeywords = keywordEffectiveness.filter(
      (k) => k.successRate < 0.6 && k.totalMatches >= 5,
    );
    if (ineffectiveKeywords.length > 0) {
      recommendations.push(
        `Consider removing or refining ${ineffectiveKeywords.length} keywords with low effectiveness: ${ineffectiveKeywords.map((k) => k.keyword).slice(0, 5).join(", ")}`,
      );
    }

    const highEscalationThresholds = confidenceMetrics.filter(
      (m) => m.escalatedCount > m.totalRoutings * 0.5 && m.totalRoutings > 5,
    );
    if (highEscalationThresholds.length > 0) {
      const threshold = highEscalationThresholds[0]?.threshold ?? 0.75;
      recommendations.push(
        `Threshold ${threshold} shows high escalation rate - consider adjusting keyword mappings or confidence scoring`,
      );
    }

    const optimalAgents = agentMetrics
      .filter((a) => a.successRate >= 0.9 && a.totalRoutings >= 10)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3);

    if (optimalAgents.length > 0) {
      recommendations.push(
        `Top performing agents: ${optimalAgents.map((a) => `${a.agent} (${(a.successRate * 100).toFixed(1)}%)`).join(", ")}`,
      );
    }

    const lowConfidenceKeywords = keywordEffectiveness
      .filter((k) => k.avgConfidence < 0.6 && k.totalMatches >= 5)
      .slice(0, 5);

    if (lowConfidenceKeywords.length > 0) {
      recommendations.push(
        `Keywords with consistently low confidence: ${lowConfidenceKeywords.map((k) => k.keyword).join(", ")} - consider reviewing routing logic`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Routing system is performing optimally");
    }

    return recommendations;
  }

  /**
   * Get performance report as formatted string
   */
  generateFormattedReport(): string {
    const report = this.generatePerformanceReport();

    const lines: string[] = [];

    lines.push("╔════════════════════════════════════════════════════════════╗");
    lines.push("║      StringRay Routing Performance Analytics Report      ║");
    lines.push("╚════════════════════════════════════════════════════════════╝");
    lines.push("");
    lines.push(`Total Routings: ${report.totalRoutings}`);
    lines.push(`Overall Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`);
    lines.push(`Average Confidence: ${(report.avgConfidence * 100).toFixed(1)}%`);
    lines.push(`Time Range: ${report.timeRange.start.toISOString()} to ${report.timeRange.end.toISOString()}`);
    lines.push("");

    if (report.agentMetrics.length > 0) {
      lines.push("=== Agent Performance Metrics ===");
      for (const agent of report.agentMetrics.slice(0, 10)) {
        lines.push(`\n  Agent: ${agent.agent} (${agent.skill})`);
        lines.push(`    Total Routings: ${agent.totalRoutings}`);
        lines.push(`    Success Rate: ${(agent.successRate * 100).toFixed(1)}%`);
        lines.push(`    Avg Confidence: ${(agent.avgConfidence * 100).toFixed(1)}%`);
        lines.push(`    Escalations: ${agent.escalatedRoutings}`);
        lines.push(`    Confidence Distribution:`);
        lines.push(`      High (≥${this.mediumConfidenceThreshold}): ${agent.confidenceDistribution.high}`);
        lines.push(`      Medium (≥${this.lowConfidenceThreshold}): ${agent.confidenceDistribution.medium}`);
        lines.push(`      Low (<${this.lowConfidenceThreshold}): ${agent.confidenceDistribution.low}`);
      }
    }

    if (report.keywordEffectiveness.length > 0) {
      lines.push("");
      lines.push("=== Top Keywords by Effectiveness ===");
      for (const keyword of report.keywordEffectiveness.slice(0, 15)) {
        lines.push(`\n  Keyword: "${keyword.keyword}"`);
        lines.push(`    Total Matches: ${keyword.totalMatches}`);
        lines.push(`    Success Rate: ${(keyword.successRate * 100).toFixed(1)}%`);
        lines.push(`    Avg Confidence: ${(keyword.avgConfidence * 100).toFixed(1)}%`);
        lines.push(`    Routes to: ${keyword.routedAgent}/${keyword.routedSkill}`);
      }
    }

    if (report.confidenceMetrics.length > 0) {
      lines.push("");
      lines.push("=== Confidence Threshold Analysis ===");
      for (const metrics of report.confidenceMetrics) {
        lines.push(`\n  Threshold: ${(metrics.threshold * 100).toFixed(0)}%`);
        lines.push(`    Below Threshold: ${metrics.totalRoutings} routings`);
        lines.push(`    Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        lines.push(`    Escalations: ${metrics.escalatedCount}`);
        lines.push(`    Recommendation: ${metrics.recommendation}`);
      }
    }

    if (report.recommendations.length > 0) {
      lines.push("");
      lines.push("=== Recommendations ===");
      for (const recommendation of report.recommendations) {
        lines.push(`  • ${recommendation}`);
      }
    }

    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Generated by StringRay Routing Performance Analyzer");

    return lines.join("\n");
  }

  private emptyPerformanceReport(): RoutingPerformanceReport {
    const now = new Date();
    return {
      totalRoutings: 0,
      overallSuccessRate: 0,
      avgConfidence: 0,
      agentMetrics: [],
      keywordEffectiveness: [],
      confidenceMetrics: [],
      timeRange: { start: now, end: now },
      recommendations: ["Insufficient data for analysis"],
    };
  }
}

export const routingPerformanceAnalyzer = new RoutingPerformanceAnalyzer();
