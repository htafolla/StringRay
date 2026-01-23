/**
 * StringRay AI v1.1.1 - Performance System Orchestrator
 *
 * Unified performance monitoring, testing, and enforcement system
 * that integrates all performance components into a cohesive framework.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import { PerformanceBudgetEnforcer } from "./performance-budget-enforcer";
import { PerformanceRegressionTester } from "./performance-regression-tester";
import { PerformanceMonitoringDashboard } from "./performance-monitoring-dashboard";
import { PerformanceCIGates } from "./performance-ci-gates";
import { frameworkLogger } from "../framework-logger";
/**
 * Unified performance system orchestrator
 */
export class PerformanceSystemOrchestrator extends EventEmitter {
    config;
    components = {};
    initialized = false;
    status;
    constructor(config = {}) {
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
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            await frameworkLogger.log("performance-orchestrator", "system-initializing", "info");
            // Initialization details kept as console.log for user feedback
            await frameworkLogger.log('performance-system-orchestrator', '-initializing-performance-components-', 'info', { message: "   📊 Initializing performance components..." });
            // Initialize components
            this.components = {
                budgetEnforcer: this.config.budgetEnforcement?.enabled
                    ? new PerformanceBudgetEnforcer()
                    : undefined,
                regressionTester: new PerformanceRegressionTester(),
                dashboard: this.config.monitoring?.enabled
                    ? new PerformanceMonitoringDashboard()
                    : undefined,
                ciGates: new PerformanceCIGates(),
            };
            this.status = {
                initialized: true,
                monitoringActive: false,
                lastUpdate: Date.now(),
                components: {
                    budgetEnforcer: !!this.components.budgetEnforcer,
                    regressionTester: !!this.components.regressionTester,
                    dashboard: !!this.components.dashboard,
                    ciGates: !!this.components.ciGates,
                },
                activeAlerts: 0,
                recentViolations: 0,
            };
            this.initialized = true;
        }
        catch (error) {
            console.error("❌ Failed to initialize performance system:", error);
            throw error;
        }
    }
    /**
     * Start the performance monitoring system
     */
    async start() {
        if (!this.initialized) {
            await this.initialize();
        }
        await frameworkLogger.log('performance-system-orchestrator', '-starting-performance-monitoring-', 'info', { message: "▶️ Starting performance monitoring" });
        if (this.components.dashboard && this.config.monitoring.enabled) {
            this.components.dashboard.start();
            this.status.monitoringActive = true;
            await frameworkLogger.log('performance-system-orchestrator', '-dashboard-monitoring-started-', 'info', { message: "   📊 Dashboard monitoring started" });
        }
        this.emit("started");
    }
    /**
     * Stop the performance monitoring system
     */
    async stop() {
        await frameworkLogger.log('performance-system-orchestrator', '-stopping-performance-monitoring-', 'info', { message: "⏹️ Stopping performance monitoring" });
        if (this.components.dashboard) {
            // Note: Dashboard doesn't have a stop method, just disable monitoring
            this.status.monitoringActive = false;
            frameworkLogger.log("performance-orchestrator", "dashboard-stopped", "info");
        }
        this.emit("stopped");
    }
    /**
     * Run performance gates (for CI/CD)
     */
    async runGates() {
        if (!this.components.ciGates) {
            throw new Error("CI gates not initialized");
        }
        await frameworkLogger.log("performance-orchestrator", "gates-executing", "info");
        const result = await this.components.ciGates.runPerformanceGates();
        if (!result.success && this.config.ciGates.failPipeline) {
            console.error("❌ Performance gates failed");
        }
        return result;
    }
    /**
     * Generate comprehensive performance report
     */
    async generateReport() {
        if (!this.components.budgetEnforcer) {
            throw new Error("Budget enforcer not initialized");
        }
        const report = await this.components.budgetEnforcer.generatePerformanceReport();
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
    getStatus() {
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
    setupEventForwarding() {
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
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await frameworkLogger.log("performance-orchestrator", "config-updated", "info");
    }
    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        await frameworkLogger.log('performance-system-orchestrator', '-shutting-down-performance-system-', 'info', { message: "🔌 Shutting down performance system" });
        this.stop();
        // Cleanup components
        this.components = {};
        this.initialized = false;
        this.status.initialized = false;
        await frameworkLogger.log('performance-system-orchestrator', '-performance-system-shutdown-complete-', 'success', { message: "✅ Performance system shutdown complete" });
    }
}
// Export singleton instance
export const performanceSystem = new PerformanceSystemOrchestrator();
//# sourceMappingURL=performance-system-orchestrator.js.map