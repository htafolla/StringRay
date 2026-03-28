/**
 * Routing Refiner for StringRay
 *
 * Suggests new keyword mappings, optimizes existing mappings, and generates
 * configuration updates based on analytics data from the routing system.
 *
 * @version 1.0.0
 * @since 2026-03-05
 */

import type {
  RoutingOutcome,
  PromptDataPoint,
  RoutingDecision,
} from "../delegation/config/types.js";
import { routingOutcomeTracker } from "../delegation/analytics/outcome-tracker.js";
import {
  type PromptComparisonResult,
  promptPatternAnalyzer,
  type TemplateOptimizationSuggestion,
} from "./prompt-pattern-analyzer.js";
import { routingPerformanceAnalyzer } from "./routing-performance-analyzer.js";

export interface KeywordMappingSuggestion {
  keyword: string;
  targetAgent: string;
  targetSkill: string;
  suggestedConfidence: number;
  reason: string;
  evidence: {
    frequency: number;
    successRate: number;
    avgConfidence: number;
    sampleRequests: string[];
  };
  priority: "high" | "medium" | "low";
}

export interface MappingOptimization {
  mappingId: string;
  currentKeywords: string[];
  currentAgent: string;
  currentSkill: string;
  optimizationType: "add_keywords" | "remove_keywords" | "adjust_confidence" | "reassign_agent";
  suggestedChanges: {
    keywordsToAdd?: string[];
    keywordsToRemove?: string[];
    newConfidence?: number;
    newAgent?: string;
  };
  reason: string;
  expectedImpact: string;
}

export interface ConfigurationUpdate {
  version: string;
  generatedAt: Date;
  summary: {
    newMappings: number;
    optimizedMappings: number;
    removedMappings: number;
    estimatedImprovement: string;
  };
  newMappings: KeywordMappingSuggestion[];
  optimizations: MappingOptimization[];
  warnings: string[];
}

export interface RefinementReport {
  promptAnalysis: PromptComparisonResult;
  performanceReport: ReturnType<typeof routingPerformanceAnalyzer.generatePerformanceReport>;
  configurationUpdate: ConfigurationUpdate;
  implementationSteps: string[];
}

class RoutingRefiner {
  private readonly minSamplesForSuggestion = 5;
  private readonly minSuccessRateForSuggestion = 0.7;
  private readonly minConfidenceForSuggestion = 0.7;

  /**
   * Generate comprehensive routing refinement recommendations
   */
  generateRefinementReport(): RefinementReport {
    const promptAnalysis = promptPatternAnalyzer.analyzePromptPatterns();
    const performanceReport = routingPerformanceAnalyzer.generatePerformanceReport();

    const configurationUpdate = this.generateConfigurationUpdate(
      promptAnalysis,
      performanceReport,
    );

    const implementationSteps = this.generateImplementationSteps(configurationUpdate);

    return {
      promptAnalysis,
      performanceReport,
      configurationUpdate,
      implementationSteps,
    };
  }

  /**
   * Generate configuration update suggestions
   */
  private generateConfigurationUpdate(
    promptAnalysis: PromptComparisonResult,
    performanceReport: ReturnType<typeof routingPerformanceAnalyzer.generatePerformanceReport>,
  ): ConfigurationUpdate {
    const newMappings = this.suggestNewKeywordMappings(
      promptAnalysis,
      performanceReport,
    );

    const optimizations = this.suggestMappingOptimizations(
      promptAnalysis,
      performanceReport,
    );

    const warnings = this.generateWarnings(newMappings, optimizations);

    return {
      version: "1.15.11",
      generatedAt: new Date(),
      summary: {
        newMappings: newMappings.length,
        optimizedMappings: optimizations.length,
        removedMappings: this.calculateRemovals(optimizations),
        estimatedImprovement: this.estimateImprovement(
          newMappings,
          optimizations,
        ),
      },
      newMappings,
      optimizations,
      warnings,
    };
  }

