/**
 * Auto-Fix Engine for Post-Processor
 */
import { FixResult, FailureAnalysis, PostProcessorContext } from "../types";
export declare class AutoFixEngine {
    private confidenceThreshold;
    private appliedFixes;
    constructor(confidenceThreshold?: number);
    /**
     * Attempt to automatically apply fixes for a failure
     */
    applyFixes(analysis: FailureAnalysis, context: PostProcessorContext): Promise<FixResult>;
    /**
     * Apply a single suggested fix
     */
    private applySingleFix;
    /**
     * Apply dependency updates
     */
    private applyDependencyUpdate;
    /**
     * Apply automatic code fixes
     */
    private applyCodeFix;
    /**
     * Apply test regeneration fixes
     */
    private applyTestRegeneration;
    /**
     * Validate that applied fixes resolve the issue
     */
    validateFixes(fixes: any[], originalFailure: FailureAnalysis, context: PostProcessorContext): Promise<boolean>;
    /**
     * Rollback applied fixes if validation fails
     */
    rollbackFixes(fixes: any[]): Promise<void>;
    /**
     * Get the list of applied fixes
     */
    getAppliedFixes(): AppliedFixRecord[];
}
interface AppliedFixRecord {
    type: string;
    files: string[];
    description: string;
    timestamp: Date;
    appliedChanges: string[];
}
export {};
//# sourceMappingURL=AutoFixEngine.d.ts.map