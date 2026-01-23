/**
 * Test Auto-Healing System for StringRay Framework
 *
 * Automatically detects slow/failing tests and orchestrates fixes using specialized agents
 * Implements intelligent test optimization and refactoring for enterprise reliability
 */
import { RuleValidationContext } from "./rule-enforcer";
export interface TestFailureAnalysis {
    testFile: string;
    failureType: "timeout" | "performance" | "logic-error" | "flaky" | "infrastructure";
    rootCause: string;
    severity: "low" | "medium" | "high" | "critical";
    estimatedFixTime: number;
    autoFixable: boolean;
    recommendedAgent: string;
    fixStrategy: TestFixStrategy;
}
export interface TestFixStrategy {
    type: "refactor" | "optimize" | "parallelize" | "mock" | "isolate" | "infrastructure";
    description: string;
    estimatedImprovement: number;
    riskLevel: "low" | "medium" | "high";
    requiresAgentCoordination: boolean;
}
export interface AutoHealingResult {
    success: boolean;
    fixesApplied: number;
    testsOptimized: number;
    performanceImprovement: number;
    agentCoordinationUsed: boolean;
    recommendations: string[];
    nextSteps: string[];
}
export declare class TestAutoHealingSystem {
    private healingHistory;
    /**
     * Main auto-healing entry point for test failures
     */
    healTestFailures(testResults: any, context: RuleValidationContext): Promise<AutoHealingResult>;
    /**
     * Analyze test failures and determine root causes
     */
    private analyzeTestFailures;
    /**
     * Apply automatic fixes for simple issues
     */
    private applyAutomaticFixes;
    /**
     * Coordinate with specialized agents for complex fixes
     */
    private coordinateAgentFixes;
    /**
     * Optimize test timeouts automatically
     */
    private optimizeTestTimeouts;
    /**
     * Implement parallel test execution
     */
    private implementParallelExecution;
    /**
     * Add mocks to speed up tests
     */
    private addTestMocks;
    /**
     * Invoke specialized agents for complex fixes
     */
    private invokeSpecializedAgent;
    /**
     * Detect flaky tests based on inconsistent results
     */
    private detectFlakyTests;
    /**
     * Prioritize issues for fixing
     */
    private prioritizeIssues;
}
export declare const testAutoHealingSystem: TestAutoHealingSystem;
//# sourceMappingURL=test-auto-healing.d.ts.map