/**
 * Task Handler
 * 
 * Handles task orchestration requests
 */

import { frameworkLogger } from '../../../core/framework-logger.js';
import { getExecutionPlanner } from '../execution/execution-planner.js';
import type { OrchestrationResult, OrchestrationTask } from '../types.js';

export interface TaskHandlerDeps {
  taskHistory: OrchestrationHistoryItem[];
  activeTasks: Map<string, unknown>;
}

interface OrchestrationHistoryItem {
  sessionId: string;
  description: string;
  tasks: number;
  result: OrchestrationResult;
  timestamp: string;
}

/**
 * Task Handler
 * Processes orchestrate-task requests
 */
export class TaskHandler {
  private planner = getExecutionPlanner();

  /**
   * Handle orchestrate-task request
   */
  async handleOrchestrateTask(
    args: {
      description: string;
      tasks?: OrchestrationTask[];
      sessionId?: string;
      executionMode?: string;
      timeout?: number;
    },
    deps: TaskHandlerDeps
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { description, tasks = [], sessionId = `session_${Date.now()}`, executionMode = 'optimized', timeout = 300000 } = args;

    await frameworkLogger.log(
      'orchestrator.server',
      'orchestrate-task-start',
      'info',
      { description, taskCount: tasks.length, sessionId, executionMode }
    );

    const orchestrationResult: OrchestrationResult = {
      sessionId,
      success: false,
      completedTasks: 0,
      failedTasks: 0,
      duration: 0,
      agentUtilization: {},
      bottlenecks: [],
      recommendations: [],
    };

    const startTime = Date.now();

    try {
      // Validate tasks
      const validation = this.planner.validateTasks(tasks);
      if (!validation.valid) {
        throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
      }

      // Analyze complexity and create execution plan
      const executionPlan = await this.planner.createExecutionPlan(tasks, executionMode);

      // Execute orchestration (simulated for MCP server)
      const results = await this.executePlan(executionPlan, sessionId, timeout);

      // Update result
      orchestrationResult.success = results.success;
      orchestrationResult.completedTasks = results.completedTasks;
      orchestrationResult.failedTasks = results.failedTasks;
      orchestrationResult.agentUtilization = results.agentUtilization;
      orchestrationResult.bottlenecks = results.bottlenecks;
      orchestrationResult.recommendations = results.recommendations;

      // Store in history
      deps.taskHistory.push({
        sessionId,
        description,
        tasks: tasks.length,
        result: orchestrationResult,
        timestamp: new Date().toISOString(),
      });

      // Store in active tasks
      deps.activeTasks.set(sessionId, { status: 'completed', ...orchestrationResult });
    } catch (error) {
      orchestrationResult.recommendations.push(
        `Orchestration error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    orchestrationResult.duration = Date.now() - startTime;

    const response = this.formatOrchestrationResponse(description, orchestrationResult, executionMode);

    return { content: [{ type: 'text', text: response }] };
  }

  /**
   * Execute the orchestration plan (simulated for MCP)
   */
  private async executePlan(
    plan: { agentAssignments: Map<string, OrchestrationTask[]> },
    sessionId: string,
    _timeout: number
  ): Promise<{
    success: boolean;
    completedTasks: number;
    failedTasks: number;
    agentUtilization: Record<string, number>;
    bottlenecks: string[];
    recommendations: string[];
  }> {
    // Simulated execution for MCP server
    const agentUtilization: Record<string, number> = {};
    let completedTasks = 0;
    const failedTasks = 0;

    for (const [agent, tasks] of plan.agentAssignments) {
      agentUtilization[agent] = tasks.length;
      completedTasks += tasks.length;
    }

    // Generate recommendations based on assignments
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];

    if (plan.agentAssignments.size > 5) {
      recommendations.push('Consider reducing the number of agents for better coordination');
    }

    for (const [agent, tasks] of plan.agentAssignments) {
      if (tasks.length > 3) {
        bottlenecks.push(`${agent} is handling ${tasks.length} tasks - may be overloaded`);
      }
    }

    return {
      success: true,
      completedTasks,
      failedTasks,
      agentUtilization,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Format orchestration response
   */
  private formatOrchestrationResponse(
    description: string,
    result: OrchestrationResult,
    executionMode: string
  ): string {
    return `🎯 Orchestration Complete: "${description}"

**Session ID:** ${result.sessionId}
**Success:** ${result.success ? '✅ COMPLETED' : '❌ FAILED'}
**Duration:** ${result.duration}ms
**Tasks:** ${result.completedTasks + result.failedTasks} total
  - ✅ Completed: ${result.completedTasks}
  - ❌ Failed: ${result.failedTasks}

**Agent Utilization:**
${Object.entries(result.agentUtilization)
  .map(([agent, count]) => `• ${agent}: ${count} tasks`)
  .join('\n')}

${result.bottlenecks.length > 0 ? `**Bottlenecks Detected:**\n${result.bottlenecks.map((b) => `• 🚧 ${b}`).join('\n')}\n` : ''}
**Recommendations:**
${result.recommendations.length > 0 ? result.recommendations.map((r) => `• 💡 ${r}`).join('\n') : 'No recommendations'}

**Execution Mode:** ${executionMode}
**Status:** ${result.success ? '🟢 SUCCESS' : '🔴 ISSUES DETECTED'}`;
  }
}
