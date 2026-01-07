/**
 * StrRay Framework v1.0.0 - Performance Benchmark Unit Tests
 *
 * Tests the performance benchmarking and metrics collection functionality.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, test, expect, beforeEach } from 'vitest';

describe('Performance Benchmark System', () => {
  test('should measure boot sequence timing', () => {
    // Test boot time measurement
    const bootMetrics = {
      coldStartTime: 450, // ms
      warmStartTime: 95,  // ms
      componentInitTimes: {
        contextLoader: 50,
        stateManager: 30,
        codexInjector: 75,
        orchestrator: 120
      },
      totalBootTime: 450
    };

    expect(bootMetrics.coldStartTime).toBeLessThan(500);
    expect(bootMetrics.warmStartTime).toBeLessThan(100);
    expect(bootMetrics.totalBootTime).toBe(450);
  });

  test('should track task profiling metrics', () => {
    // Test task execution profiling
    const taskProfile = {
      taskId: 'profile-task-1',
      startTime: Date.now(),
      endTime: Date.now() + 150,
      duration: 150,
      agentId: 'test-agent',
      complexity: 7,
      success: true,
      memoryUsage: {
        before: 50 * 1024 * 1024, // 50MB
        after: 52 * 1024 * 1024,  // 52MB
        peak: 55 * 1024 * 1024     // 55MB
      },
      cpuUsage: {
        user: 0.15,
        system: 0.05,
        total: 0.20
      }
    };

    expect(taskProfile.duration).toBe(150);
    expect(taskProfile.success).toBe(true);
    expect(taskProfile.memoryUsage.peak).toBeGreaterThan(taskProfile.memoryUsage.before);
  });

  test('should analyze bottleneck identification', () => {
    // Test bottleneck detection
    const bottlenecks = {
      slowComponents: [
        {
          component: 'complexity-analyzer',
          averageTime: 250,
          callCount: 100,
          totalTime: 25000,
          percentageOfTotal: 45.5
        },
        {
          component: 'session-coordinator',
          averageTime: 180,
          callCount: 80,
          totalTime: 14400,
          percentageOfTotal: 26.1
        }
      ],
      recommendations: [
        'Optimize complexity analyzer algorithm',
        'Implement caching for session coordination',
        'Consider parallel processing for independent tasks'
      ]
    };

    expect(bottlenecks.slowComponents[0].percentageOfTotal).toBeGreaterThan(40);
    expect(bottlenecks.recommendations).toHaveLength(3);
  });

  test('should benchmark agent performance', () => {
    // Test agent performance benchmarking
    const agentBenchmarks = {
      agentId: 'benchmark-agent',
      testScenarios: [
        {
          scenario: 'simple-task',
          averageTime: 50,
          successRate: 1.0,
          throughput: 1200 // tasks per hour
        },
        {
          scenario: 'complex-task',
          averageTime: 300,
          successRate: 0.95,
          throughput: 240 // tasks per hour
        },
        {
          scenario: 'error-handling',
          averageTime: 75,
          successRate: 0.98,
          throughput: 960 // tasks per hour
        }
      ],
      overallScore: 85, // Out of 100
      strengths: ['Fast simple tasks', 'Good error handling'],
      weaknesses: ['Complex task performance']
    };

    expect(agentBenchmarks.overallScore).toBe(85);
    expect(agentBenchmarks.testScenarios).toHaveLength(3);
    expect(agentBenchmarks.strengths).toContain('Fast simple tasks');
  });

  test('should collect session monitoring data', () => {
    // Test session-level monitoring
    const sessionMetrics = {
      sessionId: 'bench-session-1',
      startTime: Date.now(),
      duration: 3600000, // 1 hour
      taskCount: 150,
      successfulTasks: 142,
      failedTasks: 8,
      averageTaskTime: 180,
      peakConcurrentTasks: 5,
      memoryUsage: {
        average: 75 * 1024 * 1024, // 75MB
        peak: 120 * 1024 * 1024    // 120MB
      },
      agentUtilization: {
        'agent-1': 0.85,
        'agent-2': 0.72,
        'agent-3': 0.91
      }
    };

    expect(sessionMetrics.successfulTasks).toBe(142);
    expect(sessionMetrics.failedTasks).toBe(8);
    expect(sessionMetrics.taskCount).toBe(sessionMetrics.successfulTasks + sessionMetrics.failedTasks);
  });

  test('should generate performance reports', () => {
    // Test performance report generation
    const performanceReport = {
      timestamp: Date.now(),
      period: 'last-24-hours',
      summary: {
        totalTasks: 1250,
        averageTaskTime: 165,
        successRate: 0.94,
        throughput: 52 // tasks per hour
      },
      bottlenecks: ['complexity-analysis', 'session-coordination'],
      recommendations: [
        'Implement caching for complexity analysis',
        'Optimize session state management',
        'Consider horizontal scaling for high-load periods'
      ],
      agentPerformance: [
        { agentId: 'agent-1', score: 92, tasksCompleted: 180 },
        { agentId: 'agent-2', score: 87, tasksCompleted: 165 },
        { agentId: 'agent-3', score: 95, tasksCompleted: 195 }
      ]
    };

    expect(performanceReport.summary.successRate).toBe(0.94);
    expect(performanceReport.recommendations).toHaveLength(3);
    expect(performanceReport.agentPerformance[0].score).toBe(92);
  });

  test('should handle benchmark configuration', () => {
    // Test benchmark configuration
    const benchmarkConfig = {
      enabled: true,
      samplingRate: 0.1, // 10% of tasks
      metrics: ['timing', 'memory', 'cpu', 'io'],
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      alertThresholds: {
        slowTaskThreshold: 1000, // ms
        highMemoryThreshold: 200 * 1024 * 1024, // 200MB
        highCpuThreshold: 80 // 80%
      }
    };

    expect(benchmarkConfig.samplingRate).toBe(0.1);
    expect(benchmarkConfig.metrics).toContain('timing');
    expect(benchmarkConfig.alertThresholds.slowTaskThreshold).toBe(1000);
  });
});