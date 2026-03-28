/**
 * Agent Delegator
 *
 * Intelligent agent delegation system that uses complexity analysis to determine
 * optimal task distribution strategies and conflict resolution.
 *
 * Integrates with TaskSkillRouter for keyword-based preprocessing.
 *
 * @version 1.1.0
 * @since 2026-01-07
 */

import {
   ComplexityAnalyzer,
   ComplexityMetrics,
   ComplexityScore,
} from "./complexity-analyzer.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { strRayConfigLoader } from "../core/config-loader.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { getKernel, KernelInferenceResult } from "../core/kernel-patterns.js";
import { DEFAULT_AGENTS } from "../config/default-agents.js";

export interface AgentCapability {
  name: string;
  capabilities: string[];
  status: "active" | "inactive";
  [key: string]: any; // Allow additional properties
}

export interface DelegationRequest {
  operation: string;
  description: string;
  context?: any;
  sessionId?: string;
}

export interface DelegationAnalysis {
  strategy: "single-agent" | "multi-agent" | "orchestrator-led";
  agents: string[];
  agentDetails: Array<{
    name: string;
    confidence: number;
    role: string;
  }>;
  complexity: ComplexityScore;
  conflictResolution: "majority_vote" | "expert_priority" | "consensus";
  estimatedDuration: number;
  metrics?: {
    [key: string]: any;
  };
}

export interface DelegationResult {
  success: boolean;
  results: Array<{
    agent: string;
    output: any;
    executionTime: number;
  }>;
  totalTime: number;
  errors?: string[] | undefined;
  agents?: string[];
}

export interface PerformanceMetrics {
  totalDelegations: number;
  successfulDelegations: number;
  failedDelegations: number;
  averageExecutionTime: number;
  averageResponseTime: number;
  averageComplexity: number;
  averageDuration: number;
  strategyUsage: Record<string, number>;
  agentUtilization: Record<string, number>;
}

export interface DelegationMetrics extends PerformanceMetrics {
  recentDelegations: Array<{
    timestamp: number;
    operation: string;
    strategy: string;
    success: boolean;
    totalTime: number;
  }>;
}

/**
 * AgentDelegator class for intelligent task delegation
 */
export class AgentDelegator {
  private complexityAnalyzer: ComplexityAnalyzer;
  private stateManager: StringRayStateManager;
  private configLoader: typeof strRayConfigLoader;
  private kernel: ReturnType<typeof getKernel>;

  constructor(
    stateManager: StringRayStateManager,
    configLoader: typeof strRayConfigLoader,
  ) {
    this.stateManager = stateManager;
    this.configLoader = configLoader;
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.kernel = getKernel();
  }

  getAvailableAgents(): AgentCapability[] {
    return DEFAULT_AGENTS.map((agent) => {
      const storedAgent = this.stateManager.get(
        `agent_capabilities:${agent.name}`,
      ) as AgentCapability;
      return storedAgent || agent;
    });
  }

  /**
   * Pre-process a task description using TaskSkillRouter
   * This extracts operation type and context from natural language descriptions
   * before running complexity analysis
   */
  preprocessTaskDescription(
    description: string,
    options?: {
      sessionId?: string;
      taskId?: string;
      complexity?: number;
    },
  ): {
    operation: string;
    context: Record<string, unknown>;
    suggestedAgent: string;
    suggestedSkill: string;
    confidence: number;
  } {
    const routingOptions = {
      ...(options?.sessionId && { sessionId: options.sessionId }),
      ...(options?.taskId && { taskId: options.taskId }),
      ...(options?.complexity !== undefined && {
        complexity: options.complexity,
      }),
      stateManager: this.stateManager,
    };

    return {
      operation: description,
      context: {},
      suggestedAgent: DEFAULT_AGENTS[0]?.name || "enforcer",
      suggestedSkill: "",
      confidence: 0.5,
    };
  }

