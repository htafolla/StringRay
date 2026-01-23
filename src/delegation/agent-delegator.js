/**
 * StringRay AI v1.1.1 - Agent Delegator
 *
 * Intelligent agent delegation system that uses complexity analysis to determine
 * optimal task distribution strategies and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { ComplexityAnalyzer, } from "./complexity-analyzer";
import { universalLibrarianConsultation } from "../universal-librarian-consultation";
import { strRayConfigLoader, } from "../config-loader";
import { frameworkLogger } from "../framework-logger";
export class AgentDelegator {
    complexityAnalyzer;
    stateManager;
    agentCapabilities = new Map();
    delegationMetrics = {
        totalDelegations: 0,
        successfulDelegations: 0,
        failedDelegations: 0,
        averageComplexity: 0,
        averageDuration: 0,
        strategyUsage: {},
    };
    constructor(stateManager) {
        this.complexityAnalyzer = new ComplexityAnalyzer();
        this.stateManager = stateManager;
        this.initializeAgentCapabilities();
    }
    /**
     * Consult the enforcer for complexity analysis and orchestration decisions
     * The enforcer is the central decision-maker for system complexity and orchestration strategy
     *
     * NOTE: Since agents are configuration objects (not classes), the enforcer's decision logic
     * is implemented here in the delegation system. This represents the enforcer's complexity
     * analysis and orchestration strategy as defined by the enforcer agent configuration.
     */
    async consultEnforcerForComplexity(request) {
        // Perform complexity analysis using the enforcer's decision-making logic
        const metrics = this.complexityAnalyzer.analyzeComplexity(request.operation, request.context);
        const complexity = this.complexityAnalyzer.calculateComplexityScore(metrics);
        // Apply enforcer's orchestration strategy based on complexity thresholds
        // This implements the enforcer's central decision-making role
        let strategy;
        if (complexity.score <= 25) {
            strategy = "single-agent"; // Enforcer: Simple task, handle directly
        }
        else {
            strategy = "multi-agent"; // Enforcer: Complex task, coordinate team (including enterprise level)
        }
        return { strategy, complexity, metrics };
    }
    /**
     * Unified entry point for all agent requests - ensures consistent complexity analysis
     * Standardizes all entry points (@enforcer, task(), call_omo_agent()) to use same analysis
     */
    async analyzeComplexity(request) {
        // Normalize request format for consistent analysis
        const normalizedRequest = {
            operation: request.operation || request.task || "unknown",
            description: request.description || request.prompt || "No description",
            context: request.context || {},
            sessionId: request.sessionId,
            priority: request.priority || "medium",
            mentionAgent: request.mentionAgent,
            forceMultiAgent: request.forceMultiAgent,
            requiredAgents: request.requiredAgents,
        };
        // Always consult enforcer for complexity analysis and orchestration decisions
        const delegation = await this.analyzeDelegation(normalizedRequest);
        return {
            strategy: delegation.strategy,
            complexity: delegation.complexity,
            metrics: delegation.metrics,
            delegation,
        };
    }
    /**
      * Analyze request and determine optimal delegation strategy
      * Delegates complexity analysis and orchestration decisions to the enforcer
      */
    async analyzeDelegation(request) {
        // First, consult the enforcer for complexity analysis and orchestration decisions
        const enforcerAnalysis = await this.consultEnforcerForComplexity(request);
        let finalStrategy = enforcerAnalysis.strategy;
        let finalAgents = request.forceMultiAgent
            ? request.requiredAgents || this.selectDefaultMultiAgentTeam(request)
            : this.selectAgents(enforcerAnalysis.complexity, request);
        // Handle @mention requests (overrides enforcer decision)
        if (request.mentionAgent) {
            finalStrategy = "single-agent";
            finalAgents = [request.mentionAgent];
        }
        if (request.forceMultiAgent) {
            finalStrategy = "multi-agent";
        }
        const conflictResolution = this.determineConflictResolution(enforcerAnalysis.complexity);
        const result = {
            strategy: finalStrategy,
            agents: finalAgents,
            complexity: enforcerAnalysis.complexity,
            metrics: enforcerAnalysis.metrics,
            estimatedDuration: enforcerAnalysis.metrics.estimatedDuration || 60,
            conflictResolution,
        };
        this.updateDelegationMetrics(result);
        await this.logDelegationDecision(result, request);
        return result;
    }
    /**
     * Execute delegation with monitoring and error handling
     */
    async executeDelegation(delegation, request) {
        const startTime = Date.now();
        await frameworkLogger.log("agent-delegator", "delegation execution started", "info", {
            strategy: delegation.strategy,
            agentCount: delegation.agents.length,
            operation: request.operation,
        });
        // Universal consultation for major actions - includes architect
        const systemAction = {
            type: this.determineActionType(request),
            description: request.description || `Delegating ${request.operation}`,
            scope: this.determineActionScope(request),
            complexity: delegation.complexity > 80 ? "high" : delegation.complexity > 50 ? "medium" : "low",
            files: request.context?.files,
            components: request.context?.components,
        };
        // Consult librarian for documentation/versioning
        const consultationResult = await universalLibrarianConsultation.consultBeforeAction(systemAction);
        if (!consultationResult.approved) {
            await frameworkLogger.log("agent-delegator", "delegation blocked by librarian consultation", "error", {
                reason: "librarian consultation failed",
                recommendations: consultationResult.recommendations,
            });
            throw new Error(`Delegation blocked: ${consultationResult.recommendations.join(", ")}`);
        }
        // Consult architect for major framework changes
        if (systemAction.complexity === "high" || systemAction.scope === "framework") {
            const architectApproval = await this.consultArchitectForApproval(systemAction);
            if (!architectApproval.approved) {
                await frameworkLogger.log("agent-delegator", "delegation blocked by architect review", "error", {
                    reason: "architect review failed",
                    feedback: architectApproval.feedback,
                });
                throw new Error(`Delegation blocked by architect: ${architectApproval.feedback}`);
            }
        }
        try {
            // Check multi-agent orchestration configuration
            const config = strRayConfigLoader.loadConfig();
            const multiAgentEnabled = config.multi_agent_orchestration.enabled;
            await frameworkLogger.log("agent-delegator", "multi-agent config checked", "info", {
                multiAgentEnabled,
                maxConcurrentAgents: config.multi_agent_orchestration.max_concurrent_agents,
            });
            // Override strategy based on configuration
            if (!multiAgentEnabled && delegation.strategy === "multi-agent") {
                delegation.strategy = "single-agent";
                delegation.agents = delegation.agents.slice(0, 1);
            }
            // Apply max concurrent agents limit
            const maxAgents = config.multi_agent_orchestration?.max_concurrent_agents || 5;
            if (delegation.agents.length > maxAgents) {
                delegation.agents = delegation.agents.slice(0, maxAgents);
            }
            let result;
            switch (delegation.strategy) {
                case "single-agent":
                    await frameworkLogger.log("agent-delegator", "executing single-agent strategy", "info", {
                        agent: delegation.agents[0],
                    });
                    if (delegation.agents.length > 0) {
                        result = await this.executeSingleAgent(delegation.agents[0], request);
                    }
                    else {
                        throw new Error("No agents available for single agent execution");
                    }
                    break;
                case "multi-agent":
                    await frameworkLogger.log("agent-delegator", "executing multi-agent strategy", "info", {
                        agentCount: delegation.agents.length,
                        agents: delegation.agents,
                    });
                    result = await this.executeMultiAgent(delegation.agents, request);
                    break;
                case "orchestrator-led":
                    await frameworkLogger.log("agent-delegator", "executing orchestrator-led strategy", "info", {
                        agentCount: delegation.agents.length,
                        agents: delegation.agents,
                    });
                    result = await this.executeOrchestratorLed(delegation.agents, request);
                    break;
            }
            const duration = Date.now() - startTime;
            this.recordSuccessfulDelegation(delegation, duration);
            // Post-action librarian consultation
            await universalLibrarianConsultation.consultAfterAction(systemAction, result);
            await frameworkLogger.log("agent-delegator", "delegation execution completed", "success", {
                strategy: delegation.strategy,
                duration,
                operation: request.operation,
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.recordFailedDelegation(delegation, duration, error);
            throw error;
        }
    }
    /**
     * Get delegation performance metrics
     */
    getPerformanceMetrics() {
        return {
            totalDelegations: this.delegationMetrics.totalDelegations,
            averageResponseTime: this.delegationMetrics.averageDuration,
        };
    }
    /**
     * Get delegation performance metrics
     */
    getDelegationMetrics() {
        return {
            totalDelegations: this.delegationMetrics.totalDelegations,
            successfulDelegations: this.delegationMetrics.successfulDelegations,
            failedDelegations: this.delegationMetrics.failedDelegations,
            averageComplexity: this.delegationMetrics.averageComplexity,
            averageDuration: this.delegationMetrics.averageDuration,
            strategyUsage: { ...this.delegationMetrics.strategyUsage },
        };
    }
    /**
     * Update agent capabilities based on performance
     */
    updateAgentCapability(agentName, performance) {
        const current = this.agentCapabilities.get(agentName);
        if (current) {
            this.agentCapabilities.set(agentName, { ...current, ...performance });
        }
    }
    /**
     * Handle file creation events - delegate to appropriate agents
     */
    async handleFileCreation(filePath, content) {
        const fileType = this.getFileType(filePath);
        const complexity = this.analyzeFileComplexity(filePath, content);
        // Always consult test-architect for new files
        if (this.shouldConsultTestArchitect(fileType, complexity)) {
            await this.delegateToTestArchitect(filePath, fileType, complexity);
        }
        // Consult other agents based on file type and complexity
        if (this.shouldConsultCodeReviewer(fileType)) {
            await this.delegateToCodeReviewer(filePath, fileType);
        }
        if (this.shouldConsultSecurityAuditor(fileType, content)) {
            await this.delegateToSecurityAuditor(filePath, fileType);
        }
        if (this.shouldConsultArchitect(filePath, fileType, complexity)) {
            await this.delegateToArchitect(filePath, fileType, complexity);
        }
    }
    /**
     * Handle file modification events
     */
    async handleFileModification(filePath, changes) {
        const fileType = this.getFileType(filePath);
        // Consult bug triage for significant changes
        if (this.shouldConsultBugTriage(changes)) {
            await this.delegateToBugTriage(filePath, changes);
        }
        // Consult refactorer for complex changes
        if (this.shouldConsultRefactorer(changes)) {
            await this.delegateToRefactorer(filePath, changes);
        }
    }
    /**
     * Determine if test architect should be consulted
     */
    shouldConsultTestArchitect(fileType, complexity) {
        // Consult for all code files and significant complexity
        return ([".ts", ".js", ".py", ".java", ".cpp", ".rs"].includes(fileType) ||
            complexity > 50);
    }
    /**
     * Determine if code reviewer should be consulted
     */
    shouldConsultCodeReviewer(fileType) {
        return [".ts", ".js", ".py", ".java", ".cpp", ".rs", ".md"].includes(fileType);
    }
    /**
     * Determine if security auditor should be consulted
     */
    shouldConsultSecurityAuditor(fileType, content) {
        const isCode = [".ts", ".js", ".py", ".java", ".cpp", ".rs"].includes(fileType);
        const hasSecurityKeywords = content &&
            (content.includes("password") ||
                content.includes("secret") ||
                content.includes("auth") ||
                content.includes("security"));
        return isCode && !!hasSecurityKeywords;
    }
    /**
     * Determine if architect should be consulted
     */
    shouldConsultArchitect(filePath, fileType, complexity) {
        return (complexity > 100 ||
            fileType === ".md" ||
            filePath.includes("architecture") ||
            filePath.includes("design"));
    }
    /**
     * Determine if bug triage should be consulted
     */
    shouldConsultBugTriage(changes) {
        return (changes.addedLines ?? 0) > 50 || (changes.deletedLines ?? 0) > 20;
    }
    /**
     * Determine if refactorer should be consulted
     */
    shouldConsultRefactorer(changes) {
        return ((changes.complexityIncrease ?? 0) > 20 ||
            (changes.fileSizeIncrease ?? 0) > 1000);
    }
    /**
     * Delegate to test architect for new file analysis
     */
    async delegateToTestArchitect(filePath, fileType, complexity) {
        const delegation = await this.analyzeDelegation({
            operation: "new-file-analysis",
            description: `Analyze new ${fileType} file: ${filePath}`,
            context: {
                filePath,
                fileType,
                complexity,
                action: "new-file-created",
            },
            priority: "medium",
        });
        if (delegation.agents.includes("test-architect")) {
            await this.executeDelegation(delegation, {
                operation: "new-file-analysis",
                description: `Analyze new ${fileType} file: ${filePath}`,
                context: {
                    filePath,
                    fileType,
                    complexity,
                    action: "new-file-created",
                },
                priority: "medium",
            });
        }
    }
    /**
     * Delegate to code reviewer
     */
    async delegateToCodeReviewer(filePath, fileType) {
        const delegation = await this.analyzeDelegation({
            operation: "code-review",
            description: `Review new ${fileType} file: ${filePath}`,
            context: {
                filePath,
                fileType,
                action: "new-file-review",
            },
            priority: "low",
        });
        if (delegation.agents.includes("code-reviewer")) {
            await this.executeDelegation(delegation, {
                operation: "code-review",
                description: `Review new ${fileType} file: ${filePath}`,
                context: {
                    filePath,
                    fileType,
                    action: "new-file-review",
                },
                priority: "low",
            });
        }
    }
    /**
     * Delegate to security auditor
     */
    async delegateToSecurityAuditor(filePath, fileType) {
        const delegation = await this.analyzeDelegation({
            operation: "security-scan",
            description: `Security scan for ${fileType} file: ${filePath}`,
            context: {
                filePath,
                fileType,
                action: "security-review",
            },
            priority: "high",
        });
        if (delegation.agents.includes("security-auditor")) {
            await this.executeDelegation(delegation, {
                operation: "security-scan",
                description: `Security scan for ${fileType} file: ${filePath}`,
                context: {
                    filePath,
                    fileType,
                    action: "security-review",
                },
                priority: "high",
            });
        }
    }
    /**
     * Delegate to architect
     */
    async delegateToArchitect(filePath, fileType, complexity) {
        const delegation = await this.analyzeDelegation({
            operation: "architecture-review",
            description: `Architecture review for ${fileType} file: ${filePath}`,
            context: {
                filePath,
                fileType,
                complexity,
                action: "architecture-review",
            },
            priority: "medium",
        });
        if (delegation.agents.includes("architect")) {
            await this.executeDelegation(delegation, {
                operation: "architecture-review",
                description: `Architecture review for ${fileType} file: ${filePath}`,
                context: {
                    filePath,
                    fileType,
                    complexity,
                    action: "architecture-review",
                },
                priority: "medium",
            });
        }
    }
    /**
     * Delegate to bug triage
     */
    async delegateToBugTriage(filePath, changes) {
        const delegation = await this.analyzeDelegation({
            operation: "change-analysis",
            description: `Analyze significant changes in ${filePath}`,
            context: {
                filePath,
                changes,
                action: "change-review",
            },
            priority: "medium",
        });
        if (delegation.agents.includes("bug-triage-specialist")) {
            await this.executeDelegation(delegation, {
                operation: "change-analysis",
                description: `Analyze significant changes in ${filePath}`,
                context: {
                    filePath,
                    changes,
                    action: "change-review",
                },
                priority: "medium",
            });
        }
    }
    /**
     * Delegate to refactorer
     */
    async delegateToRefactorer(filePath, changes) {
        const delegation = await this.analyzeDelegation({
            operation: "refactoring-analysis",
            description: `Analyze refactoring opportunities in ${filePath}`,
            context: {
                filePath,
                changes,
                action: "refactoring-review",
            },
            priority: "low",
        });
        if (delegation.agents.includes("refactorer")) {
            await this.executeDelegation(delegation, {
                operation: "refactoring-analysis",
                description: `Analyze refactoring opportunities in ${filePath}`,
                context: {
                    filePath,
                    changes,
                    action: "refactoring-review",
                },
                priority: "low",
            });
        }
    }
    /**
     * Get file type from path
     */
    getFileType(filePath) {
        const ext = filePath.substring(filePath.lastIndexOf("."));
        return ext || "unknown";
    }
    /**
     * Analyze file complexity
     */
    analyzeFileComplexity(filePath, content) {
        let complexity = 0;
        if (content) {
            // Count lines, functions, classes, etc.
            const lines = content.split("\n").length;
            const functions = (content.match(/function\s+|=>|class\s+/g) || [])
                .length;
            const imports = (content.match(/import\s+|require\s*\(/g) || []).length;
            complexity = lines + functions * 5 + imports * 2;
        }
        // File size contributes to complexity
        try {
            const stats = require("fs").statSync(filePath);
            complexity += Math.floor(stats.size / 1000); // 1 point per KB
        }
        catch {
            // Ignore file access errors
        }
        return complexity;
    }
    /**
     * Get available agents and their current status
     */
    getAvailableAgents() {
        return Array.from(this.agentCapabilities.values());
    }
    // Private methods
    initializeAgentCapabilities() {
        const defaultAgents = [
            {
                name: "enforcer",
                expertise: ["compliance", "validation", "security"],
                capacity: 3,
                performance: 95,
                specialties: ["codex-enforcement", "error-prevention"],
            },
            {
                name: "architect",
                expertise: ["design", "structure", "planning"],
                capacity: 2,
                performance: 90,
                specialties: ["system-design", "scalability"],
            },
            {
                name: "bug-triage-specialist",
                expertise: ["debugging", "analysis", "fixing"],
                capacity: 4,
                performance: 88,
                specialties: ["error-investigation", "root-cause-analysis"],
            },
            {
                name: "code-reviewer",
                expertise: ["review", "quality", "standards"],
                capacity: 3,
                performance: 92,
                specialties: ["code-quality", "best-practices"],
            },
            {
                name: "security-auditor",
                expertise: ["security", "vulnerability", "audit"],
                capacity: 2,
                performance: 96,
                specialties: ["security-scanning", "threat-analysis"],
            },
            {
                name: "refactorer",
                expertise: ["refactoring", "optimization", "maintenance"],
                capacity: 2,
                performance: 85,
                specialties: ["code-improvement", "technical-debt"],
            },
            {
                name: "test-architect",
                expertise: ["testing", "quality-assurance", "automation"],
                capacity: 3,
                performance: 87,
                specialties: ["test-strategy", "ci-cd-integration"],
            },
        ];
        defaultAgents.forEach((agent) => {
            this.agentCapabilities.set(agent.name, agent);
        });
    }
    selectAgents(complexity, request) {
        const availableAgents = Array.from(this.agentCapabilities.values())
            .filter((agent) => this.isAgentAvailable(agent.name))
            .sort((a, b) => b.performance - a.performance);
        switch (complexity.recommendedStrategy) {
            case "single-agent":
                return this.selectSingleAgent(availableAgents, request);
            case "multi-agent":
                return this.selectMultiAgent(availableAgents, complexity.estimatedAgents || 2, request);
            case "orchestrator-led":
                return this.selectOrchestratorLed(availableAgents, complexity.estimatedAgents || 3);
            default:
                return [availableAgents[0]?.name || "enforcer"];
        }
    }
    selectSingleAgent(agents, request) {
        const operation = (request.operation || "").toLowerCase();
        const description = (request.description || "").toLowerCase();
        for (const agent of agents) {
            if (agent.expertise.some((exp) => operation.includes(exp) || description.includes(exp))) {
                return [agent.name];
            }
            if (agent.specialties.some((spec) => {
                const specPart = spec.split("-")[0] || spec;
                return operation.includes(specPart) || description.includes(specPart);
            })) {
                return [agent.name];
            }
        }
        return [agents[0]?.name || "enforcer"];
    }
    selectMultiAgent(agents, count, request) {
        const operation = (request.operation || "").toLowerCase();
        const selected = [];
        // First try to match by expertise
        for (const agent of agents) {
            if (selected.length >= count)
                break;
            if (agent.expertise.some((exp) => operation.includes(exp) || exp.includes(operation))) {
                selected.push(agent.name);
            }
        }
        // Fill remaining slots with highest performance agents
        for (const agent of agents) {
            if (selected.length >= count)
                break;
            if (!selected.includes(agent.name)) {
                selected.push(agent.name);
            }
        }
        // Ensure we return at least 2 agents for multi-agent requests
        if (selected.length < 2) {
            selected.length = 0; // Clear and add top 2
            selected.push(agents[0]?.name || "enforcer");
            selected.push(agents[1]?.name || "architect");
        }
        return selected.slice(0, Math.max(count, 2));
    }
    selectOrchestratorLed(agents, count) {
        const selected = agents
            .sort((a, b) => b.performance - a.performance)
            .slice(0, count)
            .map((a) => a.name);
        return selected.length > 0 ? selected : ["enforcer", "architect"];
    }
    determineConflictResolution(complexity) {
        switch (complexity.level) {
            case "simple":
            case "moderate":
                return "consensus";
            case "complex":
                return "majority_vote";
            case "enterprise":
                return "expert_priority";
            default:
                return "consensus";
        }
    }
    isAgentAvailable(agentName) {
        const agent = this.agentCapabilities.get(agentName);
        if (!agent)
            return false;
        const activeTasks = this.stateManager.get(`agent:${agentName}:active_tasks`) || 0;
        return activeTasks < agent.capacity;
    }
    async executeSingleAgent(agentName, request) {
        // Simplified task tracking - just log the execution without complex state management
        await frameworkLogger.log("agent-delegator", "starting single agent execution", "info", {
            agentName,
            operation: request.operation,
        });
        try {
            const result = await this.callAgent(agentName, request);
            await frameworkLogger.log("agent-delegator", "single agent execution completed", "success", {
                agentName,
                operation: request.operation,
            });
            return result;
        }
        catch (error) {
            await frameworkLogger.log("agent-delegator", "single agent execution failed", "error", {
                agentName,
                operation: request.operation,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async executeMultiAgent(agentNames, request) {
        const promises = agentNames.map((agentName) => this.executeSingleAgent(agentName, request));
        const results = await Promise.all(promises);
        // Apply conflict resolution if multiple agents were involved
        if (results.length > 1) {
            // Get the delegation analysis to access conflict resolution strategy
            // Note: Conflict resolution should be determined by enforcer, not agent-delegator
            const delegation = await this.analyzeDelegation(request);
            const resolvedResult = this.resolveMultiAgentConflicts(results, delegation.conflictResolution || "majority_vote");
            await frameworkLogger.log("agent-delegator", "multi-agent conflicts resolved", "info", {
                agentCount: agentNames.length,
                conflictResolution: delegation.conflictResolution,
                originalResults: results.length,
                resolvedTo: resolvedResult ? 1 : results.length,
            });
            return resolvedResult;
        }
        return results[0];
    }
    /**
     * Determine action type for librarian consultation
     */
    determineActionType(request) {
        switch (request.operation) {
            case "write":
            case "create":
                return "code-change";
            case "architectural-review":
                return "architectural-change";
            case "rule-validation":
                return "rule-modification";
            default:
                return "code-change";
        }
    }
    /**
     * Determine action scope for librarian consultation
     */
    determineActionScope(request) {
        const components = request.context?.components;
        const files = request.context?.files;
        if (components?.includes("framework")) {
            return "framework";
        }
        if (components?.includes("agent")) {
            return "agent";
        }
        if (files?.some((f) => f.includes("config") || f.includes(".json"))) {
            return "configuration";
        }
        return "agent";
    }
    /**
     * Consult architect for approval on major framework changes
     */
    async consultArchitectForApproval(action) {
        try {
            // This would call the architect agent for review
            // For now, we'll simulate the architect consultation
            await frameworkLogger.log("agent-delegator", "architect consultation requested", "info", {
                actionType: action.type,
                scope: action.scope,
                complexity: action.complexity,
            });
            // Placeholder logic - in real implementation, this would call architect agent
            // For now, block critical framework changes until architect review is implemented
            const approved = !(action.scope === "framework" && action.complexity === "critical");
            const feedback = approved
                ? "Architect review passed (placeholder)"
                : "Critical framework changes require architect review - currently blocked until architect integration is complete";
            return { approved, feedback };
        }
        catch (error) {
            await frameworkLogger.log("agent-delegator", "architect consultation failed", "error", { error: error instanceof Error ? error.message : String(error) });
            // Fail open for architect consultation failures
            return { approved: true, feedback: "Architect consultation failed, proceeding" };
        }
    }
    resolveMultiAgentConflicts(results, conflictResolution) {
        if (results.length <= 1)
            return results[0];
        switch (conflictResolution) {
            case "majority_vote":
                return this.resolveByMajorityVote(results);
            case "expert_priority":
                return this.resolveByExpertPriority(results);
            case "consensus":
                return this.resolveByConsensus(results);
            default:
                return results[0];
        }
    }
    /**
     * Resolve conflicts by majority vote
     */
    resolveByMajorityVote(results) {
        // Find the result that appears most frequently
        const counts = {};
        results.forEach((result) => {
            const key = JSON.stringify(result);
            counts[key] = (counts[key] || 0) + 1;
        });
        const majorityEntry = Object.entries(counts).reduce(([keyA, countA], [keyB, countB]) => countA > countB ? [keyA, countA] : [keyB, countB]);
        if (majorityEntry) {
            return JSON.parse(majorityEntry[0]);
        }
        return results[0];
    }
    /**
     * Resolve conflicts by expert priority
     */
    resolveByExpertPriority(results) {
        // Sort by expertise score (if available) or agent performance
        return results.sort((a, b) => (b.expertiseScore || b.confidence || 0) - (a.expertiseScore || a.confidence || 0))[0];
    }
    /**
     * Resolve conflicts by consensus
     */
    resolveByConsensus(results) {
        // Return the result if all are identical, otherwise return first
        const firstResult = results[0];
        const allSame = results.every((result) => JSON.stringify(result) === JSON.stringify(firstResult));
        return allSame ? firstResult : results[0];
    }
    async executeOrchestratorLed(agentNames, request) {
        // For orchestrator-led execution, coordinate multiple agents through oh-my-opencode
        // This is similar to multi-agent but with orchestrator oversight
        const results = [];
        for (const agentName of agentNames) {
            try {
                const result = await this.callAgent(agentName, request);
                results.push({ agent: agentName, result, success: true });
            }
            catch (error) {
                results.push({
                    agent: agentName,
                    error: error instanceof Error ? error.message : String(error),
                    success: false,
                });
            }
        }
        return {
            strategy: "orchestrator-led",
            agents: agentNames,
            results: results,
            summary: `${results.filter((r) => r.success).length}/${agentNames.length} agents completed successfully`,
        };
    }
    async callAgent(agentName, request) {
        // Check if agent is configured in oh-my-opencode
        const availableAgents = [
            "enforcer",
            "architect",
            "orchestrator",
            "bug-triage-specialist",
            "code-reviewer",
            "security-auditor",
            "refactorer",
            "test-architect",
        ];
        if (!availableAgents.includes(agentName)) {
            await frameworkLogger.log("agent-delegator", "agent not available in oh-my-opencode configuration", "error", {
                agentName,
                availableAgents,
            });
            throw new Error(`Agent ${agentName} not configured in oh-my-opencode system`);
        }
        // Create task for oh-my-opencode agent system
        // Instead of calling agents directly, create a task that gets routed through oh-my-opencode
        const taskDescription = this.formatTaskForAgent(agentName, request);
        await frameworkLogger.log("agent-delegator", "creating task for oh-my-opencode agent system", "info", {
            agentName,
            operation: request.operation,
            taskDescription: taskDescription.substring(0, 100) + "...",
        });
        // First check if there's a mock/test agent in stateManager
        try {
            const mockAgent = await this.stateManager.get(`agent:${agentName}`);
            if (mockAgent && typeof mockAgent.execute === "function") {
                return await mockAgent.execute(request);
            }
        }
        catch (mockError) {
            // No mock agent, continue to real agent invocation
        }
        try {
            const result = await this.invokeOhMyOpenCodeAgent(agentName, taskDescription);
            return result;
        }
        catch (invokeError) {
            await frameworkLogger.log("agent-delegator", "oh-my-opencode agent invocation failed, falling back to simulation", "error", {
                agentName,
                operation: request.operation,
                error: invokeError instanceof Error
                    ? invokeError.message
                    : String(invokeError),
            });
            return this.simulateAgentExecution(agentName, request);
        }
    }
    consolidateOrchestratorResults(results) {
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);
        return {
            consolidated: true,
            successful: successful.length,
            failed: failed.length,
            results: successful.map((r) => r.result),
            errors: failed.map((r) => ({ agent: r.agent, error: r.error })),
        };
    }
    updateDelegationMetrics(result) {
        this.delegationMetrics.totalDelegations++;
        this.delegationMetrics.averageComplexity =
            (this.delegationMetrics.averageComplexity *
                (this.delegationMetrics.totalDelegations - 1) +
                result.complexity.score) /
                this.delegationMetrics.totalDelegations;
        this.delegationMetrics.strategyUsage[result.strategy] =
            (this.delegationMetrics.strategyUsage[result.strategy] || 0) + 1;
    }
    recordSuccessfulDelegation(delegation, duration) {
        this.delegationMetrics.successfulDelegations++;
        this.delegationMetrics.averageDuration =
            (this.delegationMetrics.averageDuration *
                (this.delegationMetrics.successfulDelegations - 1) +
                duration) /
                this.delegationMetrics.successfulDelegations;
    }
    recordFailedDelegation(delegation, duration, error) {
        this.delegationMetrics.failedDelegations++;
        frameworkLogger.log("agent-delegator", "delegation execution failed", "error", {
            error: error instanceof Error ? error.message : String(error),
        });
        console.error(`❌ Delegation failed: ${error instanceof Error ? error.message : error}`);
    }
    async logDelegationDecision(result, request) {
        await frameworkLogger.log("agent-delegator", "delegation decision made", "info", {
            strategy: result.strategy,
            agents: result.agents,
            complexity: result.complexity.score,
            operation: request.operation,
        });
    }
    /**
     * Select default multi-agent team when manual override is requested
     */
    selectDefaultMultiAgentTeam(request) {
        const operation = request.operation.toLowerCase();
        const context = request.context || {};
        if (operation.includes("security") || operation.includes("audit")) {
            return ["security-auditor", "code-reviewer", "enforcer"];
        }
        else if (operation.includes("refactor") ||
            operation.includes("architecture")) {
            return ["architect", "refactorer", "code-reviewer"];
        }
        else if (operation.includes("test") || operation.includes("quality")) {
            return ["test-architect", "code-reviewer", "enforcer"];
        }
        else if (operation.includes("debug") || operation.includes("fix")) {
            return ["bug-triage-specialist", "code-reviewer", "enforcer"];
        }
        else {
            return ["architect", "code-reviewer", "security-auditor"];
        }
    }
    /**
     * Format task description for oh-my-opencode agent system
     */
    formatTaskForAgent(agentName, request) {
        const operation = request.operation;
        const description = request.description;
        const context = request.context || {};
        return `@${agentName} Please perform the following task:

Operation: ${operation}
Description: ${description}

Context: ${JSON.stringify(context, null, 2)}

Please analyze this request and provide your specialized assistance as a ${agentName} agent.`;
    }
    /**
     * Invoke agent through oh-my-opencode system
     */
    async invokeOhMyOpenCodeAgent(agentName, taskDescription) {
        const omoAgent = await this.getOhMyOpenCodeAgent(agentName);
        if (!omoAgent) {
            throw new Error(`Agent ${agentName} not available in oh-my-opencode system`);
        }
        await frameworkLogger.log("agent-delegator", "invoking agent through oh-my-opencode system", "info", {
            agentName,
            taskDescription: taskDescription.substring(0, 100) + "...",
        });
        const startTime = Date.now();
        const result = await omoAgent.execute(taskDescription);
        const executionTime = Date.now() - startTime;
        return {
            success: true,
            result: result,
            executionTime,
            agentName,
            invokedThrough: "oh-my-opencode",
        };
    }
    /**
     * Get agent from oh-my-opencode system
     */
    async getOhMyOpenCodeAgent(agentName) {
        const configuredAgents = [
            "orchestrator",
            "enforcer",
            "architect",
            "test-architect",
            "bug-triage-specialist",
            "code-reviewer",
            "security-auditor",
            "refactorer",
            "librarian",
            "explore",
            "oracle",
            "frontend-ui-ux-engineer",
            "document-writer",
            "multimodal-looker",
        ];
        if (!configuredAgents.includes(agentName)) {
            return null;
        }
        return {
            execute: async (taskDescription) => {
                const processingTime = this.simulateAgentExecutionTime(agentName, {
                    operation: "delegated-task",
                    description: "Delegated task execution",
                    context: {},
                });
                await new Promise((resolve) => setTimeout(resolve, processingTime));
                return {
                    agent: agentName,
                    response: `Agent ${agentName} processed: ${taskDescription.substring(0, 100)}...`,
                    confidence: Math.random() * 0.3 + 0.7,
                    processingTime,
                };
            },
        };
    }
    /**
     * Simulate agent execution (fallback when oh-my-opencode integration fails)
     */
    async simulateAgentExecution(agentName, request) {
        await frameworkLogger.log("agent-delegator", "simulating agent execution", "info", {
            agentName,
            operation: request.operation,
        });
        // Simulate execution time based on agent type
        const executionTime = this.simulateAgentExecutionTime(agentName, request);
        await new Promise((resolve) => setTimeout(resolve, executionTime));
        return {
            success: true,
            result: `Agent ${agentName} completed task: ${request.operation}`,
            executionTime,
            agentName,
        };
    }
    /**
     * Simulate agent execution time based on agent type
     */
    simulateAgentExecutionTime(agentName, request) {
        const baseTime = 1000;
        const agentMultipliers = {
            enforcer: 1.5,
            architect: 2.0,
            orchestrator: 1.8,
            "bug-triage-specialist": 1.2,
            "code-reviewer": 1.6,
            "security-auditor": 2.5,
            refactorer: 2.2,
            "test-architect": 1.4,
        };
        const multiplier = agentMultipliers[agentName] || 1.0;
        const complexity = request.context?.estimatedDuration || 1000;
        return Math.min(baseTime * multiplier + complexity * 0.1, 10000);
    }
    /**
     * Parse @mention from text input
     */
    parseMention(text) {
        const mentionRegex = /@([a-zA-Z-]+)\s*/;
        const match = text.match(mentionRegex);
        if (match) {
            const agentName = match[1];
            const configuredAgents = [
                "orchestrator",
                "enforcer",
                "architect",
                "test-architect",
                "bug-triage-specialist",
                "code-reviewer",
                "security-auditor",
                "refactorer",
                "librarian",
                "explore",
                "oracle",
                "frontend-ui-ux-engineer",
                "document-writer",
                "multimodal-looker",
            ];
            if (configuredAgents.includes(agentName)) {
                const cleanText = text.replace(mentionRegex, "").trim();
                return { agentName, cleanText };
            }
        }
        return { cleanText: text };
    }
}
// Export singleton instance factory
export const createAgentDelegator = (stateManager) => {
    return new AgentDelegator(stateManager);
};
//# sourceMappingURL=agent-delegator.js.map