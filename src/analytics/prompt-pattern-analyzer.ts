/**
 * Prompt Pattern Analyzer for StringRay
 *
 * Analyzes actual vs. template prompts to detect gaps and emerging patterns.
 * Integrates with RoutingOutcomeTracker to provide insights for template optimization.
 *
 * @version 1.0.0
 * @since 2026-03-05
 */

import type {
  PromptDataPoint,
  RoutingOutcome,
  RoutingDecision,
} from "../delegation/config/types.js";
import { routingOutcomeTracker } from "../delegation/analytics/outcome-tracker.js";

export interface TemplateGap {
  gapType: "missing_template" | "pattern_mismatch" | "emerging_pattern";
  userRequest: string;
  generatedPrompt: string;
  suggestedAgent: string;
  suggestedSkill: string;
  frequency: number;
  lastSeen: Date;
  confidence: number;
}

export interface EmergingPattern {
  patternId: string;
  keywords: string[];
  sampleRequests: string[];
  suggestedAgent: string;
  suggestedSkill: string;
  confidence: number;
  frequency: number;
  avgConfidence: number;
  successRate: number;
}

export interface PromptComparisonResult {
  totalPrompts: number;
  templateMatches: number;
  nonTemplatePrompts: number;
  templateMatchRate: number;
  gaps: TemplateGap[];
  emergingPatterns: EmergingPattern[];
  topMissedKeywords: Array<{ keyword: string; count: number; suggestedMappings: string[] }>;
  agentCoverage: Map<string, { total: number; withTemplate: number; withoutTemplate: number }>;
}

export interface TemplateOptimizationSuggestion {
  suggestionType: "add_template" | "update_keywords" | "merge_patterns" | "remove_template";
  templateName?: string;
  keywords: string[];
  targetAgent: string;
  targetSkill: string;
  confidence: number;
  expectedImpact: string;
  reasoning: string;
}

class PromptPatternAnalyzer {
  private readonly minFrequencyThreshold = 3;
  private readonly confidenceThreshold = 0.7;
  private readonly emergingPatternMinSamples = 5;

  /**
   * Analyze prompt patterns and compare against templates
   */
  analyzePromptPatterns(): PromptComparisonResult {
    const promptData = routingOutcomeTracker.getPromptData();
    const outcomes = routingOutcomeTracker.getOutcomes();

    if (promptData.length === 0) {
      return this.emptyComparisonResult();
    }

    const templateMatches = promptData.filter(
      (p) => p.templatePrompt && p.templatePrompt.length > 0,
    );
    const nonTemplatePrompts = promptData.filter(
      (p) => !p.templatePrompt || p.templatePrompt.length === 0,
    );

    const gaps = this.detectTemplateGaps(promptData, outcomes);
    const emergingPatterns = this.identifyEmergingPatterns(promptData, outcomes);
    const topMissedKeywords = this.analyzeMissedKeywords(promptData);
    const agentCoverage = this.calculateAgentCoverage(promptData);

    return {
      totalPrompts: promptData.length,
      templateMatches: templateMatches.length,
      nonTemplatePrompts: nonTemplatePrompts.length,
      templateMatchRate:
        promptData.length > 0 ? templateMatches.length / promptData.length : 0,
      gaps,
      emergingPatterns,
      topMissedKeywords,
      agentCoverage,
    };
  }

