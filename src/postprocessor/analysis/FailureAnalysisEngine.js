/**
 * Failure Analysis Engine for Post-Processor
 */
import { frameworkLogger } from "../../framework-logger";
export class FailureAnalysisEngine {
    constructor() {
        // Initialize analysis patterns and rules
        this.initializeAnalysisPatterns();
    }
    /**
     * Analyze CI/CD failure and determine root cause
     */
    async analyzeFailure(monitoringResult) {
        const jobId = `failure-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await frameworkLogger.log('-failure-analysis-engine', '-analyzing-ci-cd-failure-', 'info', { message: "🔍 Analyzing CI/CD failure..." });
        // Determine failure category
        const category = this.classifyFailure(monitoringResult);
        // Assess confidence and severity
        const severity = this.assessSeverity(monitoringResult);
        const confidence = this.calculateConfidence(monitoringResult, category);
        // Determine root cause
        const rootCause = await this.determineRootCause(monitoringResult, category);
        // Generate recommended actions
        const recommendedActions = this.generateRecommendedActions(category, rootCause);
        // Suggest potential fixes
        const suggestedFixes = this.generateSuggestedFixes(category, rootCause);
        return {
            category,
            severity,
            confidence,
            rootCause,
            recommendedActions,
            suggestedFixes,
        };
    }
    /**
     * Classify the type of failure based on monitoring results
     */
    classifyFailure(monitoringResult) {
        // Check CI status first
        if (monitoringResult.ciStatus?.status === "failure") {
            const failedJobs = monitoringResult.ciStatus.failedJobs || [];
            // Analyze failed job names for patterns
            if (failedJobs.some((job) => job.includes("test"))) {
                return "test-failure";
            }
            if (failedJobs.some((job) => job.includes("lint"))) {
                return "code-quality-failure";
            }
            if (failedJobs.some((job) => job.includes("build"))) {
                return "build-failure";
            }
            if (failedJobs.some((job) => job.includes("security"))) {
                return "security-failure";
            }
            return "ci-pipeline-failure";
        }
        // Check performance issues
        if (monitoringResult.performanceStatus?.status === "failed") {
            return "performance-regression";
        }
        // Check security issues
        if (monitoringResult.securityStatus?.status === "failed") {
            return "security-vulnerability";
        }
        return "unknown-failure";
    }
    /**
     * Assess the severity of the failure
     */
    assessSeverity(monitoringResult) {
        const failedJobs = monitoringResult.failedJobs || [];
        // Critical failures
        if (failedJobs.some((job) => job.includes("security") || job.includes("build"))) {
            return "critical";
        }
        // High severity
        if (failedJobs.some((job) => job.includes("test") && failedJobs.length > 2)) {
            return "high";
        }
        // Medium severity
        if (failedJobs.some((job) => job.includes("performance") || job.includes("e2e"))) {
            return "medium";
        }
        // Low severity (minor issues)
        return "low";
    }
    /**
     * Calculate confidence in the analysis
     */
    calculateConfidence(monitoringResult, category) {
        let confidence = 0.5; // Base confidence
        // Increase confidence based on clear failure patterns
        if (monitoringResult.ciStatus?.failedJobs?.length === 1) {
            confidence += 0.2; // Single clear failure
        }
        // Increase for specific error patterns
        if (category === "test-failure" || category === "build-failure") {
            confidence += 0.2;
        }
        // Decrease for complex multi-job failures
        if ((monitoringResult.failedJobs?.length || 0) > 3) {
            confidence -= 0.1;
        }
        return Math.max(0.1, Math.min(1.0, confidence));
    }
    /**
     * Determine the root cause of the failure
     */
    async determineRootCause(monitoringResult, category) {
        switch (category) {
            case "test-failure":
                return "Unit, integration, or end-to-end tests are failing due to code changes";
            case "build-failure":
                return "TypeScript compilation, bundling, or build process failed";
            case "code-quality-failure":
                return "ESLint, Prettier, or code quality checks failed";
            case "security-failure":
                return "Security vulnerability scan detected issues in dependencies or code";
            case "performance-regression":
                return "Performance tests detected regression in speed or resource usage";
            case "ci-pipeline-failure":
                return "CI/CD pipeline configuration or infrastructure issue";
            default:
                return "Unknown failure cause - requires manual investigation";
        }
    }
    /**
     * Generate recommended actions for the failure
     */
    generateRecommendedActions(category, rootCause) {
        const actions = [];
        // Category-specific actions
        switch (category) {
            case "test-failure":
                actions.push("Run tests locally: npm test");
                actions.push("Check test output for specific failing assertions");
                actions.push("Review recent code changes that might affect tests");
                actions.push("Check for flaky tests that need to be skipped or fixed");
                break;
            case "build-failure":
                actions.push("Run build locally: npm run build");
                actions.push("Check TypeScript compilation errors");
                actions.push("Verify all dependencies are properly installed");
                actions.push("Check for missing type definitions");
                break;
            case "code-quality-failure":
                actions.push("Run lint locally: npm run lint");
                actions.push("Fix ESLint errors and warnings");
                actions.push("Run formatter: npm run lint:fix");
                break;
            case "security-failure":
                actions.push("Run security audit: npm run security-audit");
                actions.push("Review npm audit output for vulnerable packages");
                actions.push("Update dependencies: npm audit fix");
                actions.push("Check for security advisories in package.json");
                break;
            case "performance-regression":
                actions.push("Run performance tests: npm run test:performance");
                actions.push("Review performance baselines and regressions");
                actions.push("Optimize code for better performance");
                actions.push("Update performance expectations if changes are acceptable");
                break;
            default:
                actions.push("Review CI/CD pipeline logs for detailed error information");
                actions.push("Check recent commits for problematic changes");
                actions.push("Verify CI/CD configuration and environment");
                break;
        }
        // Common actions
        actions.push("Check CI/CD pipeline logs on GitHub Actions");
        actions.push("Reproduce issue locally before pushing fixes");
        actions.push("Consider reverting recent changes if issue persists");
        return actions;
    }
    /**
     * Generate suggested fixes for the failure
     */
    generateSuggestedFixes(category, rootCause) {
        const fixes = [];
        switch (category) {
            case "test-failure":
                fixes.push({
                    type: "dependency-update",
                    confidence: 0.7,
                    description: "Update test dependencies that might be causing issues",
                    files: ["package.json", "package-lock.json"],
                    changes: ["npm update", "npm install"],
                });
                fixes.push({
                    type: "test-regeneration",
                    confidence: 0.6,
                    description: "Skip or fix flaky tests that are failing consistently",
                    files: ["src/__tests__/**/*.test.ts"],
                    changes: ["Add describe.skip()", "Fix test assertions"],
                });
                break;
            case "build-failure":
                fixes.push({
                    type: "dependency-update",
                    confidence: 0.8,
                    description: "Install missing type definitions or update dependencies",
                    files: ["package.json"],
                    changes: ["npm install @types/package-name"],
                });
                break;
            case "code-quality-failure":
                fixes.push({
                    type: "code-fix",
                    confidence: 0.9,
                    description: "Automatically fix code formatting and style issues",
                    files: ["src/**/*.{ts,js}"],
                    changes: ["npm run lint:fix"],
                });
                break;
            case "security-failure":
                fixes.push({
                    type: "dependency-update",
                    confidence: 0.8,
                    description: "Fix security vulnerabilities in dependencies",
                    files: ["package.json", "package-lock.json"],
                    changes: ["npm audit fix", "npm audit fix --force"],
                });
                break;
            case "performance-regression":
                fixes.push({
                    type: "code-fix",
                    confidence: 0.5,
                    description: "Optimize performance-critical code sections",
                    files: ["src/**/*.ts"],
                    changes: ["Profile code performance", "Optimize algorithms"],
                });
                break;
        }
        return fixes;
    }
    /**
     * Initialize analysis patterns and rules
     */
    initializeAnalysisPatterns() {
        // Initialize patterns for failure classification
        // This could be expanded with more sophisticated pattern matching
        frameworkLogger.log("failure-analysis", "patterns-initialized", "info");
    }
}
//# sourceMappingURL=FailureAnalysisEngine.js.map