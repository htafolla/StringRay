/**
 * StringRay AI v1.1.1 - Session Coordinator
 *
 * Manages cross-agent communication and coordination within sessions.
 * Tracks delegation state, agent interactions, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export class SessionCoordinator {
    stateManager;
    sessions = new Map();
    constructor(stateManager) {
        this.stateManager = stateManager;
    }
    /**
     * Initialize session coordination for a new session
     */
    initializeSession(sessionId) {
        if (!sessionId ||
            typeof sessionId !== "string" ||
            sessionId.trim() === "") {
            throw new Error("Invalid session ID: must be a non-empty string");
        }
        const context = {
            sessionId,
            startTime: Date.now(),
            activeDelegations: new Map(),
            agentInteractions: new Map(),
            conflictHistory: [],
            coordinationState: {
                activeAgents: new Set(),
                pendingCommunications: [],
                sharedContext: new Map(),
                sessionMetrics: {
                    totalInteractions: 0,
                    successfulInteractions: 0,
                    failedInteractions: 0,
                    averageResponseTime: 0,
                    conflictResolutionRate: 0,
                    coordinationEfficiency: 0,
                },
            },
            isActive: true,
        };
        // Initialize with default agents
        const defaultAgents = [
            "enforcer",
            "architect",
            "orchestrator",
            "bug-triage-specialist",
            "code-reviewer",
            "security-auditor",
            "refactorer",
            "test-architect",
        ];
        defaultAgents.forEach((agentName) => {
            context.coordinationState.activeAgents.add(agentName);
        });
        this.sessions.set(sessionId, context);
        this.stateManager.set(`session:${sessionId}:coordinator`, context);
        return {
            sessionId,
            createdAt: new Date(context.startTime),
            active: context.isActive,
            agentCount: context.coordinationState.activeAgents.size,
        };
    }
    /**
     * Register delegation execution in session
     */
    registerDelegation(sessionId, delegationId, delegation) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        session.activeDelegations.set(delegationId, delegation);
        delegation.agents.forEach((agentName) => {
            session.coordinationState.activeAgents.add(agentName);
        });
        this.stateManager.set(`session:${sessionId}:delegations:${delegationId}`, delegation);
    }
    /**
     * Record agent interaction within session
     */
    recordInteraction(sessionId, agentName, interaction) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }
        const fullInteraction = {
            ...interaction,
            timestamp: Date.now(),
        };
        if (!session.agentInteractions.has(agentName)) {
            session.agentInteractions.set(agentName, []);
        }
        session.agentInteractions.get(agentName).push(fullInteraction);
        this.updateSessionMetrics(session, fullInteraction);
        this.stateManager.set(`session:${sessionId}:interactions:${agentName}`, session.agentInteractions.get(agentName));
    }
    /**
     * Send message between agents within session
     */
    async sendMessage(sessionId, fromAgent, toAgent, message, priority = "medium") {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const crypto = require("crypto");
        const communication = {
            id: `comm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
            fromAgent,
            toAgent,
            message,
            timestamp: Date.now(),
            priority,
        };
        session.coordinationState.pendingCommunications.push(communication);
        this.recordInteraction(sessionId, fromAgent, {
            agentName: fromAgent,
            action: "send_message",
            result: { to: toAgent, message },
            duration: 0,
            success: true,
        });
    }
    /**
     * Receive pending messages for an agent
     */
    receiveMessages(sessionId, agentName) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return [];
        }
        const messages = session.coordinationState.pendingCommunications.filter((comm) => comm.toAgent === agentName);
        session.coordinationState.pendingCommunications =
            session.coordinationState.pendingCommunications.filter((comm) => comm.toAgent !== agentName);
        if (messages.length > 0) {
            this.recordInteraction(sessionId, agentName, {
                agentName,
                action: "receive_messages",
                result: { count: messages.length },
                duration: 0,
                success: true,
            });
        }
        return messages;
    }
    /**
     * Share context data between agents
     */
    shareContext(sessionId, key, value, fromAgent) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const existing = session.coordinationState.sharedContext.get(key);
        const newEntry = {
            value,
            fromAgent,
            timestamp: Date.now(),
        };
        if (Array.isArray(existing)) {
            existing.push(newEntry);
        }
        else {
            session.coordinationState.sharedContext.set(key, [newEntry]);
        }
        this.stateManager.set(`session:${sessionId}:shared:${key}`, value);
        try {
            this.recordInteraction(sessionId, fromAgent, {
                agentName: fromAgent,
                action: "share_context",
                result: { key, value },
                duration: 0,
                success: true,
            });
        }
        catch (error) {
            console.warn(`⚠️ Failed to record context sharing interaction:`, error);
            // Continue operation despite recording failure
        }
    }
    /**
     * Get shared context data
     */
    getSharedContext(sessionId, key) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return undefined;
        }
        const contextData = session.coordinationState.sharedContext.get(key);
        if (Array.isArray(contextData) && contextData.length > 0) {
            const last = contextData[contextData.length - 1];
            return { ...last.value, sharedBy: last.fromAgent };
        }
        return undefined;
    }
    /**
     * Record conflict and resolution
     */
    recordConflict(sessionId, agents, resolution, outcome) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }
        const crypto = require("crypto");
        const conflict = {
            conflictId: `conflict_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
            timestamp: Date.now(),
            agents,
            resolution,
            outcome,
        };
        session.conflictHistory.push(conflict);
        const totalConflicts = session.conflictHistory.length;
        const successfulResolutions = session.conflictHistory.filter((c) => c.outcome !== undefined).length;
        session.coordinationState.sessionMetrics.conflictResolutionRate =
            successfulResolutions / totalConflicts;
        this.stateManager.set(`session:${sessionId}:conflicts`, session.conflictHistory);
    }
    /**
     * Complete delegation and cleanup
     */
    completeDelegation(sessionId, delegationId, result) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }
        const delegation = session.activeDelegations.get(delegationId);
        if (delegation) {
            session.activeDelegations.delete(delegationId);
            this.stateManager.set(`session:${sessionId}:completed:${delegationId}`, {
                delegation,
                result,
                completedAt: Date.now(),
            });
        }
    }
    /**
     * Get session coordination status
     */
    getSessionStatus(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        return {
            active: session.isActive,
            agentCount: session.coordinationState.activeAgents.size,
        };
    }
    /**
     * Resolve conflicts using specified strategy
     */
    resolveConflict(sessionId, conflictKey, strategy) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const sharedData = session.coordinationState.sharedContext.get(conflictKey);
        if (!sharedData || !Array.isArray(sharedData)) {
            return undefined;
        }
        let resolved;
        switch (strategy) {
            case "majority_vote":
                // Find most common value
                const counts = {};
                sharedData.forEach((item) => {
                    const value = JSON.stringify(item.value);
                    counts[value] = (counts[value] || 0) + 1;
                });
                const majorityEntry = Object.entries(counts).reduce(([keyA, countA], [keyB, countB]) => (countA > countB ? [keyA, countA] : [keyB, countB]));
                if (majorityEntry) {
                    resolved = JSON.parse(majorityEntry[0]);
                }
                break;
            case "expert_priority":
                // Use security-auditor if available, otherwise first value
                const expertItem = sharedData.find((item) => item.fromAgent === "security-auditor");
                resolved = expertItem ? expertItem.value : sharedData[0]?.value;
                break;
            case "consensus":
                // All values must be the same
                const firstValue = sharedData[0]?.value;
                const allSame = sharedData.every((item) => JSON.stringify(item.value) === JSON.stringify(firstValue));
                resolved = allSame ? firstValue : undefined;
                break;
        }
        // Record the conflict resolution
        const agents = sharedData.map((item) => item.fromAgent);
        this.recordConflict(sessionId, agents, strategy, resolved);
        return resolved;
    }
    /**
     * Cleanup session coordination data
     */
    cleanupSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }
        // Clear all session data
        session.activeDelegations.clear();
        session.agentInteractions.clear();
        session.conflictHistory = [];
        session.coordinationState.activeAgents.clear();
        session.coordinationState.pendingCommunications = [];
        session.coordinationState.sharedContext.clear();
        // Remove session from active sessions map
        this.sessions.delete(sessionId);
        // Clear from state manager
        this.stateManager.clear(`session:${sessionId}:coordinator`);
    }
    // Private methods
    updateSessionMetrics(session, interaction) {
        const metrics = session.coordinationState.sessionMetrics;
        metrics.totalInteractions++;
        if (interaction.success) {
            metrics.successfulInteractions++;
        }
        else {
            metrics.failedInteractions++;
        }
        const totalResponseTime = metrics.averageResponseTime * (metrics.totalInteractions - 1) +
            interaction.duration;
        metrics.averageResponseTime = totalResponseTime / metrics.totalInteractions;
        const successRate = metrics.successfulInteractions / metrics.totalInteractions;
        const conflictRate = session.conflictHistory.length / Math.max(metrics.totalInteractions, 1);
        metrics.coordinationEfficiency = successRate * (1 - conflictRate);
    }
}
// Export singleton instance factory
export const createSessionCoordinator = (stateManager) => {
    return new SessionCoordinator(stateManager);
};
//# sourceMappingURL=session-coordinator.js.map