  /**
   * Suggest new keyword mappings based on analysis
   */
  private suggestNewKeywordMappings(
    promptAnalysis: PromptComparisonResult,
    performanceReport: ReturnType<typeof routingPerformanceAnalyzer.generatePerformanceReport>,
  ): KeywordMappingSuggestion[] {
    const suggestions: KeywordMappingSuggestion[] = [];

    for (const pattern of promptAnalysis.emergingPatterns) {
      if (
        pattern.frequency >= this.minSamplesForSuggestion &&
        pattern.successRate >= this.minSuccessRateForSuggestion &&
        pattern.avgConfidence >= this.minConfidenceForSuggestion
      ) {
        const topKeywords = pattern.keywords.slice(0, 3);

        for (const keyword of topKeywords) {
          suggestions.push({
            keyword,
            targetAgent: pattern.suggestedAgent,
            targetSkill: pattern.suggestedSkill,
            suggestedConfidence: Math.min(
              pattern.avgConfidence + 0.05,
              0.95,
            ),
            reason: `Emerging pattern detected in ${pattern.frequency} requests with ${(pattern.successRate * 100).toFixed(1)}% success rate`,
            evidence: {
              frequency: pattern.frequency,
              successRate: pattern.successRate,
              avgConfidence: pattern.avgConfidence,
              sampleRequests: pattern.sampleRequests,
            },
            priority: this.calculatePriority(pattern.avgConfidence, pattern.successRate, pattern.frequency),
          });
        }
      }
    }

    for (const gap of promptAnalysis.gaps) {
      if (
        gap.frequency >= this.minSamplesForSuggestion &&
        gap.confidence >= this.minConfidenceForSuggestion
      ) {
        const keywords = this.extractKeywords(gap.userRequest);

        for (const keyword of keywords) {
          if (keyword.length > 3) {
            suggestions.push({
              keyword,
              targetAgent: gap.suggestedAgent,
              targetSkill: gap.suggestedSkill,
              suggestedConfidence: Math.min(gap.confidence + 0.05, 0.95),
              reason: `Template gap detected - ${gap.frequency} recurring requests without template match`,
              evidence: {
                frequency: gap.frequency,
                successRate: 0.8,
                avgConfidence: gap.confidence,
                sampleRequests: [gap.userRequest],
              },
              priority: this.calculatePriority(gap.confidence, 0.8, gap.frequency),
            });
          }
        }
      }
    }

    for (const missedKeyword of promptAnalysis.topMissedKeywords.slice(0, 15)) {
      if (
        missedKeyword.count >= this.minSamplesForSuggestion &&
        missedKeyword.suggestedMappings.length > 0
      ) {
        const targetAgent = this.selectBestAgentForMapping(
          missedKeyword.suggestedMappings,
          performanceReport.agentMetrics,
        );

        suggestions.push({
          keyword: missedKeyword.keyword,
          targetAgent,
          targetSkill: "code-review",
          suggestedConfidence: 0.8,
          reason: `Keyword appears in ${missedKeyword.count} requests without template match`,
          evidence: {
            frequency: missedKeyword.count,
            successRate: 0.75,
            avgConfidence: 0.75,
            sampleRequests: [],
          },
          priority: this.calculatePriority(0.75, 0.75, missedKeyword.count),
        });
      }
    }

    return this.deduplicateSuggestions(suggestions);
  }

  /**
   * Suggest optimizations for existing mappings
   */
  private suggestMappingOptimizations(
    promptAnalysis: PromptComparisonResult,
    performanceReport: ReturnType<typeof routingPerformanceAnalyzer.generatePerformanceReport>,
  ): MappingOptimization[] {
    const optimizations: MappingOptimization[] = [];

    for (const keyword of performanceReport.keywordEffectiveness) {
      if (keyword.successRate < 0.6 && keyword.totalMatches >= 10) {
        optimizations.push({
          mappingId: `keyword-${keyword.keyword}`,
          currentKeywords: [keyword.keyword],
          currentAgent: keyword.routedAgent,
          currentSkill: keyword.routedSkill,
          optimizationType: "remove_keywords",
          suggestedChanges: {
            keywordsToRemove: [keyword.keyword],
          },
          reason: `Low success rate (${(keyword.successRate * 100).toFixed(1)}%) for keyword "${keyword.keyword}"`,
          expectedImpact: `Reduce misroutings by approximately ${keyword.failedMatches} instances`,
        });
      }
    }

    for (const agent of performanceReport.agentMetrics) {
      if (
        agent.successRate < 0.7 &&
        agent.totalRoutings >= 20 &&
        agent.escalatedRoutings > agent.totalRoutings * 0.3
      ) {
        optimizations.push({
          mappingId: `agent-${agent.agent}`,
          currentKeywords: [],
          currentAgent: agent.agent,
          currentSkill: agent.skill,
          optimizationType: "adjust_confidence",
          suggestedChanges: {
            newConfidence: agent.avgConfidence - 0.1,
          },
          reason: `Agent ${agent.agent} showing poor performance with high escalation rate`,
          expectedImpact: `Improve routing accuracy by redirecting tasks to more suitable agents`,
        });
      }
    }

    for (const pattern of promptAnalysis.emergingPatterns) {
      if (
        pattern.successRate >= 0.9 &&
        pattern.frequency >= 10 &&
        pattern.avgConfidence < 0.85
      ) {
        optimizations.push({
          mappingId: `pattern-${pattern.patternId}`,
          currentKeywords: pattern.keywords,
          currentAgent: pattern.suggestedAgent,
          currentSkill: pattern.suggestedSkill,
          optimizationType: "adjust_confidence",
          suggestedChanges: {
            newConfidence: Math.min(pattern.avgConfidence + 0.1, 0.95),
          },
          reason: `Pattern "${pattern.patternId}" shows excellent performance but low confidence score`,
          expectedImpact: `Increase routing confidence for ${pattern.frequency} similar requests`,
        });
      }
    }

    return optimizations;
  }

