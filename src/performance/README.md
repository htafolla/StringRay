# StringRay AI v1.0.7 - Performance Testing & Monitoring System

[![Version](https://img.shields.io/badge/version-1.0.7-blue.svg)](https://github.com/strray-framework/stringray)
[![Performance Budget](https://img.shields.io/badge/bundle-%3C2MB-brightgreen.svg)](https://github.com/strray-framework/stringray)
[![FCP](https://img.shields.io/badge/FCP-%3C2s-brightgreen.svg)](https://github.com/strray-framework/stringray)
[![TTI](https://img.shields.io/badge/TTI-%3C5s-brightgreen.svg)](https://github.com/strray-framework/stringray)

**Enterprise-grade performance testing and monitoring system that enforces Universal Development Codex performance budget requirements.**

**🚀 Key Features:**

- **Performance Budget Enforcement**: Automated bundle size, FCP, and TTI monitoring
- **Regression Testing**: Detect performance regressions with statistical analysis
- **Real-time Monitoring**: Live performance dashboard with anomaly detection
- **CI/CD Integration**: Automated performance gates for deployment pipelines
- **Comprehensive Reporting**: Detailed performance reports with actionable recommendations

---

## 📊 Performance Budget Requirements

The system enforces the Universal Development Codex performance budget:

| Metric                       | Budget                                    | Description                    |
| ---------------------------- | ----------------------------------------- | ------------------------------ |
| **Bundle Size**              | < 2MB (uncompressed)<br>< 700KB (gzipped) | Total JavaScript bundle size   |
| **First Contentful Paint**   | < 2 seconds                               | Time to first content render   |
| **Time to Interactive**      | < 5 seconds                               | Time to full interactivity     |
| **Largest Contentful Paint** | < 2.5 seconds                             | Largest content element render |
| **Cumulative Layout Shift**  | < 0.1                                     | Visual stability score         |
| **First Input Delay**        | < 100ms                                   | Input responsiveness           |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Performance System Orchestrator              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Budget      │  │ Regression │  │ Monitoring │          │
│  │ Enforcer    │  │ Tester     │  │ Dashboard  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
│  ┌─────────────┐                                            │
│  │ CI/CD Gates │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Performance Budget Enforcer** - Monitors and enforces performance budgets
2. **Performance Regression Tester** - Detects performance regressions with baselines
3. **Performance Monitoring Dashboard** - Real-time monitoring with alerts
4. **Performance CI Gates** - Automated pipeline performance validation

---

## 🚀 Quick Start

### Installation

The performance system is included with StringRay AI v1.0.7. No additional installation required.

### Basic Usage

```typescript
import { performanceSystem } from "strray/performance";

// Initialize the performance system
await performanceSystem.initialize();

// Start monitoring
await performanceSystem.start();

// Run performance gates
const result = await performanceSystem.runGates();
console.log("Performance gates passed:", result.success);

// Generate performance report
const report = await performanceSystem.generateReport();
console.log("Performance status:", report.overallStatus);
```

### CLI Commands

```bash
# Run comprehensive performance tests
npm run test:performance:comprehensive

# Start performance monitoring
npm run performance:monitor

# Generate performance report
npm run performance:report

# Run CI/CD performance gates
npm run performance:gates
```

---

## 📈 Performance Budget Enforcement

### Bundle Size Monitoring

```typescript
import { performanceBudgetEnforcer } from "strray/performance";

// Analyze bundle size
const bundleMetrics =
  await performanceBudgetEnforcer.analyzeBundleSize("./dist");
console.log(`Bundle size: ${(bundleMetrics.totalSize / 1024).toFixed(2)} KB`);
console.log(`Gzipped: ${(bundleMetrics.gzippedSize / 1024).toFixed(2)} KB`);

// Check compliance
const report = await performanceBudgetEnforcer.generatePerformanceReport();
if (report.violations.length > 0) {
  console.log("🚨 Performance violations detected:");
  report.violations.forEach((v) => {
    console.log(`  - ${v.metric}: ${v.percentage.toFixed(1)}% of budget`);
  });
}
```

### Web Vitals Monitoring

```typescript
import { performanceBudgetEnforcer } from "strray/performance";

// Measure web vitals (simulated for server-side framework)
const vitals = await performanceBudgetEnforcer.measureWebVitals();
console.log(`FCP: ${vitals.firstContentfulPaint}ms`);
console.log(`TTI: ${vitals.timeToInteractive}ms`);
console.log(`LCP: ${vitals.largestContentfulPaint}ms`);
```

---

## 🧪 Performance Regression Testing

### Creating Test Suites

```typescript
import { performanceRegressionTester } from "strray/performance";

// Create custom regression test
const customTest = {
  name: "api-response-time",
  description: "API endpoint response time",
  testFunction: async () => {
    const start = performance.now();
    await fetch("/api/data");
    const duration = performance.now() - start;
    if (duration > 500) {
      throw new Error(`API response too slow: ${duration}ms`);
    }
  },
  timeout: 5000,
  tolerance: 10, // 10% tolerance
};

// Run regression test
const result = await performanceRegressionTester.runRegressionTest(customTest);
console.log(
  `Test ${result.testName}: ${result.status} (${result.deviation.toFixed(2)}% deviation)`,
);
```

### Baseline Management

```typescript
import { performanceRegressionTester } from "strray/performance";

// Load existing baselines
performanceRegressionTester.loadBaselines("./performance-baselines.json");

// Run test suite and update baselines
const suite = performanceRegressionTester.createDefaultTestSuite();
const results = await performanceRegressionTester.runTestSuite(suite);

// Save updated baselines
performanceRegressionTester.saveBaselines("./performance-baselines.json");
```

---

## 📊 Real-time Monitoring Dashboard

### Starting the Dashboard

```typescript
import { performanceDashboard } from "strray/performance";

// Start monitoring with custom config
await performanceDashboard.start();

// Get current metrics
const metrics = performanceDashboard.getMetrics();
console.log("Active alerts:", metrics.alerts.filter((a) => !a.resolved).length);

// Listen for events
performanceDashboard.on("alert", (alert) => {
  console.log(`🚨 Alert: ${alert.message}`);
});

performanceDashboard.on("metrics-updated", (metrics) => {
  console.log(
    `📊 Bundle size: ${(metrics.bundleSize.current / 1024).toFixed(2)} KB`,
  );
});
```

### Dashboard Metrics

The dashboard provides real-time monitoring of:

- **Bundle Size**: Current size, budget compliance, trend analysis
- **Runtime Performance**: Memory usage, CPU usage, startup time
- **Web Vitals**: FCP, TTI, LCP, CLS, FID with historical tracking
- **Regression Results**: Test pass rates, average deviations
- **Alerts**: Performance violations, anomalies, and recommendations

---

## 🔒 CI/CD Integration

### Automated Performance Gates

```typescript
import { performanceCIGates } from "strray/performance";

// Run performance gates
const result = await performanceCIGates.runPerformanceGates();

if (!result.success) {
  console.error("❌ Performance gates failed");
  process.exit(1);
}

console.log("✅ Performance gates passed");
console.log(`Budget check: ${result.budgetCheck.passed ? "PASSED" : "FAILED"}`);
console.log(
  `Regression check: ${result.regressionCheck.passed ? "PASSED" : "FAILED"}`,
);
```

### CI Pipeline Integration

#### GitHub Actions

```yaml
- name: Run Performance Gates
  run: npm run performance:gates
```

#### Jenkins Pipeline

```groovy
stage('Performance Gates') {
    steps {
        sh 'npm run performance:gates'
    }
}
```

#### Azure DevOps

```yaml
- script: npm run performance:gates
  displayName: "Run Performance Gates"
```

### Custom CI Configuration

```typescript
import { performanceCIGates } from "strray/performance";

// Configure CI gates
const customGates = new PerformanceCIGates({
  failOnBudgetViolation: true,
  failOnRegression: true,
  budgetThreshold: "error", // warning | error | critical
  regressionThreshold: 15, // 15% deviation threshold
  generateReports: true,
  reportPath: "./performance-reports",
});

const result = await customGates.runPerformanceGates();
```

---

## 📋 Configuration

### System Configuration

```typescript
import { performanceSystem } from "strray/performance";

// Configure the entire performance system
const config = {
  budgetEnforcement: {
    enabled: true,
    failOnViolation: true,
    thresholds: {
      warning: 90, // 90% of budget
      error: 100, // 100% of budget
      critical: 110, // 110% of budget
    },
  },
  monitoring: {
    enabled: true,
    dashboard: true,
    updateInterval: 30000, // 30 seconds
    retentionHours: 24,
    anomalyDetection: true,
  },
  regressionTesting: {
    enabled: true,
    baselineFile: "./performance-baselines.json",
    updateBaselines: true,
    tolerance: 10, // 10% tolerance
  },
  ciGates: {
    enabled: true,
    failPipeline: true,
    generateReports: true,
    reportPath: "./performance-reports",
  },
};

const system = new PerformanceSystemOrchestrator(config);
await system.initialize();
```

### Environment Variables

```bash
# Performance monitoring
STRRAY_PERFORMANCE_ENABLED=true
STRRAY_PERFORMANCE_MONITORING_INTERVAL=30000
STRRAY_PERFORMANCE_BASELINE_FILE=./performance-baselines.json

# CI/CD integration
STRRAY_CI_FAIL_ON_BUDGET_VIOLATION=true
STRRAY_CI_FAIL_ON_REGRESSION=true
STRRAY_CI_REPORT_PATH=./performance-reports

# Budget thresholds
STRRAY_BUDGET_BUNDLE_UNCOMPRESSED=2097152  # 2MB
STRRAY_BUDGET_BUNDLE_GZIPPED=716800       # 700KB
STRRAY_BUDGET_FCP=2000                     # 2s
STRRAY_BUDGET_TTI=5000                     # 5s
```

---

## 📊 Reporting & Analytics

### Performance Reports

```typescript
import { performanceSystem } from "strray/performance";

// Generate comprehensive report
const report = await performanceSystem.generateReport();

console.log("=== Performance Report ===");
console.log(`Status: ${report.overallStatus.toUpperCase()}`);
console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
console.log(
  `Bundle Size: ${(report.bundleSize.totalSize / 1024).toFixed(2)} KB`,
);
console.log(`Violations: ${report.violations.length}`);

if (report.violations.length > 0) {
  console.log("\n🚨 Violations:");
  report.violations.forEach((v) => {
    console.log(`  - ${v.metric}: ${v.percentage.toFixed(1)}% of budget`);
    console.log(`    ${v.recommendation}`);
  });
}

if (report.recommendations.length > 0) {
  console.log("\n💡 Recommendations:");
  report.recommendations.forEach((r) => console.log(`  - ${r}`));
}
```

### Historical Analysis

```typescript
import { performanceDashboard } from "strray/performance";

// Export historical data
const data = performanceDashboard.exportData();

// Analyze trends
const bundleHistory = data.metrics.bundleSize.history;
if (bundleHistory.length > 1) {
  const recent = bundleHistory.slice(-7); // Last 7 data points
  const trend =
    recent[recent.length - 1].value > recent[0].value
      ? "increasing"
      : "decreasing";
  console.log(`Bundle size trend: ${trend}`);
}
```

---

## 🔧 Advanced Usage

### Custom Performance Tests

```typescript
import { PerformanceRegressionTest } from "strray/performance";

// Create custom performance test
const customTest: PerformanceRegressionTest = {
  name: "database-query-performance",
  description: "Database query execution time",
  testFunction: async () => {
    const start = performance.now();

    // Your database query here
    await database.query("SELECT * FROM users LIMIT 1000");

    const duration = performance.now() - start;

    // Assert performance requirements
    if (duration > 100) {
      // 100ms budget
      throw new Error(`Query too slow: ${duration}ms`);
    }
  },
  timeout: 5000,
  expectedDuration: 50, // Expected ~50ms
  tolerance: 20, // 20% tolerance
};
```

### Anomaly Detection

```typescript
import { performanceDashboard } from "strray/performance";

// Monitor for anomalies
performanceDashboard.on("alert", (alert) => {
  if (alert.type === "anomaly") {
    console.log(`🚨 Performance anomaly detected: ${alert.message}`);

    // Take action based on anomaly type
    switch (alert.severity) {
      case "critical":
        // Immediate action required
        notifyTeam(alert);
        break;
      case "warning":
        // Log for monitoring
        logWarning(alert);
        break;
    }
  }
});
```

### Integration with External Monitoring

```typescript
import { performanceSystem } from "strray/performance";

// Forward metrics to external systems
performanceSystem.on("metrics-updated", (metrics) => {
  // Send to DataDog, New Relic, etc.
  sendToMonitoringSystem("strray.performance", metrics);
});

performanceSystem.on("budget-exceeded", (violation) => {
  // Send alert to PagerDuty, Slack, etc.
  sendAlert("Performance Budget Exceeded", violation);
});
```

---

## 🐛 Troubleshooting

### Common Issues

**Performance gates failing in CI/CD:**

```bash
# Check current performance status
npm run performance:report

# Run gates with verbose output
DEBUG=performance:* npm run performance:gates
```

**High memory usage:**

```typescript
// Check memory usage
const memUsage = process.memoryUsage();
console.log(`Heap used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

// Force garbage collection (if --expose-gc flag used)
if (global.gc) {
  global.gc();
}
```

**Bundle size violations:**

```bash
# Analyze bundle composition
npm run build
npm run performance:report

# Check for large dependencies
npx webpack-bundle-analyzer dist/stats.json
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=performance:* npm run performance:monitor
```

---

## 📚 API Reference

### PerformanceSystemOrchestrator

```typescript
class PerformanceSystemOrchestrator {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): void;
  runGates(): Promise<PerformanceGateResult>;
  generateReport(): Promise<PerformanceReport>;
  getStatus(): PerformanceSystemStatus;
  updateConfig(config: Partial<PerformanceSystemConfig>): void;
  shutdown(): Promise<void>;
}
```

### PerformanceBudgetEnforcer

```typescript
class PerformanceBudgetEnforcer {
  analyzeBundleSize(distPath?: string): Promise<BundleSizeMetrics>;
  measureWebVitals(): Promise<WebVitalsMetrics>;
  measureRuntimePerformance(): RuntimePerformanceMetrics;
  checkBudgetCompliance(
    bundleSize,
    webVitals,
    runtime,
  ): PerformanceBudgetViolation[];
  generatePerformanceReport(): Promise<PerformanceReport>;
}
```

### PerformanceRegressionTester

```typescript
class PerformanceRegressionTester {
  runRegressionTest(
    test: PerformanceRegressionTest,
  ): Promise<RegressionTestResult>;
  runTestSuite(suite: RegressionTestSuite): Promise<TestSuiteResult>;
  createDefaultTestSuite(): RegressionTestSuite;
  loadBaselines(file: string): void;
  saveBaselines(file: string): void;
  exportResults(): RegressionTestData;
}
```

### PerformanceMonitoringDashboard

```typescript
class PerformanceMonitoringDashboard {
  start(): Promise<void>;
  stop(): void;
  getMetrics(): DashboardMetrics;
  generateReport(): Promise<PerformanceReport>;
  exportData(): DashboardExportData;
  resolveAlert(alertId: string): boolean;
}
```

### PerformanceCIGates

```typescript
class PerformanceCIGates {
  runPerformanceGates(testSuite?: RegressionTestSuite): Promise<CIGateResult>;
  createGitHubWorkflow(): string;
  createJenkinsPipeline(): string;
  createAzurePipeline(): string;
}
```

---

## 🤝 Contributing

1. Follow the Universal Development Codex performance requirements
2. Add performance tests for new features
3. Update performance baselines when improving performance
4. Ensure CI/CD pipelines include performance gates

### Adding New Performance Tests

```typescript
// In your test file
import { performanceRegressionTester } from "strray/performance";

const newPerformanceTest: PerformanceRegressionTest = {
  name: "my-feature-performance",
  description: "Performance test for my new feature",
  testFunction: async () => {
    // Test implementation
    const start = performance.now();
    await myNewFeature();
    const duration = performance.now() - start;

    if (duration > expectedDuration) {
      throw new Error(
        `Performance regression: ${duration}ms > ${expectedDuration}ms`,
      );
    }
  },
  timeout: 10000,
  tolerance: 10,
};

// Register with regression tester
performanceRegressionTester.runRegressionTest(newPerformanceTest);
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🔗 Related Documentation

- [StringRay Framework Documentation](./README.md)
- [Universal Development Codex](./CODEX.md)
- [CI/CD Integration Guide](./docs/ci-cd-integration.md)
- [Performance Optimization Guide](./docs/performance-optimization.md)
