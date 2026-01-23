/**
 * Universal Librarian Consultation System
 * Ensures librarian is involved in all major system actions for documentation and versioning
 */
import { RuleEnforcer } from "./enforcement/rule-enforcer";
export interface SystemAction {
    type: "code-change" | "rule-modification" | "architectural-change" | "configuration-update" | "documentation-update";
    description: string;
    scope: "framework" | "agent" | "tool" | "configuration" | "documentation";
    complexity: "low" | "medium" | "high" | "critical";
    files?: string[];
    components?: string[];
}
export interface LibrarianConsultationResult {
    approved: boolean;
    documentationImpact: "none" | "minor" | "major" | "critical";
    versionUpdates: VersionUpdate[];
    recommendations: string[];
    pairProgrammingRequired: boolean;
}
export interface VersionUpdate {
    file: string;
    field: string;
    oldVersion: string;
    newVersion: string;
    reason: string;
}
export declare class UniversalLibrarianConsultation {
    private ruleEnforcer;
    constructor(ruleEnforcer: RuleEnforcer);
    /**
     * Pre-action consultation - must be called before any major system action
     */
    consultBeforeAction(action: SystemAction): Promise<LibrarianConsultationResult>;
    /**
     * Post-action consultation - must be called after any major system action
     */
    consultAfterAction(action: SystemAction, result: any): Promise<void>;
    /**
     * Assess documentation impact of the action
     */
    private assessDocumentationImpact;
    /**
     * Determine what version updates are needed
     */
    private determineVersionUpdates;
    /**
     * Check if pair programming with librarian is required
     */
    private requiresPairProgramming;
    /**
     * Generate recommendations for the action
     */
    private generateRecommendations;
    /**
     * Update documentation after action completion
     */
    private updateDocumentation;
    /**
     * Update versions after action completion
     */
    private updateVersions;
    /**
     * Validate documentation integrity
     */
    private validateDocumentationIntegrity;
    /**
     * Determine which documentation files need updating
     */
    private determineDocumentationFiles;
}
export declare const universalLibrarianConsultation: UniversalLibrarianConsultation;
//# sourceMappingURL=universal-librarian-consultation.d.ts.map