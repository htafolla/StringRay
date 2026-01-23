/**
 * StringRay AI v1.1.1 - Session State Manager
 *
 * Manages cross-session state sharing, dependency tracking,
 * and coordination for complex workflows.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { StringRayStateManager } from "../state/state-manager";
import { SessionCoordinator } from "../delegation/session-coordinator";
export interface SessionDependency {
    sessionId: string;
    dependsOn: string[];
    dependedBy: string[];
    state: "pending" | "active" | "completed" | "failed";
    priority: number;
    metadata: Record<string, any>;
}
export interface SessionGroup {
    groupId: string;
    sessionIds: string[];
    coordinatorSession: string;
    state: "forming" | "active" | "completing" | "completed" | "failed";
    sharedState: Map<string, any>;
    createdAt: number;
    completedAt?: number;
}
export interface MigrationPlan {
    sessionId: string;
    targetCoordinator: string;
    stateTransfer: Map<string, any>;
    migrationSteps: string[];
    rollbackSteps: string[];
}
export interface FailoverConfig {
    sessionId: string;
    backupCoordinators: string[];
    failoverThreshold: number;
    autoFailover: boolean;
}
export declare class SessionStateManager {
    private stateManager;
    private sessionCoordinator;
    private dependencies;
    private sessionGroups;
    private failoverConfigs;
    constructor(stateManager: StringRayStateManager, sessionCoordinator: SessionCoordinator);
    /**
     * Share state between sessions
     */
    shareState(fromSessionId: string, toSessionId: string, key: string, value: any): boolean;
    /**
     * Broadcast state to multiple sessions
     */
    broadcastState(fromSessionId: string, targetSessionIds: string[], key: string, value: any): number;
    /**
     * Register session dependency
     */
    registerDependency(sessionId: string, dependsOn: string[], metadata?: Record<string, any>): void;
    /**
     * Update dependency state
     */
    updateDependencyState(sessionId: string, state: SessionDependency["state"]): void;
    /**
     * Get dependency chain for a session
     */
    getDependencyChain(sessionId: string): {
        dependencies: string[];
        dependents: string[];
        canStart: boolean;
    };
    /**
     * Create session group for complex workflows
     */
    createSessionGroup(groupId: string, sessionIds: string[], coordinatorSession: string): SessionGroup;
    /**
     * Update session group state
     */
    updateSessionGroupState(groupId: string, state: SessionGroup["state"]): void;
    /**
     * Share state within a session group
     */
    shareGroupState(groupId: string, key: string, value: any, fromSessionId: string): boolean;
    /**
     * Get session group state
     */
    getGroupState(groupId: string, key: string): any;
    /**
     * Plan session migration
     */
    planMigration(sessionId: string, targetCoordinator: string): MigrationPlan;
    /**
     * Validate migration plan before execution
     */
    validateMigrationPlan(plan: MigrationPlan): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Validate rollback capability for a migration plan
     */
    validateRollbackCapability(plan: MigrationPlan): {
        canRollback: boolean;
        reason?: string;
    };
    /**
     * Find orphaned agents in dependency graph
     */
    findOrphanedAgents(allAgents: string[], dependencies: any): string[];
    /**
     * Execute session migration
     */
    executeMigration(plan: MigrationPlan): Promise<boolean>;
    /**
     * Configure failover for a session
     */
    configureFailover(sessionId: string, backupCoordinators: string[], failoverThreshold: number, autoFailover: boolean): void;
    /**
     * Execute failover for a session
     */
    executeFailover(sessionId: string): Promise<boolean>;
    /**
     * Get coordination statistics
     */
    getCoordinationStats(): {
        totalDependencies: number;
        activeDependencies: number;
        totalGroups: number;
        activeGroups: number;
        failoverConfigs: number;
    };
    private propagateDependencyUpdate;
    private rollbackMigration;
    private persistDependencies;
    private persistSessionGroups;
    private persistFailoverConfigs;
    shutdown(): void;
}
export declare const createSessionStateManager: (stateManager: StringRayStateManager, sessionCoordinator: SessionCoordinator) => SessionStateManager;
//# sourceMappingURL=session-state-manager.d.ts.map