  /**
   * Generate warnings for configuration updates
   */
  private generateWarnings(
    newMappings: KeywordMappingSuggestion[],
    optimizations: MappingOptimization[],
  ): string[] {
    const warnings: string[] = [];

    const lowPrioritySuggestions = newMappings.filter((m) => m.priority === "low");
    if (lowPrioritySuggestions.length > newMappings.length * 0.5) {
      warnings.push(
        `High proportion (${((lowPrioritySuggestions.length / newMappings.length) * 100).toFixed(1)}%) of suggestions are low priority - review carefully before applying`,
      );
    }

    const agentConflictMap = new Map<string, KeywordMappingSuggestion[]>();
    for (const mapping of newMappings) {
      if (!agentConflictMap.has(mapping.keyword)) {
        agentConflictMap.set(mapping.keyword, []);
      }
      agentConflictMap.get(mapping.keyword)!.push(mapping);
    }

    for (const [keyword, mappings] of agentConflictMap.entries()) {
      const uniqueAgents = new Set(mappings.map((m) => m.targetAgent));
      if (uniqueAgents.size > 1) {
        warnings.push(
          `Keyword "${keyword}" suggested for multiple agents: ${Array.from(uniqueAgents).join(", ")}. Manual review required.`,
        );
      }
    }

    if (optimizations.length > 20) {
      warnings.push(
        "Large number of optimization suggestions - consider applying in batches",
      );
    }

    return warnings;
  }

  /**
   * Generate implementation steps
   */
  private generateImplementationSteps(
    configurationUpdate: ConfigurationUpdate,
  ): string[] {
    const steps: string[] = [];

    if (configurationUpdate.newMappings.length > 0) {
      steps.push(`1. Add ${configurationUpdate.newMappings.length} new keyword mappings`);
      steps.push("   - Review high-priority suggestions first");
      steps.push("   - Test new mappings in staging environment");
      steps.push("   - Monitor impact on routing accuracy");
    }

    if (configurationUpdate.optimizations.length > 0) {
      const stepNumber = configurationUpdate.newMappings.length > 0 ? 2 : 1;
      steps.push(`${stepNumber}. Apply ${configurationUpdate.optimizations.length} mapping optimizations`);
      steps.push("   - Backup current configuration before changes");
      steps.push("   - Group optimizations by type (confidence adjustment, keyword removal, etc.)");
      steps.push("   - Apply changes incrementally with testing between batches");
    }

    steps.push(`${(configurationUpdate.newMappings.length > 0 ? 3 : 2)}. Validate and deploy`);
    steps.push("   - Run comprehensive routing tests");
    steps.push("   - Monitor performance metrics for 24-48 hours");
    steps.push("   - Roll back any changes that show negative impact");

    steps.push(`${(configurationUpdate.newMappings.length > 0 ? 4 : 3)}. Continuous monitoring`);
    steps.push("   - Review analytics dashboard weekly");
    steps.push("   - Track success rate improvements");
    steps.push("   - Iterate based on real-world usage data");

    return steps;
  }

