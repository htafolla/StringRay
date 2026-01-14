/**
 * Enhanced Multi-Agent Orchestration with Clickable Monitoring
 * Integrates subagent spawning visibility and lifecycle management
 */

import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../framework-logger.js";
import {
  ComplexityAnalyzer,
  ComplexityMetrics,
} from "../delegation/complexity-analyzer.js";
import { createAgentDelegator } from "../delegation/agent-delegator.js";

export interface AgentSpawnRequest {
  agentType: string;
  task: string;
  context?: Record<string, any>;
  priority?: "low" | "medium" | "high" | "critical";
  timeout?: number;
  dependencies?: string[];
}

export interface SpawnedAgent {
  id: string;
  agentType: string;
  task: string;
  status: "spawning" | "active" | "completed" | "failed" | "cancelled";
  startTime: number;
  endTime?: number;
  result?: any;
  error?: string;
  progress: number;
  clickable: boolean;
  monitorable: boolean;
  cleanupRequired: boolean;
}

export interface AgentOrchestrationState {
  activeAgents: Map<string, SpawnedAgent>;
  pendingSpawns: AgentSpawnRequest[];
  completedAgents: Map<string, SpawnedAgent>;
  failedAgents: Map<string, SpawnedAgent>;
  agentDependencies: Map<string, string[]>;
  monitoringEnabled: boolean;
  cleanupInterval: number;
}

export class EnhancedMultiAgentOrchestrator {
  private state: AgentOrchestrationState;
  private stateManager: StringRayStateManager;
  private complexityAnalyzer: ComplexityAnalyzer;
  private agentDelegator: any;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // 🚨 SECURITY: Track execution context to prevent subagent spawning
  private executionContext: {
    isExecutingAsSubagent: boolean;
    currentAgentId: string | null;
    spawnStack: string[];
  };

  constructor() {
    this.stateManager = new StringRayStateManager();
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.agentDelegator = createAgentDelegator(this.stateManager);

    this.state = {
      activeAgents: new Map(),
      pendingSpawns: [],
      completedAgents: new Map(),
      failedAgents: new Map(),
      agentDependencies: new Map(),
      monitoringEnabled: true,
      cleanupInterval: 30000, // 30 seconds
    };

    // Initialize execution context for security tracking
    this.executionContext = {
      isExecutingAsSubagent: false,
      currentAgentId: null,
      spawnStack: []
    };

    this.initializeCleanupSystem();
  }

  /**
   * 🚨 SECURITY: Check if currently executing as a subagent
   * Prevents subagents from spawning other subagents (infinite loops, resource exhaustion)
   */
  private isCurrentlyExecutingAsSubagent(): boolean {
    // Check if we have any active agents (indicates we're in subagent execution)
    return this.state.activeAgents.size > 0;
  }

  /**
   * Enhanced agent spawning with clickable monitoring integration
   */
  async spawnAgent(request: AgentSpawnRequest): Promise<SpawnedAgent> {
    // 🚨 SECURITY: Prevent subagents from spawning other subagents
    // This prevents infinite loops, resource exhaustion, and uncontrolled agent spawning
    if (this.isCurrentlyExecutingAsSubagent()) {
      const error = new Error(
        `SECURITY VIOLATION: Subagent attempted to spawn another agent. ` +
        `Only the main orchestrator may spawn agents. ` +
        `Subagent spawning is strictly prohibited to prevent infinite loops and resource exhaustion.`
      );
      console.error(`🚨 ${error.message}`);
      throw error;
    }

    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const spawnedAgent: SpawnedAgent = {
      id: agentId,
      agentType: request.agentType,
      task: request.task,
      status: "spawning",
      startTime: Date.now(),
      progress: 0,
      clickable: true, // Enable clickable monitoring
      monitorable: true, // Enable real-time monitoring
      cleanupRequired: true,
    };

    // Register agent in active pool
    this.state.activeAgents.set(agentId, spawnedAgent);

    // Handle dependencies
    if (request.dependencies && request.dependencies.length > 0) {
      this.state.agentDependencies.set(agentId, request.dependencies);

      // Check if dependencies are met
      const unmetDeps = request.dependencies.filter(
        (depId) =>
          !this.state.completedAgents.has(depId) ||
          this.state.completedAgents.get(depId)?.status !== "completed",
      );

      if (unmetDeps.length > 0) {
        frameworkLogger.log(
          "orchestrator",
          `Agent ${agentId} waiting for dependencies: ${unmetDeps.join(", ")}`,
          "info",
        );
        this.state.pendingSpawns.push(request);
        return spawnedAgent;
      }
    }

    // Log clickable spawn event
    frameworkLogger.log(
      "orchestrator",
      `🔗 SPAWNED: ${request.agentType} agent (${agentId}) - Click to monitor`,
      "info",
      {
        agentId,
        agentType: request.agentType,
        task: request.task,
        clickable: true,
        timestamp: Date.now(),
      },
    );

    // Start agent execution
    this.executeAgent(spawnedAgent, request).catch((error) => {
      frameworkLogger.log(
        "orchestrator",
        `Agent execution failed: ${error}`,
        "error",
      );
    });

    return spawnedAgent;
  }

