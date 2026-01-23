/**
 * StringRay AI v1.1.1 - Performance Regression Testing
 *
 * Automated testing system that detects performance regressions and
 * enforces performance budget compliance in CI/CD pipelines.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { PerformanceBudgetEnforcer, PerformanceReport } from "./performance-budget-enforcer";
export interface PerformanceRegressionTest {
    name: string;
    description: string;
    testFunction: () => Promise<void> | void;
    timeout: number;
    expectedDuration?: number;
    tolerance: number;
}
export interface RegressionTestResult {
    testName: string;
    duration: number;
    expectedDuration?: number;
    deviation: number;
    status: "pass" | "warning" | "fail";
    error?: string;
    timestamp: number;
}
export interface PerformanceBaseline {
    testName: string;
    averageDuration: number;
    standardDeviation: number;
    sampleCount: number;
    lastUpdated: number;
    tolerance: number;
}
export interface RegressionTestSuite {
    name: string;
    description: string;
    tests: PerformanceRegressionTest[];
    baselineFile: string;
    failOnRegression: boolean;
    warningThreshold: number;
    failureThreshold: number;
}
/**
 * Performance regression testing system
 */
export declare class PerformanceRegressionTester {
    private baselines;
    private results;
    private budgetEnforcer;
    constructor(budgetEnforcer?: PerformanceBudgetEnforcer);
    /**
     * Load performance baselines from file
     */
    loadBaselines(baselineFile: string): void;
    /**
     * Save performance baselines to file
     */
    saveBaselines(baselineFile: string): void;
    /**
     * Run a single performance regression test
     */
    runRegressionTest(test: PerformanceRegressionTest): Promise<RegressionTestResult>;
    /**
     * Run a complete regression test suite
     */
    runTestSuite(suite: RegressionTestSuite): Promise<{
        results: RegressionTestResult[];
        summary: {
            totalTests: number;
            passed: number;
            warnings: number;
            failed: number;
            averageDeviation: number;
            maxDeviation: number;
            duration: number;
        };
        budgetReport?: PerformanceReport;
        success: boolean;
    }>;
    /**
     * Update baselines with new test results
     */
    private updateBaselines;
    /**
     * Generate test suite summary
     */
    private generateSummary;
    /**
     * Create default performance regression test suite
     */
    createDefaultTestSuite(): RegressionTestSuite;
    /**
     * Export test results for analysis
     */
    exportResults(): {
        results: RegressionTestResult[];
        baselines: Record<string, PerformanceBaseline>;
        summary: {
            totalTests: number;
            passRate: number;
            averageDeviation: number;
            regressionDetected: boolean;
        };
    };
}
export declare const performanceRegressionTester: PerformanceRegressionTester;
//# sourceMappingURL=performance-regression-tester.d.ts.map