/**
 * Orchestrator MCP Server Types
 * 
 * Type definitions for the orchestrator MCP server module
 */

export interface AgentCapability {
  capabilities: string[];
  complexityThreshold: number;
  concurrentTasks: number;
}

export interface OrchestrationTask {
  id: string;
  description: string;
  type: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  estimatedComplexity?: number;
}

export interface ExecutionPlan {
  tasks: OrchestrationTask[];
  strategy: 'parallel' | 'sequential' | 'optimized';
  agentAssignments: Map<string, OrchestrationTask[]>;
  estimatedDuration: number;
}

export interface OrchestrationResult {
  sessionId: string;
  success: boolean;
  completedTasks: number;
  failedTasks: number;
  duration: number;
  agentUtilization: Record<string, number>;
  bottlenecks: string[];
  recommendations: string[];
}

export interface ComplexityAnalysis {
  overallComplexity: number;
  recommendedStrategy: string;
  taskComplexity: Array<{ complexity: number; category: string }>;
  agentAssignments: Array<{ agent: string; taskCount: number; utilization: number }>;
  estimatedDuration: number;
  parallelPotential: number;
}

export interface TaskValidation {
  valid: boolean;
  errors: string[];
}

export interface OrchestrationStatus {
  activeSessions: number;
  totalTasks: number;
  agentUtilization: Record<string, number>;
  recentSessions: Array<{
    sessionId: string;
    status: string;
    tasks: number;
    duration: number;
  }>;
}

export interface TaskExecutionContext {
  sessionId: string;
  task: OrchestrationTask;
  assignedAgent: string;
  startTime: number;
}