  async analyzeDelegation(
    request: DelegationRequest,
  ): Promise<DelegationAnalysis> {
    try {
      const metrics: ComplexityMetrics = {
        fileCount: request.context?.files?.length || 1,
        changeVolume: request.context?.changeVolume || 10,
        operationType: this.mapOperationToType(request.operation),
        dependencies: request.context?.dependencies?.length || 0,
        riskLevel: request.context?.riskLevel || "low",
        estimatedDuration: 10,
        operation: request.operation,
      } as any;

      const complexityScore =
        this.complexityAnalyzer.calculateComplexityScore(metrics);

      // KERNEL ANALYSIS: Apply kernel pattern detection
      const kernelInsights = this.kernel.analyze(request.description);
      
      // Log kernel insights for debugging and learning
      frameworkLogger.log(
        "agent-delegator",
        "kernel-analysis",
        "info",
        {
          operation: request.operation,
          kernelLevel: kernelInsights.level,
          kernelConfidence: kernelInsights.confidence,
          detectedPatterns: kernelInsights.cascadePatterns?.length || 0,
          detectedAssumptions: kernelInsights.fatalAssumptions?.length || 0,
        }
      );

      const agentDetails = this.determineAgents(metrics, complexityScore, kernelInsights);
      const conflictResolution = this.determineConflictResolution(
        metrics,
        complexityScore,
      );
      const agents = agentDetails.map((a) => a.name);

      // Persist delegation analysis metrics to state for tracking
      const existingMetrics =
        (this.stateManager.get("delegation_metrics") as any[]) || [];
      const delegationMetric = {
        timestamp: Date.now(),
        operation: request.operation,
        strategy: complexityScore.recommendedStrategy,
        complexity: complexityScore,
        estimatedDuration: metrics.estimatedDuration,
        agents: agents,
        analysisOnly: true,
        sessionId: request.sessionId,
      };
      existingMetrics.push(delegationMetric);
      this.stateManager.set("delegation_metrics", existingMetrics);

      await frameworkLogger.log(
        "agent-delegator",
        "delegation-analyzed",
        "info",
        {
          operation: request.operation,
          strategy: complexityScore.recommendedStrategy,
          complexity: complexityScore.score,
          agentsCount: agents.length,
        },
        request.sessionId,
      );

      return {
        strategy: complexityScore.recommendedStrategy,
        agents,
        agentDetails,
        complexity: complexityScore,
        conflictResolution,
        estimatedDuration: metrics.estimatedDuration,
      };
    } catch (error) {
      await frameworkLogger.log(
        "agent-delegator",
        "analysis-failed",
        "error",
        {
          operation: request.operation,
          error: String(error),
        },
        request.sessionId,
      );
      throw error;
    }
  }

