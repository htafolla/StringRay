/**
 * StringRay AI v1.1.1 - Orchestrator Agent
 *
 * Coordinates multi-step tasks and delegates to specialized subagents.
 * Implements Sisyphus integration for relentless execution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
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
export interface TestFailureContext {
    failedTests: string[];
    timeoutIssues: string[];
    performanceIssues: string[];
    flakyTests: string[];
    errorLogs: string[];
    testExecutionTime: number;
    sessionId?: string;
}
export declare class StringRayOrchestrator {
    private config;
    private activeTasks;
    private taskToAgentMap;
    constructor(config?: Partial<OrchestratorConfig>);
    /**
     * Execute a complex multi-step task
     */
    executeComplexTask(description: string, tasks: TaskDefinition[], sessionId?: string): Promise<TaskResult[]>;
    /**
     * Execute a single task by delegating to appropriate subagent
     */
    private executeSingleTask;
    /**
     * Auto-healing orchestration for test failures - coordinates multi-agent response
     */
    orchestrateTestAutoHealing(failureContext: TestFailureContext, sessionId?: string): Promise<{
        success: boolean;
        healingResult: any;
        agentCoordination: string[];
        performanceImprovement: number;
    }>;
    /**
     * Analyze test failure patterns to determine healing strategy
     */
    private analyzeTestFailurePatterns;
    /**
     * Create task definitions for healing orchestration
     */
    private createHealingTaskDefinitions;
    /**
     * Consolidate healing results from multiple agents
     */
    private consolidateHealingResults;
    /**
     * Delegate task to appropriate subagent using enhanced orchestration
     */
    private delegateToSubagent;
    /**
     * Resolve conflicts between subagent responses
     */
    resolveConflicts(conflicts: any[]): any;
    private resolveByMajorityVote;
    private resolveByExpertPriority;
    private resolveByConsensus;
    /**
     * Get orchestrator status
     */
    getStatus(): {
        activeTasks: number;
        config: OrchestratorConfig;
    };
}
export declare const strRayOrchestrator: StringRayOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map