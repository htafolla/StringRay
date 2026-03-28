/**
 * Status Handler
 * 
 * Handles orchestration status requests
 */

import { frameworkLogger } from '../../../core/framework-logger.js';
import type { OrchestrationStatus, OrchestrationResult } from '../types.js';

interface HistoryItem {
  sessionId: string;
  description: string;
  tasks: number;
  result: OrchestrationResult;
  timestamp: string;
}

interface StatusHandlerDeps {
  activeTasks: Map<string, unknown>;
  taskHistory: HistoryItem[];
}

/**
 * Status Handler
 * Processes get-orchestration-status requests
 */
export class StatusHandler {
  /**
   * Handle get-orchestration-status request
   */
  async handleGetOrchestrationStatus(
    args: { sessionId?: string; detailed?: boolean },
    deps: StatusHandlerDeps
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { sessionId, detailed = false } = args;

    await frameworkLogger.log(
      'orchestrator.server',
      'get-status-start',
      'info',
      { sessionId, detailed }
    );

    try {
      let status: unknown;

      if (sessionId) {
        status = deps.activeTasks.get(sessionId);
        
        if (!status) {
          // Check history
          const historyItem = deps.taskHistory.find((h) => h.sessionId === sessionId);
          if (historyItem) {
            status = { completed: true, ...historyItem.result };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Session not found: ${sessionId}`,
                },
              ],
            };
          }
        }
      } else {
        // Overall status
        status = this.getOverallStatus(deps);
      }

      const response = this.formatStatusResponse(status, detailed);

      return { content: [{ type: 'text', text: response }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Status check failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Handle cancel-orchestration request
   */
  async handleCancelOrchestration(
    args: { sessionId?: string; taskId?: string; force?: boolean },
    deps: StatusHandlerDeps
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { sessionId, taskId, force = false } = args;

    await frameworkLogger.log(
      'orchestrator.server',
      'cancel-orchestration-start',
      'info',
      { sessionId, taskId, force }
    );

    try {
      if (!sessionId) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ sessionId is required for cancellation',
            },
          ],
        };
      }

      // Check if session exists
      const existingTask = deps.activeTasks.get(sessionId);
      if (!existingTask) {
        // Check history
        const historyItem = deps.taskHistory.find((h) => h.sessionId === sessionId);
        if (historyItem) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Session already completed: ${sessionId}`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `❌ Session not found: ${sessionId}`,
            },
          ],
        };
      }

      // Cancel the session
      deps.activeTasks.delete(sessionId);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Orchestration cancelled: ${sessionId}${taskId ? ` (task: ${taskId})` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Cancellation failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Handle optimize-orchestration request
   */
  async handleOptimizeOrchestration(
    args: { history?: boolean; recommendations?: boolean }
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { history = true, recommendations = true } = args;

    await frameworkLogger.log(
      'orchestrator.server',
      'optimize-orchestration-start',
      'info',
      { history, recommendations }
    );

    try {
      const optimizations: string[] = [];

      if (recommendations) {
        optimizations.push('Consider using "optimized" execution mode for most workflows');
        optimizations.push('Batch similar tasks together for better agent utilization');
        optimizations.push('Monitor agent utilization and adjust concurrent task limits');
      }

      if (history) {
        optimizations.push('Review historical data to identify recurring patterns');
        optimizations.push('Use complexity analysis to pre-plan task distribution');
      }

      return {
        content: [
          {
            type: 'text',
            text: `🔧 Orchestration Optimization Results

**Optimizations Available:**
${optimizations.map((o) => `• ${o}`).join('\n')}

**Current Best Practices:**
• Use "optimized" mode for mixed task types
• Set appropriate timeouts based on task complexity
• Monitor bottleneck agents and redistribute load
• Leverage task dependencies for correct execution order`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Optimization failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Get overall orchestration status
   */
  private getOverallStatus(deps: StatusHandlerDeps): OrchestrationStatus {
    const agentUtilization: Record<string, number> = {};
    
    // Aggregate from active tasks
    for (const [, task] of deps.activeTasks) {
      const taskAny = task as Record<string, unknown>;
      if (taskAny.agentUtilization) {
        const util = taskAny.agentUtilization as Record<string, number>;
        for (const [agent, count] of Object.entries(util)) {
          agentUtilization[agent] = (agentUtilization[agent] || 0) + count;
        }
      }
    }

    // Get recent sessions from history
    const recentSessions = deps.taskHistory
      .slice(-10)
      .map((h) => ({
        sessionId: h.sessionId,
        status: 'completed',
        tasks: h.tasks,
        duration: h.result.duration,
      }));

    return {
      activeSessions: deps.activeTasks.size,
      totalTasks: deps.taskHistory.reduce((sum, h) => sum + h.tasks, 0),
      agentUtilization,
      recentSessions,
    };
  }

  /**
   * Format status response
   */
  private formatStatusResponse(status: unknown, detailed: boolean): string {
    const statusAny = status as Record<string, unknown>;

    // Check if it's a completed session
    if (statusAny.completed) {
      const result = statusAny as { success: boolean; duration: number; completedTasks: number; failedTasks: number };
      return `📊 Session Status: COMPLETED

**Success:** ${result.success ? '✅ Yes' : '❌ No'}
**Duration:** ${result.duration}ms
**Tasks:** ${result.completedTasks + result.failedTasks} (${result.completedTasks} ✅, ${result.failedTasks} ❌)`;
    }

    // Overall status
    const orchStatus = status as OrchestrationStatus;
    
    let response = `📊 Orchestration Status

**Active Sessions:** ${orchStatus.activeSessions}
**Total Tasks Executed:** ${orchStatus.totalTasks}`;

    if (Object.keys(orchStatus.agentUtilization).length > 0) {
      response += `\n\n**Agent Utilization:**`;
      for (const [agent, count] of Object.entries(orchStatus.agentUtilization)) {
        response += `\n• ${agent}: ${count} tasks`;
      }
    }

    if (detailed && orchStatus.recentSessions.length > 0) {
      response += `\n\n**Recent Sessions:**`;
      for (const session of orchStatus.recentSessions) {
        response += `\n• ${session.sessionId}: ${session.tasks} tasks, ${session.duration}ms`;
      }
    }

    return response;
  }
}
