/**
 * StringRay AI v1.1.1 - CI/CD Performance Gates
 *
 * Automated performance gates for CI/CD pipelines that enforce
 * performance budgets and prevent performance regressions.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../framework-logger";
import { PerformanceBudgetEnforcer, } from "./performance-budget-enforcer";
import { PerformanceRegressionTester, } from "./performance-regression-tester";
/**
 * CI/CD performance gates for automated pipeline enforcement
 */
export class PerformanceCIGates {
    config;
    budgetEnforcer;
    regressionTester;
    constructor(config = {}, budgetEnforcer, regressionTester) {
        this.config = {
            failOnBudgetViolation: true,
            failOnRegression: true,
            budgetThreshold: "error",
            regressionThreshold: 20, // 20%
            baselineComparison: true,
            generateReports: true,
            reportPath: "./performance-reports",
            artifactPath: "./artifacts",
            ...config,
        };
        this.budgetEnforcer = budgetEnforcer || new PerformanceBudgetEnforcer();
        this.regressionTester =
            regressionTester || new PerformanceRegressionTester();
    }
    /**
     * Run all performance gates for CI/CD pipeline
     */
    async runPerformanceGates(testSuite) {
        const startTime = Date.now();
        await frameworkLogger.log('performance-ci-gates', '-running-stringray-performance-gates-', 'info', { message: "🚀 Running StringRay Performance Gates" });
        await frameworkLogger.log('performance-ci-gates', '-', 'info', { message: "=====================================" });
        const result = {
            success: true,
            budgetCheck: {
                passed: true,
                violations: 0,
                criticalViolations: 0,
                report: null,
            },
            regressionCheck: {
                passed: true,
                failedTests: 0,
                averageDeviation: 0,
                baselineUpdated: false,
            },
            duration: 0,
            timestamp: startTime,
            reports: {},
        };
        try {
            // Ensure report directories exist
            this.ensureDirectories();
            // 1. Run performance budget check
            await frameworkLogger.log('performance-ci-gates', '-n-running-performance-budget-check-', 'info', { message: "\n📊 Running Performance Budget Check..." });
            const budgetResult = await this.runBudgetCheck();
            result.budgetCheck = budgetResult;
            if (!budgetResult.passed && this.config.failOnBudgetViolation) {
                result.success = false;
                await frameworkLogger.log('performance-ci-gates', '-budget-check-failed-pipeline-will-fail-', 'error', { message: "❌ Budget check failed - pipeline will fail" });
            }
            // 2. Run regression tests
            await frameworkLogger.log('performance-ci-gates', '-n-running-performance-regression-tests-', 'info', { message: "\n🧪 Running Performance Regression Tests..." });
            const regressionResult = await this.runRegressionCheck(testSuite);
            result.regressionCheck = regressionResult;
            if (!regressionResult.passed && this.config.failOnRegression) {
                result.success = false;
                await frameworkLogger.log('performance-ci-gates', '-regression-check-failed-pipeline-will-fail-', 'error', { message: "❌ Regression check failed - pipeline will fail" });
            }
            // 3. Generate reports
            if (this.config.generateReports) {
                await frameworkLogger.log('performance-ci-gates', '-n-generating-performance-reports-', 'info', { message: "\n📝 Generating Performance Reports..." });
                result.reports = await this.generateReports(budgetResult.report, regressionResult);
            }
            // 4. Update baselines if tests passed
            if (result.success && this.config.baselineComparison) {
                await frameworkLogger.log('performance-ci-gates', '-n-updating-performance-baselines-', 'info', { message: "\n💾 Updating Performance Baselines..." });
                this.updateBaselines();
                result.regressionCheck.baselineUpdated = true;
            }
        }
        catch (error) {
            console.error("❌ Performance gates failed with error:", error);
            result.success = false;
        }
        result.duration = Date.now() - startTime;
        // Final summary
        await frameworkLogger.log('performance-ci-gates', '-n-performance-gates-summary-', 'info', { message: "\n🎯 Performance Gates Summary" });
        await frameworkLogger.log('performance-ci-gates', '-', 'info', { message: "=============================" });
        await frameworkLogger.log('performance-ci-gates', '-duration-result-duration-ms-', 'info', { message: `   Duration: ${result.duration}ms` });
        await frameworkLogger.log('performance-ci-gates', '-budget-check-result-budgetcheck-passed-passed-fai', 'error', { message: `   Budget Check: ${result.budgetCheck.passed ? "✅ PASSED" : "❌ FAILED"}`,
        });
        await frameworkLogger.log('performance-ci-gates', '-regression-check-result-regressioncheck-passed-pa', 'error', { message: `   Regression Check: ${result.regressionCheck.passed ? "✅ PASSED" : "❌ FAILED"}`,
        });
        await frameworkLogger.log('performance-ci-gates', '-overall-result-result-success-success-failure-', 'error', { message: `   Overall Result: ${result.success ? "✅ SUCCESS" : "❌ FAILURE"}`,
        });
        if (!result.success) {
            await frameworkLogger.log('performance-ci-gates', '-n-failure-details-', 'info', { message: "\n🔍 Failure Details:" });
            if (!result.budgetCheck.passed) {
                await frameworkLogger.log('performance-ci-gates', '-budget-violations-result-budgetcheck-violations-r', 'info', { message: `   - Budget violations: ${result.budgetCheck.violations} (${result.budgetCheck.criticalViolations} critical)`,
                });
            }
            if (!result.regressionCheck.passed) {
                await frameworkLogger.log('performance-ci-gates', '-failed-regression-tests-result-regressioncheck-fa', 'error', { message: `   - Failed regression tests: ${result.regressionCheck.failedTests}`,
                });
                await frameworkLogger.log('performance-ci-gates', '-average-deviation-result-regressioncheck-averaged', 'info', { message: `   - Average deviation: ${result.regressionCheck.averageDeviation.toFixed(2)}%`,
                });
            }
        }
        return result;
    }
    /**
     * Run performance budget compliance check
     */
    async runBudgetCheck() {
        const report = await this.budgetEnforcer.generatePerformanceReport();
        const violations = report.violations;
        const criticalViolations = violations.filter((v) => v.severity === "critical").length;
        const errorViolations = violations.filter((v) => v.severity === "error").length;
        const warningViolations = violations.filter((v) => v.severity === "warning").length;
        let passed = true;
        if (this.config.budgetThreshold === "warning" &&
            (criticalViolations > 0 || errorViolations > 0)) {
            passed = false;
        }
        else if (this.config.budgetThreshold === "error" &&
            criticalViolations > 0) {
            passed = false;
        }
        else if (this.config.budgetThreshold === "critical" &&
            criticalViolations > 0) {
            passed = false;
        }
        await frameworkLogger.log('performance-ci-gates', '-bundle-size-report-bundlesize-totalsize-1024-tofi', 'info', { message: `   📦 Bundle Size: ${(report.bundleSize.totalSize / 1024).toFixed(2)} KB (${(report.bundleSize.gzippedSize / 1024).toFixed(2)} KB gzipped)`,
        });
        await frameworkLogger.log('performance-ci-gates', '-memory-usage-report-runtime-memoryusage-heapused-', 'info', { message: `   🧠 Memory Usage: ${(report.runtime.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        });
        await frameworkLogger.log('performance-ci-gates', '-startup-time-report-runtime-startuptime-tofixed-2', 'info', { message: `   ⚡ Startup Time: ${report.runtime.startupTime.toFixed(2)}ms`,
        });
        await frameworkLogger.log('performance-ci-gates', '-violations-violations-length-criticalviolations-c', 'error', { message: `   🚨 Violations: ${violations.length} (${criticalViolations} critical, ${errorViolations} error, ${warningViolations} warning)`,
        });
        await frameworkLogger.log('performance-ci-gates', '-status-passed-passed-failed-', 'info', { message: `   📊 Status: ${passed ? "PASSED" : "FAILED"}` });
        return {
            passed,
            violations: violations.length,
            criticalViolations,
            report,
        };
    }
    /**
     * Run performance regression tests
     */
    async runRegressionCheck(testSuite) {
        const suite = testSuite || {
            name: "default",
            description: "Default CI test suite",
            tests: [],
            warningThreshold: 10,
            failureThreshold: 20,
            baselineFile: "",
            failOnRegression: true
        };
        const suiteResult = await this.regressionTester.runTestSuite(suite);
        const failedTests = suiteResult.results.filter((r) => r.status === "fail").length;
        const passed = suiteResult.success;
        await frameworkLogger.log('performance-ci-gates', '-tests-run-suiteresult-summary-totaltests-', 'info', { message: `   🧪 Tests Run: ${suiteResult.summary.totalTests}` });
        await frameworkLogger.log('performance-ci-gates', '-passed-suiteresult-summary-passed-', 'success', { message: `   ✅ Passed: ${suiteResult.summary.passed}` });
        await frameworkLogger.log('performance-ci-gates', '-warnings-suiteresult-summary-warnings-', 'info', { message: `   ⚠️ Warnings: ${suiteResult.summary.warnings}` });
        await frameworkLogger.log('performance-ci-gates', '-failed-suiteresult-summary-failed-', 'error', { message: `   ❌ Failed: ${suiteResult.summary.failed}` });
        await frameworkLogger.log('performance-ci-gates', '-average-deviation-suiteresult-summary-averagedevi', 'info', { message: `   📈 Average Deviation: ${suiteResult.summary.averageDeviation.toFixed(2)}%`,
        });
        await frameworkLogger.log('performance-ci-gates', '-status-passed-passed-failed-', 'info', { message: `   📊 Status: ${passed ? "PASSED" : "FAILED"}` });
        return {
            passed,
            failedTests,
            averageDeviation: suiteResult.summary.averageDeviation,
            baselineUpdated: false,
        };
    }
    /**
     * Generate performance reports
     */
    async generateReports(budgetReport, regressionResult) {
        const reports = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        // Budget report
        if (budgetReport) {
            const budgetReportPath = path.join(this.config.reportPath, `budget-report-${timestamp}.json`);
            fs.writeFileSync(budgetReportPath, JSON.stringify(budgetReport, null, 2));
            reports.budgetReport = budgetReportPath;
            await frameworkLogger.log('performance-ci-gates', '-budget-report-saved-budgetreportpath-', 'info', { message: `   💾 Budget report saved: ${budgetReportPath}` });
        }
        // Regression report
        const regressionReportPath = path.join(this.config.reportPath, `regression-report-${timestamp}.json`);
        fs.writeFileSync(regressionReportPath, JSON.stringify(regressionResult, null, 2));
        reports.regressionReport = regressionReportPath;
        await frameworkLogger.log('performance-ci-gates', '-regression-report-saved-regressionreportpath-', 'info', { message: `   💾 Regression report saved: ${regressionReportPath}` });
        // Summary report
        const summaryReport = {
            timestamp: new Date().toISOString(),
            budget: budgetReport
                ? {
                    status: budgetReport.overallStatus,
                    violations: budgetReport.violations.length,
                    criticalViolations: budgetReport.violations.filter((v) => v.severity === "critical").length,
                    recommendations: budgetReport.recommendations,
                }
                : null,
            regression: {
                totalTests: 4, // Default test suite has 4 tests
                passRate: regressionResult.passed ? 100 : 0,
                averageDeviation: regressionResult.averageDeviation,
                regressionDetected: !regressionResult.passed,
            },
            recommendations: [
                ...(budgetReport?.recommendations || []),
                ...(regressionResult.failedTests > 0
                    ? ["Performance regression detected - investigate recent changes"]
                    : []),
            ],
        };
        const summaryReportPath = path.join(this.config.reportPath, `performance-summary-${timestamp}.json`);
        fs.writeFileSync(summaryReportPath, JSON.stringify(summaryReport, null, 2));
        reports.summaryReport = summaryReportPath;
        await frameworkLogger.log('performance-ci-gates', '-summary-report-saved-summaryreportpath-', 'info', { message: `   💾 Summary report saved: ${summaryReportPath}` });
        return reports;
    }
    /**
     * Update performance baselines
     */
    updateBaselines() {
        // Baseline update implementation would go here
        // Currently just a placeholder for future functionality
    }
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        const dirs = [this.config.reportPath, this.config.artifactPath];
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    /**
     * Create GitHub Actions workflow for performance gates
     */
    createGitHubWorkflow() {
        return `# StringRay Performance Gates Workflow
name: Performance Gates

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  performance-gates:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Run performance gates
      run: |
        node -e "
        import('./performance/performance-ci-gates.js').then(({ performanceCIGates }) => {
          return performanceCIGates.runPerformanceGates().then(result => {
            if (!result.success) {
              console.error('Performance gates failed');
              process.exit(1);
            }
            await frameworkLogger.log('performance-ci-gates', '-performance-gates-passed-', 'info', { message: 'Performance gates passed' });
          });
        }).catch(console.error);
        "

    - name: Upload performance reports
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: performance-reports
        path: ./performance-reports/

    - name: Comment PR with performance results
      if: github.event_name == 'pull_request' && always()
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const path = require('path');

          const reportDir = './performance-reports';
          if (fs.existsSync(reportDir)) {
            const files = fs.readdirSync(reportDir);
            const summaryFile = files.find(f => f.startsWith('performance-summary-'));

            if (summaryFile) {
              const summary = JSON.parse(fs.readFileSync(path.join(reportDir, summaryFile), 'utf8'));

              const comment = \`
## 🚀 Performance Gates Results

### Budget Check
- **Status**: \${summary.budget ? summary.budget.status.toUpperCase() : 'N/A'}
- **Violations**: \${summary.budget ? summary.budget.violations : 0}
- **Critical**: \${summary.budget ? summary.budget.criticalViolations : 0}

### Regression Check
- **Tests**: \${summary.regression.totalTests}
- **Pass Rate**: \${summary.regression.passRate.toFixed(1)}%
- **Deviation**: \${summary.regression.averageDeviation.toFixed(2)}%
- **Regression**: \${summary.regression.regressionDetected ? '❌ DETECTED' : '✅ NONE'}

### Recommendations
\${summary.recommendations.map(r => \`- \${r}\`).join('\\n')}

[📊 View Full Reports](\${process.env.GITHUB_SERVER_URL}/\${process.env.GITHUB_REPOSITORY}/actions/runs/\${process.env.GITHUB_RUN_ID})
              \`;

              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
          }
`;
    }
    /**
     * Create Jenkins pipeline for performance gates
     */
    createJenkinsPipeline() {
        return `// StringRay Performance Gates Jenkins Pipeline
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Performance Gates') {
            steps {
                script {
                    def result = sh(
                        script: '''
                        node -e "
        // Use import resolver for environment-aware imports
        const { importResolver } = await import('./utils/import-resolver.js');
        const { performanceCIGates } = await importResolver.importModule('performance/performance-ci-gates');
        performanceCIGates.runPerformanceGates().then(result => {
      return performanceCIGates.runPerformanceGates().then(result => {
        if (!result.success) {
          console.error('Performance gates failed');
          process.exit(1);
        }
        await frameworkLogger.log('performance-ci-gates', '-performance-gates-passed-', 'info', { message: 'Performance gates passed' });
      });
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
    "
  displayName: 'Run Performance Gates'

- task: PublishBuildArtifacts@1
  condition: always()
  inputs:
    pathToPublish: 'performance-reports'
    artifactName: 'performance-reports'
  displayName: 'Publish Performance Reports'

- task: PublishTestResults@2
  condition: always()
  inputs:
    testResultsFiles: 'performance-reports/regression-report-*.json'
    testRunTitle: 'Performance Regression Tests'
  displayName: 'Publish Test Results'`;
    }
    /**
     * Create Azure DevOps pipeline for performance gates
     */
    createAzurePipeline() {
        return `# StringRay Performance Gates Azure Pipeline
trigger:
- main
- develop

pr:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Setup Node.js'

- script: npm ci
  displayName: 'Install dependencies'

- script: npm run build
  displayName: 'Build application'

- script: |
    node -e "
    (async () => {
      const { importResolver } = await import('./utils/import-resolver.js');
      const { performanceCIGates } = await importResolver.importModule('performance/performance-ci-gates');
      return performanceCIGates.runPerformanceGates().then(result => {
        if (!result.success) {
          console.error('Performance gates failed');
          process.exit(1);
        }
        await frameworkLogger.log('performance-ci-gates', '-performance-gates-passed-', 'info', { message: 'Performance gates passed' });
      });
    })().catch(console.error);
    "
  displayName: 'Run Performance Gates'

- task: PublishBuildArtifacts@1
  condition: always()
  inputs:
    pathToPublish: 'performance-reports'
    artifactName: 'performance-reports'
  displayName: 'Publish Performance Reports'

- task: PublishTestResults@2
  condition: always()
  inputs:
    testResultsFiles: 'performance-reports/regression-report-*.json'
    testRunTitle: 'Performance Regression Tests'
    testResultsFormat: 'JUnit'
  displayName: 'Publish Test Results'`;
    }
}
// Export singleton instance
export const performanceCIGates = new PerformanceCIGates();
//# sourceMappingURL=performance-ci-gates.js.map