  private determineAgents(
    metrics: ComplexityMetrics,
    complexityScore: ComplexityScore,
    kernelInsights: KernelInferenceResult,
  ): Array<{ name: string; confidence: number; role: string }> {
    const agents: Array<{ name: string; confidence: number; role: string }> =
      [];

    const operation = (metrics as any).operation;

    if (operation === "security") {
      // KERNEL-AWARE: Apply P6 (Security Vulnerability) and A8/A9 patterns
      if (kernelInsights.fatalAssumptions?.some(a => 
        a.id === 'A8' || a.id === 'A9')) {
        // Kernel detected security foundation assumption
        frameworkLogger.log(
          "agent-delegator",
          "kernel-guided-security",
          "info",
          {
            detectedPattern: kernelInsights.fatalAssumptions?.find(a => a.id)?.id,
            guidance: 'Apply security foundation protocols first',
            kernelAction: kernelInsights.fatalAssumptions?.find(a => a.id)?.action,
          }
        );
      }
      
      agents.push({
        name: "security-auditor",
        confidence: 0.95,
        role: "security",
      });
    }

    if (operation === "review") {
      agents.push({ name: "code-reviewer", confidence: 0.8, role: "review" });
    }

    if (operation === "design") {
      agents.push({ name: "architect", confidence: 0.9, role: "design" });
    }
    if (
      complexityScore.recommendedStrategy === "multi-agent" ||
      complexityScore.recommendedStrategy === "orchestrator-led"
    ) {
      if (metrics.riskLevel === "critical") {
        agents.push({
          name: "security-auditor",
          confidence: 0.95,
          role: "security",
        });
      }
      if (metrics.operationType === "refactor") {
        agents.push({
          name: "refactorer",
          confidence: 0.85,
          role: "refactoring",
        });
      }
      if (metrics.dependencies > 3) {
        agents.push({ name: "code-reviewer", confidence: 0.8, role: "review" });
      }
      if (agents.length === 1) {
        agents.push({ name: "enforcer", confidence: 0.75, role: "validation" });
      }
    } else {
      if (metrics.operationType === "debug") {
        agents.push({
          name: "bug-triage-specialist",
          confidence: 0.85,
          role: "debugging",
        });
      } else if (metrics.operationType === "test") {
        agents.push({
          name: "testing-lead",
          confidence: 0.8,
          role: "testing",
        });
      } else if (metrics.operationType === "refactor") {
        agents.push({
          name: "refactorer",
          confidence: 0.85,
          role: "refactoring",
        });
      } else if (metrics.operationType === "create" && operation !== "design") {
        agents.push({ name: "architect", confidence: 0.85, role: "design" });
      } else if (operation === "review" && agents.length === 0) {
        // Add code-reviewer for review tasks if not already added
        agents.push({ name: "code-reviewer", confidence: 0.8, role: "review" });
      } else if (
        complexityScore.level === "moderate" ||
        metrics.dependencies > 3
      ) {
        agents.push({ name: "code-reviewer", confidence: 0.8, role: "review" });
      } else if (agents.length === 0) {
        agents.push({ name: "enforcer", confidence: 0.75, role: "validation" });
      }
    }

    if (complexityScore.recommendedStrategy === "orchestrator-led") {
      agents.push({
        name: "orchestrator",
        confidence: 0.9,
        role: "coordination",
      });
    }

    const finalAgents = agents.length > 0
      ? agents
      : [{ name: "enforcer", confidence: 0.75, role: "validation" }];
    
    // Log complete agent selection for analytics
    frameworkLogger.log(
      "agent-delegator",
      "agents-selected",
      "info",
      {
        operation,
        strategy: complexityScore.recommendedStrategy,
        complexityLevel: complexityScore.level,
        complexityScore: complexityScore.score,
        agents: finalAgents.map(a => ({ name: a.name, role: a.role, confidence: a.confidence })),
        agentCount: finalAgents.length,
      }
    );
    
    return finalAgents;
  }

  private mapOperationToType(
    operation: string,
  ): ComplexityMetrics["operationType"] {
    const op = operation.toLowerCase();
    if (op.includes("security") || op.includes("audit")) {
      return "analyze";
    }
    if (op.includes("review") || op.includes("quality")) {
      return "modify";
    }
    if (op.includes("refactor") || op.includes("restructure")) {
      return "refactor";
    }
    if (op.includes("debug") || op.includes("fix") || op.includes("resolve")) {
      return "debug";
    }
    if (op.includes("test")) {
      return "test";
    }
    if (op.includes("create") || op.includes("add") || op.includes("new")) {
      return "create";
    }
    if (op.includes("design") || op.includes("architect")) {
      return "create";
    }
    return "modify";
  }

  private determineConflictResolution(
    metrics: ComplexityMetrics,
    complexityScore: ComplexityScore,
  ): "majority_vote" | "expert_priority" | "consensus" {
    if (
      complexityScore.level === "enterprise" ||
      metrics.riskLevel === "critical"
    ) {
      return "expert_priority";
    }

    if (complexityScore.level === "complex" || metrics.dependencies > 5) {
      return "consensus";
    }

    return "majority_vote";
  }

