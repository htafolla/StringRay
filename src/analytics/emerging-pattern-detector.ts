/**
 * Emerging Pattern Detector for P9 - ADAPTIVE_PATTERN_LEARNING
 *
 * Discovers new routing patterns from recent task requests,
 * identifies emergent behaviors, and suggests new pattern candidates.
 *
 * @version 1.0.0
 * @since 2026-03-05
 */

import { frameworkLogger } from "../core/framework-logger.js";
import type { EmergentPattern } from "../core/kernel-patterns.js";
import type { RoutingOutcome } from "../delegation/config/types.js";

export interface ClusterResult {
  clusterId: string;
  patterns: string[];
  frequency: number;
  keywords: string[];
  suggestedAgents: string[];
  suggestedSkills: string[];
  confidence: number;
}

export interface PatternDiscoveryResult {
  emergentPatterns: EmergentPattern[];
  clusters: ClusterResult[];
  recommendations: string[];
}

export class EmergingPatternDetector {
  private readonly minFrequencyThreshold = 3;
  private readonly minConfidenceThreshold = 0.6;
  private readonly clusterSimilarityThreshold = 0.4;
  private readonly maxClusters = 20;
  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which'
  ]);

  /**
   * Extract meaningful keywords from task description
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.stopWords.has(word));

    return [...new Set(words)];
  }

  /**
   * Calculate Jaccard similarity between two keyword sets
   */
  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Cluster similar task descriptions
   */
  private clusterTasks(tasks: Array<{ id: string; keywords: string[]; description: string }>): ClusterResult[] {
    const clusters: ClusterResult[] = [];
    const assigned = new Set<string>();

    // Sort by frequency (most frequent first)
    const sortedTasks = [...tasks].sort((a, b) => b.keywords.length - a.keywords.length);

    for (const task of sortedTasks) {
      if (assigned.has(task.id)) continue;

      // Create new cluster
      const clusterKeywords = new Set(task.keywords);
      const clusterDescriptions = [task.description];
      const clusterIds = [task.id];
      let clusterFrequency = 1;

      // Find similar tasks
      for (const otherTask of sortedTasks) {
        if (assigned.has(otherTask.id) || otherTask.id === task.id) continue;

        const similarity = this.calculateSimilarity(
          [...clusterKeywords],
          otherTask.keywords
        );

        if (similarity >= this.clusterSimilarityThreshold) {
          otherTask.keywords.forEach(kw => clusterKeywords.add(kw));
          clusterDescriptions.push(otherTask.description);
          clusterIds.push(otherTask.id);
          clusterFrequency++;
          assigned.add(otherTask.id);
        }
      }

      assigned.add(task.id);

      // Extract unique keywords
      const uniqueKeywords = [...clusterKeywords].slice(0, 10);

      // Calculate confidence based on frequency and uniqueness
      const confidence = Math.min(1, clusterFrequency * 0.15 + uniqueKeywords.length * 0.05);

      clusters.push({
        clusterId: `cluster_${clusters.length}`,
        patterns: clusterDescriptions.slice(0, 5),
        frequency: clusterFrequency,
        keywords: uniqueKeywords,
        suggestedAgents: [],
        suggestedSkills: [],
        confidence
      });

      if (clusters.length >= this.maxClusters) break;
    }

    return clusters;
  }

  /**
   * Detect emergent patterns from recent routing outcomes
   */
  detectEmergingPatterns(outcomes: RoutingOutcome[]): PatternDiscoveryResult {
    if (outcomes.length < this.minFrequencyThreshold) {
      return {
        emergentPatterns: [],
        clusters: [],
        recommendations: ['Insufficient data for pattern detection']
      };
    }

    // Extract keywords and group by outcome
    const taskData = outcomes.map(outcome => {
      const keywords = this.extractKeywords(outcome.taskDescription || '');
      return {
        id: outcome.taskId,
        keywords,
        description: outcome.taskDescription || '',
        agent: outcome.routedAgent,
        skill: outcome.routedSkill,
        success: outcome.success,
        confidence: outcome.confidence
      };
    });

    // Cluster similar tasks
    const clusters = this.clusterTasks(taskData);

    // Analyze clusters for emergent patterns
    const emergentPatterns: EmergentPattern[] = [];
    const recommendations: string[] = [];

    for (const cluster of clusters) {
      if (cluster.frequency < this.minFrequencyThreshold) continue;
      if (cluster.confidence < this.minConfidenceThreshold) continue;

      // Get success metrics for this cluster
      const clusterOutcomes = taskData.filter(t =>
        cluster.patterns.includes(t.description)
      );
      const successCount = clusterOutcomes.filter(t => t.success).length;
      const successRate = clusterOutcomes.length > 0 ? successCount / clusterOutcomes.length : 0;
      const avgConfidence = clusterOutcomes.length > 0
        ? clusterOutcomes.reduce((sum, t) => sum + t.confidence, 0) / clusterOutcomes.length
        : 0;

      // Determine suggested agent/skill based on most common
      const agentCounts = new Map<string, number>();
      const skillCounts = new Map<string, number>();

      for (const task of clusterOutcomes) {
        agentCounts.set(task.agent, (agentCounts.get(task.agent) || 0) + 1);
        skillCounts.set(task.skill, (skillCounts.get(task.skill) || 0) + 1);
      }

      const suggestedAgent = [...agentCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
      const suggestedSkill = [...skillCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

      cluster.suggestedAgents = [suggestedAgent];
      cluster.suggestedSkills = [suggestedSkill];

      // Create emergent pattern
      const emergentPattern: EmergentPattern = {
        id: `emergent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pattern: cluster.keywords.join(' | '),
        trigger: cluster.keywords,
        action: successRate < 0.7
          ? 'Improve routing for this pattern'
          : successRate > 0.9
            ? 'Add as new keyword mapping'
            : 'Monitor pattern performance',
        confidence: cluster.confidence,
        category: 'PREVENTION',
        frequency: cluster.frequency,
        lastDetected: new Date(),
        effectiveness: successRate,
        firstSeen: clusterOutcomes[0]?.success ? new Date() : new Date(),
        lastSeen: new Date(),
        evidence: cluster.patterns.slice(0, 3),
        suggestedAction: successRate < 0.7
          ? 'Improve routing for this pattern'
          : successRate > 0.9
            ? 'Add as new keyword mapping'
            : 'Monitor pattern performance'
      };

      // Determine if pattern is truly emergent (not in existing mappings)
      const isNewPattern = successRate > 0.7 && cluster.frequency >= 5;

      if (isNewPattern) {
        emergentPatterns.push(emergentPattern);
      }

      // Generate recommendations
      if (successRate > 0.9 && cluster.frequency >= 5) {
        recommendations.push(
          `High-performing pattern "${cluster.keywords.slice(0, 3).join(', ')}" (${cluster.frequency} uses, ${(successRate * 100).toFixed(0)}% success) - Consider adding as new keyword mapping`
        );
      } else if (successRate < 0.6 && cluster.frequency >= 3) {
        recommendations.push(
          `Underperforming pattern "${cluster.keywords.slice(0, 3).join(', ')}" (${cluster.frequency} uses, ${(successRate * 100).toFixed(0)}% success) - Review routing logic`
        );
      }
    }

    // Sort emergent patterns by confidence
    emergentPatterns.sort((a, b) => b.confidence - a.confidence);

    if (recommendations.length === 0) {
      recommendations.push('No significant emergent patterns detected');
    }

    frameworkLogger.log(
      "emerging-pattern-detector",
      "analysis-complete",
      "info",
      {
        emergentPatternsCount: emergentPatterns.length,
        clustersCount: clusters.length,
        recommendationsCount: recommendations.length
      },
      undefined
    );

    return {
      emergentPatterns,
      clusters,
      recommendations
    };
  }

  /**
   * Check if a specific pattern is emerging
   */
  isPatternEmerging(
    pattern: string,
    recentOutcomes: RoutingOutcome[],
    historicalBaseline: number
  ): { emerging: boolean; trend: 'increasing' | 'decreasing' | 'stable'; confidence: number } {
    const keywords = this.extractKeywords(pattern);
    const recentKeywords = recentOutcomes.slice(-20).map(o => this.extractKeywords(o.taskDescription || ''));

    // Count matches in recent outcomes
    let matches = 0;
    for (const recentKw of recentKeywords) {
      if (this.calculateSimilarity(keywords, recentKw) > this.clusterSimilarityThreshold) {
        matches++;
      }
    }

    const recentFrequency = matches / Math.max(recentKeywords.length, 1);
    const baselineFrequency = historicalBaseline;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (recentFrequency > baselineFrequency * 1.3) {
      trend = 'increasing';
    } else if (recentFrequency < baselineFrequency * 0.7) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      emerging: trend === 'increasing' && recentFrequency > 0.1,
      trend,
      confidence: Math.min(1, recentFrequency * 2)
    };
  }

  /**
   * Get suggested keyword mappings from emergent patterns
   */
  suggestKeywordMappings(emergentPatterns: EmergentPattern[]): Array<{
    keywords: string[];
    suggestedAgent: string;
    suggestedSkill: string;
    confidence: number;
    reason: string;
  }> {
    const suggestions: Array<{
      keywords: string[];
      suggestedAgent: string;
      suggestedSkill: string;
      confidence: number;
      reason: string;
    }> = [];

    for (const pattern of emergentPatterns) {
      if (pattern.confidence < this.minConfidenceThreshold) continue;

      // Extract top keywords as potential mapping
      const keywords = pattern.pattern.split(' | ').slice(0, 5);

      // Extract agent/skill from evidence
      // In real implementation, this would analyze the evidence
      const suggestedAgent = 'orchestrator'; // Default fallback
      const suggestedSkill = 'orchestrator';

      suggestions.push({
        keywords,
        suggestedAgent,
        suggestedSkill,
        confidence: pattern.confidence,
        reason: `Emerging pattern with ${pattern.frequency} occurrences`
      });
    }

    return suggestions;
  }
}

// Singleton instance
export const emergingPatternDetector = new EmergingPatternDetector();