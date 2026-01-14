/**
 * StringRay Framework v1.0.0 - Complexity Analyzer
 *
 * Assesses operation complexity to determine optimal agent delegation strategy.
 * Implements metrics-based complexity scoring for intelligent task distribution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export interface ComplexityMetrics {
  fileCount: number;
  changeVolume: number; // lines changed/added/deleted
  operationType:
    | "create"
    | "modify"
    | "refactor"
    | "analyze"
    | "debug"
    | "test";
  dependencies: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  estimatedDuration: number; // minutes
}

export interface ComplexityScore {
  score: number; // 0-100
  level: "simple" | "moderate" | "complex" | "enterprise";
  recommendedStrategy: "single-agent" | "multi-agent" | "orchestrator-led";
  estimatedAgents: number;
  reasoning: string[];
}

export interface ComplexityThresholds {
  simple: number; // score <= 25
  moderate: number; // score <= 50
  complex: number; // score <= 95
  enterprise: number; // score > 95
}

export class ComplexityAnalyzer {
  private thresholds: ComplexityThresholds = {
    simple: 25,
    moderate: 50,
    complex: 95,
    enterprise: 100,
  };

  private operationWeights = {
    create: 1.0,
    modify: 1.2,
    refactor: 1.8,
    analyze: 1.5,
    debug: 2.0,
    test: 1.3,
  };

  private riskMultipliers = {
    low: 0.8,
    medium: 1.0,
    high: 1.3,
    critical: 1.6,
  };

  /**
   * Analyze operation complexity and return detailed metrics
   */
  analyzeComplexity(operation: string, context: any): ComplexityMetrics {
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
   */
  calculateComplexityScore(metrics: ComplexityMetrics): ComplexityScore {
    // Base score calculation
    let score = 0;

    // File count contribution (0-20 points)
    score += Math.min(metrics.fileCount * 2, 20);

    // Change volume contribution (0-25 points)
    score += Math.min(metrics.changeVolume / 10, 25);

    // Operation type weight (multiplier)
    score *= this.operationWeights[metrics.operationType];

    // Dependencies contribution (0-15 points)
    score += Math.min(metrics.dependencies * 3, 15);

    // Risk level multiplier
    score *= this.riskMultipliers[metrics.riskLevel];

    // Duration contribution (0-15 points)
    score += Math.min(metrics.estimatedDuration / 10, 15);

    // Normalize to 0-100
    score = Math.min(Math.max(score, 0), 100);

    // Determine level and strategy
    let level: ComplexityScore["level"];
    let recommendedStrategy: ComplexityScore["recommendedStrategy"];
    let estimatedAgents: number;

    if (score <= this.thresholds.simple) {
      level = "simple";
      recommendedStrategy = "single-agent";
      estimatedAgents = 1;
    } else if (score <= this.thresholds.moderate) {
      level = "moderate";
      recommendedStrategy = "single-agent";
      estimatedAgents = 1;
    } else if (score <= this.thresholds.complex) {
      level = "complex";
      recommendedStrategy = "multi-agent";
      estimatedAgents = 2;
    } else {
      level = "enterprise";
      recommendedStrategy = "orchestrator-led";
      estimatedAgents = 3;
    }

    const reasoning = this.generateReasoning(metrics, score, level);

    return {
      score: Math.round(score),
      level,
      recommendedStrategy,
      estimatedAgents,
      reasoning,
    };
  }

  updateThresholds(performanceData: any): void {
    console.log(
      "🔄 Updating complexity thresholds based on performance data...",
    );
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
    console.log("✅ Complexity thresholds updated:", this.thresholds);
  }

  // Private helper methods

  private calculateFileCount(context: any): number {
    if (context.files && Array.isArray(context.files)) {
      return context.files.length;
    }
    if (context.fileCount) {
      return context.fileCount;
    }

    const description = context.description || "";
    const desc = description.toLowerCase();
    if (desc.includes("single file")) return 1;
    if (desc.includes("multiple files")) return 5;
    if (desc.includes("entire module")) return 10;
    if (desc.includes("system-wide")) return 20;
    return 1;
  }

  private calculateChangeVolume(context: any): number {
    if (context.changeVolume) {
      return context.changeVolume;
    }
    if (context.linesChanged) {
      return context.linesChanged;
    }

    const operation = context.operation || "";
    if (operation.includes("create")) return 50;
    if (operation.includes("modify")) return 100;
    if (operation.includes("refactor")) return 200;
    if (operation.includes("analyze")) return 0;
    if (operation.includes("debug")) return 20;
    if (operation.includes("test")) return 30;
    return 50;
  }

  private determineOperationType(
    operation: string,
  ): ComplexityMetrics["operationType"] {
    const op = operation.toLowerCase();
    if (op.includes("create") || op.includes("add") || op.includes("new"))
      return "create";
    if (op.includes("refactor") || op.includes("restructure"))
      return "refactor";
    if (
      op.includes("analyze") ||
      op.includes("review") ||
      op.includes("examine")
    )
      return "analyze";
    if (op.includes("debug") || op.includes("fix") || op.includes("resolve"))
      return "debug";
    if (op.includes("test")) return "test";
    return "modify"; // default
  }

  private calculateDependencies(context: any): number {
    if (context.dependencies && Array.isArray(context.dependencies)) {
      return context.dependencies.length;
    }
    if (context.dependencyCount) {
      return context.dependencyCount;
    }

    const description = context.description || "";
    const desc = description.toLowerCase();
    if (desc.includes("independent")) return 0;
    if (desc.includes("depends on")) return 3;
    if (desc.includes("multiple dependencies")) return 5;
    if (desc.includes("complex dependencies")) return 8;
    return 1;
  }

  private assessRiskLevel(context: any): ComplexityMetrics["riskLevel"] {
    if (context.riskLevel) {
      return context.riskLevel;
    }

    const operation = context.operation || "";
    const description = context.description || "";

    if (
      operation.includes("database") ||
      operation.includes("migration") ||
      description.includes("breaking change") ||
      description.includes("critical")
    ) {
      return "critical";
    }

    if (
      operation.includes("api") ||
      operation.includes("security") ||
      description.includes("complex") ||
      description.includes("multiple files")
    ) {
      return "high";
    }

    if (
      operation.includes("documentation") ||
      operation.includes("comment") ||
      description.includes("simple") ||
      description.includes("single file")
    ) {
      return "low";
    }

    return "medium";
  }

  private estimateDuration(context: any): number {
    if (context.estimatedDuration) {
      return context.estimatedDuration;
    }

    const fileCount = this.calculateFileCount(context);
    const changeVolume = this.calculateChangeVolume(context);
    const dependencies = this.calculateDependencies(context);

    return Math.round(fileCount * 15 + changeVolume * 0.1 + dependencies * 5);
  }

  private generateReasoning(
    metrics: ComplexityMetrics,
    score: number,
    level: string,
  ): string[] {
    const reasoning: string[] = [];

    if (metrics.fileCount > 5) {
      reasoning.push(
        `High file count (${metrics.fileCount}) indicates distributed changes`,
      );
    }

    if (metrics.changeVolume > 100) {
      reasoning.push(
        `Large change volume (${metrics.changeVolume} lines) suggests significant impact`,
      );
    }

    if (
      metrics.operationType === "refactor" ||
      metrics.operationType === "debug"
    ) {
      reasoning.push(
        `Operation type '${metrics.operationType}' typically requires specialized handling`,
      );
    }

    if (metrics.dependencies > 3) {
      reasoning.push(
        `Multiple dependencies (${metrics.dependencies}) necessitate coordinated execution`,
      );
    }

    if (metrics.riskLevel === "high" || metrics.riskLevel === "critical") {
      reasoning.push(
        `Risk level '${metrics.riskLevel}' requires careful orchestration`,
      );
    }

    if (metrics.estimatedDuration > 60) {
      reasoning.push(
        `Estimated duration (${metrics.estimatedDuration}min) suggests complex operation`,
      );
    }

    reasoning.push(
      `Overall complexity score: ${Math.round(score)} (${level} level)`,
    );

    return reasoning;
  }
}

// Export singleton instance
export const complexityAnalyzer = new ComplexityAnalyzer();