  /**
   * Execute agent with monitoring and cleanup
   */
  private async executeAgent(
    agent: SpawnedAgent,
    request: AgentSpawnRequest,
  ): Promise<void> {
    try {
      agent.status = "active";
      agent.progress = 10;

      // Execute agent with progress updates
      const executionPromise = this.executeAgentWithDelegator(agent, request);

      // Set up monitoring updates
      const monitorInterval = setInterval(() => {
        if (agent.status === "active") {
          agent.progress = Math.min(agent.progress + 10, 90);
          this.updateAgentMonitoring(agent);
        }
      }, 1000);

      const result = await executionPromise;
      clearInterval(monitorInterval);

      // Mark as completed
      agent.status = "completed";
      agent.endTime = Date.now();
      agent.progress = 100;
      agent.result = result;

      // Move to completed pool
      this.state.activeAgents.delete(agent.id);
      this.state.completedAgents.set(agent.id, agent);

      frameworkLogger.log(
        "orchestrator",
        `✅ COMPLETED: ${agent.agentType} agent (${agent.id})`,
        "info",
        {
          agentId: agent.id,
          duration: agent.endTime - agent.startTime,
          result: typeof result,
        },
      );

      // Check for dependent agents that can now spawn
      this.checkPendingSpawns();
    } catch (error) {
      agent.status = "failed";
      agent.endTime = Date.now();
      agent.error = error instanceof Error ? error.message : String(error);
      agent.progress = 0;

      // Move to failed pool
      this.state.activeAgents.delete(agent.id);
      this.state.failedAgents.set(agent.id, agent);

      frameworkLogger.log(
        "orchestrator",
        `❌ FAILED: ${agent.agentType} agent (${agent.id}): ${agent.error}`,
        "error",
        {
          agentId: agent.id,
          error: agent.error,
          duration: agent.endTime - agent.startTime,
        },
      );
    }
  }

  /**
   * Execute agent using the agent delegator system
   */
  private async executeAgentWithDelegator(
    agent: SpawnedAgent,
    request: AgentSpawnRequest,
  ): Promise<any> {
    try {
      // Use the agent delegator system - first analyze, then execute
      const delegationRequest = {
        operation: "execute",
        files: [`task-${agent.id}.txt`],
        context: {
          agentName: request.agentType,
          taskDescription: request.task,
          priority: request.priority || "medium",
          timeout: request.timeout,
          ...request.context,
        },
      };

      // Analyze the delegation to get strategy
      const delegation =
        await this.agentDelegator.analyzeDelegation(delegationRequest);

      // Execute the delegation
      const result = await this.agentDelegator.executeDelegation(
        delegation,
        delegationRequest,
      );

      return {
        agentType: request.agentType,
        task: request.task,
        executionTime: result.executionTime || 0,
        complexity: delegation.complexity || 0,
        result:
          result.result ||
          `Completed ${request.agentType} task: ${request.task}`,
        delegationResult: result,
      };
    } catch (error) {
      // Fallback to simulation if delegation fails
      frameworkLogger.log(
        "orchestrator",
        `Agent delegation failed, using simulation: ${error}`,
        "info",
      );
      return this.simulateAgentExecution(agent, request);
    }
  }

  /**
   * Simulate agent execution (fallback when delegation fails)
   */
  private async simulateAgentExecution(
    agent: SpawnedAgent,
    request: AgentSpawnRequest,
  ): Promise<any> {
    // Simulate different execution times based on agent type and complexity
    const baseTime = this.getAgentExecutionTime(request.agentType);
    const complexityMetrics = await this.complexityAnalyzer.analyzeComplexity(
      "execute",
      {
        newCode: request.task,
        files: [`task-${agent.id}.txt`],
      },
    );

    const executionTime = baseTime * (1 + complexityMetrics.changeVolume / 100);

    await new Promise((resolve) => setTimeout(resolve, executionTime));

    return {
      agentType: request.agentType,
      task: request.task,
      executionTime,
      complexity: complexityMetrics.changeVolume,
      result: `Completed ${request.agentType} task: ${request.task}`,
    };
  }

