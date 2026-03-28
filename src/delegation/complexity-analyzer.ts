/**
 * Complexity Analyzer
 *
 * Assesses operation complexity to determine optimal agent delegation strategy.
 * Implements metrics-based complexity scoring for intelligent task distribution.
 *
 * REFACTORED: Now uses complexity-core.ts for shared logic
 * @version 1.1.0
 * @since 2026-01-07
 */

import {
  ComplexityMetrics,
  ComplexityScore,
  ComplexityThresholds,
  ComplexityLevel,
  DelegationStrategy,
  DEFAULT_THRESHOLDS,
  OPERATION_WEIGHTS,
  RISK_MULTIPLIERS,
  getLevelFromScore,
  getStrategyForLevel,
  getAgentCountForLevel,
  generateReasoning,
} from "./complexity-core.js";

// Re-export types for backward compatibility
export type {
  ComplexityMetrics,
  ComplexityScore,
  ComplexityThresholds,
  ComplexityLevel,
  DelegationStrategy,
};

/**
 * Complexity Analyzer
 * Analyzes operations and calculates complexity scores
 */
export class ComplexityAnalyzer {
  private static readonly MAX_CALIBRATION_HISTORY = 1000;

  /**
   * CALIBRATED: Adjusted thresholds for balanced orchestration utilization
   * - simple: 15 - most tasks trigger single-agent
   * - moderate: 25 - tasks start triggering additional agents
   * - complex: 50 - complex tasks get multi-agent coordination
   * - enterprise: 100 - maximum complexity (only extreme cases)
   */
  private thresholds: ComplexityThresholds = { ...DEFAULT_THRESHOLDS };

  private operationWeights = { ...OPERATION_WEIGHTS };
  private riskMultipliers = { ...RISK_MULTIPLIERS };

  /**
   * Analyze operation complexity and return detailed metrics
   */
  analyzeComplexity(operation: string, context: unknown): ComplexityMetrics {
    const metrics: ComplexityMetrics = {
      fileCount: this.calculateFileCount(context),
      changeVolume: this.calculateChangeVolume(context),
      operationType: this.determineOperationType(operation),
      dependencies: this.calculateDependencies(context),
      riskLevel: this.assessRiskLevel(context),
      estimatedDuration: this.estimateDuration(context),
    };

    return metrics;
  }

  /**
   * Calculate complexity score and delegation strategy
   *
   * CALIBRATED: Weights increased to properly utilize orchestration
   * - File count: 4 pts/file (was 2) - better reflects multi-file complexity
   * - Change volume: 0.2/line (was 0.1) - better reflects code volume
   * - Dependencies: 5 each (was 3) - better reflects coordination needs
   */
  calculateComplexityScore(metrics: ComplexityMetrics): ComplexityScore {
    // Base score calculation
    let score = 0;

    // File count contribution (0-40 points)
    score += Math.min(metrics.fileCount * 4, 40);

    // Change volume contribution (0-50 points)
    score += Math.min(metrics.changeVolume / 5, 50);

    // Dependencies contribution (0-25 points)
    score += Math.min(metrics.dependencies * 5, 25);

    // Duration contribution (0-15 points)
    score += Math.min(metrics.estimatedDuration / 10, 15);

    // Operation type weight (multiplier)
    score *= this.operationWeights[metrics.operationType];

    // Risk level multiplier
    score *= this.riskMultipliers[metrics.riskLevel];

    // Normalize to 0-100
    score = Math.min(Math.max(score, 0), 100);

    // Determine level and strategy using core functions
    const level = getLevelFromScore(score, this.thresholds);
    const recommendedStrategy = getStrategyForLevel(level);
    const estimatedAgents = getAgentCountForLevel(level);

    // Generate reasoning using core function
    const reasoning = generateReasoning(metrics, score, level);

    return {
      score: Math.round(score),
      level,
      recommendedStrategy,
      estimatedAgents,
      reasoning,
    };
  }

