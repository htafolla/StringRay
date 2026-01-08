/**
 * StrRay Framework v1.0.0 - Agent Delegator
 *
 * Intelligent agent delegation system that uses complexity analysis to determine
 * optimal task distribution strategies and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import {
  ComplexityAnalyzer,
  ComplexityScore,
  ComplexityMetrics,
} from "./complexity-analyzer";
import { StrRayStateManager } from "../state/state-manager";

export interface DelegationRequest {
  operation: string;
  description: string;
  context: any;
  sessionId?: string;
  priority?: "high" | "medium" | "low";
}

export interface DelegationResult {
  strategy: "single-agent" | "multi-agent" | "orchestrator-led";
  agents: string[];
  complexity: ComplexityScore;
  metrics: ComplexityMetrics;
  estimatedDuration: number;
  conflictResolution?: "majority_vote" | "expert_priority" | "consensus";
}

export interface AgentCapability {
  name: string;
  expertise: string[];
  capacity: number; // concurrent tasks
  performance: number; // 0-100 success rate
  specialties: string[];
}

export interface DelegationMetrics {
  totalDelegations: number;
  successfulDelegations: number;
  failedDelegations: number;
  averageComplexity: number;
  averageDuration: number;
  strategyUsage: Record<string, number>;
}

export class AgentDelegator {
  private complexityAnalyzer: ComplexityAnalyzer;
  private stateManager: StrRayStateManager;
  private agentCapabilities = new Map<string, AgentCapability>();
  private delegationMetrics: DelegationMetrics = {
    totalDelegations: 0,
    successfulDelegations: 0,
    failedDelegations: 0,
    averageComplexity: 0,
    averageDuration: 0,
    strategyUsage: {},
  };

  constructor(stateManager: StrRayStateManager) {
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.stateManager = stateManager;
    this.initializeAgentCapabilities();
  }

  /**
   * Analyze request and determine optimal delegation strategy
   */
  async analyzeDelegation(
    request: DelegationRequest,
  ): Promise<DelegationResult> {
    const metrics = this.complexityAnalyzer.analyzeComplexity(
      request.operation,
      request.context,
    );
    const complexity =
      this.complexityAnalyzer.calculateComplexityScore(metrics);

    const agents = this.selectAgents(complexity, request);
    const conflictResolution = this.determineConflictResolution(complexity);

    const result: DelegationResult = {
      strategy: complexity.recommendedStrategy,
      agents,
      complexity,
      metrics,
      estimatedDuration: metrics.estimatedDuration,
      conflictResolution,
    };

    this.updateDelegationMetrics(result);
    this.logDelegationDecision(result, request);

    return result;
  }

  /**
   * Execute delegation with monitoring and error handling
   */
  async executeDelegation(
    delegation: DelegationResult,
    request: DelegationRequest,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      console.log(
        `🎯 Executing delegation: ${delegation.strategy} with ${delegation.agents.length} agents`,
      );

      let result: any;

      switch (delegation.strategy) {
        case "single-agent":
          if (delegation.agents.length > 0) {
            result = await this.executeSingleAgent(
              delegation.agents[0]!,
              request,
            );
          } else {
            throw new Error("No agents available for single agent execution");
          }
          break;
        case "multi-agent":
          result = await this.executeMultiAgent(delegation.agents, request);
          break;
        case "orchestrator-led":
          result = await this.executeOrchestratorLed(
            delegation.agents,
            request,
          );
          break;
      }

      const duration = Date.now() - startTime;
      this.recordSuccessfulDelegation(delegation, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailedDelegation(delegation, duration, error);
      throw error;
    }
  }

  /**
   * Get delegation performance metrics
   */
  getPerformanceMetrics(): {
    totalDelegations: number;
    averageResponseTime: number;
  } {
    return {
      totalDelegations: this.delegationMetrics.totalDelegations,
      averageResponseTime: this.delegationMetrics.averageDuration,
    };
  }

  /**
   * Get delegation performance metrics
   */
  getDelegationMetrics(): DelegationMetrics {
    return {
      totalDelegations: this.delegationMetrics.totalDelegations,
      successfulDelegations: this.delegationMetrics.successfulDelegations,
      failedDelegations: this.delegationMetrics.failedDelegations,
      averageComplexity: this.delegationMetrics.averageComplexity,
      averageDuration: this.delegationMetrics.averageDuration,
      strategyUsage: { ...this.delegationMetrics.strategyUsage },
    };
  }

  /**
   * Update agent capabilities based on performance
   */
  updateAgentCapability(
    agentName: string,
    performance: Partial<AgentCapability>,
  ): void {
    const current = this.agentCapabilities.get(agentName);
    if (current) {
      this.agentCapabilities.set(agentName, { ...current, ...performance });
    }
  }

  /**
   * Get available agents and their current status
   */
  getAvailableAgents(): AgentCapability[] {
    return Array.from(this.agentCapabilities.values());
  }

  // Private methods

  private initializeAgentCapabilities(): void {
    const defaultAgents: AgentCapability[] = [
      {
        name: "enforcer",
        expertise: ["compliance", "validation", "security"],
        capacity: 3,
        performance: 95,
        specialties: ["codex-enforcement", "error-prevention"],
      },
      {
        name: "architect",
        expertise: ["design", "structure", "planning"],
        capacity: 2,
        performance: 90,
        specialties: ["system-design", "scalability"],
      },
      {
        name: "bug-triage-specialist",
        expertise: ["debugging", "analysis", "fixing"],
        capacity: 4,
        performance: 88,
        specialties: ["error-investigation", "root-cause-analysis"],
      },
      {
        name: "code-reviewer",
        expertise: ["review", "quality", "standards"],
        capacity: 3,
        performance: 92,
        specialties: ["code-quality", "best-practices"],
      },
      {
        name: "security-auditor",
        expertise: ["security", "vulnerability", "audit"],
        capacity: 2,
        performance: 96,
        specialties: ["security-scanning", "threat-analysis"],
      },
      {
        name: "refactorer",
        expertise: ["refactoring", "optimization", "maintenance"],
        capacity: 2,
        performance: 85,
        specialties: ["code-improvement", "technical-debt"],
      },
      {
        name: "test-architect",
        expertise: ["testing", "quality-assurance", "automation"],
        capacity: 3,
        performance: 87,
        specialties: ["test-strategy", "ci-cd-integration"],
      },
    ];

    defaultAgents.forEach((agent) => {
      this.agentCapabilities.set(agent.name, agent);
    });
  }

  private selectAgents(
    complexity: ComplexityScore,
    request: DelegationRequest,
  ): string[] {
    const availableAgents = Array.from(this.agentCapabilities.values())
      .filter((agent) => this.isAgentAvailable(agent.name))
      .sort((a, b) => b.performance - a.performance);

    switch (complexity.recommendedStrategy) {
      case "single-agent":
        return this.selectSingleAgent(availableAgents, request);

      case "multi-agent":
        return this.selectMultiAgent(
          availableAgents,
          complexity.estimatedAgents,
          request,
        );

      case "orchestrator-led":
        return this.selectOrchestratorLed(
          availableAgents,
          complexity.estimatedAgents,
        );

      default:
        return [availableAgents[0]?.name || "enforcer"];
    }
  }

  private selectSingleAgent(
    agents: AgentCapability[],
    request: DelegationRequest,
  ): string[] {
    const operation = (request.operation || "").toLowerCase();
    const description = (request.description || "").toLowerCase();

    for (const agent of agents) {
      if (
        agent.expertise.some(
          (exp) => operation.includes(exp) || description.includes(exp),
        )
      ) {
        return [agent.name];
      }
      if (
        agent.specialties.some((spec) => {
          const specPart = spec.split("-")[0] || spec;
          return operation.includes(specPart) || description.includes(specPart);
        })
      ) {
        return [agent.name];
      }
    }

    return [agents[0]?.name || "enforcer"];
  }

  private selectMultiAgent(
    agents: AgentCapability[],
    count: number,
    request: DelegationRequest,
  ): string[] {
    const operation = (request.operation || "").toLowerCase();
    const selected: string[] = [];

    for (const agent of agents) {
      if (selected.length >= count) break;
      if (agent.expertise.some((exp) => operation.includes(exp))) {
        selected.push(agent.name);
      }
    }

    while (selected.length < count && agents.length > selected.length) {
      const nextAgent = agents[selected.length];
      if (nextAgent && !selected.includes(nextAgent.name)) {
        selected.push(nextAgent.name);
      }
    }

    return selected;
  }

  private selectOrchestratorLed(
    agents: AgentCapability[],
    count: number,
  ): string[] {
    const selected = agents
      .sort((a, b) => b.performance - a.performance)
      .slice(0, count)
      .map((a) => a.name);

    return selected.length > 0 ? selected : ["enforcer", "architect"];
  }

  private determineConflictResolution(
    complexity: ComplexityScore,
  ): "majority_vote" | "expert_priority" | "consensus" {
    switch (complexity.level) {
      case "simple":
      case "moderate":
        return "consensus";
      case "complex":
        return "majority_vote";
      case "enterprise":
        return "expert_priority";
      default:
        return "consensus";
    }
  }

  private isAgentAvailable(agentName: string): boolean {
    const agent = this.agentCapabilities.get(agentName);
    if (!agent) return false;

    const activeTasks =
      (this.stateManager.get(`agent:${agentName}:active_tasks`) as number) || 0;
    return activeTasks < agent.capacity;
  }

  private async executeSingleAgent(
    agentName: string,
    request: DelegationRequest,
  ): Promise<any> {
    const currentTasks =
      (this.stateManager.get(`agent:${agentName}:active_tasks`) as number) || 0;
    this.stateManager.set(`agent:${agentName}:active_tasks`, currentTasks + 1);

    try {
      const result = await this.callAgent(agentName, request);
      return result;
    } finally {
      const finalTasks =
        (this.stateManager.get(`agent:${agentName}:active_tasks`) as number) ||
        0;
      this.stateManager.set(`agent:${agentName}:active_tasks`, finalTasks - 1);
    }
  }

  private async executeMultiAgent(
    agentNames: string[],
    request: DelegationRequest,
  ): Promise<any[]> {
    const promises = agentNames.map((agentName) =>
      this.executeSingleAgent(agentName, request),
    );
    const results = await Promise.all(promises);

    if (results.length > 1) {
      return this.resolveMultiAgentConflicts(results, agentNames);
    }

    return results;
  }

  private async executeOrchestratorLed(
    agentNames: string[],
    request: DelegationRequest,
  ): Promise<any> {
    const orchestrator = this.stateManager.get("orchestrator");
    if (!orchestrator) {
      throw new Error(
        "Orchestrator not available for orchestrator-led execution",
      );
    }

    const tasks = agentNames.map((agentName, index) => ({
      id: `task_${index}`,
      description: `${request.description} - ${agentName} perspective`,
      subagentType: agentName,
      priority: request.priority || "medium",
    }));

    const orchestratorInstance = orchestrator as any;
    const results = await orchestratorInstance.executeComplexTask(
      `Orchestrator-led: ${request.description}`,
      tasks,
      request.sessionId,
    );

    return this.consolidateOrchestratorResults(results);
  }

  private async callAgent(
    agentName: string,
    request: DelegationRequest,
  ): Promise<any> {
    const agentInstance = this.stateManager.get(`agent:${agentName}`);
    if (!agentInstance) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const agent = agentInstance as any;
    if (typeof agent.execute === "function") {
      return await agent.execute(request);
    }

    console.warn(
      `Agent ${agentName} does not have execute method, simulating response`,
    );
    return { agent: agentName, result: `Executed ${request.description}` };
  }

  private resolveMultiAgentConflicts(
    results: any[],
    agentNames: string[],
  ): any[] {
    if (results.length <= 1) return results;

    const consensusResults = results.filter((r) => r.consensus === true);
    if (consensusResults.length > 0) return consensusResults;

    const highConfidenceResults = results.filter(
      (r) => (r.confidence || 0) > 0.8,
    );
    if (highConfidenceResults.length > 0) return highConfidenceResults;

    return [results[0]];
  }

  private consolidateOrchestratorResults(results: any[]): any {
    if (!Array.isArray(results) || results.length === 0) {
      return { consolidated: true, results: [] };
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      consolidated: true,
      successful: successful.length,
      failed: failed.length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      results: successful.map((r) => r.result),
    };
  }

  private updateDelegationMetrics(result: DelegationResult): void {
    this.delegationMetrics.totalDelegations++;
    this.delegationMetrics.averageComplexity =
      (this.delegationMetrics.averageComplexity *
        (this.delegationMetrics.totalDelegations - 1) +
        result.complexity.score) /
      this.delegationMetrics.totalDelegations;

    this.delegationMetrics.strategyUsage[result.strategy] =
      (this.delegationMetrics.strategyUsage[result.strategy] || 0) + 1;
  }

  private recordSuccessfulDelegation(
    delegation: DelegationResult,
    duration: number,
  ): void {
    this.delegationMetrics.successfulDelegations++;
    this.delegationMetrics.averageDuration =
      (this.delegationMetrics.averageDuration *
        (this.delegationMetrics.successfulDelegations - 1) +
        duration) /
      this.delegationMetrics.successfulDelegations;
  }

  private recordFailedDelegation(
    delegation: DelegationResult,
    duration: number,
    error: any,
  ): void {
    this.delegationMetrics.failedDelegations++;
    console.error(`❌ Delegation failed: ${error?.message || error}`);
  }

  private logDelegationDecision(
    result: DelegationResult,
    request: DelegationRequest,
  ): void {
    console.log(`📋 Delegation Decision: ${result.strategy} strategy`);
    console.log(`   Agents: ${result.agents.join(", ")}`);
    console.log(
      `   Complexity: ${result.complexity.level} (${result.complexity.score})`,
    );
    console.log(
      `   Reasoning: ${result.complexity.reasoning.slice(0, 2).join("; ")}`,
    );
  }
}

// Export singleton instance factory
export const createAgentDelegator = (
  stateManager: StrRayStateManager,
): AgentDelegator => {
  return new AgentDelegator(stateManager);
};