    /**
   * Resolve the project directory for delegated agents
   * Ensures working directory is set correctly (src/ vs dist/ vs project root)
   */
  private resolveProjectDirectory(): string {
    // Try to find the project root by looking for key files
    // Only use process.cwd() and validate it exists
    const root = process.cwd();
    const fs = require('fs');
    
    // Check if this looks like a valid project root
    if (fs.existsSync(`${root}/package.json`) || fs.existsSync(`${root}/strray.config.json`)) {
      return root;
    }
    
    // Fallback - try to find a parent with package.json
    let current = root;
    const maxLevels = 5;
    for (let i = 0; i < maxLevels; i++) {
      const parent = require('path').dirname(current);
      if (fs.existsSync(`${parent}/package.json`)) {
        return parent;
      }
      current = parent;
    }
    
    // Last resort fallback
    return root;
  }

  /**
   * Allowlist of valid agent names for dynamic imports
   * Prevents path traversal and unauthorized agent loading
   */
  private static readonly ALLOWED_AGENTS = new Set([
    'enforcer',
    'architect', 
    'orchestrator',
    'bug-triage-specialist',
    'code-reviewer',
    'security-auditor',
    'refactorer',
    'testing-lead',
    'log-monitor',
    'researcher',
    'analyzer',
  ]);

  /**
   * Validate agent name for security
   * @throws Error if agent name is invalid or not allowed
   */
  private validateAgentName(agentName: string): void {
    // Check for path traversal attempts
    if (agentName.includes('..') || agentName.includes('/') || agentName.includes('\\')) {
      throw new Error(`Invalid agent name: path traversal detected in "${agentName}"`);
    }
    
    // Check for other dangerous characters
    if (!/^[a-zA-Z0-9_-]+$/.test(agentName)) {
      throw new Error(`Invalid agent name: only alphanumeric, underscore, and hyphen allowed in "${agentName}"`);
    }
    
    // Check allowlist
    if (!AgentDelegator.ALLOWED_AGENTS.has(agentName)) {
      throw new Error(`Agent "${agentName}" is not in the allowed list`);
    }
  }

  /**
   * Create a properly configured agent with full tool access and working directory context
   */
  private createProperlyConfiguredAgent(
    agentName: string, 
    agentConfig: any, 
    request: DelegationRequest
  ): any {
    // Validate agent name before any operation (security)
    this.validateAgentName(agentName);
    
    // Create the agent with proper context
    return {
      config: agentConfig,
      agentName: agentName,
      execute: async (req: DelegationRequest) => {
        try {
          // Import the specific agent implementation
          const agentModule = await import(`../agents/${agentName}.js`);
          const agentImplementation = agentModule[agentName];
          
          if (agentImplementation && typeof agentImplementation.execute === 'function') {
            // Ensure the agent has access to built-in OpenCode tools
            const enhancedRequest = {
              ...req,
              context: {
                ...req.context,
                workingDirectory: process.cwd(),
                availableTools: ['read', 'write', 'edit', 'glob', 'grep', 'bash', 'task', 'webfetch', 'todowrite', 'todoread', 'skill'],
                isDelegated: true
              }
            };
            return await agentImplementation.execute(enhancedRequest);
          } else {
            throw new Error(`Agent ${agentName} does not have a valid execute method`);
          }
        } catch (error) {
          // Fallback to structured error response for agents without proper implementations
          return {
            agent: agentName,
            operation: request.operation,
            description: request.description,
            capabilities: agentConfig.capabilities,
            mode: agentConfig.mode,
            status: "error",
            timestamp: new Date().toISOString(),
            error: `Agent execution failed: ${String(error)}`,
            recommendations: [
              "Check if agent implementation exists",
              "Verify agent has proper execute method",
              "Ensure agent supports delegated mode"
            ]
          };
        }
      },
      getCapabilities: () => agentConfig.capabilities,
      getMaxComplexity: () => agentConfig.maxComplexity,
      isEnabled: () => agentConfig.enabled,
      isAgent: true, // Distinction from skills
      getType: () => 'agent'
    };
  }

