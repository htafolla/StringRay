/**
 * StringRay Framework v1.0.0 - Predictive Analytics System
 *
 * Analyzes agent performance patterns and predicts optimal delegation strategies.
 * Uses historical data to optimize task assignment and improve framework efficiency.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export interface AgentPerformanceMetrics {
  agentId: string;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  successRate: number;
  specializationScore: Record<string, number>; // task_type -> score
  recentPerformance: number[]; // last N task outcomes (1=success, 0=failure)
  averageComplexity: number;
  lastActive: number;
}

export interface TaskPrediction {
  taskId: string;
  taskType: string;
  complexity: number;
  predictedAgents: Array<{
    agentId: string;
    confidence: number;
    estimatedDuration: number;
    successProbability: number;
  }>;
  recommendedAgent: string;
  expectedDuration: number;
  riskLevel: "low" | "medium" | "high";
}

export interface PerformancePattern {
  patternId: string;
  description: string;
  conditions: Record<string, any>;
  impact: "positive" | "negative" | "neutral";
  confidence: number;
  recommendations: string[];
}

export interface AnalyticsReport {
  timestamp: number;
  agentMetrics: AgentPerformanceMetrics[];
  patterns: PerformancePattern[];
  recommendations: string[];
  overallEfficiency: number;
  bottleneckAgents: string[];
  underutilizedAgents: string[];
}

export class StringRayPredictiveAnalytics {
  private agentMetrics = new Map<string, AgentPerformanceMetrics>();
  private taskHistory: Array<{
    taskId: string;
    agentId: string;
    taskType: string;
    complexity: number;
    duration: number;
    success: boolean;
    timestamp: number;
  }> = [];
  private performancePatterns: PerformancePattern[] = [];
  private readonly maxHistorySize = 1000;
  private readonly recentTasksWindow = 20;

  /**
   * Record task execution result for analytics
   */
  recordTaskExecution(
    taskId: string,
    agentId: string,
    taskType: string,
    complexity: number,
    duration: number,
    success: boolean,
  ): void {
    this.taskHistory.push({
      taskId,
      agentId,
      taskType,
      complexity,
      duration,
      success,
      timestamp: Date.now(),
    });

    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(-this.maxHistorySize);
    }

    this.updateAgentMetrics(agentId, taskType, complexity, duration, success);

    if (this.taskHistory.length % 50 === 0) {
      this.analyzePatterns();
    }
  }

  /**
   * Predict optimal agent for a task
   */
  predictOptimalAgent(
    taskId: string,
    taskType: string,
    complexity: number,
  ): TaskPrediction {
    const availableAgents = Array.from(this.agentMetrics.values());
    const predictions = availableAgents.map((agent) => {
      const confidence = this.calculateAgentConfidence(
        agent,
        taskType,
        complexity,
      );
      const estimatedDuration = this.estimateTaskDuration(
        agent,
        taskType,
        complexity,
      );
      const successProbability = this.calculateSuccessProbability(
        agent,
        taskType,
        complexity,
      );

      return {
        agentId: agent.agentId,
        confidence,
        estimatedDuration,
        successProbability,
      };
    });

    predictions.sort((a, b) => {
      const scoreA = a.confidence * a.successProbability;
      const scoreB = b.confidence * b.successProbability;
      return scoreB - scoreA;
    });

    const recommendedAgent = predictions[0]?.agentId || "unknown";
    const expectedDuration = predictions[0]?.estimatedDuration || 0;
    const riskLevel = this.calculateRiskLevel(predictions[0]);

    return {
      taskId,
      taskType,
      complexity,
      predictedAgents: predictions.slice(0, 3),
      recommendedAgent,
      expectedDuration,
      riskLevel,
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  generateAnalyticsReport(): AnalyticsReport {
    const agentMetrics = Array.from(this.agentMetrics.values());
    const patterns = [...this.performancePatterns];
    const recommendations = this.generateRecommendations(agentMetrics);
    const overallEfficiency = this.calculateOverallEfficiency(agentMetrics);
    const bottleneckAgents = this.identifyBottlenecks(agentMetrics);
    const underutilizedAgents = this.identifyUnderutilizedAgents(agentMetrics);

    return {
      timestamp: Date.now(),
      agentMetrics,
      patterns,
      recommendations,
      overallEfficiency,
      bottleneckAgents,
      underutilizedAgents,
    };
  }

  /**
   * Get agent performance metrics
   */
  getAgentMetrics(agentId: string): AgentPerformanceMetrics | null {
    return this.agentMetrics.get(agentId) || null;
  }

  /**
   * Get all agent performance metrics
   */
  getAllAgentMetrics(): AgentPerformanceMetrics[] {
    return Array.from(this.agentMetrics.values());
  }

  /**
   * Clear all analytics data
   */
  clearAnalytics(): void {
    this.agentMetrics.clear();
    this.taskHistory = [];
    this.performancePatterns = [];
  }

  private updateAgentMetrics(
    agentId: string,
    taskType: string,
    complexity: number,
    duration: number,
    success: boolean,
  ): void {
    const existing = this.agentMetrics.get(agentId);

    if (!existing) {
      const metrics: AgentPerformanceMetrics = {
        agentId,
        totalTasks: 1,
        successfulTasks: success ? 1 : 0,
        failedTasks: success ? 0 : 1,
        averageExecutionTime: duration,
        successRate: success ? 1 : 0,
        specializationScore: { [taskType]: success ? 1 : 0 },
        recentPerformance: [success ? 1 : 0],
        averageComplexity: complexity,
        lastActive: Date.now(),
      };
      this.agentMetrics.set(agentId, metrics);
    } else {
      const totalTasks = existing.totalTasks + 1;
      const successfulTasks = existing.successfulTasks + (success ? 1 : 0);
      const failedTasks = existing.failedTasks + (success ? 0 : 1);

      const currentScore = existing.specializationScore[taskType] || 0;
      const newScore =
        (currentScore * existing.totalTasks + (success ? 1 : 0)) / totalTasks;
      existing.specializationScore[taskType] = newScore;

      existing.recentPerformance.push(success ? 1 : 0);
      if (existing.recentPerformance.length > this.recentTasksWindow) {
        existing.recentPerformance = existing.recentPerformance.slice(
          -this.recentTasksWindow,
        );
      }

      existing.averageExecutionTime =
        (existing.averageExecutionTime * existing.totalTasks + duration) /
        totalTasks;
      existing.averageComplexity =
        (existing.averageComplexity * existing.totalTasks + complexity) /
        totalTasks;

      existing.totalTasks = totalTasks;
      existing.successfulTasks = successfulTasks;
      existing.failedTasks = failedTasks;
      existing.successRate = successfulTasks / totalTasks;
      existing.lastActive = Date.now();
    }
  }

  private calculateAgentConfidence(
    agent: AgentPerformanceMetrics,
    taskType: string,
    complexity: number,
  ): number {
    let confidence = 0;

    const specializationScore = agent.specializationScore[taskType] || 0;
    confidence += specializationScore * 0.4;

    const recentSuccessRate =
      agent.recentPerformance.reduce((a, b) => a + b, 0) /
      agent.recentPerformance.length;
    confidence += recentSuccessRate * 0.3;

    confidence += agent.successRate * 0.2;

    const complexityMatch =
      1 -
      Math.abs(agent.averageComplexity - complexity) /
        Math.max(agent.averageComplexity, complexity);
    confidence += complexityMatch * 0.1;

    return Math.min(confidence, 1);
  }

  private estimateTaskDuration(
    agent: AgentPerformanceMetrics,
    taskType: string,
    complexity: number,
  ): number {
    let estimatedDuration = agent.averageExecutionTime;

    const specializationBonus =
      (agent.specializationScore[taskType] || 0) * 0.2;
    estimatedDuration *= 1 - specializationBonus;

    const complexityRatio = complexity / agent.averageComplexity;
    estimatedDuration *= complexityRatio;

    const recentVariance = this.calculateRecentVariance(agent);
    estimatedDuration *= 1 + recentVariance * 0.1;

    return Math.max(estimatedDuration, 10);
  }

  private calculateSuccessProbability(
    agent: AgentPerformanceMetrics,
    taskType: string,
    complexity: number,
  ): number {
    let probability = agent.successRate;

    const specializationBoost =
      (agent.specializationScore[taskType] || 0) * 0.2;
    probability += specializationBoost;

    const complexityPenalty =
      Math.abs(agent.averageComplexity - complexity) / 10;
    probability -= Math.min(complexityPenalty, 0.3);

    const recentSuccessRate =
      agent.recentPerformance.reduce((a, b) => a + b, 0) /
      agent.recentPerformance.length;
    probability = probability * 0.7 + recentSuccessRate * 0.3;

    return Math.max(0, Math.min(probability, 1));
  }

  private calculateRiskLevel(prediction: any): "low" | "medium" | "high" {
    if (!prediction) return "high";

    const { confidence, successProbability } = prediction;
    const riskScore = 1 - confidence + (1 - successProbability);

    if (riskScore < 0.3) return "low";
    if (riskScore < 0.7) return "medium";
    return "high";
  }

  private calculateRecentVariance(agent: AgentPerformanceMetrics): number {
    if (agent.recentPerformance.length < 2) return 0;

    const durations = this.taskHistory
      .filter((t) => t.agentId === agent.agentId)
      .slice(-10)
      .map((t) => t.duration);

    if (durations.length < 2) return 0;

    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance =
      durations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) /
      durations.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private analyzePatterns(): void {
    this.performancePatterns = [];

    const taskTypeStats = new Map<
      string,
      { total: number; success: number; avgDuration: number }
    >();

    this.taskHistory.forEach((task) => {
      const stats = taskTypeStats.get(task.taskType) || {
        total: 0,
        success: 0,
        avgDuration: 0,
      };
      stats.total++;
      if (task.success) stats.success++;
      stats.avgDuration =
        (stats.avgDuration * (stats.total - 1) + task.duration) / stats.total;
      taskTypeStats.set(task.taskType, stats);
    });

    taskTypeStats.forEach((stats, taskType) => {
      const successRate = stats.success / stats.total;

      if (successRate > 0.9) {
        this.performancePatterns.push({
          patternId: `high_success_${taskType}`,
          description: `${taskType} tasks have high success rate (${(successRate * 100).toFixed(1)}%)`,
          conditions: { taskType, successRate: successRate > 0.9 },
          impact: "positive",
          confidence: Math.min(successRate, 0.95),
          recommendations: [
            `Prioritize ${taskType} tasks for high-reliability agents`,
          ],
        });
      }

      if (stats.avgDuration > 5000) {
        this.performancePatterns.push({
          patternId: `slow_tasks_${taskType}`,
          description: `${taskType} tasks are consistently slow (avg ${stats.avgDuration.toFixed(0)}ms)`,
          conditions: { taskType, avgDuration: stats.avgDuration > 5000 },
          impact: "negative",
          confidence: 0.8,
          recommendations: [
            `Consider optimizing ${taskType} task processing`,
            `Evaluate agent assignment for ${taskType} tasks`,
          ],
        });
      }
    });

    const agentWorkload = new Map<string, number>();
    const recentTasks = this.taskHistory.slice(-100);

    recentTasks.forEach((task) => {
      agentWorkload.set(
        task.agentId,
        (agentWorkload.get(task.agentId) || 0) + 1,
      );
    });

    const totalTasks = recentTasks.length;
    agentWorkload.forEach((workload, agentId) => {
      const percentage = workload / totalTasks;

      if (percentage > 0.4) {
        this.performancePatterns.push({
          patternId: `overloaded_agent_${agentId}`,
          description: `Agent ${agentId} is handling ${(percentage * 100).toFixed(1)}% of recent tasks`,
          conditions: { agentId, workloadPercentage: percentage > 0.4 },
          impact: "negative",
          confidence: 0.9,
          recommendations: [
            `Redistribute tasks from overloaded agent ${agentId}`,
            `Consider adding more agents for load balancing`,
          ],
        });
      }

      if (percentage < 0.05) {
        this.performancePatterns.push({
          patternId: `underutilized_agent_${agentId}`,
          description: `Agent ${agentId} is underutilized (${(percentage * 100).toFixed(1)}% of tasks)`,
          conditions: { agentId, workloadPercentage: percentage < 0.05 },
          impact: "neutral",
          confidence: 0.8,
          recommendations: [
            `Consider assigning more tasks to agent ${agentId}`,
            `Evaluate if agent specialization matches current workload`,
          ],
        });
      }
    });
  }

  private generateRecommendations(
    agentMetrics: AgentPerformanceMetrics[],
  ): string[] {
    const recommendations: string[] = [];

    const topPerformers = agentMetrics
      .filter((a) => a.totalTasks > 5)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3);

    const underPerformers = agentMetrics
      .filter((a) => a.totalTasks > 5 && a.successRate < 0.7)
      .sort((a, b) => a.successRate - b.successRate);

    if (topPerformers.length > 0) {
      recommendations.push(
        `Top performing agents: ${topPerformers.map((a) => a.agentId).join(", ")}`,
      );
    }

    if (underPerformers.length > 0) {
      recommendations.push(
        `Consider reviewing performance of: ${underPerformers.map((a) => a.agentId).join(", ")}`,
      );
    }

    const specializationOpportunities = agentMetrics
      .filter((a) => Object.keys(a.specializationScore).length > 2)
      .map((a) => {
        const entries = Object.entries(a.specializationScore);
        const topEntry = entries.sort(([, a], [, b]) => b - a)[0];
        return {
          agentId: a.agentId,
          topSpecialty: topEntry ? topEntry[0] : "general",
        };
      });

    if (specializationOpportunities.length > 0) {
      recommendations.push(
        "Leverage agent specializations: " +
          specializationOpportunities
            .map((s) => `${s.agentId} excels at ${s.topSpecialty}`)
            .join("; "),
      );
    }

    return recommendations;
  }

  private calculateOverallEfficiency(
    agentMetrics: AgentPerformanceMetrics[],
  ): number {
    if (agentMetrics.length === 0) return 0;

    const totalTasks = agentMetrics.reduce((sum, a) => sum + a.totalTasks, 0);
    const weightedSuccessRate =
      agentMetrics.reduce((sum, a) => sum + a.successRate * a.totalTasks, 0) /
      totalTasks;

    const specializationDiversity =
      agentMetrics.reduce(
        (sum, a) => sum + Object.keys(a.specializationScore).length,
        0,
      ) / agentMetrics.length;

    return weightedSuccessRate * 0.7 + (specializationDiversity / 10) * 0.3;
  }

  private identifyBottlenecks(
    agentMetrics: AgentPerformanceMetrics[],
  ): string[] {
    return agentMetrics
      .filter((a) => a.totalTasks > 10)
      .filter((a) => {
        const recentTasks = this.taskHistory
          .filter((t) => t.agentId === a.agentId)
          .slice(-20);

        if (recentTasks.length < 5) return false;

        const avgDuration =
          recentTasks.reduce((sum, t) => sum + t.duration, 0) /
          recentTasks.length;
        const successRate =
          recentTasks.filter((t) => t.success).length / recentTasks.length;

        return avgDuration > 3000 || successRate < 0.7;
      })
      .map((a) => a.agentId);
  }

  private identifyUnderutilizedAgents(
    agentMetrics: AgentPerformanceMetrics[],
  ): string[] {
    const totalTasks = agentMetrics.reduce((sum, a) => sum + a.totalTasks, 0);
    const avgTasksPerAgent = totalTasks / agentMetrics.length;

    return agentMetrics
      .filter((a) => a.totalTasks < avgTasksPerAgent * 0.5)
      .filter((a) => Date.now() - a.lastActive < 24 * 60 * 60 * 1000)
      .map((a) => a.agentId);
  }
}

export const predictiveAnalytics = new StringRayPredictiveAnalytics();
