/**
 * StringRay AI v1.1.1 - Multi-Agent Orchestration Coordinator
 *
 * Central coordinator for multi-agent orchestration that integrates all orchestration components
 * for comprehensive E2E workflow management and coordination.
 *
 * @version 1.1.0
 * @since 2026-01-23
 */
import { TaskDefinition } from "../orchestrator";
import { StringRayStateManager } from "../state/state-manager";
export interface OrchestrationWorkflow {
    id: string;
    name: string;
    description: string;
    tasks: TaskDefinition[];
    priority: "low" | "medium" | "high" | "critical";
    timeout?: number;
    dependencies?: string[];
    context?: Record<string, any>;
}
export interface OrchestrationResult {
    success: boolean;
    workflowId: string;
    completedTasks: number;
    failedTasks: number;
    totalTasks: number;
    duration: number;
    results: any[];
    errors: string[];
    agentCoordination: {
        agentsUsed: string[];
        coordinationEvents: number;
        conflictsResolved: number;
    };
}
export interface CoordinationMetrics {
    totalWorkflows: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    averageDuration: number;
    agentUtilization: Record<string, number>;
    coordinationEfficiency: number;
}
export declare class MultiAgentOrchestrationCoordinator {
    private strRayOrchestrator;
    private enhancedOrchestrator;
    private agentDelegator;
    private stateManager;
    private complexityAnalyzer;
    private coordinationMetrics;
    constructor(stateManager?: StringRayStateManager);
    /**
     * Initialize the coordination system with all components
     */
    private initializeCoordinationSystem;
    /**
     * Execute a complete orchestration workflow with full coordination
     */
    executeOrchestrationWorkflow(workflow: OrchestrationWorkflow, sessionId?: string): Promise<OrchestrationResult>;
    /**
     * Analyze workflow complexity and create execution plan
     */
    private analyzeWorkflowComplexity;
    /**
     * Allocate resources for workflow execution
     */
    private allocateWorkflowResources;
    /**
     * Execute coordinated workflow using all orchestration components
     */
    private executeCoordinatedWorkflow;
    /**
     * Consolidate workflow results
     */
    private consolidateWorkflowResults;
    /**
     * Build parallel execution groups based on dependencies
     */
    private buildParallelExecutionGroups;
    /**
     * Update coordination metrics
     */
    private updateCoordinationMetrics;
    /**
     * Get coordination metrics
     */
    getCoordinationMetrics(): CoordinationMetrics;
    /**
     * Validate orchestration workflow
     */
    validateWorkflow(workflow: OrchestrationWorkflow): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Shutdown coordination system
     */
    shutdown(): Promise<void>;
}
export declare const multiAgentOrchestrationCoordinator: MultiAgentOrchestrationCoordinator;
//# sourceMappingURL=multi-agent-orchestration-coordinator.d.ts.map