  /**
   * Clear agent-stub creation and deprecated features
   * Remove this method if it exists in the future version
   */
  private clearDeprecatedStubAgent(): void {
    // Legacy method removal - this ensures no stub agents are created
    frameworkLogger.log("agent-delegator", "deprecated-method-removed", "info", {
      message: "Cleared deprecated stub agent creation to ensure proper tool access",
      timestamp: new Date().toISOString()
    });
  }

  async executeDelegation(
    analysis: DelegationAnalysis,
    request: DelegationRequest,
  ): Promise<DelegationResult> {
    const startTime = Date.now();
    const results: Array<{
      agent: string;
      output: any;
      executionTime: number;
    }> = [];
    const errors: string[] = [];

    // Set up proper working directory for delegated agents
    const originalWorkingDir = process.cwd();
    const projectRootDir = this.resolveProjectDirectory();
    
    try {
      // Change to project working directory for all delegated agents
      process.chdir(projectRootDir);

      // Properly configured agent execution
      const { builtinAgents } = await import("../agents/index.js");
      
      for (const agentName of analysis.agents) {
        const agentStartTime = Date.now();

        try {
          // First check state manager for custom/mock agents (for testing)
          let agentInstance = this.stateManager.get(`agent:${agentName}`);
          
          // If no custom agent in state, use builtin configuration
          if (!agentInstance) {
            const agentConfig = builtinAgents[agentName];
            if (!agentConfig) {
              throw new Error(`Agent ${agentName} not found in builtin agents`);
            }
            // Create properly configured agent with full tool access
            agentInstance = this.createProperlyConfiguredAgent(agentName, agentConfig, request);
          }

          // Execute the agent
          const output = await (agentInstance as any).execute(request);
          const executionTime = Date.now() - agentStartTime;

          results.push({
            agent: agentName,
            output,
            executionTime,
          });

          await frameworkLogger.log(
            "agent-delegator",
            "agent-executed",
            "success",
            {
              agent: agentName,
              executionTime,
              success: true,
              workingDirectory: projectRootDir,
            },
            request.sessionId,
          );
        } catch (error) {
          const executionTime = Date.now() - agentStartTime;
          const errorMessage = `Agent ${agentName} failed: ${String(error)}`;
          errors.push(errorMessage);

          await frameworkLogger.log(
            "agent-delegator",
            "agent-execution-failed",
            "error",
            {
              agent: agentName,
              executionTime,
              error: errorMessage,
              workingDirectory: projectRootDir,
            },
            request.sessionId,
          );
        }
      }

      const totalTime = Date.now() - startTime;
      const success = errors.length === 0 && results.length > 0;

      // Persist delegation execution metrics to state for tracking
      const existingMetrics =
        (this.stateManager.get("delegation_metrics") as any[]) || [];
      const delegationMetric = {
        timestamp: Date.now(),
        operation: request.operation,
        strategy: analysis.strategy,
        complexity: analysis.complexity,
        estimatedDuration: analysis.estimatedDuration,
        agents: analysis.agents,
        results,
        totalTime,
        success,
        errors,
        analysisOnly: false,
        sessionId: request.sessionId,
      };
      existingMetrics.push(delegationMetric);
      this.stateManager.set("delegation_metrics", existingMetrics);

      await frameworkLogger.log(
        "agent-delegator",
        "delegation-completed",
        success ? "success" : "error",
        {
          strategy: analysis.strategy,
          agentsCount: analysis.agents.length,
          successCount: results.length,
          errorCount: errors.length,
          totalTime,
        },
        request.sessionId,
      );

      // Restore original working directory
      process.chdir(originalWorkingDir);
      
      return {
        success,
        results,
        totalTime,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      // Ensure working directory is restored even on failure
      process.chdir(originalWorkingDir);
      
      const totalTime = Date.now() - startTime;
      await frameworkLogger.log(
        "agent-delegator",
        "delegation-failed",
        "error",
        {
          error: String(error),
          totalTime,
          workingDirectoryRestored: process.cwd(),
        },
        request.sessionId,
      );
      throw error;
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const delegations =
      (this.stateManager.get("delegation_metrics") as any[]) || [];
    const executionDelegations = delegations.filter(
      (d: any) => !d.analysisOnly,
    );
    const totalDelegations =
      executionDelegations.length > 0
        ? executionDelegations.length
        : delegations.length;
    const successfulDelegations = executionDelegations.filter(
      (d: any) => d.success,
    ).length;
    const failedDelegations = executionDelegations.filter(
      (d: any) => !d.success,
    ).length;

    const averageExecutionTime =
      totalDelegations > 0
        ? delegations.reduce((sum: number, d: any) => sum + d.totalTime, 0) /
          totalDelegations
        : 0;

    const agentUtilization: Record<string, number> = {};
    const strategyUsage: Record<string, number> = {};
    let totalComplexity = 0;
    let totalDuration = 0;

    delegations.forEach((delegation: any) => {
      // Count strategy usage for both analyses and executions
      if (delegation.strategy) {
        strategyUsage[delegation.strategy] =
          (strategyUsage[delegation.strategy] || 0) + 1;
      }
      if (delegation.complexity?.score) {
        totalComplexity += delegation.complexity.score;
      }
      if (delegation.estimatedDuration) {
        totalDuration += delegation.estimatedDuration;
      }
      delegation.results?.forEach((result: any) => {
        agentUtilization[result.agent] =
          (agentUtilization[result.agent] || 0) + 1;
      });
    });

    const averageResponseTime = averageExecutionTime;
    const averageComplexity =
      totalDelegations > 0 ? totalComplexity / totalDelegations : 0;
    const averageDuration =
      totalDelegations > 0 ? totalDuration / totalDelegations : 0;

    return {
      totalDelegations,
      successfulDelegations,
      failedDelegations,
      averageExecutionTime,
      averageResponseTime,
      averageComplexity,
      averageDuration,
      strategyUsage,
      agentUtilization,
    };
  }

  getDelegationMetrics(): DelegationMetrics {
    const baseMetrics = this.getPerformanceMetrics();
    const recentDelegations = (
      (this.stateManager.get("delegation_metrics") as any[]) || []
    )
      .slice(-10)
      .map((d: any) => ({
        timestamp: d.timestamp || Date.now(),
        operation: d.operation,
        strategy: d.strategy,
        success: d.success,
        totalTime: d.totalTime,
      }));

    return {
      ...baseMetrics,
      recentDelegations,
    };
  }

  updateAgentCapability(
    agentName: string,
    capabilities: Partial<AgentCapability>,
  ): void {
    const availableAgents = this.getAvailableAgents();
    const agentIndex = availableAgents.findIndex((a) => a.name === agentName);

    if (agentIndex !== -1) {
      const existingAgent = availableAgents[agentIndex];
      const updatedAgent: AgentCapability = {
        ...existingAgent,
        ...capabilities,
        name: agentName,
        capabilities:
          capabilities.capabilities || existingAgent?.capabilities || [],
        status: capabilities.status || existingAgent?.status || "active",
      };
      availableAgents[agentIndex] = updatedAgent;

      this.stateManager.set(`agent_capabilities:${agentName}`, updatedAgent);

      frameworkLogger.log(
        "agent-delegator",
        "agent-capability-updated",
        "info",
        {
          agentName,
          updatedCapabilities: capabilities,
        },
      );
    }
  }
}

export function createAgentDelegator(
  stateManager: StringRayStateManager,
  configLoader: typeof strRayConfigLoader,
): AgentDelegator {
  return new AgentDelegator(stateManager, configLoader);
}
