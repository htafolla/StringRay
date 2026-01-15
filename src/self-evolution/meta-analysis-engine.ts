/**
 * Meta-Analysis Engine for StringRay Framework v2.0.0
 *
 * Analyzes framework's own rule effectiveness and performance patterns.
 * Enables self-evolution by identifying optimization opportunities.
 */

export interface RuleEffectivenessMetrics {
  ruleId: string;
  totalTriggers: number;
  successfulValidations: number;
  failedValidations: number;
  averageExecutionTime: number;
  successRate: number;
  impactScore: number;
  lastTriggered: number;
}

export interface MetaAnalysisReport {
  timestamp: number;
  ruleEffectiveness: RuleEffectivenessMetrics[];
  frameworkHealthScore: number;
  evolutionReadiness: number;
  criticalIssues: string[];
  recommendations: string[];
}

export class MetaAnalysisEngine {
  private ruleMetrics = new Map<string, RuleEffectivenessMetrics>();

  recordRuleExecution(
    ruleId: string,
    executionTime: number,
    success: boolean,
    hasImpact: boolean,
  ): void {
    const existing = this.ruleMetrics.get(ruleId);
    const totalTriggers = (existing?.totalTriggers || 0) + 1;
    const successfulValidations = (existing?.successfulValidations || 0) + (success ? 1 : 0);
    const failedValidations = (existing?.failedValidations || 0) + (success ? 0 : 1);

    this.ruleMetrics.set(ruleId, {
      ruleId,
      totalTriggers,
      successfulValidations,
      failedValidations,
      averageExecutionTime: existing
        ? (existing.averageExecutionTime * existing.totalTriggers + executionTime) / totalTriggers
        : executionTime,
      successRate: successfulValidations / totalTriggers,
      impactScore: existing
        ? (existing.impactScore * existing.totalTriggers + (hasImpact ? 1 : 0)) / totalTriggers
        : (hasImpact ? 1 : 0),
      lastTriggered: Date.now(),
    });
  }

  generateMetaAnalysisReport(): MetaAnalysisReport {
    const ruleEffectiveness = Array.from(this.ruleMetrics.values());
    const frameworkHealthScore = this.calculateFrameworkHealthScore(ruleEffectiveness);
    const evolutionReadiness = this.calculateEvolutionReadiness(ruleEffectiveness);
    const criticalIssues = this.identifyCriticalIssues(ruleEffectiveness);
    const recommendations = this.generateRecommendations(ruleEffectiveness);

    return {
      timestamp: Date.now(),
      ruleEffectiveness,
      frameworkHealthScore,
      evolutionReadiness,
      criticalIssues,
      recommendations,
    };
  }

  private calculateFrameworkHealthScore(ruleMetrics: RuleEffectivenessMetrics[]): number {
    if (ruleMetrics.length === 0) return 50;

    const avgSuccessRate = ruleMetrics.reduce((sum, m) => sum + m.successRate, 0) / ruleMetrics.length;
    const avgImpactScore = ruleMetrics.reduce((sum, m) => sum + m.impactScore, 0) / ruleMetrics.length;

    return (avgSuccessRate * 60 + avgImpactScore * 40);
  }

  private calculateEvolutionReadiness(ruleMetrics: RuleEffectivenessMetrics[]): number {
    if (ruleMetrics.length < 5) return 20;

    const avgSuccessRate = ruleMetrics.reduce((sum, m) => sum + m.successRate, 0) / ruleMetrics.length;
    const totalTriggers = ruleMetrics.reduce((sum, m) => sum + m.totalTriggers, 0);

    return Math.min(100, (avgSuccessRate * 50) + Math.min(50, totalTriggers / 10));
  }

  private identifyCriticalIssues(ruleMetrics: RuleEffectivenessMetrics[]): string[] {
    const issues: string[] = [];

    ruleMetrics.forEach(metrics => {
      if (metrics.successRate < 0.7 && metrics.totalTriggers > 10) {
        issues.push(`Rule ${metrics.ruleId} has low success rate (${(metrics.successRate * 100).toFixed(1)}%)`);
      }
      if (metrics.averageExecutionTime > 100 && metrics.totalTriggers > 5) {
        issues.push(`Rule ${metrics.ruleId} is slow (${metrics.averageExecutionTime.toFixed(1)}ms avg)`);
      }
    });

    return issues;
  }

  private generateRecommendations(ruleMetrics: RuleEffectivenessMetrics[]): string[] {
    const recommendations: string[] = [];

    const slowRules = ruleMetrics.filter(m => m.averageExecutionTime > 50 && m.totalTriggers > 5);
    if (slowRules.length > 0) {
      recommendations.push(`Optimize ${slowRules.length} slow-performing rules`);
    }

    const ineffectiveRules = ruleMetrics.filter(m => m.impactScore < 0.3 && m.totalTriggers > 10);
    if (ineffectiveRules.length > 0) {
      recommendations.push(`Review ${ineffectiveRules.length} low-impact rules for necessity`);
    }

    return recommendations;
  }

  getRecentPerformanceMetrics(count: number): any[] {
    const allMetrics = Array.from(this.ruleMetrics.values());
    const recentMetrics = allMetrics
      .sort((a, b) => b.lastTriggered - a.lastTriggered)
      .slice(0, count);

    return recentMetrics.map(m => ({
      ruleId: m.ruleId,
      overallEfficiency: m.successRate * m.impactScore * (m.averageExecutionTime < 50 ? 1 : 0.5),
      lastTriggered: m.lastTriggered
    }));
  }
}

export const metaAnalysisEngine = new MetaAnalysisEngine();