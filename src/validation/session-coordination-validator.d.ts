/**
 * Session Coordination Validator
 * Validates agent communication patterns and coordination integrity
 */
export declare class SessionCoordinationValidator {
    private sessionCoordinator;
    private sessionMonitor;
    constructor(sessionCoordinator: any, sessionMonitor: any);
    /**
     * Validate agent communication patterns
     */
    validateCommunicationPatterns(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        metrics: {
            totalMessages: number;
            averageResponseTime: number;
            coordinationEfficiency: number;
            conflictRate: number;
        };
    }>;
    /**
     * Validate agent dependency graphs
     */
    validateDependencyGraphs(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        cycles: string[][];
        orphanedAgents: string[];
    }>;
    /**
     * Validate context sharing integrity
     */
    validateContextSharing(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        sharedKeys: string[];
        consistencyScore: number;
    }>;
    private calculateAverageResponseTime;
    private findIsolatedAgents;
    private detectCycles;
    private findOrphanedAgents;
}
//# sourceMappingURL=session-coordination-validator.d.ts.map