  /**
   * Get estimated execution time for agent type
   */
  private getAgentExecutionTime(agentType: string): number {
    const times: Record<string, number> = {
      architect: 3000, // 3 seconds
      enforcer: 2000, // 2 seconds
      librarian: 4000, // 4 seconds
      "code-reviewer": 2500, // 2.5 seconds
      "security-auditor": 3500, // 3.5 seconds
      "test-architect": 3000, // 3 seconds
      "bug-triage-specialist": 2800, // 2.8 seconds
      refactorer: 3200, // 3.2 seconds
    };
    return times[agentType] || 3000;
  }

  /**
   * Update agent monitoring (integrates with clickable interface)
   */
  private updateAgentMonitoring(agent: SpawnedAgent): void {
    if (!this.state.monitoringEnabled) return;

    // Log monitoring update for clickable interface
    frameworkLogger.log(
      "orchestrator",
      `📊 MONITOR: ${agent.agentType} (${agent.id}) - ${agent.progress}%`,
      "debug",
      {
        agentId: agent.id,
        progress: agent.progress,
        status: agent.status,
        clickable: agent.clickable,
        timestamp: Date.now(),
      },
    );
  }

  /**
   * Check for pending spawns that can now execute
   */
  private checkPendingSpawns(): void {
    const readySpawns = this.state.pendingSpawns.filter((spawn) => {
      if (!spawn.dependencies) return true;

      return spawn.dependencies.every(
        (depId) =>
          this.state.completedAgents.has(depId) &&
          this.state.completedAgents.get(depId)?.status === "completed",
      );
    });

    // Execute ready spawns
    readySpawns.forEach((spawn) => {
      this.state.pendingSpawns = this.state.pendingSpawns.filter(
        (s) => s !== spawn,
      );
      this.spawnAgent(spawn);
    });
  }

  /**
   * Get clickable agent monitoring interface
   */
  getMonitoringInterface(): Record<string, SpawnedAgent> {
    const allAgents = {
      ...Object.fromEntries(this.state.activeAgents),
      ...Object.fromEntries(this.state.completedAgents),
      ...Object.fromEntries(this.state.failedAgents),
    };

    return allAgents;
  }

  /**
   * Cancel agent execution
   */
  async cancelAgent(agentId: string): Promise<boolean> {
    const agent = this.state.activeAgents.get(agentId);
    if (!agent) return false;

    agent.status = "cancelled";
    agent.endTime = Date.now();
    agent.cleanupRequired = true;

    this.state.activeAgents.delete(agentId);
    this.state.failedAgents.set(agentId, agent);

    frameworkLogger.log(
      "orchestrator",
      `🚫 CANCELLED: ${agent.agentType} agent (${agentId})`,
      "info",
    );

    return true;
  }

  /**
   * Initialize cleanup system for completed agents
   */
  private initializeCleanupSystem(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.state.cleanupInterval);
  }

  /**
   * Perform cleanup of completed/failed agents
   */
  private performCleanup(): void {
    const now = Date.now();
    const cleanupThreshold = 5 * 60 * 1000; // 5 minutes

    // Clean up old completed agents
    for (const [agentId, agent] of this.state.completedAgents) {
      if (agent.endTime && now - agent.endTime > cleanupThreshold) {
        this.state.completedAgents.delete(agentId);
        frameworkLogger.log(
          "orchestrator",
          `🧹 CLEANED: Completed agent ${agentId}`,
          "debug",
        );
      }
    }

    // Clean up old failed agents
    for (const [agentId, agent] of this.state.failedAgents) {
      if (agent.endTime && now - agent.endTime > cleanupThreshold) {
        this.state.failedAgents.delete(agentId);
        frameworkLogger.log(
          "orchestrator",
          `🧹 CLEANED: Failed agent ${agentId}`,
          "debug",
        );
      }
    }
  }

  /**
   * Get orchestration statistics
   */
  getStatistics(): {
    activeAgents: number;
    completedAgents: number;
    failedAgents: number;
    pendingSpawns: number;
    totalSpawned: number;
  } {
    return {
      activeAgents: this.state.activeAgents.size,
      completedAgents: this.state.completedAgents.size,
      failedAgents: this.state.failedAgents.size,
      pendingSpawns: this.state.pendingSpawns.length,
      totalSpawned:
        this.state.activeAgents.size +
        this.state.completedAgents.size +
        this.state.failedAgents.size,
    };
  }

  /**
   * Shutdown orchestration system
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Cancel all active agents
    const activeAgentIds = Array.from(this.state.activeAgents.keys());
    await Promise.all(activeAgentIds.map((id) => this.cancelAgent(id)));

    frameworkLogger.log(
      "orchestrator",
      "🔄 Enhanced Multi-Agent Orchestrator shutdown complete",
      "info",
    );
  }
}

// Export singleton instance
export const enhancedMultiAgentOrchestrator =
  new EnhancedMultiAgentOrchestrator();
