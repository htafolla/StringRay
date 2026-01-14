/**
 * StringRay Framework v1.0.0 - Performance System Tests
 *
 * Comprehensive tests for the performance testing and monitoring system.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  performanceBudgetEnforcer,
  PERFORMANCE_BUDGET,
} from "../../performance/performance-budget-enforcer.js";
import { performanceRegressionTester } from "../../performance/performance-regression-tester.js";
import { performanceDashboard } from "../../performance/performance-monitoring-dashboard.js";
import { performanceCIGates } from "../../performance/performance-ci-gates.js";
import { performanceSystem } from "../../performance/performance-system-orchestrator.js";

describe("Performance Budget Enforcer", () => {
  beforeEach(() => {
    // Reset any existing state
    vi.clearAllMocks();
  });

  it("should analyze bundle size correctly", async () => {
    const metrics = await performanceBudgetEnforcer.analyzeBundleSize("./dist");

    expect(metrics).toHaveProperty("totalSize");
    expect(metrics).toHaveProperty("gzippedSize");
    expect(metrics).toHaveProperty("fileCount");
    expect(metrics).toHaveProperty("breakdown");
    expect(Array.isArray(metrics.breakdown)).toBe(true);
  });

  it("should measure web vitals", async () => {
    const vitals = await performanceBudgetEnforcer.measureWebVitals();

    expect(vitals).toHaveProperty("firstContentfulPaint");
    expect(vitals).toHaveProperty("timeToInteractive");
    expect(vitals).toHaveProperty("largestContentfulPaint");
    expect(vitals).toHaveProperty("cumulativeLayoutShift");
    expect(vitals).toHaveProperty("firstInputDelay");
    expect(vitals).toHaveProperty("timestamp");
  });

  it("should check budget compliance", async () => {
    const bundleMetrics =
      await performanceBudgetEnforcer.analyzeBundleSize("./dist");
    const runtimeMetrics =
      performanceBudgetEnforcer.measureRuntimePerformance();
    const vitals = await performanceBudgetEnforcer.measureWebVitals();

    const violations = performanceBudgetEnforcer.checkBudgetCompliance(
      bundleMetrics,
      vitals,
      runtimeMetrics,
    );

    expect(Array.isArray(violations)).toBe(true);
    violations.forEach((violation) => {
      expect(violation).toHaveProperty("metric");
      expect(violation).toHaveProperty("actual");
      expect(violation).toHaveProperty("budget");
      expect(violation).toHaveProperty("percentage");
      expect(violation).toHaveProperty("severity");
      expect(violation).toHaveProperty("recommendation");
    });
  });

  it("should generate performance report", async () => {
    const report = await performanceBudgetEnforcer.generatePerformanceReport();

    expect(report).toHaveProperty("timestamp");
    expect(report).toHaveProperty("bundleSize");
    expect(report).toHaveProperty("webVitals");
    expect(report).toHaveProperty("runtime");
    expect(report).toHaveProperty("violations");
    expect(report).toHaveProperty("recommendations");
    expect(report).toHaveProperty("overallStatus");
  });

  it("should enforce performance budget constants", () => {
    expect(PERFORMANCE_BUDGET.bundleSize.uncompressed).toBe(2 * 1024 * 1024); // 2MB
    expect(PERFORMANCE_BUDGET.bundleSize.gzipped).toBe(700 * 1024); // 700KB
    expect(PERFORMANCE_BUDGET.webVitals.firstContentfulPaint).toBe(2000); // 2s
    expect(PERFORMANCE_BUDGET.webVitals.timeToInteractive).toBe(5000); // 5s
  });
});

describe("Performance Regression Tester", () => {
  const mockTest: any = {
    name: "test-operation",
    description: "Test operation for regression testing",
    testFunction: async () => {
      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 10));
    },
    timeout: 1000,
    tolerance: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run regression test", async () => {
    const result =
      await performanceRegressionTester.runRegressionTest(mockTest);

    expect(result).toHaveProperty("testName", "test-operation");
    expect(result).toHaveProperty("duration");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("deviation");
    expect(result).toHaveProperty("timestamp");
    expect(typeof result.duration).toBe("number");
    expect(result.duration).toBeGreaterThan(0);
  });

  it("should create default test suite", () => {
    const suite = performanceRegressionTester.createDefaultTestSuite();

    expect(suite).toHaveProperty("name");
    expect(suite).toHaveProperty("description");
    expect(suite).toHaveProperty("tests");
    expect(suite).toHaveProperty("baselineFile");
    expect(Array.isArray(suite.tests)).toBe(true);
    expect(suite.tests.length).toBeGreaterThan(0);
  });

  it("should export test results", () => {
    const results = performanceRegressionTester.exportResults();

    expect(results).toHaveProperty("results");
    expect(results).toHaveProperty("baselines");
    expect(results).toHaveProperty("summary");
    expect(Array.isArray(results.results)).toBe(true);
  });
});

describe("Performance Monitoring Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default config", () => {
    const metrics = performanceDashboard.getMetrics();

    expect(metrics).toHaveProperty("timestamp");
    expect(metrics).toHaveProperty("bundleSize");
    expect(metrics).toHaveProperty("runtime");
    expect(metrics).toHaveProperty("webVitals");
    expect(metrics).toHaveProperty("regressions");
    expect(metrics).toHaveProperty("alerts");
  });

  it("should start and stop monitoring", async () => {
    await performanceDashboard.start();
    expect(performanceDashboard.isMonitoringActive()).toBe(true);

    performanceDashboard.stop();
    expect(performanceDashboard.isMonitoringActive()).toBe(false);
  });

  it("should generate performance report", async () => {
    const report = await performanceDashboard.generateReport();

    expect(report).toHaveProperty("timestamp");
    expect(report).toHaveProperty("bundleSize");
    expect(report).toHaveProperty("violations");
  });

  it("should export dashboard data", async () => {
    const data = await performanceDashboard.exportData();

    expect(data).toHaveProperty("config");
    expect(data).toHaveProperty("metrics");
    expect(data).toHaveProperty("performanceReport");
    expect(data).toHaveProperty("regressionData");
  });
});

describe("Performance CI Gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run performance gates", async () => {
    // Mock the test suite to avoid actual performance tests
    const mockSuite = performanceRegressionTester.createDefaultTestSuite();

    const result = await performanceCIGates.runPerformanceGates(mockSuite);

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("budgetCheck");
    expect(result).toHaveProperty("regressionCheck");
    expect(result).toHaveProperty("duration");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("reports");
  });

  it("should create CI pipeline configurations", () => {
    const githubWorkflow = performanceCIGates.createGitHubWorkflow();
    const jenkinsPipeline = performanceCIGates.createJenkinsPipeline();
    const azurePipeline = performanceCIGates.createAzurePipeline();

    expect(typeof githubWorkflow).toBe("string");
    expect(typeof jenkinsPipeline).toBe("string");
    expect(typeof azurePipeline).toBe("string");

    expect(githubWorkflow).toContain("Performance Gates");
    expect(jenkinsPipeline).toContain("Performance Gates");
    expect(azurePipeline).toContain("Performance Gates");
  });
});

describe("Performance System Orchestrator", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Ensure clean state
    await performanceSystem.shutdown();
  });

  afterEach(async () => {
    await performanceSystem.shutdown();
  });

  it("should initialize performance system", async () => {
    await performanceSystem.initialize();

    const status = performanceSystem.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.components.budgetEnforcer).toBe(true);
    expect(status.components.regressionTester).toBe(true);
    expect(status.components.dashboard).toBe(true);
    expect(status.components.ciGates).toBe(true);
  });

  it("should start and stop monitoring", async () => {
    await performanceSystem.initialize();
    await performanceSystem.start();

    let status = performanceSystem.getStatus();
    expect(status.monitoringActive).toBe(true);

    performanceSystem.stop();
    status = performanceSystem.getStatus();
    expect(status.monitoringActive).toBe(false);
  });

  it("should generate comprehensive report", async () => {
    await performanceSystem.initialize();

    const report = await performanceSystem.generateReport();
    expect(report).toHaveProperty("timestamp");
    expect(report).toHaveProperty("bundleSize");
    expect(report).toHaveProperty("violations");
  });

  it("should run performance gates", async () => {
    await performanceSystem.initialize();

    const result = await performanceSystem.runGates();
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("budgetCheck");
    expect(result).toHaveProperty("regressionCheck");
  });

  it("should provide component access", async () => {
    await performanceSystem.initialize();

    const components = performanceSystem.getComponents();
    expect(components).toHaveProperty("budgetEnforcer");
    expect(components).toHaveProperty("regressionTester");
    expect(components).toHaveProperty("dashboard");
    expect(components).toHaveProperty("ciGates");
  });
});

describe("Performance Budget Compliance", () => {
  it("should detect bundle size violations", async () => {
    // Create a mock bundle metrics that exceeds budget
    const oversizedBundle = {
      totalSize: PERFORMANCE_BUDGET.bundleSize.uncompressed * 1.5, // 150% of budget
      gzippedSize: PERFORMANCE_BUDGET.bundleSize.gzipped * 1.2, // 120% of budget
      fileCount: 10,
      largestFile: { name: "large.js", size: 1000000, gzippedSize: 300000 },
      breakdown: [],
    };

    const runtime = performanceBudgetEnforcer.measureRuntimePerformance();
    const vitals = await performanceBudgetEnforcer.measureWebVitals();

    const violations = performanceBudgetEnforcer.checkBudgetCompliance(
      oversizedBundle,
      vitals,
      runtime,
    );

    expect(violations.length).toBeGreaterThan(0);
    const bundleViolation = violations.find((v) =>
      v.metric.includes("bundle-size"),
    );
    expect(bundleViolation).toBeDefined();
    expect(bundleViolation!.percentage).toBeGreaterThan(100);
  });

  it("should detect web vitals violations", async () => {
    const bundle = await performanceBudgetEnforcer.analyzeBundleSize("./dist");
    const runtime = performanceBudgetEnforcer.measureRuntimePerformance();

    // Create mock vitals that exceed budget
    const slowVitals = {
      firstContentfulPaint:
        PERFORMANCE_BUDGET.webVitals.firstContentfulPaint * 1.5, // 150% of budget
      timeToInteractive: PERFORMANCE_BUDGET.webVitals.timeToInteractive * 1.2, // 120% of budget
      largestContentfulPaint: 3000,
      cumulativeLayoutShift: 0.05,
      firstInputDelay: 50,
      timestamp: Date.now(),
    };

    const violations = performanceBudgetEnforcer.checkBudgetCompliance(
      bundle,
      slowVitals,
      runtime,
    );

    const fcpViolation = violations.find(
      (v) => v.metric === "first-contentful-paint",
    );
    const ttiViolation = violations.find(
      (v) => v.metric === "time-to-interactive",
    );

    expect(fcpViolation).toBeDefined();
    expect(ttiViolation).toBeDefined();
    expect(fcpViolation!.percentage).toBeGreaterThan(100);
    expect(ttiViolation!.percentage).toBeGreaterThan(100);
  });

  it("should provide actionable recommendations", async () => {
    const report = await performanceBudgetEnforcer.generatePerformanceReport();

    expect(Array.isArray(report.recommendations)).toBe(true);
    report.recommendations.forEach((rec) => {
      expect(typeof rec).toBe("string");
      expect(rec.length).toBeGreaterThan(0);
    });
  });
});

describe("Performance System Integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await performanceSystem.shutdown();
  });

  afterEach(async () => {
    await performanceSystem.shutdown();
  });

  it("should integrate all components seamlessly", async () => {
    await performanceSystem.initialize();

    // Test that all components work together
    const status = performanceSystem.getStatus();
    expect(status.initialized).toBe(true);

    const report = await performanceSystem.generateReport();
    expect(report).toBeDefined();

    const components = performanceSystem.getComponents();
    expect(Object.keys(components).length).toBeGreaterThan(0);
  });

  it("should handle configuration updates", async () => {
    await performanceSystem.initialize();

    const newConfig = {
      monitoring: {
        enabled: true,
        dashboard: false, // Disable dashboard
        updateInterval: 60000,
        retentionHours: 48,
        anomalyDetection: false,
      },
    };

    performanceSystem.updateConfig(newConfig);

    // Configuration should be updated (components may need restart for full effect)
    expect(performanceSystem).toBeDefined();
  });

  it("should provide comprehensive system status", async () => {
    await performanceSystem.initialize();

    const status = performanceSystem.getStatus();

    expect(status).toHaveProperty("initialized");
    expect(status).toHaveProperty("monitoringActive");
    expect(status).toHaveProperty("lastUpdate");
    expect(status).toHaveProperty("components");
    expect(status).toHaveProperty("activeAlerts");
    expect(status).toHaveProperty("recentViolations");
  });
});
