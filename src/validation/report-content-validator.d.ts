/**
 * Report Content Validator
 * Reads and analyzes full report content to detect hidden errors and inconsistencies
 */
export declare class ReportContentValidator {
    private reportPatterns;
    /**
     * Validate full report content for hidden errors
     */
    validateReportContent(reportPath: string, reportType: "session" | "framework" | "validation" | "simulation"): Promise<{
        valid: boolean;
        issues: string[];
        summary: {
            errorCount: number;
            warningCount: number;
            falsePositiveCount: number;
            inconsistencyCount: number;
            riskLevel: "low" | "medium" | "high" | "critical";
        };
        details: {
            criticalErrors: string[];
            warnings: string[];
            falsePositives: string[];
            inconsistencies: string[];
        };
    }>;
    private validateReportTypeSpecific;
    private createValidationResult;
    /**
     * Get validation patterns for debugging
     */
    getValidationPatterns(): {
        criticalErrors: RegExp[];
        warnings: RegExp[];
        falsePositives: RegExp[];
        inconsistencies: RegExp[];
    };
    /**
     * Add custom validation pattern
     */
    addValidationPattern(category: keyof typeof this.reportPatterns, pattern: RegExp): void;
}
//# sourceMappingURL=report-content-validator.d.ts.map