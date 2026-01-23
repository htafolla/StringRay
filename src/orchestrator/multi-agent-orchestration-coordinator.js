/**
 * StringRay AI v1.1.1 - Multi-Agent Orchestration Coordinator
 *
 * Central coordinator for multi-agent orchestration that integrates all orchestration components
 * for comprehensive E2E workflow management and coordination.
 *
 * @version 1.1.0
 * @since 2026-01-23
 */
import { StringRayOrchestrator } from "../orchestrator";
import { EnhancedMultiAgentOrchestrator } from "./enhanced-multi-agent-orchestrator";
import { createAgentDelegator } from "../delegation/agent-delegator";
import { StringRayStateManager } from "../state/state-manager";
import { frameworkLogger } from "../framework-logger";
import { ComplexityAnalyzer } from "../delegation/complexity-analyzer";
export class MultiAgentOrchestrationCoordinator {
    strRayOrchestrator;
    enhancedOrchestrator;
    agentDelegator;
    stateManager;
    complexityAnalyzer;
    coordinationMetrics;
    constructor(stateManager) {
        this.stateManager = stateManager || new StringRayStateManager();
        this.strRayOrchestrator = new StringRayOrchestrator();
        this.enhancedOrchestrator = new EnhancedMultiAgentOrchestrator();
        this.agentDelegator = createAgentDelegator(this.stateManager);
        this.complexityAnalyzer = new ComplexityAnalyzer();
        this.coordinationMetrics = {
            totalWorkflows: 0,
            successfulWorkflows: 0,
            failedWorkflows: 0,
            averageDuration: 0,
            agentUtilization: {},
            coordinationEfficiency: 0,
        };
        this.initializeCoordinationSystem();
    }
    /**
     * Initialize the coordination system with all components
     */
    initializeCoordinationSystem() {
        // Register coordination components in state manager
        this.stateManager.set("coordination:main_coordinator", this);
        this.stateManager.set("coordination:strray_orchestrator", this.strRayOrchestrator);
        this.stateManager.set("coordination:enhanced_orchestrator", this.enhancedOrchestrator);
        this.stateManager.set("coordination:agent_delegator", this.agentDelegator);
        this.stateManager.set("coordination:metrics", this.coordinationMetrics);
        frameworkLogger.log("orchestration-coordinator", "Multi-agent orchestration coordination system initialized", "info");
    }
    /**
     * Execute a complete orchestration workflow with full coordination
     */
    async executeOrchestrationWorkflow(workflow, sessionId) {
        const startTime = Date.now();
        const jobId = `workflow-${workflow.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        frameworkLogger.log("orchestration-coordinator", `Starting orchestration workflow: ${workflow.name}`, "info", { jobId, workflowId: workflow.id, taskCount: workflow.tasks.length });
        this.coordinationMetrics.totalWorkflows++;
        try {
            // Phase 1: Analyze workflow complexity and plan execution
            const executionPlan = await this.analyzeWorkflowComplexity(workflow);
            // Phase 2: Coordinate agent availability and resource allocation
            const resourceAllocation = await this.allocateWorkflowResources(workflow, executionPlan);
            // Phase 3: Execute workflow using integrated orchestration
            const executionResult = await this.executeCoordinatedWorkflow(workflow, executionPlan, resourceAllocation, sessionId, jobId);
            // Phase 4: Consolidate results and update metrics
            const consolidatedResult = await this.consolidateWorkflowResults(workflow, executionResult, startTime);
            // Update coordination metrics
            this.updateCoordinationMetrics(consolidatedResult);
            frameworkLogger.log("orchestration-coordinator", `Workflow completed: ${workflow.name} - ${consolidatedResult.success ? "SUCCESS" : "FAILED"}`, consolidatedResult.success ? "success" : "error", {
                jobId,
                workflowId: workflow.id,
                duration: consolidatedResult.duration,
                completedTasks: consolidatedResult.completedTasks,
                failedTasks: consolidatedResult.failedTasks,
            });
            return consolidatedResult;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.coordinationMetrics.failedWorkflows++;
            frameworkLogger.log("orchestration-coordinator", `Workflow failed: ${workflow.name}`, "error", {
                jobId,
                workflowId: workflow.id,
                error: error instanceof Error ? error.message : String(error),
                duration,
            });
            return {
                success: false,
                workflowId: workflow.id,
                completedTasks: 0,
                failedTasks: workflow.tasks.length,
                totalTasks: workflow.tasks.length,
                duration,
                results: [],
                errors: [error instanceof Error ? error.message : String(error)],
                agentCoordination: {
                    agentsUsed: [],
                    coordinationEvents: 0,
                    conflictsResolved: 0,
                },
            };
        }
    }
    /**
     * Analyze workflow complexity and create execution plan
     */
    async analyzeWorkflowComplexity(workflow) {
        // Analyze overall workflow complexity
        const workflowComplexity = await this.complexityAnalyzer.analyzeComplexity("workflow-execution", {
            description: workflow.description,
            files: workflow.tasks.map(t => `task-${t.id}.txt`),
            dependencies: workflow.dependencies,
            estimatedDuration: workflow.tasks.reduce((sum, task) => sum + (task.priority === "high" ? 30 : 15), 0),
        });
        const complexityScore = await this.complexityAnalyzer.calculateComplexityScore(workflowComplexity);
        // Build dependency graph
        const dependencyGraph = new Map();
        workflow.tasks.forEach(task => {
            dependencyGraph.set(task.id, task.dependencies || []);
        });
        // Group tasks by parallel execution potential
        const parallelGroups = this.buildParallelExecutionGroups(workflow.tasks, dependencyGraph);
        return {
            complexityScore: complexityScore.score,
            recommendedStrategy: complexityScore.recommendedStrategy,
            parallelGroups,
            dependencyGraph,
            estimatedDuration: complexityScore.estimatedAgents * 60, // Rough estimate
        };
    }
    /**
     * Allocate resources for workflow execution
     */
    async allocateWorkflowResources(workflow, executionPlan) {
        const allocatedAgents = [];
        const resourceAvailability = {};
        // Get available agents from agent delegator
        const availableAgents = this.agentDelegator.getAvailableAgents();
        // Allocate agents based on workflow requirements
        workflow.tasks.forEach((task) => {
            const matchingAgent = availableAgents.find((agent) => agent.expertise.some((exp) => task.subagentType.includes(exp)) ||
                agent.specialties.some((spec) => task.subagentType.includes(spec.split('-')[0])));
            if (matchingAgent && !allocatedAgents.includes(matchingAgent.name)) {
                allocatedAgents.push(matchingAgent.name);
                resourceAvailability[matchingAgent.name] = true;
            }
        });
        return {
            allocatedAgents,
            resourceAvailability,
            coordinationCapacity: allocatedAgents.length * 2, // Rough coordination capacity estimate
        };
    }
    /**
     * Execute coordinated workflow using all orchestration components
     */
    async executeCoordinatedWorkflow(workflow, executionPlan, resourceAllocation, sessionId, jobId) {
        const taskResults = [];
        let coordinationEvents = 0;
        let conflictsResolved = 0;
        const agentsUsed = [];
        // Use different orchestration strategies based on complexity
        if (executionPlan.recommendedStrategy === "single-agent") {
            // Simple workflow - use StringRay orchestrator
            const result = await this.strRayOrchestrator.executeComplexTask(workflow.description, workflow.tasks, sessionId);
            taskResults.push(...result);
            coordinationEvents += result.length;
            agentsUsed.push(...resourceAllocation.allocatedAgents);
        }
        else {
            // Complex workflow - use enhanced multi-agent orchestrator
            const coordinationPromises = workflow.tasks.map(async (task) => {
                coordinationEvents++;
                const agentRequest = {
                    agentType: task.subagentType,
                    task: task.description,
                    context: {
                        ...workflow.context,
                        taskId: task.id,
                        workflowId: workflow.id,
                        sessionId,
                    },
                    priority: task.priority || "medium",
                    dependencies: task.dependencies?.map(depId => `agent_${depId}`) || [],
                };
                try {
                    const spawnedAgent = await this.enhancedOrchestrator.spawnAgent(agentRequest);
                    agentsUsed.push(task.subagentType);
                    // Wait for completion
                    return new Promise((resolve) => {
                        const checkCompletion = () => {
                            const monitoringData = this.enhancedOrchestrator.getMonitoringInterface();
                            const agent = monitoringData[spawnedAgent.id];
                            if (agent?.status === "completed") {
                                resolve({
                                    success: true,
                                    taskId: task.id,
                                    result: agent.result,
                                    duration: agent.endTime ? agent.endTime - agent.startTime : 0,
                                });
                            }
                            else if (agent?.status === "failed") {
                                resolve({
                                    success: false,
                                    taskId: task.id,
                                    error: agent.error,
                                    duration: agent.endTime ? agent.endTime - agent.startTime : 0,
                                });
                            }
                            else {
                                setTimeout(checkCompletion, 500);
                            }
                        };
                        checkCompletion();
                    });
                }
                catch (error) {
                    conflictsResolved++; // Count as conflict resolution attempt
                    return {
                        success: false,
                        taskId: task.id,
                        error: error instanceof Error ? error.message : String(error),
                        duration: 0,
                    };
                }
            });
            const coordinationResults = await Promise.allSettled(coordinationPromises);
            coordinationResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    taskResults.push(result.value);
                }
                else {
                    taskResults.push({
                        success: false,
                        error: result.reason,
                        duration: 0,
                    });
                }
            });
        }
        return {
            taskResults,
            coordinationEvents,
            conflictsResolved,
            agentsUsed: [...new Set(agentsUsed)], // Remove duplicates
        };
    }
    /**
     * Consolidate workflow results
     */
    async consolidateWorkflowResults(workflow, executionResult, startTime) {
        const duration = Date.now() - startTime;
        const successfulTasks = executionResult.taskResults.filter((r) => r.success);
        const failedTasks = executionResult.taskResults.filter((r) => !r.success);
        const success = successfulTasks.length === workflow.tasks.length;
        if (success) {
            this.coordinationMetrics.successfulWorkflows++;
        }
        else {
            this.coordinationMetrics.failedWorkflows++;
        }
        return {
            success,
            workflowId: workflow.id,
            completedTasks: successfulTasks.length,
            failedTasks: failedTasks.length,
            totalTasks: workflow.tasks.length,
            duration,
            results: successfulTasks.map((r) => r.result),
            errors: failedTasks.map((r) => r.error || "Unknown error"),
            agentCoordination: {
                agentsUsed: executionResult.agentsUsed,
                coordinationEvents: executionResult.coordinationEvents,
                conflictsResolved: executionResult.conflictsResolved,
            },
        };
    }
    /**
     * Build parallel execution groups based on dependencies
     */
    buildParallelExecutionGroups(tasks, dependencyGraph) {
        const groups = [];
        const processedTasks = new Set();
        const taskMap = new Map(tasks.map(task => [task.id, task]));
        while (processedTasks.size < tasks.length) {
            const currentGroup = [];
            for (const task of tasks) {
                if (processedTasks.has(task.id))
                    continue;
                // Check if all dependencies are processed
                const dependencies = dependencyGraph.get(task.id) || [];
                const depsMet = dependencies.every(dep => processedTasks.has(dep));
                if (depsMet) {
                    currentGroup.push(task);
                }
            }
            if (currentGroup.length === 0) {
                // Circular dependency or no progress possible
                break;
            }
            groups.push(currentGroup);
            currentGroup.forEach(task => processedTasks.add(task.id));
        }
        return groups;
    }
    /**
     * Update coordination metrics
     */
    updateCoordinationMetrics(result) {
        // Update agent utilization
        result.agentCoordination.agentsUsed.forEach(agent => {
            this.coordinationMetrics.agentUtilization[agent] =
                (this.coordinationMetrics.agentUtilization[agent] || 0) + 1;
        });
        // Update average duration
        const totalDuration = this.coordinationMetrics.averageDuration * (this.coordinationMetrics.totalWorkflows - 1) + result.duration;
        this.coordinationMetrics.averageDuration = totalDuration / this.coordinationMetrics.totalWorkflows;
        // Calculate coordination efficiency (tasks per minute)
        const totalTasks = this.coordinationMetrics.totalWorkflows * 10; // Assume average 10 tasks per workflow
        const totalTime = this.coordinationMetrics.averageDuration * this.coordinationMetrics.totalWorkflows;
        this.coordinationMetrics.coordinationEfficiency = totalTasks / (totalTime / 60000); // tasks per minute
    }
    /**
     * Get coordination metrics
     */
    getCoordinationMetrics() {
        return { ...this.coordinationMetrics };
    }
    /**
     * Validate orchestration workflow
     */
    validateWorkflow(workflow) {
        const errors = [];
        const warnings = [];
        // Check for duplicate task IDs
        const taskIds = workflow.tasks.map(t => t.id);
        const duplicates = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate task IDs: ${duplicates.join(", ")}`);
        }
        // Check for circular dependencies
        const dependencyGraph = new Map();
        workflow.tasks.forEach(task => {
            dependencyGraph.set(task.id, task.dependencies || []);
        });
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (taskId) => {
            if (recursionStack.has(taskId))
                return true;
            if (visited.has(taskId))
                return false;
            visited.add(taskId);
            recursionStack.add(taskId);
            const dependencies = dependencyGraph.get(taskId) || [];
            for (const dep of dependencies) {
                if (hasCycle(dep))
                    return true;
            }
            recursionStack.delete(taskId);
            return false;
        };
        for (const task of workflow.tasks) {
            if (hasCycle(task.id)) {
                errors.push(`Circular dependency detected involving task: ${task.id}`);
                break;
            }
        }
        // Check for invalid agent types
        const validAgentTypes = [
            "enforcer", "architect", "orchestrator", "bug-triage-specialist",
            "code-reviewer", "security-auditor", "refactorer", "test-architect"
        ];
        workflow.tasks.forEach(task => {
            if (!validAgentTypes.includes(task.subagentType)) {
                errors.push(`Invalid agent type: ${task.subagentType} for task ${task.id}`);
            }
        });
        // Check for missing dependencies
        const allTaskIds = new Set(workflow.tasks.map(t => t.id));
        workflow.tasks.forEach(task => {
            task.dependencies?.forEach(dep => {
                if (!allTaskIds.has(dep)) {
                    errors.push(`Task ${task.id} references non-existent dependency: ${dep}`);
                }
            });
        });
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Shutdown coordination system
     */
    async shutdown() {
        frameworkLogger.log("orchestration-coordinator", "Shutting down multi-agent orchestration coordinator", "info");
        await this.enhancedOrchestrator.shutdown();
        await this.strRayOrchestrator.getStatus(); // Just get status, no actual shutdown method
        frameworkLogger.log("orchestration-coordinator", "Multi-agent orchestration coordinator shutdown complete", "info");
    }
}
// Export singleton instance
export const multiAgentOrchestrationCoordinator = new MultiAgentOrchestrationCoordinator();
//# sourceMappingURL=multi-agent-orchestration-coordinator.js.map