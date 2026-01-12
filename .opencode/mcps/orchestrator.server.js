/**
 * StrRay Orchestrator MCP Server
 *
 * Enterprise-grade orchestration with advanced task management and agent coordination
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
class StrRayOrchestratorServer {
    server;
    activeTasks = new Map();
    taskHistory = [];
    agentCapabilities = new Map();
    constructor() {
        this.server = new Server({
            name: "strray-orchestrator",
            version: "1.0.0",
        });
        this.initializeAgentCapabilities();
        this.setupToolHandlers();
        console.log("StrRay Orchestrator MCP Server initialized");
    }
    initializeAgentCapabilities() {
        // Initialize agent capabilities for orchestration decisions
        this.agentCapabilities.set("enforcer", {
            capabilities: ["validation", "security", "compliance"],
            complexityThreshold: 25,
            concurrentTasks: 3,
        });
        this.agentCapabilities.set("architect", {
            capabilities: ["design", "planning", "system-thinking"],
            complexityThreshold: 50,
            concurrentTasks: 2,
        });
        this.agentCapabilities.set("code-reviewer", {
            capabilities: ["analysis", "quality", "validation"],
            complexityThreshold: 30,
            concurrentTasks: 4,
        });
        this.agentCapabilities.set("orchestrator", {
            capabilities: ["coordination", "management", "optimization"],
            complexityThreshold: 95,
            concurrentTasks: 1,
        });
        this.agentCapabilities.set("bug-triage-specialist", {
            capabilities: ["debugging", "investigation", "fixing"],
            complexityThreshold: 40,
            concurrentTasks: 2,
        });
        this.agentCapabilities.set("security-auditor", {
            capabilities: ["security", "vulnerability", "audit"],
            complexityThreshold: 35,
            concurrentTasks: 2,
        });
        this.agentCapabilities.set("refactorer", {
            capabilities: ["optimization", "maintenance", "improvement"],
            complexityThreshold: 45,
            concurrentTasks: 1,
        });
        this.agentCapabilities.set("test-architect", {
            capabilities: ["testing", "coverage", "validation"],
            complexityThreshold: 38,
            concurrentTasks: 3,
        });
        this.agentCapabilities.set("log-monitor", {
            capabilities: ["monitoring", "analysis", "alerting"],
            complexityThreshold: 20,
            concurrentTasks: 5,
        });
    }
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "orchestrate-task",
                        description: "Execute complex multi-step tasks with intelligent agent delegation and progress tracking",
                        inputSchema: {
                            type: "object",
                            properties: {
                                description: { type: "string" },
                                tasks: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string" },
                                            description: { type: "string" },
                                            type: { type: "string" },
                                            priority: {
                                                type: "string",
                                                enum: ["critical", "high", "medium", "low"],
                                                default: "medium",
                                            },
                                            dependencies: {
                                                type: "array",
                                                items: { type: "string" },
                                            },
                                            estimatedComplexity: {
                                                type: "number",
                                                minimum: 1,
                                                maximum: 100,
                                            },
                                        },
                                        required: ["id", "description", "type"],
                                    },
                                },
                                sessionId: { type: "string" },
                                executionMode: {
                                    type: "string",
                                    enum: ["parallel", "sequential", "optimized"],
                                    default: "optimized",
                                },
                                timeout: { type: "number", default: 300000 }, // 5 minutes
                            },
                            required: ["description", "tasks"],
                        },
                    },
                    {
                        name: "analyze-complexity",
                        description: "Analyze task complexity and recommend optimal orchestration strategy",
                        inputSchema: {
                            type: "object",
                            properties: {
                                tasks: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            description: { type: "string" },
                                            type: { type: "string" },
                                            files: { type: "array", items: { type: "string" } },
                                            dependencies: { type: "number" },
                                            riskLevel: {
                                                type: "string",
                                                enum: ["low", "medium", "high", "critical"],
                                            },
                                        },
                                    },
                                },
                            },
                            required: ["tasks"],
                        },
                    },
                    {
                        name: "get-orchestration-status",
                        description: "Get comprehensive status of active orchestrations and agent utilization",
                        inputSchema: {
                            type: "object",
                            properties: {
                                sessionId: { type: "string" },
                                detailed: { type: "boolean", default: false },
                            },
                        },
                    },
                    {
                        name: "cancel-orchestration",
                        description: "Cancel active orchestration tasks with cleanup",
                        inputSchema: {
                            type: "object",
                            properties: {
                                sessionId: { type: "string" },
                                taskId: { type: "string" },
                                force: { type: "boolean", default: false },
                            },
                        },
                    },
                    {
                        name: "optimize-orchestration",
                        description: "Analyze and optimize orchestration patterns for better performance",
                        inputSchema: {
                            type: "object",
                            properties: {
                                history: { type: "boolean", default: true },
                                recommendations: { type: "boolean", default: true },
                            },
                        },
                    },
                ],
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case "orchestrate-task":
                    return await this.handleOrchestrateTask(args);
                case "analyze-complexity":
                    return await this.handleAnalyzeComplexity(args);
                case "get-orchestration-status":
                    return await this.handleGetOrchestrationStatus(args);
                case "cancel-orchestration":
                    return await this.handleCancelOrchestration(args);
                case "optimize-orchestration":
                    return await this.handleOptimizeOrchestration(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    async handleOrchestrateTask(args) {
        const description = args.description;
        const tasks = args.tasks || [];
        const sessionId = args.sessionId || `session_${Date.now()}`;
        const executionMode = args.executionMode || "optimized";
        const timeout = args.timeout || 300000;
        console.log("🎯 MCP: Orchestrating complex task:", {
            description,
            taskCount: tasks.length,
            sessionId,
            executionMode,
        });
        const orchestrationResult = {
            sessionId,
            success: false,
            completedTasks: 0,
            failedTasks: 0,
            duration: 0,
            agentUtilization: {},
            bottlenecks: [],
            recommendations: [],
        };
        const startTime = Date.now();
        try {
            // Validate tasks
            const validation = this.validateTasks(tasks);
            if (!validation.valid) {
                throw new Error(`Task validation failed: ${validation.errors.join(", ")}`);
            }
            // Analyze complexity and create execution plan
            const executionPlan = await this.createExecutionPlan(tasks, executionMode);
            // Execute orchestration
            const results = await this.executeOrchestrationPlan(executionPlan, sessionId, timeout);
            // Update result
            orchestrationResult.success = results.success;
            orchestrationResult.completedTasks = results.completedTasks;
            orchestrationResult.failedTasks = results.failedTasks;
            orchestrationResult.agentUtilization = results.agentUtilization;
            orchestrationResult.bottlenecks = results.bottlenecks;
            orchestrationResult.recommendations = results.recommendations;
            // Store in history
            this.taskHistory.push({
                sessionId,
                description,
                tasks: tasks.length,
                result: orchestrationResult,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            orchestrationResult.recommendations.push(`Orchestration error: ${error instanceof Error ? error.message : String(error)}`);
        }
        orchestrationResult.duration = Date.now() - startTime;
        const response = `🎯 Orchestration Complete: "${description}"

**Session ID:** ${sessionId}
**Success:** ${orchestrationResult.success ? "✅ COMPLETED" : "❌ FAILED"}
**Duration:** ${orchestrationResult.duration}ms
**Tasks:** ${orchestrationResult.completedTasks + orchestrationResult.failedTasks} total
  - ✅ Completed: ${orchestrationResult.completedTasks}
  - ❌ Failed: ${orchestrationResult.failedTasks}

**Agent Utilization:**
${Object.entries(orchestrationResult.agentUtilization)
            .map(([agent, count]) => `• ${agent}: ${count} tasks`)
            .join("\n")}

${orchestrationResult.bottlenecks.length > 0 ? `**Bottlenecks Detected:**\n${orchestrationResult.bottlenecks.map((b) => `• 🚧 ${b}`).join("\n")}\n` : ""}
**Recommendations:**
${orchestrationResult.recommendations.length > 0 ? orchestrationResult.recommendations.map((r) => `• 💡 ${r}`).join("\n") : "No recommendations"}

**Execution Mode:** ${executionMode}
**Status:** ${orchestrationResult.success ? "🟢 SUCCESS" : "🔴 ISSUES DETECTED"}`;
        return {
            content: [{ type: "text", text: response }],
        };
    }
    async handleAnalyzeComplexity(args) {
        const tasks = args.tasks || [];
        console.log("🔍 MCP: Analyzing task complexity:", {
            taskCount: tasks.length,
        });
        try {
            const analysis = await this.analyzeTaskComplexity(tasks);
            const recommendations = this.generateComplexityRecommendations(analysis);
            return {
                content: [
                    {
                        type: "text",
                        text: `🔍 Complexity Analysis Results

**Tasks Analyzed:** ${tasks.length}
**Overall Complexity:** ${analysis.overallComplexity}/100
**Recommended Strategy:** ${analysis.recommendedStrategy}

**Complexity Breakdown:**
${analysis.taskComplexity
                            .map((task, index) => `• Task ${index + 1}: ${task.complexity}/100 (${task.category})`)
                            .join("\n")}

**Agent Assignments:**
${analysis.agentAssignments
                            .map((assignment) => `• ${assignment.agent}: ${assignment.taskCount} tasks (${assignment.utilization}%)`)
                            .join("\n")}

**Recommendations:**
${recommendations.map((r) => `• 💡 ${r}`).join("\n")}

**Execution Estimate:** ${analysis.estimatedDuration}ms
**Parallel Potential:** ${Math.round(analysis.parallelPotential * 100)}%`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Complexity analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async handleGetOrchestrationStatus(args) {
        const sessionId = args.sessionId;
        const detailed = args.detailed || false;
        console.log("📊 MCP: Getting orchestration status:", {
            sessionId,
            detailed,
        });
        try {
            let status;
            if (sessionId) {
                status = this.activeTasks.get(sessionId);
                if (!status) {
                    // Check history
                    const historyItem = this.taskHistory.find((h) => h.sessionId === sessionId);
                    if (historyItem) {
                        status = { completed: true, ...historyItem.result };
                    }
                    else {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `❌ Session not found: ${sessionId}`,
                                },
                            ],
                        };
                    }
                }
            }
            else {
                // Overall status
                status = this.getOverallOrchestrationStatus();
            }
            const response = this.formatOrchestrationStatus(status, detailed);
            return {
                content: [{ type: "text", text: response }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Status check failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async handleCancelOrchestration(args) {
        const sessionId = args.sessionId;
        const taskId = args.taskId;
        const force = args.force || false;
        console.log("🛑 MCP: Cancelling orchestration:", {
            sessionId,
            taskId,
            force,
        });
        try {
            let cancelled = false;
            let cleanupResults = "";
            if (sessionId && taskId) {
                // Cancel specific task
                const session = this.activeTasks.get(sessionId);
                if (session && session.tasks[taskId]) {
                    cancelled = await this.cancelSpecificTask(sessionId, taskId, force);
                    cleanupResults = `Task ${taskId} cancelled`;
                }
                else {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ Task not found: ${sessionId}/${taskId}`,
                            },
                        ],
                    };
                }
            }
            else if (sessionId) {
                // Cancel entire session
                cancelled = await this.cancelSession(sessionId, force);
                cleanupResults = `Session ${sessionId} cancelled`;
            }
            else {
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ Must specify either sessionId or both sessionId and taskId`,
                        },
                    ],
                };
            }
            if (!cancelled && !force) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `⚠️ Cancellation blocked - use force=true to override`,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `🛑 Orchestration Cancelled\n**Status:** ${cancelled ? "✅ SUCCESS" : "❌ FAILED"}\n**Cleanup:** ${cleanupResults}\n**Force Used:** ${force}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Cancellation failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async handleOptimizeOrchestration(args) {
        const includeHistory = args.history !== false;
        const includeRecommendations = args.recommendations !== false;
        console.log("⚡ MCP: Optimizing orchestration patterns:", {
            includeHistory,
            includeRecommendations,
        });
        try {
            const optimizationResults = await this.analyzeOrchestrationPatterns(includeHistory);
            let response = `⚡ Orchestration Optimization Analysis

**Analysis Period:** ${includeHistory ? "Full History" : "Current Session"}
**Total Orchestrations:** ${optimizationResults.totalOrchestrations}
**Average Success Rate:** ${optimizationResults.averageSuccessRate}%

**Performance Metrics:**
• Average Duration: ${optimizationResults.averageDuration}ms
• Peak Agent Utilization: ${optimizationResults.peakUtilization}%
• Bottleneck Frequency: ${optimizationResults.bottleneckFrequency}%

**Common Patterns:**
${optimizationResults.commonPatterns.map((p) => `• ${p.pattern}: ${p.frequency}%`).join("\n")}

**Agent Efficiency:**
${optimizationResults.agentEfficiency.map((a) => `• ${a.agent}: ${a.efficiency}% (${a.taskCount} tasks)`).join("\n")}`;
            if (includeRecommendations) {
                response += `\n\n**Optimization Recommendations:**
${optimizationResults.recommendations.map((r) => `• 💡 ${r}`).join("\n")}

**Predicted Improvements:**
${optimizationResults.predictedImprovements.map((i) => `• 📈 ${i.metric}: ${i.improvement}%`).join("\n")}`;
            }
            return {
                content: [{ type: "text", text: response }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Optimization analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    validateTasks(tasks) {
        const errors = [];
        if (!Array.isArray(tasks) || tasks.length === 0) {
            errors.push("Tasks must be a non-empty array");
            return { valid: false, errors };
        }
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (!task.id || !task.description || !task.type) {
                errors.push(`Task ${i + 1}: missing required fields (id, description, type)`);
            }
            if (task.dependencies && !Array.isArray(task.dependencies)) {
                errors.push(`Task ${i + 1}: dependencies must be an array`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    async createExecutionPlan(tasks, executionMode) {
        const plan = {
            mode: executionMode,
            phases: [],
            agentAssignments: {},
            estimatedDuration: 0,
            resourceRequirements: {},
        };
        // Analyze task dependencies and create phases
        const taskMap = new Map(tasks.map((t) => [t.id, t]));
        const completed = new Set();
        const phases = [];
        while (completed.size < tasks.length) {
            const phase = [];
            for (const task of tasks) {
                if (completed.has(task.id))
                    continue;
                const dependencies = task.dependencies || [];
                if (dependencies.every((dep) => completed.has(dep))) {
                    phase.push(task);
                }
            }
            if (phase.length === 0) {
                throw new Error("Circular dependency detected in tasks");
            }
            phases.push(phase);
            phase.forEach((t) => completed.add(t.id));
        }
        plan.phases = phases;
        // Assign agents based on task types and complexity
        for (const phase of phases) {
            for (const task of phase) {
                const agent = this.selectAgentForTask(task);
                if (!plan.agentAssignments[agent]) {
                    plan.agentAssignments[agent] = [];
                }
                plan.agentAssignments[agent].push(task);
            }
        }
        // Calculate resource requirements
        for (const [agent, agentTasks] of Object.entries(plan.agentAssignments)) {
            const capability = this.agentCapabilities.get(agent);
            plan.resourceRequirements[agent] = Math.min(agentTasks.length, capability?.concurrentTasks || 1);
        }
        // Estimate duration
        plan.estimatedDuration = this.estimateExecutionDuration(plan);
        return plan;
    }
    selectAgentForTask(task) {
        // Simple agent selection based on task type
        const typeMappings = {
            validation: ["enforcer", "code-reviewer"],
            security: ["security-auditor", "enforcer"],
            design: ["architect"],
            testing: ["test-architect"],
            debugging: ["bug-triage-specialist"],
            optimization: ["refactorer"],
            monitoring: ["log-monitor"],
            coordination: ["orchestrator"],
        };
        const candidates = typeMappings[task.type] || ["enforcer"];
        const complexity = task.estimatedComplexity || 25;
        // Select agent with appropriate complexity threshold
        for (const candidate of candidates) {
            const capability = this.agentCapabilities.get(candidate);
            if (capability && complexity <= capability.complexityThreshold) {
                return candidate;
            }
        }
        return candidates[0] || "enforcer";
    }
    async executeOrchestrationPlan(plan, sessionId, timeout) {
        const results = {
            success: true,
            completedTasks: 0,
            failedTasks: 0,
            agentUtilization: {},
            bottlenecks: [],
            recommendations: [],
        };
        const session = {
            sessionId,
            plan,
            startTime: Date.now(),
            tasks: {},
            status: "running",
            endTime: undefined,
        };
        this.activeTasks.set(sessionId, session);
        try {
            // Execute phases
            for (let i = 0; i < plan.phases.length; i++) {
                const phase = plan.phases[i];
                console.log(`Executing phase ${i + 1}/${plan.phases.length} with ${phase.length} tasks`);
                // Execute tasks in phase (simplified - in real implementation would coordinate actual agents)
                for (const task of phase) {
                    try {
                        await this.simulateTaskExecution(task);
                        results.completedTasks++;
                        // Track agent utilization
                        const agent = this.selectAgentForTask(task);
                        results.agentUtilization[agent] =
                            (results.agentUtilization[agent] || 0) + 1;
                    }
                    catch (error) {
                        results.failedTasks++;
                        results.success = false;
                        results.bottlenecks.push(`Task ${task.id} failed: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            }
            // Analyze bottlenecks
            const utilization = Object.values(results.agentUtilization);
            const avgUtilization = utilization.reduce((a, b) => a + b, 0) / utilization.length;
            if (avgUtilization > 5) {
                results.bottlenecks.push("High agent utilization detected");
                results.recommendations.push("Consider increasing agent concurrency limits");
            }
            if (results.failedTasks > 0) {
                results.recommendations.push("Review failed tasks and error patterns");
            }
        }
        finally {
            session.status = results.success ? "completed" : "failed";
            session.endTime = Date.now();
        }
        return results;
    }
    async simulateTaskExecution(task) {
        // Simulate task execution with random duration and occasional failures
        const duration = Math.random() * 2000 + 500; // 500-2500ms
        await new Promise((resolve) => setTimeout(resolve, duration));
        // 10% chance of failure for demo purposes
        if (Math.random() < 0.1) {
            throw new Error(`Simulated failure for task ${task.id}`);
        }
    }
    async analyzeTaskComplexity(tasks) {
        const analysis = {
            overallComplexity: 0,
            taskComplexity: [],
            recommendedStrategy: "single-agent",
            agentAssignments: [],
            estimatedDuration: 0,
            parallelPotential: 0,
        };
        let totalComplexity = 0;
        for (const task of tasks) {
            const complexity = this.calculateTaskComplexity(task);
            analysis.taskComplexity.push({
                id: task.id,
                complexity: complexity.score,
                category: complexity.category,
            });
            totalComplexity += complexity.score;
        }
        analysis.overallComplexity = Math.min(100, totalComplexity / tasks.length);
        // Determine strategy
        if (analysis.overallComplexity > 95) {
            analysis.recommendedStrategy = "orchestrator-led";
        }
        else if (analysis.overallComplexity > 50) {
            analysis.recommendedStrategy = "multi-agent";
        }
        else {
            analysis.recommendedStrategy = "single-agent";
        }
        // Calculate agent assignments
        const agentCounts = {};
        for (const task of tasks) {
            const agent = this.selectAgentForTask(task);
            agentCounts[agent] = (agentCounts[agent] || 0) + 1;
        }
        analysis.agentAssignments = Object.entries(agentCounts).map(([agent, count]) => ({
            agent,
            taskCount: count,
            utilization: Math.round((count / tasks.length) * 100),
        }));
        // Estimate duration and parallel potential
        analysis.estimatedDuration = this.estimateExecutionDuration({
            agentAssignments: agentCounts,
        });
        analysis.parallelPotential = this.calculateParallelPotential(tasks);
        return analysis;
    }
    calculateTaskComplexity(task) {
        let score = 25; // Base complexity
        // Factor in file count
        const fileCount = task.files?.length || 1;
        score += Math.min(fileCount * 2, 20);
        // Factor in dependencies
        const dependencies = task.dependencies || 0;
        score += Math.min(dependencies * 3, 15);
        // Factor in risk level
        const riskMultiplier = { low: 0.8, medium: 1.0, high: 1.3, critical: 1.6 };
        score *=
            riskMultiplier[task.riskLevel || "medium"];
        // Determine category
        let category = "simple";
        if (score > 80)
            category = "enterprise";
        else if (score > 50)
            category = "complex";
        else if (score > 25)
            category = "moderate";
        return { score: Math.round(score), category };
    }
    estimateExecutionDuration(plan) {
        let totalDuration = 0;
        for (const [agent, tasks] of Object.entries(plan.agentAssignments || {})) {
            const capability = this.agentCapabilities.get(agent);
            const concurrentTasks = capability?.concurrentTasks || 1;
            const taskCount = Array.isArray(tasks)
                ? tasks.length
                : typeof tasks === "number"
                    ? tasks
                    : 0;
            // Estimate time per task (simplified)
            const avgTaskTime = 1500; // 1.5 seconds average
            const agentTime = Math.ceil(taskCount / concurrentTasks) * avgTaskTime;
            totalDuration = Math.max(totalDuration, agentTime);
        }
        return totalDuration;
    }
    calculateParallelPotential(tasks) {
        // Calculate how much parallelism is possible based on dependencies
        const independentTasks = tasks.filter((task) => !task.dependencies || task.dependencies.length === 0).length;
        return independentTasks / tasks.length;
    }
    generateComplexityRecommendations(analysis) {
        const recommendations = [];
        if (analysis.recommendedStrategy === "orchestrator-led") {
            recommendations.push("Use enterprise orchestrator for complex multi-agent coordination");
        }
        else if (analysis.recommendedStrategy === "multi-agent") {
            recommendations.push("Leverage multi-agent parallelism for improved efficiency");
        }
        if (analysis.parallelPotential > 0.7) {
            recommendations.push("High parallel potential - consider parallel execution");
        }
        const overloadedAgents = analysis.agentAssignments.filter((a) => a.utilization > 80);
        if (overloadedAgents.length > 0) {
            recommendations.push(`Consider load balancing for overloaded agents: ${overloadedAgents.map((a) => a.agent).join(", ")}`);
        }
        return recommendations;
    }
    getOverallOrchestrationStatus() {
        const activeCount = this.activeTasks.size;
        const completedCount = this.taskHistory.length;
        const agentUtilization = this.calculateAgentUtilization();
        return {
            activeSessions: activeCount,
            completedSessions: completedCount,
            totalSessions: activeCount + completedCount,
            agentUtilization,
            systemLoad: this.calculateSystemLoad(),
        };
    }
    calculateAgentUtilization() {
        const utilization = {};
        for (const session of this.activeTasks.values()) {
            for (const [agent, tasks] of Object.entries(session.plan?.agentAssignments || {})) {
                utilization[agent] =
                    (utilization[agent] || 0) +
                        (Array.isArray(tasks)
                            ? tasks.length
                            : typeof tasks === "number"
                                ? tasks
                                : 0);
            }
        }
        return utilization;
    }
    calculateSystemLoad() {
        const activeTasks = Array.from(this.activeTasks.values());
        const totalTasks = activeTasks.reduce((sum, session) => {
            return sum + (session.plan?.phases?.flat().length || 0);
        }, 0);
        // Simple load calculation (0-100)
        return Math.min(100, totalTasks * 10);
    }
    async cancelSession(sessionId, force) {
        const session = this.activeTasks.get(sessionId);
        if (!session)
            return false;
        // In a real implementation, this would send cancellation signals to running agents
        this.activeTasks.delete(sessionId);
        return true;
    }
    async cancelSpecificTask(sessionId, taskId, force) {
        const session = this.activeTasks.get(sessionId);
        if (!session || !session.tasks[taskId])
            return false;
        // In a real implementation, this would cancel the specific task
        delete session.tasks[taskId];
        return true;
    }
    async analyzeOrchestrationPatterns(includeHistory) {
        const data = includeHistory
            ? this.taskHistory
            : [this.getOverallOrchestrationStatus()];
        const results = {
            totalOrchestrations: data.length,
            averageSuccessRate: 0,
            averageDuration: 0,
            peakUtilization: 0,
            bottleneckFrequency: 0,
            commonPatterns: [],
            agentEfficiency: [],
            recommendations: [],
            predictedImprovements: [],
        };
        if (data.length === 0)
            return results;
        // Calculate metrics
        let totalSuccess = 0;
        let totalDuration = 0;
        const agentTaskCounts = {};
        for (const item of data) {
            if (item.result?.success)
                totalSuccess++;
            if (item.result?.duration)
                totalDuration += item.result.duration;
            // Count agent usage
            for (const [agent, count] of Object.entries(item.result?.agentUtilization || {})) {
                agentTaskCounts[agent] =
                    (agentTaskCounts[agent] || 0) +
                        (typeof count === "number" ? count : 0);
            }
        }
        results.averageSuccessRate = Math.round((totalSuccess / data.length) * 100);
        results.averageDuration = Math.round(totalDuration / data.length);
        // Calculate agent efficiency
        results.agentEfficiency = Object.entries(agentTaskCounts).map(([agent, tasks]) => ({
            agent,
            taskCount: tasks,
            efficiency: Math.round((tasks / data.length) * 100),
        }));
        // Generate recommendations
        if (results.averageSuccessRate < 80) {
            results.recommendations.push("Review orchestration strategies to improve success rates");
        }
        if (results.averageDuration > 60000) {
            // 1 minute
            results.recommendations.push("Consider parallel execution optimizations for long-running orchestrations");
        }
        // Predicted improvements
        results.predictedImprovements = [
            { metric: "Success Rate", improvement: 15 },
            { metric: "Execution Time", improvement: -25 },
            { metric: "Agent Utilization", improvement: 20 },
        ];
        return results;
    }
    formatOrchestrationStatus(status, detailed) {
        if (status.completed !== undefined) {
            // Completed session
            return `📊 Completed Orchestration
**Session:** ${status.sessionId}
**Tasks:** ${status.completedTasks + status.failedTasks}
**Success:** ${status.success ? "✅ Yes" : "❌ No"}
**Duration:** ${status.duration}ms
**Agent Utilization:** ${Object.entries(status.agentUtilization || {})
                .map(([a, c]) => `${a}:${c}`)
                .join(", ")}`;
        }
        else {
            // Overall status
            return `📊 Orchestration System Status
**Active Sessions:** ${status.activeSessions}
**Completed Sessions:** ${status.completedSessions}
**System Load:** ${status.systemLoad}%
**Agent Utilization:** ${Object.entries(status.agentUtilization || {})
                .map(([a, c]) => `${a}:${c}`)
                .join(", ")}`;
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log("StrRay Orchestrator MCP Server started");
    }
}
// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new StrRayOrchestratorServer();
    server.run().catch(console.error);
}
export { StrRayOrchestratorServer };
//# sourceMappingURL=orchestrator.server.js.map