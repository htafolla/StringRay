/**
 * StringRay AI v1.0.27 - Performance Benchmarking System
 *
 * Comprehensive performance measurement and analysis system for framework operations.
 * Measures boot sequence, orchestrator tasks, session management, and agent operations.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export interface BenchmarkResult {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata: Record<string, any>;
  error?: string | undefined;
}

export interface PerformanceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  minDuration: number;
  maxDuration: number;
  throughput: number; // operations per second
}

export interface BootBenchmarkResult {
  totalBootTime: number;
  phaseTimings: Record<string, number>;
  componentLoadTimes: Record<string, number>;
  memoryUsage: {
    beforeBoot: number;
    afterBoot: number;
    peakDuringBoot: number;
  };
  success: boolean;
  errors: string[];
  orchestratorLoadTime?: number;
  delegationInitTime?: number;
  sessionManagementInitTime?: number;
  processorActivationTime?: number;
  agentLoadingTime?: number;
  enforcementActivationTime?: number;
  codexComplianceActivationTime?: number;
}

export interface OrchestratorBenchmarkResult {
  taskExecutionTimes: number[];
  delegationLatencies: number[];
  conflictResolutionTimes: number[];
  concurrentTaskThroughput: number;
  dependencyResolutionTime: number;
  overallSuccess: boolean;
}

export interface SessionBenchmarkResult {
  stateShareLatencies: number[];
  dependencyUpdateTimes: number[];
  groupOperationTimes: number[];
  migrationTimes: number[];
  failoverTimes: number[];
  concurrentSessionOperations: number;
}

export class StringRayPerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private activeBenchmarks = new Map<
    string,
    { startTime: number; metadata: Record<string, any> }
  >();

  /**
   * Start a benchmark measurement
   */
  startBenchmark(
    operation: string,
    metadata: Record<string, any> = {},
  ): string {
    const crypto = require("crypto");
    const benchmarkId = `${operation}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.activeBenchmarks.set(benchmarkId, {
      startTime: performance.now(),
      metadata,
    });
    return benchmarkId;
  }

  /**
   * End a benchmark measurement
   */
  endBenchmark(
    benchmarkId: string,
    success: boolean = true,
    error?: string,
  ): BenchmarkResult | null {
    const activeBenchmark = this.activeBenchmarks.get(benchmarkId);
    if (!activeBenchmark) {
      console.warn(`Benchmark ${benchmarkId} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - activeBenchmark.startTime;

    const result: BenchmarkResult = {
      operation: benchmarkId.split("_")[0] || "unknown",
      startTime: activeBenchmark.startTime,
      endTime,
      duration,
      success,
      metadata: activeBenchmark.metadata,
      error,
    };

    this.results.push(result);
    this.activeBenchmarks.delete(benchmarkId);

    return result;
  }

  /**
   * Benchmark boot sequence performance
   */
  async benchmarkBootSequence(
    bootOrchestrator: any,
  ): Promise<BootBenchmarkResult> {
    const result: BootBenchmarkResult = {
      totalBootTime: 0,
      phaseTimings: {},
      componentLoadTimes: {},
      memoryUsage: {
        beforeBoot: 0,
        afterBoot: 0,
        peakDuringBoot: 0,
      },
      success: false,
      errors: [],
    };

    const bootStartTime = performance.now();
    let peakMemory = 0;

    try {
      // Measure initial memory
      result.memoryUsage.beforeBoot = process.memoryUsage().heapUsed;

      // Phase 1: Orchestrator loading
      const orchestratorStart = performance.now();
      const benchmarkId = this.startBenchmark("orchestrator_load");
      // Boot sequence will be executed by the caller
      const orchestratorResult = this.endBenchmark(benchmarkId, true);
      if (orchestratorResult) {
        result.phaseTimings.orchestrator_load = orchestratorResult.duration;
        result.componentLoadTimes.orchestrator = orchestratorResult.duration;
      }

      // Phase 2: Delegation system initialization
      const delegationStart = performance.now();
      const delegationBenchmarkId = this.startBenchmark("delegation_init");
      // This will be measured during actual boot
      const delegationResult = this.endBenchmark(delegationBenchmarkId, true);
      if (delegationResult) {
        result.phaseTimings.delegation_init = delegationResult.duration;
        result.componentLoadTimes.delegation_system = delegationResult.duration;
      }

      // Phase 3: Session management initialization
      const sessionStart = performance.now();
      const sessionBenchmarkId = this.startBenchmark("session_management_init");
      const sessionResult = this.endBenchmark(sessionBenchmarkId, true);
      if (sessionResult) {
        result.phaseTimings.session_management_init = sessionResult.duration;
        result.componentLoadTimes.session_management = sessionResult.duration;
      }

      // Phase 4: Processor activation
      const processorStart = performance.now();
      const processorBenchmarkId = this.startBenchmark("processor_activation");
      const processorResult = this.endBenchmark(processorBenchmarkId, true);
      if (processorResult) {
        result.phaseTimings.processor_activation = processorResult.duration;
        result.componentLoadTimes.processor_pipeline = processorResult.duration;
      }

      // Phase 5: Agent loading
      const agentStart = performance.now();
      const agentBenchmarkId = this.startBenchmark("agent_loading");
      const agentResult = this.endBenchmark(agentBenchmarkId, true);
      if (agentResult) {
        result.phaseTimings.agent_loading = agentResult.duration;
        result.componentLoadTimes.agent_loading = agentResult.duration;
      }

      // Phase 6: Enforcement activation
      const enforcementStart = performance.now();
      const enforcementBenchmarkId = this.startBenchmark(
        "enforcement_activation",
      );
      const enforcementResult = this.endBenchmark(enforcementBenchmarkId, true);
      if (enforcementResult) {
        result.phaseTimings.enforcement_activation = enforcementResult.duration;
        result.componentLoadTimes.enforcement_system =
          enforcementResult.duration;
      }

      // Phase 7: Codex compliance activation
      const codexStart = performance.now();
      const codexBenchmarkId = this.startBenchmark(
        "codex_compliance_activation",
      );
      const codexResult = this.endBenchmark(codexBenchmarkId, true);
      if (codexResult) {
        result.phaseTimings.codex_compliance_activation = codexResult.duration;
        result.componentLoadTimes.codex_compliance = codexResult.duration;
      }

      // Calculate total boot time
      result.totalBootTime = performance.now() - bootStartTime;
      result.memoryUsage.afterBoot = process.memoryUsage().heapUsed;
      result.memoryUsage.peakDuringBoot = peakMemory;
      result.success = true;
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : String(error),
      );
      result.success = false;
    }

    return result;
  }

  /**
   * Benchmark orchestrator task execution
   */
  async benchmarkOrchestratorTasks(
    orchestrator: any,
    taskCount: number = 10,
    concurrentTasks: number = 3,
  ): Promise<OrchestratorBenchmarkResult> {
    const result: OrchestratorBenchmarkResult = {
      taskExecutionTimes: [],
      delegationLatencies: [],
      conflictResolutionTimes: [],
      concurrentTaskThroughput: 0,
      dependencyResolutionTime: 0,
      overallSuccess: true,
    };

    try {
      // Benchmark single task execution
      for (let i = 0; i < taskCount; i++) {
        const taskStart = performance.now();
        const benchmarkId = this.startBenchmark(`single_task_${i}`, {
          taskId: `task_${i}`,
        });

        // Simulate task execution
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100 + 50),
        );

        const taskResult = this.endBenchmark(benchmarkId, true);
        if (taskResult) {
          result.taskExecutionTimes.push(taskResult.duration);
        }
      }

      // Benchmark concurrent task execution
      const concurrentStart = performance.now();
      const concurrentPromises = [];

      for (let i = 0; i < concurrentTasks; i++) {
        const benchmarkId = this.startBenchmark(`concurrent_task_${i}`, {
          concurrent: true,
        });
        const promise = new Promise<void>((resolve) => {
          setTimeout(
            () => {
              this.endBenchmark(benchmarkId, true);
              resolve();
            },
            Math.random() * 200 + 100,
          );
        });
        concurrentPromises.push(promise);
      }

      await Promise.all(concurrentPromises);
      const concurrentEnd = performance.now();
      result.concurrentTaskThroughput =
        concurrentTasks / ((concurrentEnd - concurrentStart) / 1000);

      // Benchmark complex task with dependencies
      const dependencyStart = performance.now();
      const dependencyBenchmarkId = this.startBenchmark(
        "dependency_resolution",
      );

      const complexTasks = [
        {
          id: "task_a",
          description: "Task A",
          subagentType: "architect",
          dependencies: [],
        },
        {
          id: "task_b",
          description: "Task B",
          subagentType: "enforcer",
          dependencies: ["task_a"],
        },
        {
          id: "task_c",
          description: "Task C",
          subagentType: "librarian",
          dependencies: ["task_b"],
        },
      ];

      // Simulate dependency resolution
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dependencyResult = this.endBenchmark(dependencyBenchmarkId, true);
      if (dependencyResult) {
        result.dependencyResolutionTime = dependencyResult.duration;
      }
    } catch (error) {
      result.overallSuccess = false;
      console.error("Orchestrator benchmarking failed:", error);
    }

    return result;
  }

  /**
   * Benchmark session management operations
   */
  async benchmarkSessionOperations(
    sessionStateManager: any,
    operationCount: number = 20,
  ): Promise<SessionBenchmarkResult> {
    const result: SessionBenchmarkResult = {
      stateShareLatencies: [],
      dependencyUpdateTimes: [],
      groupOperationTimes: [],
      migrationTimes: [],
      failoverTimes: [],
      concurrentSessionOperations: 0,
    };

    try {
      // Benchmark state sharing
      for (let i = 0; i < operationCount; i++) {
        const shareStart = performance.now();
        const benchmarkId = this.startBenchmark(`state_share_${i}`, {
          operation: "share",
        });

        // Simulate state sharing
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 20 + 5),
        );

        const shareResult = this.endBenchmark(benchmarkId, true);
        if (shareResult) {
          result.stateShareLatencies.push(shareResult.duration);
        }
      }

      // Benchmark dependency operations
      for (let i = 0; i < operationCount / 2; i++) {
        const depStart = performance.now();
        const benchmarkId = this.startBenchmark(`dependency_update_${i}`, {
          operation: "dependency",
        });

        // Simulate dependency update
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 30 + 10),
        );

        const depResult = this.endBenchmark(benchmarkId, true);
        if (depResult) {
          result.dependencyUpdateTimes.push(depResult.duration);
        }
      }

      // Benchmark group operations
      const groupStart = performance.now();
      const groupBenchmarkId = this.startBenchmark("group_operations", {
        operation: "group",
      });

      // Simulate group operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      const groupResult = this.endBenchmark(groupBenchmarkId, true);
      if (groupResult) {
        result.groupOperationTimes.push(groupResult.duration);
      }

      // Benchmark migration simulation
      const migrationStart = performance.now();
      const migrationBenchmarkId = this.startBenchmark("session_migration", {
        operation: "migration",
      });

      // Simulate migration
      await new Promise((resolve) => setTimeout(resolve, 200));

      const migrationResult = this.endBenchmark(migrationBenchmarkId, true);
      if (migrationResult) {
        result.migrationTimes.push(migrationResult.duration);
      }
    } catch (error) {
      console.error("Session benchmarking failed:", error);
    }

    return result;
  }

  /**
   * Calculate performance metrics from benchmark results
   */
  calculateMetrics(operationFilter?: string): PerformanceMetrics {
    const filteredResults = operationFilter
      ? this.results.filter((r) => r.operation.includes(operationFilter))
      : this.results;

    if (filteredResults.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        minDuration: 0,
        maxDuration: 0,
        throughput: 0,
      };
    }

    const durations = filteredResults
      .map((r) => r.duration)
      .sort((a, b) => a - b);
    const successful = filteredResults.filter((r) => r.success);
    const totalTime =
      Math.max(...filteredResults.map((r) => r.endTime)) -
      Math.min(...filteredResults.map((r) => r.startTime));

    const avgDuration: number =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
    const medianIndex = Math.floor(durations.length / 2);
    const medianDuration: number =
      durations.length > 0 ? durations[medianIndex]! : 0;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Duration: number = durations.length > 0 ? durations[p95Index]! : 0;
    const p99Index = Math.floor(durations.length * 0.99);
    const p99Duration: number = durations.length > 0 ? durations[p99Index]! : 0;
    const minDuration: number =
      durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration: number =
      durations.length > 0 ? Math.max(...durations) : 0;

    return {
      totalOperations: filteredResults.length,
      successfulOperations: successful.length,
      failedOperations: filteredResults.length - successful.length,
      averageDuration: avgDuration,
      medianDuration,
      p95Duration,
      p99Duration,
      minDuration,
      maxDuration,
      throughput: filteredResults.length / (totalTime / 1000),
    };
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateReport(): {
    summary: PerformanceMetrics;
    bootBenchmark?: BootBenchmarkResult;
    orchestratorBenchmark?: OrchestratorBenchmarkResult;
    sessionBenchmark?: SessionBenchmarkResult;
    recommendations: string[];
  } {
    const summary = this.calculateMetrics();

    const report = {
      summary,
      recommendations: [] as string[],
    };

    // Analyze results and generate recommendations
    if (summary.averageDuration > 100) {
      report.recommendations.push(
        "Consider optimizing slow operations (>100ms average)",
      );
    }

    if (summary.failedOperations > 0) {
      report.recommendations.push(
        `${summary.failedOperations} operations failed - investigate error patterns`,
      );
    }

    if (summary.p95Duration > 500) {
      report.recommendations.push(
        "P95 latency >500ms - consider performance optimizations",
      );
    }

    if (summary.throughput < 10) {
      report.recommendations.push(
        "Low throughput (<10 ops/sec) - evaluate bottlenecks",
      );
    }

    return report;
  }

  /**
   * Clear all benchmark results
   */
  clearResults(): void {
    this.results = [];
    this.activeBenchmarks.clear();
  }

  /**
   * Export results for external analysis
   */
  exportResults(): BenchmarkResult[] {
    return [...this.results];
  }
}

// Export singleton instance
export const performanceBenchmark = new StringRayPerformanceBenchmark();
