/**
 * Enhanced Multi-Agent Orchestration with Clickable Monitoring
 * Integrates subagent spawning visibility and lifecycle management
 */
import { StringRayStateManager } from "../state/state-manager";
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
    isMainOrchestrator: boolean;
}
export declare class EnhancedMultiAgentOrchestrator {
    private state;
    private stateManager;
    private complexityAnalyzer;
    private agentDelegator;
    private executionContext;
    private cleanupTimer;
    constructor(stateManager?: StringRayStateManager, isMainOrchestrator?: boolean);
    /**
     * 🚨 SECURITY: Check if currently executing as a subagent
     * Prevents subagents from spawning other subagents (infinite loops, resource exhaustion)
     */
    private isCurrentlyExecutingAsSubagent;
    /**
     * Enhanced agent spawning with clickable monitoring integration
     */
    spawnAgent(request: AgentSpawnRequest): Promise<SpawnedAgent>;
    /**
     * Execute agent with monitoring and cleanup
     */
    private executeAgent;
    /**
     * Execute agent using the agent delegator system
     */
    private executeAgentWithDelegator;
    /**
     * Simulate agent execution (fallback when delegation fails)
     */
    private simulateAgentExecution;
    /**
     * Get estimated execution time for agent type
     */
    private getAgentExecutionTime;
    /**
     * Update agent monitoring (integrates with clickable interface)
     */
    private updateAgentMonitoring;
    /**
     * Check for pending spawns that can now execute
     */
    private checkPendingSpawns;
    /**
     * Get clickable agent monitoring interface
     */
    getMonitoringInterface(): Record<string, SpawnedAgent>;
    /**
     * Cancel agent execution
     */
    cancelAgent(agentId: string): Promise<boolean>;
    /**
     * Initialize cleanup system for completed agents
     */
    private initializeCleanupSystem;
    /**
     * Perform cleanup of completed/failed agents
     */
    private performCleanup;
    /**
     * Get orchestration statistics
     */
    getStatistics(): {
        activeAgents: number;
        completedAgents: number;
        failedAgents: number;
        pendingSpawns: number;
        totalSpawned: number;
    };
    /**
     * Shutdown orchestration system
     */
    shutdown(): Promise<void>;
}
export declare const enhancedMultiAgentOrchestrator: EnhancedMultiAgentOrchestrator;
//# sourceMappingURL=enhanced-multi-agent-orchestrator.d.ts.map