/**
 * Fix Validator for Post-Processor Auto-Fix System
 *
 * Validates applied fixes and provides rollback functionality.
 */
import { FailureAnalysis, PostProcessorContext } from "../types";
export interface AppliedFix {
    type: string;
    files: string[];
    description: string;
    timestamp: Date;
    rollbackData?: any;
}
export declare class FixValidator {
    /**
     * Validate that applied fixes resolve the original issue
     */
    validateFixes(appliedFixes: AppliedFix[], analysis: FailureAnalysis, context: PostProcessorContext): Promise<boolean>;
    /**
     * Rollback applied fixes
     */
    rollbackFixes(appliedFixes: AppliedFix[]): Promise<void>;
}
//# sourceMappingURL=FixValidator.d.ts.map