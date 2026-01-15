/**
 * StringRay AI v1.0.4 - Session Coordinator
 *
 * Manages cross-agent communication and coordination within sessions.
 * Tracks delegation state, agent interactions, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StringRayStateManager } from "../state/state-manager";
import { DelegationResult } from "./agent-delegator.js";

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

export class SessionCoordinator {
  private stateManager: StringRayStateManager;
  private sessions = new Map<string, SessionContext>();

  constructor(stateManager: StringRayStateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Initialize session coordination for a new session
   */
  initializeSession(sessionId: string): {
    sessionId: string;
    createdAt: Date;
    active: boolean;
    agentCount: number;
  } {
    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      sessionId.trim() === ""
    ) {
      throw new Error("Invalid session ID: must be a non-empty string");
    }

    const context: SessionContext = {
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

    console.log(
      `📋 Session Coordinator: Initialized session ${sessionId} with ${defaultAgents.length} agents`,
    );
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
  registerDelegation(
    sessionId: string,
    delegationId: string,
    delegation: DelegationResult,
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.activeDelegations.set(delegationId, delegation);

    delegation.agents.forEach((agentName) => {
      session.coordinationState.activeAgents.add(agentName);
    });

    this.stateManager.set(
      `session:${sessionId}:delegations:${delegationId}`,
      delegation,
    );
    console.log(
      `📋 Session Coordinator: Registered delegation ${delegationId} in session ${sessionId}`,
    );
  }

  /**
   * Record agent interaction within session
   */
  recordInteraction(
    sessionId: string,
    agentName: string,
    interaction: Omit<AgentInteraction, "timestamp">,
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const fullInteraction: AgentInteraction = {
      ...interaction,
      timestamp: Date.now(),
    };

    if (!session.agentInteractions.has(agentName)) {
      session.agentInteractions.set(agentName, []);
    }

    session.agentInteractions.get(agentName)!.push(fullInteraction);

    this.updateSessionMetrics(session, fullInteraction);

    this.stateManager.set(
      `session:${sessionId}:interactions:${agentName}`,
      session.agentInteractions.get(agentName),
    );
  }

  /**
   * Send message between agents within session
   */
  async sendMessage(
    sessionId: string,
    fromAgent: string,
    toAgent: string,
    message: any,
    priority: "low" | "medium" | "high" = "medium",
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const crypto = require("crypto");
    const communication: Communication = {
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

    console.log(
      `💬 Session Coordinator: Message from ${fromAgent} to ${toAgent} in session ${sessionId}`,
    );
  }

  /**
   * Receive pending messages for an agent
   */
  receiveMessages(sessionId: string, agentName: string): Communication[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    const messages = session.coordinationState.pendingCommunications.filter(
      (comm) => comm.toAgent === agentName,
    );

    session.coordinationState.pendingCommunications =
      session.coordinationState.pendingCommunications.filter(
        (comm) => comm.toAgent !== agentName,
      );

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
  shareContext(
    sessionId: string,
    key: string,
    value: any,
    fromAgent: string,
  ): void {
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
    } else {
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
    } catch (error) {
      console.warn(`⚠️ Failed to record context sharing interaction:`, error);
      // Continue operation despite recording failure
    }

    console.log(
      `🔗 Session Coordinator: ${fromAgent} shared context '${key}' in session ${sessionId}`,
    );
  }

  /**
   * Get shared context data
   */
  getSharedContext(sessionId: string, key: string): any {
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
  recordConflict(
    sessionId: string,
    agents: string[],
    resolution: ConflictRecord["resolution"],
    outcome: any,
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const crypto = require("crypto");
    const conflict: ConflictRecord = {
      conflictId: `conflict_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      timestamp: Date.now(),
      agents,
      resolution,
      outcome,
    };

    session.conflictHistory.push(conflict);

    const totalConflicts = session.conflictHistory.length;
    const successfulResolutions = session.conflictHistory.filter(
      (c) => c.outcome !== undefined,
    ).length;
    session.coordinationState.sessionMetrics.conflictResolutionRate =
      successfulResolutions / totalConflicts;

    this.stateManager.set(
      `session:${sessionId}:conflicts`,
      session.conflictHistory,
    );

    console.log(
      `⚖️ Session Coordinator: Conflict resolved via ${resolution} in session ${sessionId}`,
    );
  }

  /**
   * Complete delegation and cleanup
   */
  completeDelegation(
    sessionId: string,
    delegationId: string,
    result: any,
  ): void {
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

      console.log(
        `✅ Session Coordinator: Completed delegation ${delegationId} in session ${sessionId}`,
      );
    }
  }

  /**
   * Get session coordination status
   */
  getSessionStatus(
    sessionId: string,
  ): { active: boolean; agentCount: number } | null {
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
  resolveConflict(
    sessionId: string,
    conflictKey: string,
    strategy: "majority_vote" | "expert_priority" | "consensus",
  ): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sharedData = session.coordinationState.sharedContext.get(conflictKey);
    if (!sharedData || !Array.isArray(sharedData)) {
      return undefined;
    }

    let resolved: any;

    switch (strategy) {
      case "majority_vote":
        // Find most common value
        const counts: Record<string, number> = {};
        sharedData.forEach((item: any) => {
          const value = JSON.stringify(item.value);
          counts[value] = (counts[value] || 0) + 1;
        });

        const majorityEntry = Object.entries(counts).reduce(
          (
            [keyA, countA]: [string, number],
            [keyB, countB]: [string, number],
          ) => (countA > countB ? [keyA, countA] : [keyB, countB]),
        );

        if (majorityEntry) {
          resolved = JSON.parse(majorityEntry[0]);
        }
        break;

      case "expert_priority":
        // Use security-auditor if available, otherwise first value
        const expertItem = sharedData.find(
          (item: any) => item.fromAgent === "security-auditor",
        );
        resolved = expertItem ? expertItem.value : sharedData[0]?.value;
        break;

      case "consensus":
        // All values must be the same
        const firstValue = sharedData[0]?.value;
        const allSame = sharedData.every(
          (item: any) =>
            JSON.stringify(item.value) === JSON.stringify(firstValue),
        );
        resolved = allSame ? firstValue : undefined;
        break;
    }

    // Record the conflict resolution
    const agents = sharedData.map((item: any) => item.fromAgent);
    this.recordConflict(sessionId, agents, strategy, resolved);

    return resolved;
  }

  /**
   * Cleanup session coordination data
   */
  cleanupSession(sessionId: string): void {
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

    console.log(
      `🧹 Session Coordinator: Cleaned up session ${sessionId} (removed)`,
    );
  }

  // Private methods

  private updateSessionMetrics(
    session: SessionContext,
    interaction: AgentInteraction,
  ): void {
    const metrics = session.coordinationState.sessionMetrics;

    metrics.totalInteractions++;

    if (interaction.success) {
      metrics.successfulInteractions++;
    } else {
      metrics.failedInteractions++;
    }

    const totalResponseTime =
      metrics.averageResponseTime * (metrics.totalInteractions - 1) +
      interaction.duration;
    metrics.averageResponseTime = totalResponseTime / metrics.totalInteractions;

    const successRate =
      metrics.successfulInteractions / metrics.totalInteractions;
    const conflictRate =
      session.conflictHistory.length / Math.max(metrics.totalInteractions, 1);
    metrics.coordinationEfficiency = successRate * (1 - conflictRate);
  }
}

// Export singleton instance factory
export const createSessionCoordinator = (
  stateManager: StringRayStateManager,
): SessionCoordinator => {
  return new SessionCoordinator(stateManager);
};
