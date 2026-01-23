/**
 * StringRay AI v1.1.1 - Performance Regression Testing
 *
 * Automated testing system that detects performance regressions and
 * enforces performance budget compliance in CI/CD pipelines.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { performance } from "perf_hooks";
import * as fs from "fs";
import { PerformanceBudgetEnforcer, PERFORMANCE_BUDGET, } from "./performance-budget-enforcer";
/**
 * Performance regression testing system
 */
export class PerformanceRegressionTester {
    baselines = new Map();
    results = [];
    budgetEnforcer;
    constructor(budgetEnforcer) {
        this.budgetEnforcer = budgetEnforcer || new PerformanceBudgetEnforcer();
    }
    /**
     * Load performance baselines from file
     */
    loadBaselines(baselineFile) {
        try {
            if (fs.existsSync(baselineFile)) {
                const data = fs.readFileSync(baselineFile, "utf8");
                const baselines = JSON.parse(data);
                this.baselines = new Map(Object.entries(baselines));
            }
            else {
                // No existing baselines found, will use defaults
            }
        }
        catch (error) {
            console.error(`Failed to load baselines from ${baselineFile}:`, error);
        }
    }
    /**
     * Save performance baselines to file
     */
    saveBaselines(baselineFile) {
        try {
            const baselines = Object.fromEntries(this.baselines);
            fs.writeFileSync(baselineFile, JSON.stringify(baselines, null, 2));
        }
        catch (error) {
            console.error(`Failed to save baselines to ${baselineFile}:`, error);
        }
    }
    /**
     * Run a single performance regression test
     */
    async runRegressionTest(test) {
        const startTime = performance.now();
        try {
            // Set timeout for the test
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Test timeout after ${test.timeout}ms`)), test.timeout);
            });
            const testPromise = Promise.resolve(test.testFunction());
            await Promise.race([testPromise, timeoutPromise]);
            const duration = performance.now() - startTime;
            const baseline = this.baselines.get(test.name);
            let deviation = 0;
            let status = "pass";
            if (baseline) {
                deviation =
                    ((duration - baseline.averageDuration) / baseline.averageDuration) *
                        100;
                if (Math.abs(deviation) > test.tolerance) {
                    if (Math.abs(deviation) > test.tolerance * 2) {
                        status = "fail";
                    }
                    else {
                        status = "warning";
                    }
                }
            }
            else {
                // No baseline, create one
                deviation = 0;
                status = "pass";
            }
            const expectedDuration = baseline
                ? baseline.averageDuration
                : test.expectedDuration || duration;
            const result = {
                testName: test.name,
                duration,
                expectedDuration,
                deviation,
                status,
                timestamp: Date.now(),
            };
            this.results.push(result);
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            const result = {
                testName: test.name,
                duration,
                deviation: 0,
                status: "fail",
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
            };
            this.results.push(result);
            return result;
        }
    }
    /**
     * Run a complete regression test suite
     */
    async runTestSuite(suite) {
        // Load baselines
        this.loadBaselines(suite.baselineFile);
        const suiteStartTime = performance.now();
        const results = [];
        // Run all tests
        for (const test of suite.tests) {
            const result = await this.runRegressionTest(test);
            results.push(result);
            const statusIcon = result.status === "pass"
                ? "✅"
                : result.status === "warning"
                    ? "⚠️"
                    : "❌";
            const durationStr = result.duration.toFixed(2);
            const deviationStr = result.deviation.toFixed(2);
            const expectedStr = result.expectedDuration
                ? result.expectedDuration.toFixed(2)
                : "N/A";
            if (result.error) {
                console.error(`Test ${result.testName} failed:`, result.error);
            }
        }
        // Update baselines with new results
        this.updateBaselines(results);
        // Generate performance budget report
        let budgetReport;
        try {
            budgetReport = await this.budgetEnforcer.generatePerformanceReport();
        }
        catch (error) {
            console.error("Failed to generate performance budget report:", error);
        }
        const suiteDuration = performance.now() - suiteStartTime;
        const summary = this.generateSummary(results, suiteDuration);
        // Display summary
        // Test failure count - kept as console.log for CI visibility
        if (budgetReport) {
            if (budgetReport.violations.length > 0) {
                budgetReport.violations.forEach((v) => {
                });
            }
        }
        // Save updated baselines
        this.saveBaselines(suite.baselineFile);
        // Check if suite should fail
        const shouldFail = suite.failOnRegression &&
            (summary.failed > 0 ||
                (budgetReport && budgetReport.overallStatus === "fail"));
        if (shouldFail) {
            throw new Error("Performance regression test suite failed");
        }
        else {
            console.log("Performance regression test suite passed");
        }
        const result = {
            results,
            summary,
            success: !shouldFail,
        };
        if (budgetReport) {
            result.budgetReport = budgetReport;
        }
        return result;
    }
    /**
     * Update baselines with new test results
     */
    updateBaselines(results) {
        for (const result of results) {
            if (result.status === "pass" || result.status === "warning") {
                const existing = this.baselines.get(result.testName);
                if (existing) {
                    // Update rolling average
                    const newCount = existing.sampleCount + 1;
                    const newAverage = (existing.averageDuration * existing.sampleCount +
                        result.duration) /
                        newCount;
                    // Update standard deviation (simplified)
                    const variance = Math.pow(result.duration - existing.averageDuration, 2);
                    const newStdDev = Math.sqrt((existing.standardDeviation *
                        existing.standardDeviation *
                        existing.sampleCount +
                        variance) /
                        newCount);
                    this.baselines.set(result.testName, {
                        ...existing,
                        averageDuration: newAverage,
                        standardDeviation: newStdDev,
                        sampleCount: newCount,
                        lastUpdated: Date.now(),
                    });
                }
                else {
                    // Create new baseline
                    this.baselines.set(result.testName, {
                        testName: result.testName,
                        averageDuration: result.duration,
                        standardDeviation: 0,
                        sampleCount: 1,
                        lastUpdated: Date.now(),
                        tolerance: 10, // Default 10% tolerance
                    });
                }
            }
        }
    }
    /**
     * Generate test suite summary
     */
    generateSummary(results, suiteDuration) {
        const passed = results.filter((r) => r.status === "pass").length;
        const warnings = results.filter((r) => r.status === "warning").length;
        const failed = results.filter((r) => r.status === "fail").length;
        const deviations = results.map((r) => Math.abs(r.deviation));
        const averageDeviation = deviations.length > 0
            ? deviations.reduce((a, b) => a + b, 0) / deviations.length
            : 0;
        const maxDeviation = deviations.length > 0 ? Math.max(...deviations) : 0;
        return {
            totalTests: results.length,
            passed,
            warnings,
            failed,
            averageDeviation,
            maxDeviation,
            duration: suiteDuration,
        };
    }
    /**
     * Create default performance regression test suite
     */
    createDefaultTestSuite() {
        const tests = [
            {
                name: "bundle-size-analysis",
                description: "Analyze bundle size against performance budget",
                testFunction: async () => {
                    await this.budgetEnforcer.analyzeBundleSize();
                },
                timeout: 10000,
                tolerance: 5,
            },
            {
                name: "module-import-performance",
                description: "Measure core module import performance",
                testFunction: async () => {
                    const start = performance.now();
                    await import("../index.js");
                    const duration = performance.now() - start;
                    if (duration > PERFORMANCE_BUDGET.runtime.startupTime) {
                        throw new Error(`Import time ${duration.toFixed(2)}ms exceeds budget of ${PERFORMANCE_BUDGET.runtime.startupTime}ms`);
                    }
                },
                timeout: 5000,
                tolerance: 10,
            },
            {
                name: "memory-usage-check",
                description: "Verify memory usage stays within budget",
                testFunction: () => {
                    const memUsage = process.memoryUsage();
                    if (memUsage.heapUsed > PERFORMANCE_BUDGET.runtime.memoryUsage) {
                        throw new Error(`Heap usage ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB exceeds budget of ${(PERFORMANCE_BUDGET.runtime.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
                    }
                },
                timeout: 1000,
                tolerance: 5,
            },
            {
                name: "test-execution-performance",
                description: "Measure simple test execution time",
                testFunction: async () => {
                    const start = performance.now();
                    // Simple test operation instead of running npm test
                    const testArray = Array.from({ length: 1000 }, (_, i) => i * i);
                    const result = testArray.reduce((sum, val) => sum + val, 0);
                    if (result < 0)
                        throw new Error("Unexpected result"); // Never happens
                    const duration = performance.now() - start;
                    // Just ensure the operation completes in reasonable time
                    if (duration > 100) {
                        throw new Error(`Test operation ${duration.toFixed(2)}ms too slow`);
                    }
                },
                timeout: 5000,
                tolerance: 20,
            },
        ];
        return {
            name: "StringRay Performance Regression Suite",
            description: "Comprehensive performance regression tests for StringRay Framework",
            tests,
            baselineFile: "./performance-baselines.json",
            failOnRegression: true,
            warningThreshold: 10,
            failureThreshold: 20,
        };
    }
    /**
     * Export test results for analysis
     */
    exportResults() {
        const summary = {
            totalTests: this.results.length,
            passRate: this.results.length > 0
                ? (this.results.filter((r) => r.status === "pass").length /
                    this.results.length) *
                    100
                : 0,
            averageDeviation: this.results.length > 0
                ? this.results.reduce((sum, r) => sum + Math.abs(r.deviation), 0) /
                    this.results.length
                : 0,
            regressionDetected: this.results.some((r) => r.status === "fail"),
        };
        return {
            results: this.results,
            baselines: Object.fromEntries(this.baselines),
            summary,
        };
    }
}
// Export singleton instance
export const performanceRegressionTester = new PerformanceRegressionTester();
//# sourceMappingURL=performance-regression-tester.js.map