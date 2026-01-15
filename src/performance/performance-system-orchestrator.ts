/**
 * StringRay AI v1.0.4 - Performance System Orchestrator
 *
 * Unified performance monitoring, testing, and enforcement system
 * that integrates all performance components into a cohesive framework.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import { PerformanceBudgetEnforcer } from "./performance-budget-enforcer.js";
import { PerformanceRegressionTester } from "./performance-regression-tester.js";
import { PerformanceMonitoringDashboard } from "./performance-monitoring-dashboard.js";
import { PerformanceCIGates } from "./performance-ci-gates.js";

export interface PerformanceSystemConfig {
  budgetEnforcement: {
    enabled: boolean;
    failOnViolation: boolean;
    thresholds: {
      warning: number; // percentage of budget
      error: number;
      critical: number;
    };
  };
  monitoring: {
    enabled: boolean;
    dashboard: boolean;
    updateInterval: number;
    retentionHours: number;
    anomalyDetection: boolean;
  };
  regressionTesting: {
    enabled: boolean;
    baselineFile: string;
    updateBaselines: boolean;
    tolerance: number;
  };
  ciGates: {
    enabled: boolean;
    failPipeline: boolean;
    generateReports: boolean;
    reportPath: string;
  };
}

export interface PerformanceSystemStatus {
  initialized: boolean;
  monitoringActive: boolean;
  lastUpdate: number;
  components: {
    budgetEnforcer: boolean;
    regressionTester: boolean;
    dashboard: boolean;
    ciGates: boolean;
  };
  activeAlerts: number;
  recentViolations: number;
}

/**
 * Unified performance system orchestrator
 */
export class PerformanceSystemOrchestrator extends EventEmitter {
  private config: PerformanceSystemConfig;
  private components: {
    budgetEnforcer?: PerformanceBudgetEnforcer;
    regressionTester?: PerformanceRegressionTester;
    dashboard?: PerformanceMonitoringDashboard;
    ciGates?: PerformanceCIGates;
  } = {};
  private initialized = false;
  private status: PerformanceSystemStatus;

  constructor(config: Partial<PerformanceSystemConfig> = {}) {
    super();

    this.config = {
      budgetEnforcement: {
        enabled: true,
        failOnViolation: true,
        thresholds: {
          warning: 90,
          error: 100,
          critical: 110,
        },
      },
      monitoring: {
        enabled: true,
        dashboard: true,
        updateInterval: 30000,
        retentionHours: 24,
        anomalyDetection: true,
      },
      regressionTesting: {
        enabled: true,
        baselineFile: "./performance-baselines.json",
        updateBaselines: true,
        tolerance: 10,
      },
      ciGates: {
        enabled: true,
        failPipeline: true,
        generateReports: true,
        reportPath: "./performance-reports",
      },
      ...config,
    };

    this.status = {
      initialized: false,
      monitoringActive: false,
      lastUpdate: 0,
      components: {
        budgetEnforcer: false,
        regressionTester: false,
        dashboard: false,
        ciGates: false,
      },
      activeAlerts: 0,
      recentViolations: 0,
    };
  }

