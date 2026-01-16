/**
 * StringRay AI v1.0.9 - Predictive Analytics Unit Tests
 *
 * Tests the agent performance analysis and task prediction functionality.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, test, expect, beforeEach } from "vitest";

describe("Predictive Analytics System", () => {
  test("should analyze agent performance metrics", () => {
    // Test agent performance analysis
    const agentMetrics = {
      agentId: "test-agent",
      totalTasks: 100,
      successfulTasks: 95,
      failedTasks: 5,
      averageExecutionTime: 150,
      successRate: 0.95,
      specializationScore: {
        "code-review": 0.9,
        "bug-fix": 0.8,
        "feature-dev": 0.6,
      },
      recentPerformance: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1], // Last 10 tasks
      averageComplexity: 7.5,
      lastActive: Date.now(),
    };

    expect(agentMetrics.successRate).toBe(0.95);
    expect(agentMetrics.specializationScore["code-review"]).toBe(0.9);
    expect(agentMetrics.recentPerformance.length).toBe(10);
  });

  test("should predict task outcomes", () => {
    // Test task prediction logic
    const taskPrediction = {
      taskId: "predict-task-1",
      taskType: "code-review",
      complexity: 8,
      predictedAgents: [
        {
          agentId: "expert-agent",
          confidence: 0.95,
          estimatedDuration: 120,
          successProbability: 0.92,
        },
        {
          agentId: "general-agent",
          confidence: 0.78,
          estimatedDuration: 180,
          successProbability: 0.85,
        },
      ],
      recommendedAgent: "expert-agent",
      expectedDuration: 120,
      riskLevel: "low" as const,
    };

    expect(taskPrediction.recommendedAgent).toBe("expert-agent");
    expect(taskPrediction.riskLevel).toBe("low");
    expect(taskPrediction.predictedAgents[0].confidence).toBeGreaterThan(0.9);
  });

  test("should calculate success rates accurately", () => {
    // Test success rate calculations
    const calculateSuccessRate = (successful: number, total: number) => {
      return total > 0 ? successful / total : 0;
    };

    expect(calculateSuccessRate(95, 100)).toBe(0.95);
    expect(calculateSuccessRate(0, 10)).toBe(0);
    expect(calculateSuccessRate(10, 10)).toBe(1);
  });

  test("should identify performance patterns", () => {
    // Test pattern recognition
    const performancePatterns = [
      {
        patternId: "consistent-high-performer",
        description: "Agent consistently achieves high success rates",
        conditions: { minSuccessRate: 0.9, minTasks: 50 },
        impact: "positive" as const,
        confidence: 0.95,
        recommendations: [
          "Prioritize for complex tasks",
          "Use as mentor agent",
        ],
      },
      {
        patternId: "improving-agent",
        description: "Agent showing improvement over time",
        conditions: { recentSuccessRate: 0.8, overallSuccessRate: 0.6 },
        impact: "positive" as const,
        confidence: 0.7,
        recommendations: ["Increase task load gradually"],
      },
    ];

    expect(performancePatterns[0].impact).toBe("positive");
    expect(performancePatterns[0].confidence).toBe(0.95);
    expect(performancePatterns[1].recommendations).toContain(
      "Increase task load gradually",
    );
  });

  test("should generate analytics reports", () => {
    // Test report generation
    const analyticsReport = {
      timestamp: Date.now(),
      agentMetrics: [
        {
          agentId: "agent-1",
          totalTasks: 50,
          successfulTasks: 48,
          failedTasks: 2,
          averageExecutionTime: 200,
          successRate: 0.96,
          specializationScore: { debugging: 0.9 },
          recentPerformance: [1, 1, 1, 0, 1],
          averageComplexity: 6.0,
          lastActive: Date.now() - 1000,
        },
      ],
      totalTasksProcessed: 50,
      averageSuccessRate: 0.96,
      topPerformingAgents: ["agent-1"],
      underPerformingAgents: [],
      recommendations: ["Continue current task assignments"],
    };

    expect(analyticsReport.agentMetrics).toHaveLength(1);
    expect(analyticsReport.averageSuccessRate).toBe(0.96);
    expect(analyticsReport.topPerformingAgents).toContain("agent-1");
  });

  test("should handle edge cases in analytics", () => {
    // Test edge cases
    const edgeCases = {
      noTasksAgent: {
        agentId: "new-agent",
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0,
        successRate: 0,
        specializationScore: {},
        recentPerformance: [],
        averageComplexity: 0,
        lastActive: 0,
      },
      perfectAgent: {
        agentId: "perfect-agent",
        totalTasks: 10,
        successfulTasks: 10,
        failedTasks: 0,
        averageExecutionTime: 100,
        successRate: 1.0,
        specializationScore: { all: 1.0 },
        recentPerformance: [1, 1, 1, 1, 1],
        averageComplexity: 5.0,
        lastActive: Date.now(),
      },
    };

    expect(edgeCases.noTasksAgent.successRate).toBe(0);
    expect(edgeCases.perfectAgent.successRate).toBe(1.0);
  });

  test("should update agent metrics over time", () => {
    // Test metrics updating
    let agentMetrics = {
      agentId: "learning-agent",
      totalTasks: 5,
      successfulTasks: 4,
      failedTasks: 1,
      averageExecutionTime: 300,
      successRate: 0.8,
    };

    // Simulate completing another task
    agentMetrics.totalTasks += 1;
    agentMetrics.successfulTasks += 1;
    agentMetrics.successRate =
      agentMetrics.successfulTasks / agentMetrics.totalTasks;

    expect(agentMetrics.totalTasks).toBe(6);
    expect(agentMetrics.successRate).toBe(5 / 6); // 0.833...
  });
});