  /**
   * Get formatted refinement report
   */
  generateFormattedReport(): string {
    const report = this.generateRefinementReport();

    const lines: string[] = [];

    lines.push("╔════════════════════════════════════════════════════════════╗");
    lines.push("║        StringRay Routing Refinement Report              ║");
    lines.push("╚════════════════════════════════════════════════════════════╝");
    lines.push("");
    lines.push(`Generated: ${report.configurationUpdate.generatedAt.toISOString()}`);
    lines.push(`Version: ${report.configurationUpdate.version}`);
    lines.push("");

    lines.push("=== Summary ===");
    lines.push(
      `New Mappings: ${report.configurationUpdate.summary.newMappings}`,
    );
    lines.push(
      `Optimized Mappings: ${report.configurationUpdate.summary.optimizedMappings}`,
    );
    lines.push(
      `Removed Mappings: ${report.configurationUpdate.summary.removedMappings}`,
    );
    lines.push(
      `Estimated Improvement: ${report.configurationUpdate.summary.estimatedImprovement}`,
    );
    lines.push("");

    if (report.configurationUpdate.newMappings.length > 0) {
      lines.push("=== New Keyword Mappings ===");
      for (const mapping of report.configurationUpdate.newMappings.slice(0, 20)) {
        lines.push(`\n  Keyword: "${mapping.keyword}"`);
        lines.push(`    Target: ${mapping.targetAgent}/${mapping.targetSkill}`);
        lines.push(`    Confidence: ${mapping.suggestedConfidence.toFixed(2)}`);
        lines.push(`    Priority: ${mapping.priority.toUpperCase()}`);
        lines.push(`    Reason: ${mapping.reason}`);
        lines.push(`    Evidence: ${mapping.evidence.frequency} occurrences, ${(mapping.evidence.successRate * 100).toFixed(1)}% success rate`);
      }
    }

    if (report.configurationUpdate.optimizations.length > 0) {
      lines.push("");
      lines.push("=== Mapping Optimizations ===");
      for (const optimization of report.configurationUpdate.optimizations.slice(0, 10)) {
        lines.push(`\n  ${optimization.optimizationType.toUpperCase()}: ${optimization.mappingId}`);
        lines.push(`    Current: ${optimization.currentAgent}/${optimization.currentSkill}`);
        lines.push(`    Reason: ${optimization.reason}`);
        lines.push(`    Expected Impact: ${optimization.expectedImpact}`);
      }
    }

    if (report.configurationUpdate.warnings.length > 0) {
      lines.push("");
      lines.push("=== Warnings ===");
      for (const warning of report.configurationUpdate.warnings) {
        lines.push(`  ⚠️  ${warning}`);
      }
    }

    lines.push("");
    lines.push("=== Implementation Steps ===");
    for (const step of report.implementationSteps) {
      lines.push(`  ${step}`);
    }

    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Generated by StringRay Routing Refiner");

    return lines.join("\n");
  }

  /**
   * Export configuration update as JSON
   */
  exportConfigurationUpdate(): string {
    const report = this.generateRefinementReport();
    return JSON.stringify(report.configurationUpdate, null, 2);
  }

  private calculatePriority(
    confidence: number,
    successRate: number,
    frequency: number,
  ): "high" | "medium" | "low" {
    const score = confidence * 0.4 + successRate * 0.4 + (Math.min(frequency, 20) / 20) * 0.2;

    if (score >= 0.85) return "high";
    if (score >= 0.7) return "medium";
    return "low";
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const stopWords = new Set([
      "this",
      "that",
      "with",
      "from",
      "have",
      "will",
      "just",
      "like",
      "they",
      "them",
      "than",
      "then",
      "some",
      "such",
    ]);

    return words.filter((word) => !stopWords.has(word));
  }

  private selectBestAgentForMapping(
    agents: string[],
    agentMetrics: Array<{ agent: string; successRate: number }>,
  ): string {
    const agentPerformance = new Map(
      agentMetrics.map((m) => [m.agent, m.successRate]),
    );

    const sortedAgents = [...agents].sort((a, b) => {
      const scoreA = agentPerformance.get(a) ?? 0;
      const scoreB = agentPerformance.get(b) ?? 0;
      return scoreB - scoreA;
    });

    return sortedAgents[0] ?? "enforcer";
  }

  private deduplicateSuggestions(
    suggestions: KeywordMappingSuggestion[],
  ): KeywordMappingSuggestion[] {
    const seen = new Map<string, KeywordMappingSuggestion>();

    for (const suggestion of suggestions) {
      const key = `${suggestion.keyword}-${suggestion.targetAgent}-${suggestion.targetSkill}`;

      if (!seen.has(key)) {
        seen.set(key, suggestion);
      } else {
        const existing = seen.get(key)!;
        if (
          suggestion.evidence.frequency > existing.evidence.frequency ||
          suggestion.evidence.successRate > existing.evidence.successRate
        ) {
          seen.set(key, suggestion);
        }
      }
    }

    return Array.from(seen.values());
  }

  private calculateRemovals(optimizations: MappingOptimization[]): number {
    return optimizations.filter((o) => o.optimizationType === "remove_keywords").length;
  }

  private estimateImprovement(
    newMappings: KeywordMappingSuggestion[],
    optimizations: MappingOptimization[],
  ): string {
    const highPriorityMappings = newMappings.filter((m) => m.priority === "high");
    const confidenceAdjustments = optimizations.filter(
      (o) => o.optimizationType === "adjust_confidence",
    ).length;

    const estimatedAccuracyImprovement =
      (highPriorityMappings.length * 2) + (confidenceAdjustments * 1);

    if (estimatedAccuracyImprovement > 15) {
      return `${estimatedAccuracyImprovement}%+ (significant)`;
    } else if (estimatedAccuracyImprovement > 5) {
      return `${estimatedAccuracyImprovement}%+ (moderate)`;
    } else {
      return `${estimatedAccuracyImprovement}%+ (minor)`;
    }
  }
}

export const routingRefiner = new RoutingRefiner();