  /**
   * Initialize the performance system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("🚀 Initializing StringRay Performance System");

    try {
      // Initialize budget enforcer
      if (this.config.budgetEnforcement.enabled) {
        this.components.budgetEnforcer = new PerformanceBudgetEnforcer();
        this.status.components.budgetEnforcer = true;
        console.log("   ✅ Budget enforcer initialized");
      }

      // Initialize regression tester
      if (this.config.regressionTesting.enabled) {
        this.components.regressionTester = new PerformanceRegressionTester(
          this.components.budgetEnforcer,
        );
        this.status.components.regressionTester = true;
        console.log("   ✅ Regression tester initialized");
      }

      // Initialize monitoring dashboard
      if (this.config.monitoring.enabled && this.config.monitoring.dashboard) {
        this.components.dashboard = new PerformanceMonitoringDashboard(
          {
            updateInterval: this.config.monitoring.updateInterval,
            historyRetention: this.config.monitoring.retentionHours,
            alertThresholds: {
              budgetViolation: "error",
              regressionThreshold: this.config.regressionTesting.tolerance,
              anomalySensitivity: "medium",
            },
          },
          this.components.budgetEnforcer,
          this.components.regressionTester,
        );
        this.status.components.dashboard = true;
        console.log("   ✅ Monitoring dashboard initialized");
      }

      // Initialize CI gates
      if (this.config.ciGates.enabled) {
        this.components.ciGates = new PerformanceCIGates(
          {
            failOnBudgetViolation: this.config.ciGates.failPipeline,
            failOnRegression: this.config.ciGates.failPipeline,
            generateReports: this.config.ciGates.generateReports,
            reportPath: this.config.ciGates.reportPath,
          },
          this.components.budgetEnforcer,
          this.components.regressionTester,
        );
        this.status.components.ciGates = true;
        console.log("   ✅ CI gates initialized");
      }

      // Setup event forwarding
      this.setupEventForwarding();

      this.initialized = true;
      this.status.initialized = true;

      console.log("✅ Performance system initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize performance system:", error);
      throw error;
    }
  }

  /**
   * Start the performance monitoring system
   */
  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log("▶️ Starting performance monitoring");

    if (this.components.dashboard && this.config.monitoring.enabled) {
      this.components.dashboard.start();
      this.status.monitoringActive = true;
      console.log("   📊 Dashboard monitoring started");
    }

    this.emit("started");
  }

  /**
   * Stop the performance monitoring system
   */
  stop(): void {
    console.log("⏹️ Stopping performance monitoring");

    if (this.components.dashboard) {
      this.components.dashboard.stop();
      this.status.monitoringActive = false;
      console.log("   📊 Dashboard monitoring stopped");
    }

    this.emit("stopped");
  }

  /**
   * Run performance gates (for CI/CD)
   */
  async runGates(): Promise<any> {
    if (!this.components.ciGates) {
      throw new Error("CI gates not initialized");
    }

    console.log("🚪 Running performance gates");
    const result = await this.components.ciGates.runPerformanceGates();

    if (!result.success && this.config.ciGates.failPipeline) {
      console.error("❌ Performance gates failed");
    }

    return result;
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(): Promise<any> {
    if (!this.components.budgetEnforcer) {
      throw new Error("Budget enforcer not initialized");
    }

    const report =
      await this.components.budgetEnforcer.generatePerformanceReport();

    if (this.components.dashboard) {
      const dashboardData = this.components.dashboard.exportData();
      return {
        ...report,
        dashboard: dashboardData,
        systemStatus: this.status,
      };
    }

    return report;
  }

  /**
   * Get current system status
   */
  getStatus(): PerformanceSystemStatus {
    // Update dynamic status
    if (this.components.dashboard) {
      const alerts = this.components.dashboard.getActiveAlerts();
      this.status.activeAlerts = alerts.length;
    }

    this.status.lastUpdate = Date.now();

    return { ...this.status };
  }

  /**
   * Setup event forwarding between components
   */
  private setupEventForwarding(): void {
    // Forward budget enforcer events
    if (this.components.budgetEnforcer) {
      this.components.budgetEnforcer.on("violation", (violation) => {
        this.emit("budget-violation", violation);
        this.status.recentViolations++;
      });

      this.components.budgetEnforcer.on("budget-exceeded", (violation) => {
        this.emit("budget-exceeded", violation);
      });
    }

    // Forward dashboard events
    if (this.components.dashboard) {
      this.components.dashboard.on("alert", (alert) => {
        this.emit("alert", alert);
      });

      this.components.dashboard.on("metrics-updated", (metrics) => {
        this.emit("metrics-updated", metrics);
      });
    }
  }

  /**
   * Get component instances (for advanced usage)
   */
  getComponents() {
    return { ...this.components };
  }

  /**
   * Update configuration (hot-reload capable components)
   */
  updateConfig(newConfig: Partial<PerformanceSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔄 Performance system configuration updated");
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log("🔌 Shutting down performance system");

    this.stop();

    // Cleanup components
    this.components = {};
    this.initialized = false;
    this.status.initialized = false;

    console.log("✅ Performance system shutdown complete");
  }
}

// Export singleton instance
export const performanceSystem = new PerformanceSystemOrchestrator();
