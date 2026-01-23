/**
 * StringRay AI v1.1.1 - CI/CD Performance Gates
 *
 * Automated performance gates for CI/CD pipelines that enforce
 * performance budgets and prevent performance regressions.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { PerformanceBudgetEnforcer, PerformanceReport } from "./performance-budget-enforcer";
import { PerformanceRegressionTester, RegressionTestSuite } from "./performance-regression-tester";
export interface CIGateConfig {
    failOnBudgetViolation: boolean;
    failOnRegression: boolean;
    budgetThreshold: "warning" | "error" | "critical";
    regressionThreshold: number;
    baselineComparison: boolean;
    generateReports: boolean;
    reportPath: string;
    artifactPath: string;
}
export interface CIGateResult {
    success: boolean;
    budgetCheck: {
        passed: boolean;
        violations: number;
        criticalViolations: number;
        report: PerformanceReport | null;
    };
    regressionCheck: {
        passed: boolean;
        failedTests: number;
        averageDeviation: number;
        baselineUpdated: boolean;
    };
    duration: number;
    timestamp: number;
    reports: {
        budgetReport?: string;
        regressionReport?: string;
        summaryReport?: string;
    };
}
/**
 * CI/CD performance gates for automated pipeline enforcement
 */
export declare class PerformanceCIGates {
    private config;
    private budgetEnforcer;
    private regressionTester;
    constructor(config?: Partial<CIGateConfig>, budgetEnforcer?: PerformanceBudgetEnforcer, regressionTester?: PerformanceRegressionTester);
    /**
     * Run all performance gates for CI/CD pipeline
     */
    runPerformanceGates(testSuite?: RegressionTestSuite): Promise<CIGateResult>;
    /**
     * Run performance budget compliance check
     */
    private runBudgetCheck;
    /**
     * Run performance regression tests
     */
    private runRegressionCheck;
    /**
     * Generate performance reports
     */
    private generateReports;
    /**
     * Update performance baselines
     */
    private updateBaselines;
    /**
     * Ensure required directories exist
     */
    private ensureDirectories;
    /**
     * Create GitHub Actions workflow for performance gates
     */
    createGitHubWorkflow(): string;
    /**
     * Create Jenkins pipeline for performance gates
     */
    createJenkinsPipeline(): string;
    /**
     * Create Azure DevOps pipeline for performance gates
     */
    createAzurePipeline(): string;
}
export declare const performanceCIGates: PerformanceCIGates;
//# sourceMappingURL=performance-ci-gates.d.ts.map