  /**
   * Performance data structure for calibration
   */
  private calibrationHistory: Array<{
    complexityScore: number;
    actualDuration: number;
    estimatedDuration: number;
    success: boolean;
    timestamp: number;
  }> = [];

  /**
   * Update thresholds based on historical performance data
   * Analyzes: task score vs completion time vs success rate
   * to automatically adjust thresholds for better accuracy
   */
  updateThresholds(performanceData: unknown): void {
    if (!performanceData || typeof performanceData !== "object") {
      return;
    }

    const data = performanceData as {
      complexityScore?: number;
      actualDuration?: number;
      estimatedDuration?: number;
      success?: boolean;
      timestamp?: number;
    };

    if (data.complexityScore === undefined) {
      return;
    }

    this.calibrationHistory.push({
      complexityScore: data.complexityScore,
      actualDuration: data.actualDuration || 0,
      estimatedDuration: data.estimatedDuration || 30,
      success: data.success !== false,
      timestamp: data.timestamp || Date.now(),
    });

    if (this.calibrationHistory.length > ComplexityAnalyzer.MAX_CALIBRATION_HISTORY) {
      const removeCount = this.calibrationHistory.length - ComplexityAnalyzer.MAX_CALIBRATION_HISTORY + 100;
      this.calibrationHistory = this.calibrationHistory.slice(removeCount);
    }

    if (this.calibrationHistory.length < 10) {
      return;
    }

    const analysis = this.analyzeCalibrationData();
    this.applyCalibrationAnalysis(analysis);
  }

  /**
   * Analyze calibration data to find patterns
   */
  private analyzeCalibrationData(): {
    underestimated: boolean;
    overestimated: boolean;
    adjustmentFactor: number;
  } {
    let underestimated = 0;
    let overestimated = 0;
    let totalAdjustmentFactor = 0;

    for (const entry of this.calibrationHistory) {
      if (entry.actualDuration > entry.estimatedDuration * 1.5) {
        underestimated++;
        totalAdjustmentFactor += 0.05;
      } else if (entry.actualDuration < entry.estimatedDuration * 0.5) {
        overestimated++;
        totalAdjustmentFactor -= 0.05;
      }
    }

    return {
      underestimated: underestimated > this.calibrationHistory.length * 0.3,
      overestimated: overestimated > this.calibrationHistory.length * 0.3,
      adjustmentFactor: totalAdjustmentFactor / this.calibrationHistory.length,
    };
  }

  /**
   * Apply calibration analysis to adjust thresholds
   */
  private applyCalibrationAnalysis(analysis: {
    underestimated: boolean;
    overestimated: boolean;
    adjustmentFactor: number;
  }): void {
    const maxAdjustment = 10;

    if (analysis.underestimated) {
      const adjustment = Math.min(maxAdjustment, Math.abs(analysis.adjustmentFactor) * 100);
      this.thresholds.simple = Math.max(10, this.thresholds.simple - adjustment);
      this.thresholds.moderate = Math.max(20, this.thresholds.moderate - adjustment);
      this.thresholds.complex = Math.max(40, this.thresholds.complex - adjustment);
    } else if (analysis.overestimated) {
      const adjustment = Math.min(maxAdjustment, Math.abs(analysis.adjustmentFactor) * 100);
      this.thresholds.simple = Math.min(40, this.thresholds.simple + adjustment);
      this.thresholds.moderate = Math.min(60, this.thresholds.moderate + adjustment);
      this.thresholds.complex = Math.min(90, this.thresholds.complex + adjustment);
    }
  }

  /**
   * Get calibration history for diagnostics
   */
  getCalibrationHistory(): ReadonlyArray<{
    complexityScore: number;
    actualDuration: number;
    estimatedDuration: number;
    success: boolean;
    timestamp: number;
  }> {
    return [...this.calibrationHistory];
  }

  /**
   * Reset calibration history
   */
  resetCalibration(): void {
    this.calibrationHistory = [];
  }

