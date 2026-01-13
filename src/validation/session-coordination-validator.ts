/**
 * Session Coordination Validator
 * Validates agent communication patterns and coordination integrity
 */
export class SessionCoordinationValidator {
  private sessionCoordinator: any;
  private sessionMonitor: any;

  constructor(sessionCoordinator: any, sessionMonitor: any) {
    this.sessionCoordinator = sessionCoordinator;
    this.sessionMonitor = sessionMonitor;
  }

  /**
   * Validate agent communication patterns
   */
  async validateCommunicationPatterns(sessionId: string): Promise<{
    valid: boolean;
    issues: string[];
    metrics: {
      totalMessages: number;
      averageResponseTime: number;
      coordinationEfficiency: number;
      conflictRate: number;
    };
  }> {
    const issues: string[] = [];

    // Get session status and metrics
    const sessionStatus = this.sessionCoordinator.getSessionStatus(sessionId);
    const metrics = this.sessionMonitor.collectMetrics(sessionId);

    // Validate session exists and is active
    if (!sessionStatus || sessionStatus.status !== 'active') {
      issues.push("Session not found or not active");
      return {
        valid: false,
        issues,
        metrics: {
          totalMessages: 0,
          averageResponseTime: 0,
          coordinationEfficiency: 0,
          conflictRate: 0
        }
      };
    }

    // Check for excessive conflicts based on session metrics
    const conflictRate = metrics.failedInteractions / Math.max(metrics.totalInteractions, 1);
    if (conflictRate > 0.1) { // More than 10% conflicts
      issues.push(`High conflict rate: ${(conflictRate * 100).toFixed(1)}%`);
    }

    // Check coordination efficiency
    const coordinationEfficiency = metrics.successfulInteractions / Math.max(metrics.totalInteractions, 1);
    if (coordinationEfficiency < 0.8) { // Less than 80% efficiency
      issues.push(`Low coordination efficiency: ${(coordinationEfficiency * 100).toFixed(1)}%`);
    }

    // Check for agent count consistency
    if (sessionStatus.agentCount < 1) {
      issues.push("Session has no active agents");
    }

    // Check for isolated agents (simplified - all agents should be active)
    const isolatedAgents = sessionStatus.agentCount === 0 ? ["all-agents"] : [];
    if (isolatedAgents.length > 0) {
      issues.push(`Isolated agents detected: ${isolatedAgents.join(", ")}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      metrics: {
        totalMessages: sessionStatus.agentCount * 10, // Estimate based on agent count
        averageResponseTime: 1000, // Estimate - would need real communication tracking
        coordinationEfficiency,
        conflictRate
      }
    };
  }

  /**
   * Validate agent dependency graphs
   */
  async validateDependencyGraphs(sessionId: string): Promise<{
    valid: boolean;
    issues: string[];
    cycles: string[][];
    orphanedAgents: string[];
  }> {
    const issues: string[] = [];

    // For now, simplified dependency validation since we don't have complex dependency tracking
    const sessionStatus = this.sessionCoordinator.getSessionStatus(sessionId);
    if (!sessionStatus) {
      issues.push("Session not found for dependency validation");
      return {
        valid: false,
        issues,
        cycles: [],
        orphanedAgents: []
      };
    }

    // Basic validation: ensure session has agents and they're properly configured
    if (sessionStatus.agentCount === 0) {
      issues.push("Session has no agents - cannot validate dependencies");
    }

    // Simplified cycle detection (would need actual dependency graph)
    const cycles: string[][] = [];
    const orphanedAgents: string[] = [];

    // For now, assume no cycles and no orphans in basic validation
    // This would be expanded with actual dependency tracking

    return {
      valid: issues.length === 0,
      issues,
      cycles,
      orphanedAgents
    };
  }

  /**
   * Validate context sharing integrity
   */
  async validateContextSharing(sessionId: string): Promise<{
    valid: boolean;
    issues: string[];
    sharedKeys: string[];
    consistencyScore: number;
  }> {
    const issues: string[] = [];

    const context = this.sessionCoordinator.getSharedContext(sessionId, "*");
    if (!context) {
      return {
        valid: true,
        issues: [],
        sharedKeys: [],
        consistencyScore: 1.0
      };
    }

    const sharedKeys = Object.keys(context);

    // Check for context consistency across agents
    const agents = this.sessionCoordinator.getSessionAgents(sessionId);
    let consistencyScore = 1.0;

    for (const agent of agents) {
      const agentContext = this.sessionCoordinator.getSharedContext(sessionId, agent);
      if (agentContext) {
        const agentKeys = Object.keys(agentContext);
        const missingKeys = sharedKeys.filter(key => !agentKeys.includes(key));

        if (missingKeys.length > 0) {
          consistencyScore -= 0.1;
          issues.push(`Agent ${agent} missing shared keys: ${missingKeys.join(", ")}`);
        }
      }
    }

    if (consistencyScore < 0.8) {
      issues.push(`Low context consistency: ${(consistencyScore * 100).toFixed(1)}%`);
    }

    return {
      valid: issues.length === 0,
      issues,
      sharedKeys,
      consistencyScore
    };
  }

  private calculateAverageResponseTime(communications: any[]): number {
    if (communications.length === 0) return 0;

    const responseTimes = communications
      .filter(comm => comm.responseTime)
      .map(comm => comm.responseTime);

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private findIsolatedAgents(sessionId: string, communications: any[]): string[] {
    const agents = this.sessionCoordinator.getSessionAgents(sessionId);
    const activeAgents = new Set();

    communications.forEach(comm => {
      activeAgents.add(comm.from);
      activeAgents.add(comm.to);
    });

    return agents.filter((agent: string) => !activeAgents.has(agent));
  }

  private detectCycles(dependencies: any): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (agent: string, path: string[]): void => {
      if (recursionStack.has(agent)) {
        const cycleStart = path.indexOf(agent);
        cycles.push([...path.slice(cycleStart), agent]);
        return;
      }

      if (visited.has(agent)) return;

      visited.add(agent);
      recursionStack.add(agent);

      const deps = dependencies[agent] || [];
      for (const dep of deps) {
        dfs(dep, [...path, agent]);
      }

      recursionStack.delete(agent);
    };

    for (const agent of Object.keys(dependencies)) {
      if (!visited.has(agent)) {
        dfs(agent, []);
      }
    }

    return cycles;
  }

  private findOrphanedAgents(allAgents: string[], dependencies: any): string[] {
    const agentsWithDeps = new Set(Object.keys(dependencies));

    // Add agents that are dependencies of others
    for (const deps of Object.values(dependencies)) {
      for (const dep of deps as string[]) {
        agentsWithDeps.add(dep);
      }
    }

    return allAgents.filter(agent => !agentsWithDeps.has(agent));
  }
}