  /**
   * Detect gaps where templates don't match user requests
   */
  private detectTemplateGaps(
    promptData: PromptDataPoint[],
    outcomes: RoutingOutcome[],
  ): TemplateGap[] {
    const gaps: TemplateGap[] = [];
    const gapMap = new Map<string, TemplateGap>();

    for (const prompt of promptData) {
      if (!prompt.templatePrompt || prompt.templatePrompt.length === 0) {
        const key = this.normalizeRequest(prompt.userRequest || '');

        if (gapMap.has(key)) {
          const existing = gapMap.get(key);
          if (existing) {
            existing.frequency++;
            existing.lastSeen = prompt.timestamp;
          }
        } else {
          const outcome = outcomes.find((o) => o.taskId === prompt.taskId);
          gaps.push({
            gapType: this.classifyGapType(prompt, outcome),
            userRequest: prompt.userRequest || '',
            generatedPrompt: prompt.generatedPrompt || '',
            suggestedAgent: outcome?.routedAgent ?? "enforcer",
            suggestedSkill: outcome?.routedSkill ?? "code-review",
            frequency: 1,
            lastSeen: prompt.timestamp,
            confidence: prompt.confidence ?? 0.5,
          });
          const newGap = gaps[gaps.length - 1];
          if (newGap) {
            gapMap.set(key, newGap);
          }
        }
      }
    }

    return gaps
      .filter((gap) => gap.frequency >= this.minFrequencyThreshold)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Identify emerging patterns from real usage
   */
  private identifyEmergingPatterns(
    promptData: PromptDataPoint[],
    outcomes: RoutingOutcome[],
  ): EmergingPattern[] {
    const patternMap = new Map<string, EmergingPattern>();
    const keywordFrequency = new Map<string, number>();

    for (const prompt of promptData) {
      const keywords = this.extractKeywords(prompt.userRequest || '');

      for (const keyword of keywords) {
        keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
      }
    }

    const significantKeywords = Array.from(keywordFrequency.entries())
      .filter(([, count]) => count >= this.minFrequencyThreshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    for (const prompt of promptData) {
      const keywords = this.extractKeywords(prompt.userRequest || '');
      const significantKeywordsInPrompt = keywords.filter((kw) =>
        significantKeywords.some(([sigKw]) => kw === sigKw),
      );

      if (significantKeywordsInPrompt.length === 0) continue;

      const patternKey = significantKeywordsInPrompt.sort().join("|");
      const outcome = outcomes.find((o) => o.taskId === prompt.taskId);

      if (!outcome) continue;

      if (patternMap.has(patternKey)) {
        const existing = patternMap.get(patternKey)!;
        existing.frequency++;
        existing.avgConfidence =
          (existing.avgConfidence * (existing.frequency - 1) + (prompt.confidence || 0.5)) /
          existing.frequency;

        if (outcome.success !== undefined) {
          const totalSuccesses =
            existing.successRate * (existing.frequency - 1) +
            (outcome.success ? 1 : 0);
          existing.successRate = totalSuccesses / existing.frequency;
        }

        if (existing.sampleRequests.length < 3) {
          existing.sampleRequests.push(prompt.userRequest || '');
        }
      } else {
        patternMap.set(patternKey, {
          patternId: this.generatePatternId(significantKeywordsInPrompt),
          keywords: significantKeywordsInPrompt,
          sampleRequests: [prompt.userRequest || ''],
          suggestedAgent: outcome.routedAgent || 'enforcer',
          suggestedSkill: outcome.routedSkill || 'code-review',
          confidence: prompt.confidence || 0.5,
          frequency: 1,
          avgConfidence: prompt.confidence || 0.5,
          successRate: outcome.success !== undefined ? (outcome.success ? 1 : 0) : 0,
        });
      }
    }

    return Array.from(patternMap.values())
      .filter(
        (pattern) =>
          pattern.frequency >= this.emergingPatternMinSamples &&
          pattern.avgConfidence >= this.confidenceThreshold &&
          pattern.successRate >= 0.6,
      )
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Analyze frequently missed keywords
   */
  private analyzeMissedKeywords(
    promptData: PromptDataPoint[],
  ): Array<{ keyword: string; count: number; suggestedMappings: string[] }> {
    const missedKeywords = new Map<string, number>();
    const keywordToAgent = new Map<string, Set<string>>();

    for (const prompt of promptData) {
      if (!prompt.templatePrompt || prompt.templatePrompt.length === 0) {
        const keywords = this.extractKeywords(prompt.userRequest || '');

        for (const keyword of keywords) {
          if (keyword.length > 3) {
            missedKeywords.set(keyword, (missedKeywords.get(keyword) || 0) + 1);

            if (!keywordToAgent.has(keyword)) {
              keywordToAgent.set(keyword, new Set());
            }
            keywordToAgent.get(keyword)!.add(prompt.routedAgent || 'enforcer');
          }
        }
      }
    }

    return Array.from(missedKeywords.entries())
      .filter(([, count]) => count >= this.minFrequencyThreshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({
        keyword,
        count,
        suggestedMappings: Array.from(keywordToAgent.get(keyword) || []),
      }));
  }

  /**
   * Calculate agent coverage metrics
   */
  private calculateAgentCoverage(
    promptData: PromptDataPoint[],
  ): Map<string, { total: number; withTemplate: number; withoutTemplate: number }> {
    const coverage = new Map<
      string,
      { total: number; withTemplate: number; withoutTemplate: number }
    >();

    for (const prompt of promptData) {
      const agent = prompt.routedAgent || 'enforcer';
      const hasTemplate = prompt.templatePrompt && prompt.templatePrompt.length > 0;

      if (!coverage.has(agent)) {
        coverage.set(agent, { total: 0, withTemplate: 0, withoutTemplate: 0 });
      }

      const stats = coverage.get(agent)!;
      stats.total++;
      if (hasTemplate) {
        stats.withTemplate++;
      } else {
        stats.withoutTemplate++;
      }
    }

    return coverage;
  }

  /**
   * Generate template optimization suggestions
   */
  generateOptimizationSuggestions(
    comparisonResult: PromptComparisonResult,
  ): TemplateOptimizationSuggestion[] {
    const suggestions: TemplateOptimizationSuggestion[] = [];

    for (const pattern of comparisonResult.emergingPatterns) {
      if (
        pattern.avgConfidence >= 0.85 &&
        pattern.successRate >= 0.8 &&
        pattern.frequency >= 5
      ) {
        suggestions.push({
          suggestionType: "add_template",
          templateName: pattern.patternId,
          keywords: pattern.keywords,
          targetAgent: pattern.suggestedAgent,
          targetSkill: pattern.suggestedSkill,
          confidence: pattern.avgConfidence,
          expectedImpact: `Improve routing for ${pattern.frequency} similar requests`,
          reasoning: `Pattern detected in ${pattern.frequency} requests with ${(pattern.successRate * 100).toFixed(1)}% success rate`,
        });
      }
    }

    for (const gap of comparisonResult.gaps) {
      if (gap.frequency >= 5 && gap.confidence >= 0.8) {
        suggestions.push({
          suggestionType: "add_template",
          keywords: this.extractKeywords(gap.userRequest),
          targetAgent: gap.suggestedAgent || "enforcer",
          targetSkill: gap.suggestedSkill || "code-review",
          confidence: gap.confidence,
          expectedImpact: `Fill template gap for ${gap.frequency} similar requests`,
          reasoning: `Missing template detected for recurring request pattern`,
        });
      }
    }

    for (const missed of comparisonResult.topMissedKeywords.slice(0, 10)) {
      if (missed.count >= 3 && missed.suggestedMappings.length > 0) {
        const targetAgent = this.selectBestAgent(missed.suggestedMappings);
        suggestions.push({
          suggestionType: "update_keywords",
          keywords: [missed.keyword],
          targetAgent,
          targetSkill: "code-review",
          confidence: 0.7,
          expectedImpact: `Improve routing for requests containing "${missed.keyword}"`,
          reasoning: `Keyword appears in ${missed.count} requests without template match`,
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get analytics summary as formatted report
   */
  generateReport(comparisonResult: PromptComparisonResult): string {
    const lines: string[] = [];

    lines.push("╔════════════════════════════════════════════════════════════╗");
    lines.push("║        StringRay Prompt Pattern Analytics Report        ║");
    lines.push("╚════════════════════════════════════════════════════════════╝");
    lines.push("");
    lines.push(`Total Prompts Analyzed: ${comparisonResult.totalPrompts}`);
    lines.push(
      `Template Match Rate: ${(comparisonResult.templateMatchRate * 100).toFixed(1)}%`,
    );
    lines.push(`Non-Template Prompts: ${comparisonResult.nonTemplatePrompts}`);
    lines.push("");

    if (comparisonResult.gaps.length > 0) {
      lines.push("=== Template Gaps ===");
      lines.push(
        `Found ${comparisonResult.gaps.length} recurring gaps (frequency ≥ ${this.minFrequencyThreshold})`,
      );

      for (const gap of comparisonResult.gaps.slice(0, 5)) {
        lines.push(`\n  ${gap.gapType.toUpperCase()}:`);
        lines.push(`    Request: "${gap.userRequest.substring(0, 100)}..."`);
        lines.push(`    Frequency: ${gap.frequency}`);
        lines.push(`    Suggested: ${gap.suggestedAgent}/${gap.suggestedSkill}`);
      }
    }

    if (comparisonResult.emergingPatterns.length > 0) {
      lines.push("");
      lines.push("=== Emerging Patterns ===");
      lines.push(
        `Found ${comparisonResult.emergingPatterns.length} emerging patterns`,
      );

      for (const pattern of comparisonResult.emergingPatterns.slice(0, 5)) {
        lines.push(`\n  ${pattern.patternId}:`);
        lines.push(`    Keywords: ${pattern.keywords.join(", ")}`);
        lines.push(`    Frequency: ${pattern.frequency}`);
        lines.push(`    Avg Confidence: ${(pattern.avgConfidence * 100).toFixed(1)}%`);
        lines.push(`    Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`);
      }
    }

    if (comparisonResult.agentCoverage.size > 0) {
      lines.push("");
      lines.push("=== Agent Template Coverage ===");
      for (const [agent, stats] of Array.from(comparisonResult.agentCoverage.entries()).sort(
        (a, b) => b[1].total - a[1].total,
      )) {
        const coverage = ((stats.withTemplate / stats.total) * 100).toFixed(1);
        lines.push(
          `  ${agent}: ${coverage}% template coverage (${stats.withTemplate}/${stats.total})`,
        );
      }
    }

    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Generated by StringRay Prompt Pattern Analyzer");

    return lines.join("\n");
  }

  private classifyGapType(
    prompt: PromptDataPoint,
    outcome?: RoutingOutcome,
  ): TemplateGap["gapType"] {
    if (prompt.templatePrompt && prompt.templatePrompt.length > 0) {
      if (prompt.generatedPrompt !== prompt.templatePrompt) {
        return "pattern_mismatch";
      }
    }

    const hasHighConfidence = (prompt.confidence || 0) >= this.confidenceThreshold;
    const hasSuccess = outcome?.success === true;

    if (hasHighConfidence && hasSuccess) {
      return "emerging_pattern";
    }

    return "missing_template";
  }

  private normalizeRequest(request: string): string {
    return request
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .substring(0, 200);
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
      "into",
      "over",
      "after",
    ]);

    return words.filter((word) => !stopWords.has(word));
  }

  private generatePatternId(keywords: string[]): string {
    return keywords.map((kw) => kw.substring(0, 3)).join("-") + "-pattern";
  }

  private selectBestAgent(agents: string[]): string {
    if (agents.length === 1) return agents[0]!;

    const priorityOrder = [
      "enforcer",
      "orchestrator",
      "architect",
      "code-reviewer",
      "testing-lead",
      "bug-triage-specialist",
    ];

    for (const priority of priorityOrder) {
      if (agents.includes(priority)) {
        return priority;
      }
    }

    return agents[0] ?? "enforcer";
  }

  private emptyComparisonResult(): PromptComparisonResult {
    return {
      totalPrompts: 0,
      templateMatches: 0,
      nonTemplatePrompts: 0,
      templateMatchRate: 0,
      gaps: [],
      emergingPatterns: [],
      topMissedKeywords: [],
      agentCoverage: new Map(),
    };
  }
}

export const promptPatternAnalyzer = new PromptPatternAnalyzer();
