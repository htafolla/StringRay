/**
 * Rule Enforcement System for StringRay Framework
 * Enforces development rules and validates component creation
 */
export interface RuleDefinition {
    id: string;
    name: string;
    description: string;
    category: "code-quality" | "architecture" | "performance" | "security" | "testing" | "reporting";
    severity: "error" | "warning" | "info" | "blocking" | "high";
    validator: (context: RuleValidationContext) => Promise<RuleValidationResult>;
    enabled: boolean;
}
export interface RuleValidationContext {
    operation: string;
    files?: string[];
    component?: string;
    existingCode?: Map<string, string>;
    newCode?: string;
    dependencies?: string[];
    tests?: string[];
}
export interface RuleValidationResult {
    passed: boolean;
    message: string;
    suggestions?: string[];
    fixes?: RuleFix[];
}
export interface ValidationReport {
    operation: string;
    passed: boolean;
    errors: string[];
    warnings: string[];
    results: RuleValidationResult[];
    timestamp: Date;
}
export interface ViolationFix {
    ruleId: string;
    agent: string;
    skill: string;
    context: any;
    attempted: boolean;
    success?: boolean;
    error?: string;
}
export interface RuleFix {
    type: "create-file" | "modify-file" | "add-dependency" | "run-command";
    description: string;
    filePath?: string;
    content?: string;
    command?: string;
}
export declare class RuleEnforcer {
    private rules;
    private ruleHierarchy;
    private initialized;
    constructor();
    /**
     * Load async rules in background
     */
    private loadAsyncRules;
    /**
     * Load codex terms as rules
     */
    private loadCodexRules;
    /**
     * Load agent triage rules from AGENTS.md
     */
    private loadAgentTriageRules;
    /**
     * Load processor-specific rules
     */
    private loadProcessorRules;
    /**
     * Map codex severity to rule severity
     */
    private mapCodexSeverity;
    /**
     * Create validator for codex terms
     */
    private createCodexValidator;
    /**
     * Validate triage reporting requirements
     */
    private validateTriageReporting;
    /**
     * Initialize default framework rules
     */
    private initializeRules;
    /**
     * Initialize rule hierarchy (prerequisites)
     */
    private initializeRuleHierarchy;
    /**
     * Add a rule to the enforcer
     */
    addRule(rule: RuleDefinition): void;
    /**
     * Get all loaded rules
     */
    getRules(): RuleDefinition[];
    /**
     * Get rule count
     */
    getRuleCount(): number;
    /**
     * Get rule by ID
     */
    getRule(id: string): RuleDefinition | undefined;
    /**
     * Get rule statistics
     */
    getRuleStats(): {
        totalRules: number;
        enabledRules: number;
        disabledRules: number;
        ruleCategories: Record<string, number>;
    };
    /**
     * Check if rule enforcer is fully initialized
     */
    isInitialized(): boolean;
    /**
     * Validate operation against all applicable rules
     */
    validateOperation(operation: string, context: RuleValidationContext): Promise<ValidationReport>;
    /**
     * Attempt to fix rule violations by delegating to appropriate agents/skills
     * This method is the central governance point for all violation remediation
     */
    attemptRuleViolationFixes(violations: any[], context: RuleValidationContext): Promise<ViolationFix[]>;
    /**
     * Get the appropriate agent/skill for a rule violation
     * Central governance mapping for all codex compliance actions
     */
    private getAgentForRule;
    /**
     * Get the appropriate tool name for a skill
     */
    private getToolForSkill;
    /**
     * Validate operation against all applicable rules
     */
    private getApplicableRules;
    /**
     * Check if a rule is applicable to the current operation
     */
    private isRuleApplicable;
    /**
     * Validate no duplicate code creation
     */
    private validateNoDuplicateCode;
    /**
     * Validate tests are required
     */
    private validateTestsRequired;
    /**
     * Validate context analysis integration
     */
    private validateContextAnalysisIntegration;
    /**
     * Validate memory optimization
     */
    private validateMemoryOptimization;
    /**
     * Validate dependency management
     */
    private validateDependencyManagement;
    /**
     * Validate input validation requirements
     */
    private validateInputValidation;
    /**
     * Extract function body for validation analysis
     */
    private extractFunctionBody;
    /**
     * Validate comprehensive documentation requirements (Codex Term #46)
     * Enforces universal librarian consultation and comprehensive documentation
     */
    private validateDocumentationRequired;
    /**
     * Validate no over-engineering (Codex Term #3)
     * Prevents unnecessary complexity and abstractions
     */
    private validateNoOverEngineering;
    /**
     * Calculate maximum nesting depth in code
     */
    private calculateMaxNesting;
    /**
     * Validate import consistency (Codex Term #46)
     * Ensures imports work in both development and production environments
     */
    private validateImportConsistency;
    /**
     * CRITICAL FIX: Module System Consistency (Codex Term #47)
     * Enforces ES module consistency and prevents CommonJS/ES module mixing
     */
    private validateModuleSystemConsistency;
    /**
     * Validate state management patterns (Codex Term #41 - CRITICAL)
     * Ensures proper state management throughout the application
     */
    private validateErrorResolution;
    /**
     * Validate loop safety (Codex Term #8)
     * Prevents infinite loops
     */
    private validateLoopSafety;
    /**
     * Validate state management patterns (Codex Term #41 - CRITICAL)
     * Ensures proper state management throughout the application
     */
    private validateStateManagementPatterns;
    /**
     * Validate single responsibility principle (Codex Term #24)
     */
    private validateSingleResponsibility;
    /**
     * Validate test coverage requirements (Codex Term #26)
     */
    private validateTestCoverage;
    /**
     * Validate security by design (Codex Term #29)
     */
    private validateSecurityByDesign;
    private validateContinuousIntegration;
    private validateDeploymentSafety;
    private validateCleanDebugLogs;
    private validateConsoleLogUsage;
    private validateTestFailureReporting;
    private validatePerformanceRegressionReporting;
    private validateSecurityVulnerabilityReporting;
    private validateMultiAgentEnsemble;
    private validateSubstrateExternalization;
    private validateFrameworkSelfValidation;
    private validateEmergentImprovement;
}
export declare const ruleEnforcer: RuleEnforcer;
//# sourceMappingURL=rule-enforcer.d.ts.map