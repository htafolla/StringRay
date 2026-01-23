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
export interface PerformanceSystemConfig {
    budgetEnforcement: {
        enabled: boolean;
        failOnViolation: boolean;
        thresholds: {
            warning: number;
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
export declare class PerformanceSystemOrchestrator extends EventEmitter {
    private config;
    private components;
    private initialized;
    private status;
    constructor(config?: Partial<PerformanceSystemConfig>);
    /**
     * Initialize the performance system
     */
    initialize(): Promise<void>;
    /**
     * Start the performance monitoring system
     */
    start(): Promise<void>;
    /**
     * Stop the performance monitoring system
     */
    stop(): Promise<void>;
    /**
     * Run performance gates (for CI/CD)
     */
    runGates(): Promise<any>;
    /**
     * Generate comprehensive performance report
     */
    generateReport(): Promise<any>;
    /**
     * Get current system status
     */
    getStatus(): PerformanceSystemStatus;
    /**
     * Setup event forwarding between components
     */
    private setupEventForwarding;
    /**
     * Get component instances (for advanced usage)
     */
    getComponents(): {
        budgetEnforcer?: PerformanceBudgetEnforcer;
        regressionTester?: PerformanceRegressionTester;
        dashboard?: PerformanceMonitoringDashboard;
        ciGates?: PerformanceCIGates;
    };
    /**
     * Update configuration (hot-reload capable components)
     */
    updateConfig(newConfig: Partial<PerformanceSystemConfig>): Promise<void>;
    /**
     * Cleanup and shutdown
     */
    shutdown(): Promise<void>;
}
export declare const performanceSystem: PerformanceSystemOrchestrator;
//# sourceMappingURL=performance-system-orchestrator.d.ts.map