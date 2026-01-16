/**
 * StringRay AI v1.0.5 - Orchestrator Agent
 *
 * Coordinates multi-step tasks and delegates to specialized subagents.
 * Implements Sisyphus integration for relentless execution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { enhancedMultiAgentOrchestrator } from "./orchestrator/enhanced-multi-agent-orchestrator.js";
import { frameworkLogger } from "./framework-logger.js";

export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  conflictResolutionStrategy: "majority_vote" | "expert_priority" | "consensus";
}

export interface TaskDefinition {
  id: string;
  description: string;
  subagentType: string;
  priority?: "high" | "medium" | "low";
  dependencies?: string[];
}

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export interface TestFailureContext {
  failedTests: string[];
  timeoutIssues: string[];
  performanceIssues: string[];
  flakyTests: string[];
  errorLogs: string[];
  testExecutionTime: number;
  sessionId?: string;
}

export class StringRayOrchestrator {
  private config: OrchestratorConfig;
  private activeTasks: Map<string, Promise<TaskResult>> = new Map();
  private taskToAgentMap: Map<string, string> = new Map(); // taskId -> agentId

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 5,
      taskTimeout: 300000, // 5 minutes
      conflictResolutionStrategy: "majority_vote",
      ...config,
    };
  }

  /**
   * Execute a complex multi-step task
   */
  async executeComplexTask(
    description: string,
    tasks: TaskDefinition[],
    sessionId?: string,
  ): Promise<TaskResult[]> {
    // Task execution start - operational logging, keep for monitoring

    const results: TaskResult[] = [];
    const taskMap = new Map<string, TaskDefinition>();

    // Build task dependency graph
    tasks.forEach((task) => taskMap.set(task.id, task));

    // Execute tasks in dependency order
    const completedTasks = new Set<string>();

    while (completedTasks.size < tasks.length) {
      const executableTasks = tasks.filter(
        (task) =>
          !completedTasks.has(task.id) &&
          (!task.dependencies ||
            task.dependencies.every((dep) => completedTasks.has(dep))),
      );

      if (executableTasks.length === 0) {
        throw new Error("Circular dependency detected or no executable tasks");
      }

      // Execute tasks concurrently up to maxConcurrentTasks
      const batchSize = Math.min(
        executableTasks.length,
        this.config.maxConcurrentTasks,
      );
      const batchTasks = executableTasks.slice(0, batchSize);

      const batchPromises = batchTasks.map((task) =>
        this.executeSingleTask(task),
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Mark tasks as completed
        batchTasks.forEach((task) => completedTasks.add(task.id));
      } catch (error) {
        console.error("❌ Orchestrator: Batch execution failed:", error);
        throw error;
      }
    }

    // Task completion logging removed - use frameworkLogger instead
    return results;
  }

  /**
   * Execute a single task by delegating to appropriate subagent
   */
  private async executeSingleTask(task: TaskDefinition): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      console.log(
        `🔄 Orchestrator: Executing task ${task.id} with ${task.subagentType}`,
      );

      // Delegate to subagent (this would integrate with the actual agent system)
      const result = await this.delegateToSubagent(task);

      const duration = Date.now() - startTime;
      await frameworkLogger.log("orchestrator", "complex-task-completed", "success", { taskExecuted: true });

      // Execute post-processors for agent task completion logging
      console.log(
        "🎯 Agent task completed successfully, checking post-processors",
      );
      console.log("📊 Result details:", {
        success: result.success,
        hasAgentName: !!result.agentName,
        hasTask: !!result.task,
        agentName: result.agentName,
        taskLength: result.task?.length,
      });

      try {
        // Get processor manager from global state
        const globalStateManager = (globalThis as any).strRayStateManager;
        // Global state debug - remove for production
        frameworkLogger.log("orchestrator", "global-state-check", "debug", {
          exists: !!globalStateManager,
          type: typeof globalStateManager,
          hasGet: typeof globalStateManager?.get === "function",
        });

        const processorManager = globalStateManager?.get("processor:manager");
        // Processor manager debug - remove for production
        frameworkLogger.log("orchestrator", "processor-manager-check", "debug", {
          retrieved: !!processorManager,
          type: typeof processorManager,
          hasExecutePostProcessors:
            typeof processorManager?.executePostProcessors === "function",
        });

        if (processorManager) {
          // Create agent task context for logging
          const agentContext = {
            agentName: task.subagentType,
            task: task.description,
            startTime,
            endTime: Date.now(),
            success: true,
            result,
            capabilities: [task.subagentType],
          };

          await processorManager.executePostProcessors(
            `agent-${task.subagentType}`,
            agentContext,
            [], // No pre-results for agent tasks
          );
        }
      } catch (processorError) {
        console.warn(
          `⚠️ Post-processor execution failed for task ${task.id}:`,
          processorError,
        );
      }

      return {
        success: true,
        result: { ...result, id: task.id },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ Orchestrator: Task ${task.id} failed after ${duration}ms:`,
        error,
      );

      // Execute post-processors even on failure for error logging
      try {
        const globalStateManager = (globalThis as any).strRayStateManager;
        const processorManager = globalStateManager?.get("processor:manager");

        if (processorManager) {
          const agentContext = {
            agentName: task.subagentType,
            task: task.description,
            startTime,
            endTime: Date.now(),
            success: false,
            result: null,
            capabilities: [task.subagentType],
            error: error instanceof Error ? error.message : String(error),
          };

          await processorManager.executePostProcessors(
            `agent-${task.subagentType}-failed`,
            agentContext,
            [],
          );
        }
      } catch (processorError) {
        console.warn(
          `⚠️ Post-processor execution failed for failed task ${task.id}:`,
          processorError,
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  /**
   * Auto-healing orchestration for test failures - coordinates multi-agent response
   */
  async orchestrateTestAutoHealing(
    failureContext: TestFailureContext,
    sessionId?: string,
  ): Promise<{
    success: boolean;
    healingResult: any;
    agentCoordination: string[];
    performanceImprovement: number;
  }> {
    const startTime = Date.now();
    console.log(
      `🔧 Orchestrator: Initiating auto-healing for ${failureContext.failedTests.length} test failures`,
    );

    try {
      // Step 1: Analyze failure patterns and create healing strategy
      const healingStrategy =
        await this.analyzeTestFailurePatterns(failureContext);

      // Step 2: Create coordinated multi-agent tasks
      const healingTasks = this.createHealingTaskDefinitions(
        healingStrategy,
        failureContext,
      );

      // Step 3: Execute healing tasks through enhanced orchestration
      const taskResults = await this.executeComplexTask(
        `Auto-healing test failures: ${failureContext.failedTests.length} issues detected`,
        healingTasks,
        sessionId,
      );

      // Step 4: Consolidate results and measure improvements
      const consolidationResult = await this.consolidateHealingResults(
        taskResults,
        failureContext,
      );

      const duration = Date.now() - startTime;
      // Auto-healing completion - operational, keep

      return {
        success: consolidationResult.success,
        healingResult: consolidationResult,
        agentCoordination: healingStrategy.agentsNeeded,
        performanceImprovement: consolidationResult.performanceImprovement,
      };
    } catch (error) {
      console.error(
        `❌ Orchestrator: Auto-healing orchestration failed:`,
        error,
      );
      return {
        success: false,
        healingResult: {
          error: error instanceof Error ? error.message : String(error),
        },
        agentCoordination: [],
        performanceImprovement: 0,
      };
    }
  }

  /**
   * Analyze test failure patterns to determine healing strategy
   */
  private async analyzeTestFailurePatterns(
    failureContext: TestFailureContext,
  ): Promise<{
    priorityLevel: "low" | "medium" | "high" | "critical";
    agentsNeeded: string[];
    estimatedTime: number;
    complexityScore: number;
    healingApproach: "simple" | "coordinated" | "enterprise";
  }> {
    const totalIssues =
      failureContext.failedTests.length +
      failureContext.timeoutIssues.length +
      failureContext.performanceIssues.length +
      failureContext.flakyTests.length;

    // Calculate complexity score (0-100)
    const complexityScore = Math.min(
      100,
      failureContext.timeoutIssues.length * 20 +
        failureContext.performanceIssues.length * 15 +
        failureContext.flakyTests.length * 25 +
        failureContext.failedTests.length * 5 +
        (failureContext.testExecutionTime > 600000 ? 25 : 0), // 10+ minutes
    );

    // Determine priority and approach
    let priorityLevel: "low" | "medium" | "high" | "critical";
    let agentsNeeded: string[] = [];
    let healingApproach: "simple" | "coordinated" | "enterprise";

    if (complexityScore < 25) {
      priorityLevel = "low";
      agentsNeeded = ["test-architect"];
      healingApproach = "simple";
    } else if (complexityScore < 50) {
      priorityLevel = "medium";
      agentsNeeded = ["test-architect", "refactorer"];
      healingApproach = "coordinated";
    } else if (complexityScore < 75) {
      priorityLevel = "high";
      agentsNeeded = ["test-architect", "refactorer", "bug-triage-specialist"];
      healingApproach = "coordinated";
    } else {
      priorityLevel = "critical";
      agentsNeeded = [
        "orchestrator",
        "architect",
        "security-auditor",
        "test-architect",
        "refactorer",
        "bug-triage-specialist",
      ];
      healingApproach = "enterprise";
    }

    const estimatedTime = totalIssues * (complexityScore > 50 ? 15 : 5); // minutes

    return {
      priorityLevel,
      agentsNeeded,
      estimatedTime,
      complexityScore,
      healingApproach,
    };
  }

  /**
   * Create task definitions for healing orchestration
   */
  private createHealingTaskDefinitions(
    strategy: any,
    failureContext: TestFailureContext,
  ): TaskDefinition[] {
    const tasks: TaskDefinition[] = [];

    // Analysis task (always first)
    tasks.push({
      id: "failure-analysis",
      description: "Analyze test failure patterns and root causes",
      subagentType: "bug-triage-specialist",
      priority: "high",
    });

    // Timeout optimization tasks
    if (failureContext.timeoutIssues.length > 0) {
      tasks.push({
        id: "timeout-optimization",
        description: `Optimize ${failureContext.timeoutIssues.length} timeout issues`,
        subagentType: "test-architect",
        priority: strategy.priorityLevel === "critical" ? "high" : "medium",
        dependencies: ["failure-analysis"],
      });
    }

    // Performance optimization tasks
    if (failureContext.performanceIssues.length > 0) {
      tasks.push({
        id: "performance-optimization",
        description: `Fix ${failureContext.performanceIssues.length} performance bottlenecks`,
        subagentType: "refactorer",
        priority: strategy.priorityLevel === "critical" ? "high" : "medium",
        dependencies: ["failure-analysis"],
      });
    }

    // Flaky test investigation
    if (failureContext.flakyTests.length > 0) {
      tasks.push({
        id: "flaky-test-investigation",
        description: `Investigate ${failureContext.flakyTests.length} flaky tests`,
        subagentType: "bug-triage-specialist",
        priority: "high",
        dependencies: ["failure-analysis"],
      });
    }

    // General test refactoring
    if (failureContext.failedTests.length > 0) {
      tasks.push({
        id: "test-refactoring",
        description: `Refactor ${failureContext.failedTests.length} failing tests`,
        subagentType: "refactorer",
        priority: "medium",
        dependencies: ["failure-analysis"],
      });
    }

    // Architecture review for critical issues
    if (strategy.priorityLevel === "critical") {
      tasks.push({
        id: "architecture-review",
        description: "Review test architecture for systemic issues",
        subagentType: "architect",
        priority: "high",
        dependencies: [
          "failure-analysis",
          "timeout-optimization",
          "performance-optimization",
        ],
      });
    }

    return tasks;
  }

  /**
   * Consolidate healing results from multiple agents
   */
  private async consolidateHealingResults(
    taskResults: TaskResult[],
    originalContext: TestFailureContext,
  ): Promise<{
    success: boolean;
    fixesApplied: number;
    testsOptimized: number;
    performanceImprovement: number;
    recommendations: string[];
    summary: string;
  }> {
    const successfulTasks = taskResults.filter((r) => r.success);
    const failedTasks = taskResults.filter((r) => !r.success);

    // Aggregate results from successful tasks
    let totalFixesApplied = 0;
    let totalTestsOptimized = 0;
    let totalPerformanceImprovement = 0;
    const recommendations: string[] = [];

    for (const result of successfulTasks) {
      if (result.result) {
        totalFixesApplied += result.result.fixesApplied || 0;
        totalTestsOptimized += result.result.testsOptimized || 0;
        totalPerformanceImprovement +=
          result.result.performanceImprovement || 0;

        if (result.result.recommendations) {
          recommendations.push(...result.result.recommendations);
        }
      }
    }

    const successRate = successfulTasks.length / taskResults.length;
    const overallSuccess = successRate >= 0.8; // 80% success threshold

    const summary =
      `Auto-healing completed: ${successfulTasks.length}/${taskResults.length} tasks successful. ` +
      `Applied ${totalFixesApplied} fixes, optimized ${totalTestsOptimized} tests, ` +
      `achieved ${totalPerformanceImprovement}% performance improvement.`;

    return {
      success: overallSuccess,
      fixesApplied: totalFixesApplied,
      testsOptimized: totalTestsOptimized,
      performanceImprovement: totalPerformanceImprovement,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      summary,
    };
  }

  /**
   * Delegate task to appropriate subagent using enhanced orchestration
   */
  private async delegateToSubagent(task: TaskDefinition): Promise<any> {
    // Convert task dependencies to agent IDs
    const agentDependencies: string[] = [];
    if (task.dependencies) {
      for (const depTaskId of task.dependencies) {
        const depAgentId = this.taskToAgentMap.get(depTaskId);
        if (depAgentId) {
          agentDependencies.push(depAgentId);
        }
      }
    }

    // Use enhanced multi-agent orchestrator with clickable monitoring
    const agentRequest = {
      agentType: task.subagentType,
      task: task.description,
      context: {
        taskId: task.id,
        priority: task.priority || "medium",
        orchestratorSession: "main-orchestrator",
      },
      priority: (task.priority as "low" | "medium" | "high") || "medium",
      dependencies: agentDependencies,
    };

    const spawnedAgent =
      await enhancedMultiAgentOrchestrator.spawnAgent(agentRequest);

    // Map task ID to agent ID for future dependencies
    this.taskToAgentMap.set(task.id, spawnedAgent.id);

    // Wait for agent completion with monitoring
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const monitoringData =
          enhancedMultiAgentOrchestrator.getMonitoringInterface();
        const agent = monitoringData[spawnedAgent.id];

        if (!agent) {
          reject(
            new Error(`Agent ${spawnedAgent.id} not found in monitoring data`),
          );
          return;
        }

        if (agent.status === "completed") {
          resolve(agent.result);
        } else if (agent.status === "failed") {
          reject(new Error(agent.error || `Agent ${spawnedAgent.id} failed`));
        } else {
          // Continue monitoring
          setTimeout(checkCompletion, 500);
        }
      };

      checkCompletion();
    });
  }

  /**
   * Resolve conflicts between subagent responses
   */
  resolveConflicts(conflicts: any[]): any {
    switch (this.config.conflictResolutionStrategy) {
      case "majority_vote":
        return this.resolveByMajorityVote(conflicts);
      case "expert_priority":
        return this.resolveByExpertPriority(conflicts);
      case "consensus":
        return this.resolveByConsensus(conflicts);
      default:
        return conflicts[0];
    }
  }

  private resolveByMajorityVote(conflicts: any[]): any {
    // Find the response that appears most frequently
    const counts: Record<string, number> = {};
    conflicts.forEach((conflict) => {
      const response = JSON.stringify(conflict.response);
      counts[response] = (counts[response] || 0) + 1;
    });

    const majorityEntry = Object.entries(counts).reduce(
      ([keyA, countA], [keyB, countB]) =>
        countA > countB ? [keyA, countA] : [keyB, countB],
    );

    if (majorityEntry) {
      const majorityResponse = JSON.parse(majorityEntry[0]);
      return conflicts.find(
        (c) => JSON.stringify(c.response) === majorityEntry[0],
      );
    }
    return conflicts[0];
  }

  private resolveByExpertPriority(conflicts: any[]): any {
    // Sort by expertise score
    return conflicts.sort(
      (a, b) => (b.expertiseScore || 0) - (a.expertiseScore || 0),
    )[0];
  }

  private resolveByConsensus(conflicts: any[]): any {
    // Return the response if all are identical, otherwise undefined
    const firstResponse = conflicts[0]?.response;
    const allSame = conflicts.every(
      (c) => JSON.stringify(c.response) === JSON.stringify(firstResponse),
    );
    return allSame ? conflicts[0] : undefined;
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    activeTasks: number;
    config: OrchestratorConfig;
  } {
    return {
      activeTasks: this.activeTasks.size,
      config: this.config,
    };
  }
}

// Export singleton instance
export const strRayOrchestrator = new StringRayOrchestrator();
