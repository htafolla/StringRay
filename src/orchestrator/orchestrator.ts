/**
 * Orchestrator Agent
 *
 * Coordinates multi-step tasks and delegates to specialized subagents.
 * Implements Sisyphus integration for relentless execution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { EnhancedMultiAgentOrchestrator, enhancedMultiAgentOrchestrator } from "./enhanced-multi-agent-orchestrator.js";
import { frameworkLogger } from "../core/framework-logger.js";
import {
  universalLibrarianConsultation,
  SystemAction,
} from "./universal-librarian-consultation.js";
import { routingOutcomeTracker } from "../delegation/analytics/outcome-tracker.js";
import { patternPerformanceTracker } from "../analytics/pattern-performance-tracker.js";
import type { ProcessorManager } from "../processors/processor-manager.js";
import { VotingCoordinator } from "../delegation/voting-coordinator.js";
import { getAgentExpertiseLevel } from "../delegation/agent-expertise.js";
import { StringRayStateManager } from "../state/state-manager.js";
import fs from "fs";

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
  result?: TaskExecutionResult;
  error?: string;
  duration: number;
  taskId?: string;
  taskType?: string;
  resolved?: boolean;
  resolutionStrategy?: string;
}

export interface TaskExecutionResult {
  fixesApplied?: number;
  testsOptimized?: number;
  performanceImprovement?: number;
  recommendations?: string[];
  [key: string]: unknown;
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

export interface HealingStrategy {
  priorityLevel: "low" | "medium" | "high" | "critical";
  agentsNeeded: string[];
  estimatedTime: number;
  complexityScore: number;
  healingApproach: "simple" | "coordinated" | "enterprise";
}

export interface ConsolidationResult {
  success: boolean;
  fixesApplied: number;
  testsOptimized: number;
  performanceImprovement: number;
  recommendations: string[];
  summary: string;
}

export class StringRayOrchestrator {
  private config: OrchestratorConfig;
  private activeTasks: Map<string, Promise<TaskResult>> = new Map();
  private taskToAgentMap: Map<string, string> = new Map();
  private votingCoordinator: VotingCoordinator;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    const loadedConfig = this.loadOrchestratorConfig();
    
    this.config = {
      maxConcurrentTasks: loadedConfig?.maxConcurrentTasks ?? 5,
      taskTimeout: 300000,
      conflictResolutionStrategy: loadedConfig?.conflictResolutionStrategy ?? "majority_vote",
      ...config,
    };

    this.votingCoordinator = new VotingCoordinator(new StringRayStateManager());
  }

  /**
   * Load orchestrator config from features.json
   */
  private loadOrchestratorConfig(): Partial<OrchestratorConfig> | null {
    try {
      const configPaths = [
        ".strray/features.json",
        ".opencode/strray/features.json",
      ];
      
      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          const content = fs.readFileSync(configPath, "utf-8");
          const features = JSON.parse(content);
          
          if (features.multi_agent_orchestration) {
            const ma = features.multi_agent_orchestration;
            return {
              maxConcurrentTasks: ma.max_concurrent_agents,
              conflictResolutionStrategy: this.mapConflictResolution(ma.conflict_resolution),
            };
          }
        }
      }
    } catch (e) {
      // Silently continue with defaults
    }
    return null;
  }

  /**
   * Map config key to enum value
   */
  private mapConflictResolution(strategy?: string): OrchestratorConfig["conflictResolutionStrategy"] {
    switch (strategy) {
      case "expert-priority": return "expert_priority";
      case "consensus": return "consensus";
      case "majority-vote":
      case "majority_vote":
      default: return "majority_vote";
    }
  }

  /**
   * Execute a complex multi-step task
   */
  async executeComplexTask(
    description: string,
    tasks: TaskDefinition[],
    sessionId?: string,
  ): Promise<TaskResult[]> {
    const jobId = `complex-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
        this.executeSingleTask(task, jobId),
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        
        // Add all results - conflict resolution will be applied in consolidateWorkflowResults
        results.push(...batchResults);

        // Mark tasks as completed
        batchTasks.forEach((task) => completedTasks.add(task.id));
      } catch (error) {
        await frameworkLogger.log(
          "orchestrator",
          "batch-execution-failed",
          "error",
          { error: String(error) },
        );
        throw error;
      }
    }

    // Task completion logging removed - use frameworkLogger instead
    
    // Final conflict resolution pass
    const finalConflictResult = this.detectAndResolveConflicts(results);
    if (finalConflictResult.conflictsFound > 0) {
      await frameworkLogger.log(
        "orchestrator",
        "final-conflicts-resolved",
        "info",
        {
          conflictsFound: finalConflictResult.conflictsFound,
          resolutionStrategy: this.config.conflictResolutionStrategy,
          totalResults: results.length,
        },
      );
      return finalConflictResult.resolvedResults;
    }
    
    return results;
  }

  /**
   * Execute a single task by delegating to appropriate subagent
   */
  private async executeSingleTask(
    task: TaskDefinition,
    jobId: string,
  ): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Delegate to subagent (this would integrate with the actual agent system)
      const result = await this.delegateToSubagent(task);

      const duration = Date.now() - startTime;
      
      // Track routing outcome for analytics
      const resultObj = result as { error?: string } | null | undefined;
      const success = !resultObj?.error;
      routingOutcomeTracker.recordOutcome({
        taskId: task.id,
        taskDescription: task.description,
        routedAgent: task.subagentType,
        routedSkill: task.subagentType.replace("-", "_") + "_skill",
        confidence: 0.8,
        success,
      });
      
      // Update pattern performance tracker for learning
      patternPerformanceTracker.trackPatternPerformance(
        `${task.subagentType}:${task.subagentType.replace("-", "_")}_skill`,
        { success, confidence: 0.8 }
      );
      
      await frameworkLogger.log(
        "orchestrator",
        "complex-task-completed",
        "success",
        { 
          jobId, 
          taskExecuted: true,
          taskId: task.id,
          taskType: task.subagentType,
          duration,
          success,
        },
      );

      // Execute post-processors for agent task completion logging
      try {
        // Get processor manager from global state
        const globalStateManager = globalThis.strRayStateManager;
        frameworkLogger.log("orchestrator", "global-state-check", "debug", {
          jobId,
          exists: !!globalStateManager,
          type: typeof globalStateManager,
          hasGet: typeof globalStateManager?.get === "function",
        });

        const processorManager = globalStateManager?.get<ProcessorManager>("processor:manager");
        frameworkLogger.log(
          "orchestrator",
          "processor-manager-check",
          "debug",
          {
            jobId,
            retrieved: !!processorManager,
            type: typeof processorManager,
            hasExecutePostProcessors:
              typeof processorManager?.executePostProcessors === "function",
          },
        );

        if (processorManager) {
          // Create agent task context for logging with metadata
          const agentContext = {
            agentName: task.subagentType,
            task: task.description,
            startTime,
            endTime: Date.now(),
            success: true,
            result,
            capabilities: [task.subagentType],
            metadata: {
              isAgentTask: true,
              agentType: task.subagentType,
              taskId: task.id,
              hook: "agent_execution",
              timestamp: Date.now(),
            },
          };

          await processorManager.executePostProcessors(
            `agent-${task.subagentType}`,
            agentContext,
            [],
          );
        }
      } catch (processorError) {
        await frameworkLogger.log(
          "orchestrator",
          "post-processor-execution-failed",
          "warning",
          { taskId: task.id, error: String(processorError) },
        );
      }

      return {
        success: true,
        result: { ...(result as Record<string, unknown>), id: task.id },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await frameworkLogger.log(
        "orchestrator",
        "task-execution-failed",
        "error",
        { taskId: task.id, duration, error: String(error) },
      );

      // Execute post-processors even on failure for error logging
      try {
        const globalStateManager = globalThis.strRayStateManager;
        const processorManager = globalStateManager?.get<ProcessorManager>("processor:manager");

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
            metadata: {
              isAgentTask: true,
              agentType: task.subagentType,
              taskId: task.id,
              hook: "agent_execution_failed",
              timestamp: Date.now(),
              failed: true,
            },
          };

          await processorManager.executePostProcessors(
            `agent-${task.subagentType}-failed`,
            agentContext,
            [],
          );
        }
      } catch (processorError) {
        await frameworkLogger.log(
          "orchestrator",
          "post-processor-execution-failed-on-error",
          "warning",
          { taskId: task.id, error: String(processorError) },
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
    healingResult: unknown;
    agentCoordination: string[];
    performanceImprovement: number;
  }> {
    const jobId = `test-healing-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const startTime = Date.now();
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
      await frameworkLogger.log(
        "orchestrator",
        "auto-healing-orchestration-failed",
        "error",
        { error: String(error) },
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
      agentsNeeded = ["testing-lead"];
      healingApproach = "simple";
    } else if (complexityScore < 50) {
      priorityLevel = "medium";
      agentsNeeded = ["testing-lead", "refactorer"];
      healingApproach = "coordinated";
    } else if (complexityScore < 75) {
      priorityLevel = "high";
      agentsNeeded = ["testing-lead", "refactorer", "bug-triage-specialist"];
      healingApproach = "coordinated";
    } else {
      priorityLevel = "critical";
      agentsNeeded = [
        "orchestrator",
        "architect",
        "security-auditor",
        "testing-lead",
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
    strategy: HealingStrategy,
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
        subagentType: "testing-lead",
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
  ): Promise<ConsolidationResult> {
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
  private async delegateToSubagent(task: TaskDefinition): Promise<unknown> {
    // Import complexity analyzer for delegation decisions
    const { complexityAnalyzer } =
      await import("../delegation/complexity-analyzer.js");

    // Analyze task complexity to determine delegation strategy
    const complexityMetrics = complexityAnalyzer.analyzeComplexity(
      "task-execution",
      {
        description: task.description,
        operation: "delegate",
        agentType: task.subagentType,
        priority: task.priority,
        dependencies: task.dependencies,
      },
    );

    const complexityScore =
      complexityAnalyzer.calculateComplexityScore(complexityMetrics);

    // Log complexity analysis for monitoring
    await frameworkLogger.log(
      "orchestrator",
      "task-complexity-analyzed",
      "info",
      {
        taskId: task.id,
        agentType: task.subagentType,
        complexityScore: complexityScore.score,
        recommendedStrategy: complexityScore.recommendedStrategy,
      },
    );

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
        complexityScore: complexityScore.score,
        recommendedStrategy: complexityScore.recommendedStrategy,
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
  resolveConflicts(conflicts: Array<{ response?: unknown; agentType?: string; expertiseScore?: number }>): unknown {
    if (conflicts.length === 0) return undefined;
    if (conflicts.length === 1) return conflicts[0];

    const agents = conflicts
      .map((c) => c.agentType)
      .filter((a): a is string => typeof a === "string");

    if (agents.length < 2) return conflicts[0];

    const voteId = this.votingCoordinator.initiateVoting(
      `orchestrator-conflict-${Date.now()}`,
      "conflict-resolution",
      "Resolve conflicting agent responses",
      agents,
      {
        complexity: 30,
        riskLevel: "medium",
        hasSecurityConcerns: false,
        hasArchitecturalImpact: false,
        participantCount: agents.length,
      },
    );

    void voteId.then((id) => {
      for (const conflict of conflicts) {
        if (conflict.agentType) {
          const vote = conflict.response ? "approve" : "reject";
          const confidence = (conflict.expertiseScore ?? 5) / 10;
          this.votingCoordinator.submitVote(id, conflict.agentType, vote, confidence);
        }
      }
      this.votingCoordinator.resolveVoting(id);
    });

    return this.resolveByExpertPriority(conflicts);
  }

  private resolveByMajorityVote(conflicts: Array<{ response?: unknown }>): unknown {
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

  private resolveByConsensus(conflicts: Array<{ response?: unknown }>): unknown {
    // Return the response if all are identical, otherwise fall back to majority_vote
    const firstResponse = conflicts[0]?.response;
    const allSame = conflicts.every(
      (c) => JSON.stringify(c.response) === JSON.stringify(firstResponse),
    );
    
    if (allSame) {
      return conflicts[0];
    }
    
    // Fall back to majority_vote on disagreement - prevents silent failure
    return this.resolveByMajorityVote(conflicts);
  }

  /**
   * Detect and resolve conflicts between task results in a batch.
   * This enables multi-agent governance by comparing results from parallel agents.
   * 
   * Current implementation: Disabled by default - needs refinement to properly
   * detect actual conflicts vs. expected different results from different agent types.
   * Set ENABLE_CONFLICT_DETECTION=true to enable.
   */
  private detectAndResolveConflicts(results: TaskResult[]): {
    conflictsFound: number;
    resolvedResults: TaskResult[];
    resolvedBy: string;
  } {
    // Conflict resolution disabled by default - needs proper conflict definition
    // Set ENABLE_CONFLICT_DETECTION=true to enable
    if (process.env.ENABLE_CONFLICT_DETECTION !== "true") {
      return { conflictsFound: 0, resolvedResults: results, resolvedBy: "disabled" };
    }
    
    // Rest of implementation for when properly enabled...
    if (results.length < 2) {
      return { conflictsFound: 0, resolvedResults: results, resolvedBy: "none" };
    }

    // Group results by task type (subagentType) to find similar results
    const resultsByType: Record<string, TaskResult[]> = {};
    for (const result of results) {
      const taskType = (result as any).taskType || "default";
      if (!resultsByType[taskType]) {
        resultsByType[taskType] = [];
      }
      resultsByType[taskType].push(result);
    }

    let conflictsFound = 0;
    const resolvedResults: TaskResult[] = [];

    // Check each group for conflicts
    for (const [taskType, taskResults] of Object.entries(resultsByType)) {
      if (taskResults.length < 2) {
        resolvedResults.push(...taskResults);
        continue;
      }

      const conflicts: Array<{ response?: unknown; agentType?: string; expertiseScore?: number }> = taskResults.map((r, idx) => ({
        response: r.result,
        agentType: taskType,
        expertiseScore: 0,
      }));

      const responseStrings = conflicts.map(c => JSON.stringify(c.response));
      const uniqueResponses = new Set(responseStrings);

      if (uniqueResponses.size > 1) {
        conflictsFound++;
        const resolved = this.resolveConflicts(conflicts) as { response?: unknown } | undefined;
        
        if (resolved?.response && taskResults.length > 0) {
          const first = taskResults[0]!;
          resolvedResults.push({
            success: first.success,
            result: resolved.response,
            duration: first.duration,
            taskId: "resolved-task",
            taskType: "resolved",
            resolved: true,
            resolutionStrategy: this.config.conflictResolutionStrategy,
          } as TaskResult);
        } else {
          resolvedResults.push(...taskResults);
        }
      } else {
        resolvedResults.push(...taskResults);
      }
    }

    return {
      conflictsFound,
      resolvedResults,
      resolvedBy: conflictsFound > 0 ? this.config.conflictResolutionStrategy : "none",
    };
  }

  /**
   * Populate expertiseScore based on agent type for expert_priority resolution.
   * This maps agent types to expertise levels for conflict resolution.
   */
  private resolveByExpertPriority(conflicts: Array<{ response?: unknown; agentType?: string; expertiseScore?: number }>): unknown {
    // Use centralized agent expertise from agent-expertise.ts
    const scoredConflicts = conflicts.map((conflict) => {
      const agentName = conflict.agentType ?? "default";
      const expertiseLevel = getAgentExpertiseLevel(agentName);
      return {
        ...conflict,
        expertiseScore: expertiseLevel,
      };
    });
    return scoredConflicts.sort(
      (a, b) => (b.expertiseScore || 0) - (a.expertiseScore || 0),
    )[0];
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
