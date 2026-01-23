/**
 * StringRay AI v1.1.1 - Session Coordinator
 *
 * Manages cross-agent communication and coordination within sessions.
 * Tracks delegation state, agent interactions, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { StringRayStateManager } from "../state/state-manager";
import { DelegationResult } from "./agent-delegator";
export interface SessionContext {
    sessionId: string;
    startTime: number;
    activeDelegations: Map<string, DelegationResult>;
    agentInteractions: Map<string, AgentInteraction[]>;
    conflictHistory: ConflictRecord[];
    coordinationState: CoordinationState;
    isActive: boolean;
}
export interface AgentInteraction {
    agentName: string;
    timestamp: number;
    action: string;
    result: any;
    duration: number;
    success: boolean;
}
export interface ConflictRecord {
    conflictId: string;
    timestamp: number;
    agents: string[];
    resolution: "consensus" | "majority_vote" | "expert_priority" | "manual";
    outcome: any;
}
export interface CoordinationState {
    activeAgents: Set<string>;
    pendingCommunications: Communication[];
    sharedContext: Map<string, any>;
    sessionMetrics: SessionMetrics;
}
export interface Communication {
    id: string;
    fromAgent: string;
    toAgent: string;
    message: any;
    timestamp: number;
    priority: "low" | "medium" | "high";
}
export interface SessionMetrics {
    totalInteractions: number;
    successfulInteractions: number;
    failedInteractions: number;
    averageResponseTime: number;
    conflictResolutionRate: number;
    coordinationEfficiency: number;
}
export declare class SessionCoordinator {
    private stateManager;
    private sessions;
    constructor(stateManager: StringRayStateManager);
    /**
     * Initialize session coordination for a new session
     */
    initializeSession(sessionId: string): {
        sessionId: string;
        createdAt: Date;
        active: boolean;
        agentCount: number;
    };
    /**
     * Register delegation execution in session
     */
    registerDelegation(sessionId: string, delegationId: string, delegation: DelegationResult): void;
    /**
     * Record agent interaction within session
     */
    recordInteraction(sessionId: string, agentName: string, interaction: Omit<AgentInteraction, "timestamp">): void;
    /**
     * Send message between agents within session
     */
    sendMessage(sessionId: string, fromAgent: string, toAgent: string, message: any, priority?: "low" | "medium" | "high"): Promise<void>;
    /**
     * Receive pending messages for an agent
     */
    receiveMessages(sessionId: string, agentName: string): Communication[];
    /**
     * Share context data between agents
     */
    shareContext(sessionId: string, key: string, value: any, fromAgent: string): void;
    /**
     * Get shared context data
     */
    getSharedContext(sessionId: string, key: string): any;
    /**
     * Record conflict and resolution
     */
    recordConflict(sessionId: string, agents: string[], resolution: ConflictRecord["resolution"], outcome: any): void;
    /**
     * Complete delegation and cleanup
     */
    completeDelegation(sessionId: string, delegationId: string, result: any): void;
    /**
     * Get session coordination status
     */
    getSessionStatus(sessionId: string): {
        active: boolean;
        agentCount: number;
    } | null;
    /**
     * Resolve conflicts using specified strategy
     */
    resolveConflict(sessionId: string, conflictKey: string, strategy: "majority_vote" | "expert_priority" | "consensus"): any;
    /**
     * Cleanup session coordination data
     */
    cleanupSession(sessionId: string): void;
    private updateSessionMetrics;
}
export declare const createSessionCoordinator: (stateManager: StringRayStateManager) => SessionCoordinator;
//# sourceMappingURL=session-coordinator.d.ts.map