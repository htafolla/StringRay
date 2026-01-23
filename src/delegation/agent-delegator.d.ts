/**
 * StringRay AI v1.1.1 - Agent Delegator
 *
 * Intelligent agent delegation system that uses complexity analysis to determine
 * optimal task distribution strategies and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { ComplexityScore, ComplexityMetrics } from "./complexity-analyzer";
import { StringRayStateManager } from "../state/state-manager";
export interface DelegationContext {
    fileCount?: number;
    changeVolume?: number;
    dependencies?: number | string[];
    riskLevel?: "low" | "medium" | "high" | "critical";
    estimatedDuration?: number;
    [key: string]: unknown;
}
export interface FileChanges {
    added?: number;
    deleted?: number;
    modified?: number;
    addedLines?: number;
    deletedLines?: number;
    complexityIncrease?: number;
    fileSizeIncrease?: number;
    type?: "typescript" | "javascript" | "python" | "other";
    [key: string]: unknown;
}
export interface AgentExecutionResult {
    agent: string;
    result?: unknown;
    success: boolean;
    error?: string;
}
export interface DelegationAnalysisResult {
    delegation: DelegationResult;
    jobId: string;
}
export interface DelegationRequest {
    operation: string;
    description: string;
    context: DelegationContext;
    sessionId?: string;
    priority?: "high" | "medium" | "low";
    forceMultiAgent?: boolean;
    requiredAgents?: string[];
    mentionAgent?: string;
}
export interface DelegationResult {
    strategy: "single-agent" | "multi-agent" | "orchestrator-led";
    agents: string[];
    complexity: ComplexityScore;
    metrics: ComplexityMetrics;
    estimatedDuration: number;
    conflictResolution?: "majority_vote" | "expert_priority" | "consensus";
}
export interface AgentCapability {
    name: string;
    expertise: string[];
    capacity: number;
    performance: number;
    specialties: string[];
}
export interface DelegationMetrics {
    totalDelegations: number;
    successfulDelegations: number;
    failedDelegations: number;
    averageComplexity: number;
    averageDuration: number;
    strategyUsage: Record<string, number>;
}
export declare class AgentDelegator {
    private complexityAnalyzer;
    private stateManager;
    private agentCapabilities;
    private delegationMetrics;
    constructor(stateManager: StringRayStateManager);
    /**
     * Consult the enforcer for complexity analysis and orchestration decisions
     * The enforcer is the central decision-maker for system complexity and orchestration strategy
     *
     * NOTE: Since agents are configuration objects (not classes), the enforcer's decision logic
     * is implemented here in the delegation system. This represents the enforcer's complexity
     * analysis and orchestration strategy as defined by the enforcer agent configuration.
     */
    private consultEnforcerForComplexity;
    /**
     * Unified entry point for all agent requests - ensures consistent complexity analysis
     * Standardizes all entry points (@enforcer, task(), call_omo_agent()) to use same analysis
     */
    analyzeComplexity(request: any): Promise<{
        strategy: "single-agent" | "multi-agent" | "orchestrator-led";
        complexity: ComplexityScore;
        metrics: ComplexityMetrics;
        delegation: DelegationResult;
    }>;
    /**
      * Analyze request and determine optimal delegation strategy
      * Delegates complexity analysis and orchestration decisions to the enforcer
      */
    analyzeDelegation(request: DelegationRequest): Promise<DelegationResult>;
    /**
     * Execute delegation with monitoring and error handling
     */
    executeDelegation(delegation: DelegationResult, request: DelegationRequest): Promise<any>;
    /**
     * Get delegation performance metrics
     */
    getPerformanceMetrics(): {
        totalDelegations: number;
        averageResponseTime: number;
    };
    /**
     * Get delegation performance metrics
     */
    getDelegationMetrics(): DelegationMetrics;
    /**
     * Update agent capabilities based on performance
     */
    updateAgentCapability(agentName: string, performance: Partial<AgentCapability>): void;
    /**
     * Handle file creation events - delegate to appropriate agents
     */
    handleFileCreation(filePath: string, content?: string): Promise<void>;
    /**
     * Handle file modification events
     */
    handleFileModification(filePath: string, changes: FileChanges): Promise<void>;
    /**
     * Determine if test architect should be consulted
     */
    private shouldConsultTestArchitect;
    /**
     * Determine if code reviewer should be consulted
     */
    private shouldConsultCodeReviewer;
    /**
     * Determine if security auditor should be consulted
     */
    private shouldConsultSecurityAuditor;
    /**
     * Determine if architect should be consulted
     */
    private shouldConsultArchitect;
    /**
     * Determine if bug triage should be consulted
     */
    private shouldConsultBugTriage;
    /**
     * Determine if refactorer should be consulted
     */
    private shouldConsultRefactorer;
    /**
     * Delegate to test architect for new file analysis
     */
    private delegateToTestArchitect;
    /**
     * Delegate to code reviewer
     */
    private delegateToCodeReviewer;
    /**
     * Delegate to security auditor
     */
    private delegateToSecurityAuditor;
    /**
     * Delegate to architect
     */
    private delegateToArchitect;
    /**
     * Delegate to bug triage
     */
    private delegateToBugTriage;
    /**
     * Delegate to refactorer
     */
    private delegateToRefactorer;
    /**
     * Get file type from path
     */
    private getFileType;
    /**
     * Analyze file complexity
     */
    private analyzeFileComplexity;
    /**
     * Get available agents and their current status
     */
    getAvailableAgents(): AgentCapability[];
    private initializeAgentCapabilities;
    private selectAgents;
    private selectSingleAgent;
    private selectMultiAgent;
    private selectOrchestratorLed;
    private determineConflictResolution;
    private isAgentAvailable;
    private executeSingleAgent;
    private executeMultiAgent;
    /**
     * Determine action type for librarian consultation
     */
    private determineActionType;
    /**
     * Determine action scope for librarian consultation
     */
    private determineActionScope;
    /**
     * Consult architect for approval on major framework changes
     */
    private consultArchitectForApproval;
    private resolveMultiAgentConflicts;
    /**
     * Resolve conflicts by majority vote
     */
    private resolveByMajorityVote;
    /**
     * Resolve conflicts by expert priority
     */
    private resolveByExpertPriority;
    /**
     * Resolve conflicts by consensus
     */
    private resolveByConsensus;
    private executeOrchestratorLed;
    private callAgent;
    private consolidateOrchestratorResults;
    private updateDelegationMetrics;
    private recordSuccessfulDelegation;
    private recordFailedDelegation;
    private logDelegationDecision;
    /**
     * Select default multi-agent team when manual override is requested
     */
    private selectDefaultMultiAgentTeam;
    /**
     * Format task description for oh-my-opencode agent system
     */
    private formatTaskForAgent;
    /**
     * Invoke agent through oh-my-opencode system
     */
    private invokeOhMyOpenCodeAgent;
    /**
     * Get agent from oh-my-opencode system
     */
    private getOhMyOpenCodeAgent;
    /**
     * Simulate agent execution (fallback when oh-my-opencode integration fails)
     */
    private simulateAgentExecution;
    /**
     * Simulate agent execution time based on agent type
     */
    private simulateAgentExecutionTime;
    /**
     * Parse @mention from text input
     */
    parseMention(text: string): {
        agentName?: string;
        cleanText: string;
    };
}
export declare const createAgentDelegator: (stateManager: StringRayStateManager) => AgentDelegator;
//# sourceMappingURL=agent-delegator.d.ts.map