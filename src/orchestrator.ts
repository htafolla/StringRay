/**
 * StrRay Framework v1.0.0 - Orchestrator Agent
 *
 * Coordinates multi-step tasks and delegates to specialized subagents.
 * Implements Sisyphus integration for relentless execution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { enhancedMultiAgentOrchestrator } from "./orchestrator/enhanced-multi-agent-orchestrator.js";

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

export class StrRayOrchestrator {
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
    console.log(`🎯 Orchestrator: Executing complex task - ${description}`);

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

    console.log(
      `✅ Orchestrator: Complex task completed - ${results.length} tasks executed`,
    );
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
      console.log(
        `✅ Orchestrator: Task ${task.id} completed in ${duration}ms`,
      );

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

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
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
export const strRayOrchestrator = new StrRayOrchestrator();
