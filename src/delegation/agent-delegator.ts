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
} from "./complexity-analyzer.js";
import {
  strRayConfigLoader,
  type MultiAgentOrchestrationConfig,
} from "../config-loader.js";
import { StrRayStateManager } from "../state/state-manager";
import { frameworkLogger } from "../framework-logger.js";

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
    await this.logDelegationDecision(result, request);

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

    await frameworkLogger.log(
      "agent-delegator",
      "delegation execution started",
      "info",
      {
        strategy: delegation.strategy,
        agentCount: delegation.agents.length,
        operation: request.operation,
      },
    );

    try {
      console.log(
        `🎯 Executing delegation: ${delegation.strategy} with ${delegation.agents.length} agents`,
      );

      // Check multi-agent orchestration configuration
      const config = strRayConfigLoader.loadConfig();
      const multiAgentEnabled = config.multi_agent_orchestration.enabled;

      await frameworkLogger.log(
        "agent-delegator",
        "multi-agent config checked",
        "info",
        {
          multiAgentEnabled,
          maxConcurrentAgents:
            config.multi_agent_orchestration.max_concurrent_agents,
        },
      );

      // Override strategy based on configuration
      if (!multiAgentEnabled && delegation.strategy === "multi-agent") {
        console.log(
          "⚠️  Multi-agent orchestration disabled, falling back to single-agent",
        );
        delegation.strategy = "single-agent";
        delegation.agents = delegation.agents.slice(0, 1);
      }

      // Apply max concurrent agents limit
      if (
        delegation.agents.length >
        config.multi_agent_orchestration.max_concurrent_agents
      ) {
        console.log(
          `⚠️  Limiting agents to ${config.multi_agent_orchestration.max_concurrent_agents} (config limit)`,
        );
        delegation.agents = delegation.agents.slice(
          0,
          config.multi_agent_orchestration.max_concurrent_agents,
        );
      }
      let result: any;

      switch (delegation.strategy) {
        case "single-agent":
          await frameworkLogger.log(
            "agent-delegator",
            "executing single-agent strategy",
            "info",
            {
              agent: delegation.agents[0],
            },
          );
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
          await frameworkLogger.log(
            "agent-delegator",
            "executing multi-agent strategy",
            "info",
            {
              agentCount: delegation.agents.length,
              agents: delegation.agents,
            },
          );
          result = await this.executeMultiAgent(delegation.agents, request);
          break;
        case "orchestrator-led":
          await frameworkLogger.log(
            "agent-delegator",
            "executing orchestrator-led strategy",
            "info",
            {
              agentCount: delegation.agents.length,
              agents: delegation.agents,
            },
          );
          result = await this.executeOrchestratorLed(
            delegation.agents,
            request,
          );
          break;
      }

      const duration = Date.now() - startTime;
      this.recordSuccessfulDelegation(delegation, duration);

      await frameworkLogger.log(
        "agent-delegator",
        "delegation execution completed",
        "success",
        {
          strategy: delegation.strategy,
          duration,
          operation: request.operation,
        },
      );

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
   * Handle file creation events - delegate to appropriate agents
   */
  async handleFileCreation(filePath: string, content?: string): Promise<void> {
    const fileType = this.getFileType(filePath);
    const complexity = this.analyzeFileComplexity(filePath, content);

    // Always consult test-architect for new files
    if (this.shouldConsultTestArchitect(fileType, complexity)) {
      await this.delegateToTestArchitect(filePath, fileType, complexity);
    }

    // Consult other agents based on file type and complexity
    if (this.shouldConsultCodeReviewer(fileType)) {
      await this.delegateToCodeReviewer(filePath, fileType);
    }

    if (this.shouldConsultSecurityAuditor(fileType, content)) {
      await this.delegateToSecurityAuditor(filePath, fileType);
    }

    if (this.shouldConsultArchitect(filePath, fileType, complexity)) {
      await this.delegateToArchitect(filePath, fileType, complexity);
    }
  }

  /**
   * Handle file modification events
   */
  async handleFileModification(filePath: string, changes: any): Promise<void> {
    const fileType = this.getFileType(filePath);

    // Consult bug triage for significant changes
    if (this.shouldConsultBugTriage(changes)) {
      await this.delegateToBugTriage(filePath, changes);
    }

    // Consult refactorer for complex changes
    if (this.shouldConsultRefactorer(changes)) {
      await this.delegateToRefactorer(filePath, changes);
    }
  }

  /**
   * Determine if test architect should be consulted
   */
  private shouldConsultTestArchitect(fileType: string, complexity: number): boolean {
    // Consult for all code files and significant complexity
    return ['.ts', '.js', '.py', '.java', '.cpp', '.rs'].includes(fileType) || complexity > 50;
  }

  /**
   * Determine if code reviewer should be consulted
   */
  private shouldConsultCodeReviewer(fileType: string): boolean {
    return ['.ts', '.js', '.py', '.java', '.cpp', '.rs', '.md'].includes(fileType);
  }

  /**
   * Determine if security auditor should be consulted
   */
  private shouldConsultSecurityAuditor(fileType: string, content?: string): boolean {
    const isCode = ['.ts', '.js', '.py', '.java', '.cpp', '.rs'].includes(fileType);
    const hasSecurityKeywords = content && (
      content.includes('password') ||
      content.includes('secret') ||
      content.includes('auth') ||
      content.includes('security')
    );
    return isCode && !!hasSecurityKeywords;
  }

  /**
   * Determine if architect should be consulted
   */
  private shouldConsultArchitect(filePath: string, fileType: string, complexity: number): boolean {
    return complexity > 100 || fileType === '.md' || filePath.includes('architecture') || filePath.includes('design');
  }

  /**
   * Determine if bug triage should be consulted
   */
  private shouldConsultBugTriage(changes: any): boolean {
    return changes.addedLines > 50 || changes.deletedLines > 20;
  }

  /**
   * Determine if refactorer should be consulted
   */
  private shouldConsultRefactorer(changes: any): boolean {
    return changes.complexityIncrease > 20 || changes.fileSizeIncrease > 1000;
  }

  /**
   * Delegate to test architect for new file analysis
   */
  private async delegateToTestArchitect(
    filePath: string,
    fileType: string,
    complexity: number
  ): Promise<void> {
    const delegation = await this.analyzeDelegation({
      operation: 'new-file-analysis',
      description: `Analyze new ${fileType} file: ${filePath}`,
      context: {
        filePath,
        fileType,
        complexity,
        action: 'new-file-created'
      },
      priority: 'medium'
    });

    if (delegation.agents.includes('test-architect')) {
      await this.executeDelegation(delegation, {
        operation: 'new-file-analysis',
        description: `Analyze new ${fileType} file: ${filePath}`,
        context: {
          filePath,
          fileType,
          complexity,
          action: 'new-file-created'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Delegate to code reviewer
   */
  private async delegateToCodeReviewer(filePath: string, fileType: string): Promise<void> {
    const delegation = await this.analyzeDelegation({
      operation: 'code-review',
      description: `Review new ${fileType} file: ${filePath}`,
      context: {
        filePath,
        fileType,
        action: 'new-file-review'
      },
      priority: 'low'
    });

    if (delegation.agents.includes('code-reviewer')) {
      await this.executeDelegation(delegation, {
        operation: 'code-review',
        description: `Review new ${fileType} file: ${filePath}`,
        context: {
          filePath,
          fileType,
          action: 'new-file-review'
        },
        priority: 'low'
      });
    }
  }

  /**
   * Delegate to security auditor
   */
  private async delegateToSecurityAuditor(filePath: string, fileType: string): Promise<void> {
    const delegation = await this.analyzeDelegation({
      operation: 'security-scan',
      description: `Security scan for ${fileType} file: ${filePath}`,
      context: {
        filePath,
        fileType,
        action: 'security-review'
      },
      priority: 'high'
    });

    if (delegation.agents.includes('security-auditor')) {
      await this.executeDelegation(delegation, {
        operation: 'security-scan',
        description: `Security scan for ${fileType} file: ${filePath}`,
        context: {
          filePath,
          fileType,
          action: 'security-review'
        },
        priority: 'high'
      });
    }
  }

  /**
   * Delegate to architect
   */
  private async delegateToArchitect(
    filePath: string,
    fileType: string,
    complexity: number
  ): Promise<void> {
    const delegation = await this.analyzeDelegation({
      operation: 'architecture-review',
      description: `Architecture review for ${fileType} file: ${filePath}`,
      context: {
        filePath,
        fileType,
        complexity,
        action: 'architecture-review'
      },
      priority: 'medium'
    });

    if (delegation.agents.includes('architect')) {
      await this.executeDelegation(delegation, {
        operation: 'architecture-review',
        description: `Architecture review for ${fileType} file: ${filePath}`,
        context: {
          filePath,
          fileType,
          complexity,
          action: 'architecture-review'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Delegate to bug triage
   */
  private async delegateToBugTriage(filePath: string, changes: any): Promise<void> {
    const delegation = await this.analyzeDelegation({
      operation: 'change-analysis',
      description: `Analyze significant changes in ${filePath}`,
      context: {
        filePath,
        changes,
        action: 'change-review'
      },
      priority: 'medium'
    });

    if (delegation.agents.includes('bug-triage-specialist')) {
      await this.executeDelegation(delegation, {
        operation: 'change-analysis',
        description: `Analyze significant changes in ${filePath}`,
        context: {
          filePath,
          changes,
          action: 'change-review'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Delegate to refactorer
   */
  private async delegateToRefactorer(filePath: string, changes: any): Promise<void> {
    const delegation = await this.analyzeDelegation({
      operation: 'refactoring-analysis',
      description: `Analyze refactoring opportunities in ${filePath}`,
      context: {
        filePath,
        changes,
        action: 'refactoring-review'
      },
      priority: 'low'
    });

    if (delegation.agents.includes('refactorer')) {
      await this.executeDelegation(delegation, {
        operation: 'refactoring-analysis',
        description: `Analyze refactoring opportunities in ${filePath}`,
        context: {
          filePath,
          changes,
          action: 'refactoring-review'
        },
        priority: 'low'
      });
    }
  }

  /**
   * Get file type from path
   */
  private getFileType(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    return ext || 'unknown';
  }

  /**
   * Analyze file complexity
   */
  private analyzeFileComplexity(filePath: string, content?: string): number {
    let complexity = 0;

    if (content) {
      // Count lines, functions, classes, etc.
      const lines = content.split('\n').length;
      const functions = (content.match(/function\s+|=>|class\s+/g) || []).length;
      const imports = (content.match(/import\s+|require\s*\(/g) || []).length;

      complexity = lines + (functions * 5) + (imports * 2);
    }

    // File size contributes to complexity
    try {
      const stats = require('fs').statSync(filePath);
      complexity += Math.floor(stats.size / 1000); // 1 point per KB
    } catch {
      // Ignore file access errors
    }

    return complexity;
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
    // Simplified task tracking - just log the execution without complex state management
    await frameworkLogger.log(
      "agent-delegator",
      "starting single agent execution",
      "info",
      {
        agentName,
        operation: request.operation,
      },
    );

    try {
      const result = await this.callAgent(agentName, request);

      await frameworkLogger.log(
        "agent-delegator",
        "single agent execution completed",
        "success",
        {
          agentName,
          operation: request.operation,
        },
      );

      return result;
    } catch (error) {
      await frameworkLogger.log(
        "agent-delegator",
        "single agent execution failed",
        "error",
        {
          agentName,
          operation: request.operation,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
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

    return results;
  }

  private async callAgent(
    agentName: string,
    request: DelegationRequest,
  ): Promise<any> {
    // Check if agent is available in the system
    const availableAgents = [
      "sisyphus",
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect",
      "log-monitor",
    ];

    if (!availableAgents.includes(agentName)) {
      await frameworkLogger.log(
        "agent-delegator",
        "agent not available in system",
        "error",
        {
          agentName,
          availableAgents,
        },
      );
      throw new Error(
        `Agent ${agentName} not available in current system configuration`,
      );
    }
    // Check if agent is available in state manager (for testing with mocks)
    const agentKey = `agent:${agentName}`;
    const agent = this.stateManager.get(agentKey);

    if (agent && typeof (agent as any).execute === "function") {
      // Real agent available, call it
      await frameworkLogger.log(
        "agent-delegator",
        "calling real agent from state manager",
        "info",
        {
          agentName,
          operation: request.operation,
        },
      );
      return await (agent as any).execute(request);
    }

    // Fallback to simulation
    // For now, simulate agent execution since agents aren't loaded in state manager
    await frameworkLogger.log(
      "agent-delegator",
      "simulating agent execution",
      "info",
      {
        agentName,
        operation: request.operation,
      },
    );

    console.log(`🤖 Simulating execution by agent: ${agentName}`);

    // Simulate agent response based on agent type
    return {
      agent: agentName,
      result: `Simulated execution of ${request.description}`,
      status: "success",
      simulated: true,
    };
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
    frameworkLogger.log(
      "agent-delegator",
      "delegation execution failed",
      "error",
      {
        error: error?.message || String(error),
      },
    );
    console.error(`❌ Delegation failed: ${error?.message || error}`);
  }

  private async logDelegationDecision(
    result: DelegationResult,
    request: DelegationRequest,
  ): Promise<void> {
    await frameworkLogger.log(
      "agent-delegator",
      "delegation decision made",
      "info",
      {
        strategy: result.strategy,
        agents: result.agents,
        complexity: result.complexity.score,
        operation: request.operation,
      },
    );

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