  /**
   * Get current complexity thresholds
   */
  getThresholds(): ComplexityThresholds {
    return { ...this.thresholds };
  }

  /**
   * Set custom complexity thresholds
   */
  setThresholds(thresholds: Partial<ComplexityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Set operation type weights (from calibrator)
   */
  setOperationWeights(weights: Partial<Record<string, number>>): void {
    for (const [key, value] of Object.entries(weights)) {
      if (typeof value === "number") {
        (this.operationWeights as Record<string, number>)[key] = value;
      }
    }
  }

  /**
   * Set risk level multipliers (from calibrator)
   */
  setRiskMultipliers(multipliers: Partial<Record<string, number>>): void {
    for (const [key, value] of Object.entries(multipliers)) {
      if (typeof value === "number") {
        (this.riskMultipliers as Record<string, number>)[key] = value;
      }
    }
  }

  /**
   * Calibrate analyzer based on calibrator recommendations
   */
  calibrate(settings: {
    thresholds?: Partial<ComplexityThresholds>;
    operationWeights?: Partial<Record<string, number>>;
    riskMultipliers?: Partial<Record<string, number>>;
  }): void {
    if (settings.thresholds) {
      this.setThresholds(settings.thresholds);
    }
    if (settings.operationWeights) {
      this.setOperationWeights(settings.operationWeights);
    }
    if (settings.riskMultipliers) {
      this.setRiskMultipliers(settings.riskMultipliers);
    }
  }

  // Private helper methods
  private calculateFileCount(context: unknown): number {
    const ctx = context as { files?: string[] };
    return ctx?.files?.length || 1;
  }

  private calculateChangeVolume(context: unknown): number {
    const ctx = context as {
      changes?: { added?: number; deleted?: number; modified?: number };
      linesChanged?: number;
      changeVolume?: number;
    };
    // Support both formats: context.changes or context.linesChanged
    if (ctx?.linesChanged !== undefined) {
      return ctx.linesChanged;
    }
    if (ctx?.changeVolume !== undefined) {
      return ctx.changeVolume;
    }
    const changes = ctx?.changes || {};
    return (changes.added || 0) + (changes.deleted || 0) + (changes.modified || 0);
  }

  private determineOperationType(operation: string): ComplexityMetrics["operationType"] {
    const op = operation.toLowerCase();
    if (op.includes("refactor")) return "refactor";
    if (op.includes("debug")) return "debug";
    if (op.includes("test")) return "test";
    if (op.includes("analyze")) return "analyze";
    if (op.includes("create")) return "create";
    return "modify";
  }

  private calculateDependencies(context: unknown): number {
    const ctx = context as { dependencies?: string[]; dependencyCount?: number };
    // Support both formats: context.dependencies array or context.dependencyCount
    if (ctx?.dependencyCount !== undefined) {
      return ctx.dependencyCount;
    }
    return ctx?.dependencies?.length || 0;
  }

  private assessRiskLevel(context: unknown): ComplexityMetrics["riskLevel"] {
    const ctx = context as { riskLevel?: string; critical?: boolean; highRisk?: boolean };
    if (ctx?.critical || ctx?.riskLevel === "critical") return "critical";
    if (ctx?.highRisk || ctx?.riskLevel === "high") return "high";
    if (ctx?.riskLevel === "medium") return "medium";
    return "low";
  }

  private estimateDuration(context: unknown): number {
    const ctx = context as { estimatedDuration?: number; estimatedTime?: number };
    return ctx?.estimatedDuration || ctx?.estimatedTime || 30;
  }
}

// Singleton instance for convenience
let analyzerInstance: ComplexityAnalyzer | null = null;

export function getComplexityAnalyzer(): ComplexityAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new ComplexityAnalyzer();
  }
  return analyzerInstance;
}

// Backward compatibility: export singleton instance
export const complexityAnalyzer = getComplexityAnalyzer();
