/**
 * Enforcer Tools - Integration layer between enforcer agent and rule enforcement system
 * Provides tools for codex compliance, rule validation, and contextual analysis enforcement
 */
import { RuleValidationContext, ValidationReport } from "./rule-enforcer";
export interface EnforcementResult {
    operation: string;
    passed: boolean;
    blocked: boolean;
    errors: string[];
    warnings: string[];
    fixes: Array<{
        type: "auto" | "manual";
        description: string;
        action?: () => Promise<void>;
    }>;
    report: ValidationReport;
}
/**
 * Rule Validation Tool - Validates operations against rule hierarchy
 */
export declare function ruleValidation(operation: string, context: RuleValidationContext): Promise<EnforcementResult>;
/**
 * Context Analysis Validation Tool - Validates contextual analysis integration
 */
export declare function contextAnalysisValidation(files: string[], operation: string): Promise<EnforcementResult>;
/**
 * Codex Enforcement Tool - Comprehensive codex compliance validation
 */
export declare function codexEnforcement(operation: string, files: string[], newCode?: string): Promise<EnforcementResult>;
/**
 * Quality Gate Check Tool - Final validation before commit/execution
 */
export declare function qualityGateCheck(operation: string, context: {
    files: string[];
    newCode?: string;
    tests?: string[];
    dependencies?: string[];
}): Promise<EnforcementResult>;
/**
 * Get comprehensive enforcement status
 */
export declare function getEnforcementStatus(): Promise<{
    rules: number;
    validations: number;
    violations: number;
    fixes: number;
    success: boolean;
}>;
/**
 * Run comprehensive pre-commit validation
 */
export declare function runPreCommitValidation(files: string[], operation?: string): Promise<EnforcementResult>;
export declare const enforcerTools: {
    ruleValidation: typeof ruleValidation;
    contextAnalysisValidation: typeof contextAnalysisValidation;
    codexEnforcement: typeof codexEnforcement;
    qualityGateCheck: typeof qualityGateCheck;
    getEnforcementStatus: typeof getEnforcementStatus;
    runPreCommitValidation: typeof runPreCommitValidation;
};
//# sourceMappingURL=enforcer-tools.d.ts.map