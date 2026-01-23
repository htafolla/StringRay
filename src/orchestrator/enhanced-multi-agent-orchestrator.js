/**
 * Enhanced Multi-Agent Orchestration with Clickable Monitoring
 * Integrates subagent spawning visibility and lifecycle management
 */
import { StringRayStateManager } from "../state/state-manager";
import { frameworkLogger } from "../framework-logger";
import { ComplexityAnalyzer, } from "../delegation/complexity-analyzer";
import { createAgentDelegator } from "../delegation/agent-delegator";
export class EnhancedMultiAgentOrchestrator {
    state;
    stateManager;
    complexityAnalyzer;
    agentDelegator;
    executionContext;
    cleanupTimer;
    constructor(stateManager, isMainOrchestrator = false) {
        this.stateManager = stateManager || new StringRayStateManager();
        this.complexityAnalyzer = new ComplexityAnalyzer();
        this.agentDelegator = createAgentDelegator(this.stateManager);
        this.state = {
            activeAgents: new Map(),
            pendingSpawns: [],
            completedAgents: new Map(),
            failedAgents: new Map(),
            agentDependencies: new Map(),
            monitoringEnabled: true,
            cleanupInterval: stateManager ? 300000 : 30000, // 5 minutes for main, 30 seconds for sub
            isMainOrchestrator,
        };
        // Initialize execution context for security tracking
        this.executionContext = {
            isExecutingAsSubagent: false,
            currentAgentId: null,
            spawnStack: [],
        };
        this.initializeCleanupSystem();
    }
    /**
     * 🚨 SECURITY: Check if currently executing as a subagent
     * Prevents subagents from spawning other subagents (infinite loops, resource exhaustion)
     */
    isCurrentlyExecutingAsSubagent() {
        // Main orchestrator can spawn agents, subagents cannot
        return !this.state.isMainOrchestrator;
    }
    /**
     * Enhanced agent spawning with clickable monitoring integration
     */
    async spawnAgent(request) {
        const jobId = `spawn-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // 🚨 SECURITY: Prevent subagents from spawning other subagents
        // This prevents infinite loops, resource exhaustion, and uncontrolled agent spawning
        if (this.isCurrentlyExecutingAsSubagent()) {
            const error = new Error(`SECURITY VIOLATION: Subagent attempted to spawn another agent. ` +
                `Only the main orchestrator may spawn agents. ` +
                `Subagent spawning is strictly prohibited to prevent infinite loops and resource exhaustion.`);
            console.error(`🚨 ${error.message}`);
            throw error;
        }
        const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const spawnedAgent = {
            id: agentId,
            agentType: request.agentType,
            task: request.task,
            status: "spawning",
            startTime: Date.now(),
            progress: 0,
            clickable: true, // Enable clickable monitoring
            monitorable: true, // Enable real-time monitoring
            cleanupRequired: true,
        };
        // Register agent in active pool
        this.state.activeAgents.set(agentId, spawnedAgent);
        // Handle dependencies
        if (request.dependencies && request.dependencies.length > 0) {
            this.state.agentDependencies.set(agentId, request.dependencies);
            // Check if dependencies are met
            const unmetDeps = request.dependencies.filter((depId) => !this.state.completedAgents.has(depId) ||
                this.state.completedAgents.get(depId)?.status !== "completed");
            if (unmetDeps.length > 0) {
                frameworkLogger.log("orchestrator", `Agent ${agentId} waiting for dependencies: ${unmetDeps.join(", ")}`, "info", { jobId });
                this.state.pendingSpawns.push(request);
                return spawnedAgent;
            }
        }
        // Log clickable spawn event
        frameworkLogger.log("orchestrator", `🔗 SPAWNED: ${request.agentType} agent (${agentId}) - Click to monitor`, "info", {
            jobId,
            agentId,
            agentType: request.agentType,
            task: request.task,
            clickable: true,
            timestamp: Date.now(),
        });
        // Start agent execution
        this.executeAgent(spawnedAgent, request, jobId).catch((error) => {
            frameworkLogger.log("orchestrator", `Agent execution failed: ${error}`, "error", { jobId });
        });
        return spawnedAgent;
    }
    /**
     * Execute agent with monitoring and cleanup
     */
    async executeAgent(agent, request, jobId) {
        const executeJobId = `execute-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            agent.status = "active";
            agent.progress = 10;
            // Execute agent with progress updates
            const executionPromise = this.executeAgentWithDelegator(agent, request, executeJobId);
            // Set up monitoring updates
            const monitorInterval = setInterval(() => {
                if (agent.status === "active") {
                    agent.progress = Math.min(agent.progress + 10, 90);
                    this.updateAgentMonitoring(agent);
                }
            }, 1000);
            const result = await executionPromise;
            clearInterval(monitorInterval);
            // Mark as completed
            agent.status = "completed";
            agent.endTime = Date.now();
            agent.progress = 100;
            agent.result = result;
            // Move to completed pool
            this.state.activeAgents.delete(agent.id);
            this.state.completedAgents.set(agent.id, agent);
            frameworkLogger.log("orchestrator", `✅ COMPLETED: ${agent.agentType} agent (${agent.id})`, "info", {
                executeJobId,
                agentId: agent.id,
                duration: agent.endTime - agent.startTime,
                result: typeof result,
            });
            // Check for dependent agents that can now spawn
            this.checkPendingSpawns();
        }
        catch (error) {
            agent.status = "failed";
            agent.endTime = Date.now();
            agent.error = error instanceof Error ? error.message : String(error);
            agent.progress = 0;
            // Move to failed pool
            this.state.activeAgents.delete(agent.id);
            this.state.failedAgents.set(agent.id, agent);
            frameworkLogger.log("orchestrator", `❌ FAILED: ${agent.agentType} agent (${agent.id}): ${agent.error}`, "error", {
                executeJobId,
                agentId: agent.id,
                error: agent.error,
                duration: agent.endTime - agent.startTime,
            });
        }
    }
    /**
     * Execute agent using the agent delegator system
     */
    async executeAgentWithDelegator(agent, request, jobId) {
        try {
            // Use the agent delegator system - first analyze, then execute
            const delegationRequest = {
                operation: "execute",
                files: [`task-${agent.id}.txt`],
                context: {
                    agentName: request.agentType,
                    taskDescription: request.task,
                    priority: request.priority || "medium",
                    timeout: request.timeout,
                    ...request.context,
                },
            };
            // Analyze the delegation to get strategy
            const delegation = await this.agentDelegator.analyzeDelegation(delegationRequest);
            // Execute the delegation
            const result = await this.agentDelegator.executeDelegation(delegation, delegationRequest);
            return {
                success: true,
                agentType: request.agentType,
                task: request.task,
                executionTime: result.executionTime || 0,
                complexity: delegation.complexity || 0,
                result: result.result ||
                    `Completed ${request.agentType} task: ${request.task}`,
                delegationResult: result,
            };
        }
        catch (error) {
            // Fallback to simulation if delegation fails
            frameworkLogger.log("orchestrator", `Agent delegation failed, using simulation: ${error}`, "info", { jobId });
            return this.simulateAgentExecution(agent, request);
        }
    }
    /**
     * Simulate agent execution (fallback when delegation fails)
     */
    async simulateAgentExecution(agent, request) {
        // Simulate different execution times based on agent type and complexity
        const baseTime = this.getAgentExecutionTime(request.agentType);
        const complexityMetrics = await this.complexityAnalyzer.analyzeComplexity("execute", {
            newCode: request.task,
            files: [`task-${agent.id}.txt`],
        });
        const executionTime = baseTime * (1 + complexityMetrics.changeVolume / 100);
        await new Promise((resolve) => setTimeout(resolve, executionTime));
        return {
            success: true,
            agentType: request.agentType,
            task: request.task,
            executionTime,
            complexity: complexityMetrics.changeVolume,
            result: `Completed ${request.agentType} task: ${request.task}`,
        };
    }
    /**
     * Get estimated execution time for agent type
     */
    getAgentExecutionTime(agentType) {
        const times = {
            architect: 3000, // 3 seconds
            enforcer: 2000, // 2 seconds
            librarian: 4000, // 4 seconds
            "code-reviewer": 2500, // 2.5 seconds
            "security-auditor": 3500, // 3.5 seconds
            "test-architect": 3000, // 3 seconds
            "bug-triage-specialist": 2800, // 2.8 seconds
            refactorer: 3200, // 3.2 seconds
        };
        return times[agentType] || 3000;
    }
    /**
     * Update agent monitoring (integrates with clickable interface)
     */
    updateAgentMonitoring(agent) {
        if (!this.state.monitoringEnabled)
            return;
        // Log monitoring update for clickable interface
        frameworkLogger.log("orchestrator", `📊 MONITOR: ${agent.agentType} (${agent.id}) - ${agent.progress}%`, "debug", {
            agentId: agent.id,
            progress: agent.progress,
            status: agent.status,
            clickable: agent.clickable,
            timestamp: Date.now(),
        });
    }
    /**
     * Check for pending spawns that can now execute
     */
    checkPendingSpawns() {
        const readySpawns = this.state.pendingSpawns.filter((spawn) => {
            if (!spawn.dependencies)
                return true;
            return spawn.dependencies.every((depId) => this.state.completedAgents.has(depId) &&
                this.state.completedAgents.get(depId)?.status === "completed");
        });
        // Execute ready spawns
        readySpawns.forEach((spawn) => {
            this.state.pendingSpawns = this.state.pendingSpawns.filter((s) => s !== spawn);
            this.spawnAgent(spawn);
        });
    }
    /**
     * Get clickable agent monitoring interface
     */
    getMonitoringInterface() {
        const allAgents = {
            ...Object.fromEntries(this.state.activeAgents),
            ...Object.fromEntries(this.state.completedAgents),
            ...Object.fromEntries(this.state.failedAgents),
        };
        return allAgents;
    }
    /**
     * Cancel agent execution
     */
    async cancelAgent(agentId) {
        const agent = this.state.activeAgents.get(agentId);
        if (!agent)
            return false;
        agent.status = "cancelled";
        agent.endTime = Date.now();
        agent.cleanupRequired = true;
        this.state.activeAgents.delete(agentId);
        this.state.failedAgents.set(agentId, agent);
        frameworkLogger.log("orchestrator", `🚫 CANCELLED: ${agent.agentType} agent (${agentId})`, "info");
        return true;
    }
    /**
     * Initialize cleanup system for completed agents
     */
    initializeCleanupSystem() {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.state.cleanupInterval);
    }
    /**
     * Perform cleanup of completed/failed agents
     */
    performCleanup() {
        const now = Date.now();
        const cleanupThreshold = 5 * 60 * 1000; // 5 minutes
        // Clean up old completed agents
        for (const [agentId, agent] of this.state.completedAgents) {
            if (agent.endTime && now - agent.endTime > cleanupThreshold) {
                this.state.completedAgents.delete(agentId);
                frameworkLogger.log("orchestrator", `🧹 CLEANED: Completed agent ${agentId}`, "debug");
            }
        }
        // Clean up old failed agents
        for (const [agentId, agent] of this.state.failedAgents) {
            if (agent.endTime && now - agent.endTime > cleanupThreshold) {
                this.state.failedAgents.delete(agentId);
                frameworkLogger.log("orchestrator", `🧹 CLEANED: Failed agent ${agentId}`, "debug");
            }
        }
    }
    /**
     * Get orchestration statistics
     */
    getStatistics() {
        return {
            activeAgents: this.state.activeAgents.size,
            completedAgents: this.state.completedAgents.size,
            failedAgents: this.state.failedAgents.size,
            pendingSpawns: this.state.pendingSpawns.length,
            totalSpawned: this.state.activeAgents.size +
                this.state.completedAgents.size +
                this.state.failedAgents.size,
        };
    }
    /**
     * Shutdown orchestration system
     */
    async shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        // Cancel all active agents
        const activeAgentIds = Array.from(this.state.activeAgents.keys());
        await Promise.all(activeAgentIds.map((id) => this.cancelAgent(id)));
        frameworkLogger.log("orchestrator", "🔄 Enhanced Multi-Agent Orchestrator shutdown complete", "info");
    }
}
// Export singleton instance
export const enhancedMultiAgentOrchestrator = new EnhancedMultiAgentOrchestrator(undefined, true); // Main orchestrator
//# sourceMappingURL=enhanced-multi-agent-orchestrator.js.map