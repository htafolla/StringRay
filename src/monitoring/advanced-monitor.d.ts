/**
 * StringRay AI v1.1.1 - Advanced Monitoring System
 *
 * Real-time monitoring with anomaly detection and alerting.
 * Provides comprehensive framework health tracking and automated responses.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export interface MonitoringMetrics {
    timestamp: number;
    agentMetrics: Record<string, AgentMetrics>;
    systemMetrics: SystemMetrics;
    performanceMetrics: PerformanceMetrics;
    errorMetrics: ErrorMetrics;
}
export interface AgentMetrics {
    agentId: string;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    lastActivity: number;
    healthStatus: "healthy" | "degraded" | "unhealthy";
    memoryUsage?: number;
    cpuUsage?: number;
}
export interface SystemMetrics {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    queuedTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface PerformanceMetrics {
    throughput: number;
    latency: {
        p50: number;
        p95: number;
        p99: number;
    };
    errorRate: number;
    resourceUtilization: {
        memory: number;
        cpu: number;
        network: number;
    };
}
export interface ErrorMetrics {
    totalErrors: number;
    errorRate: number;
    errorTypes: Record<string, number>;
    recentErrors: Array<{
        timestamp: number;
        agentId: string;
        errorType: string;
        message: string;
        severity: "low" | "medium" | "high" | "critical";
    }>;
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    condition: (metrics: MonitoringMetrics) => boolean;
    severity: "info" | "warning" | "error" | "critical";
    cooldown: number;
    enabled: boolean;
    lastTriggered?: number;
}
export interface Alert {
    id: string;
    ruleId: string;
    timestamp: number;
    severity: "info" | "warning" | "error" | "critical";
    message: string;
    metrics: Partial<MonitoringMetrics>;
    acknowledged: boolean;
    resolved: boolean;
    resolvedAt?: number;
}
export interface AnomalyDetectionResult {
    detected: boolean;
    anomalyType: string;
    confidence: number;
    description: string;
    affectedComponents: string[];
    recommendedActions: string[];
    severity: "low" | "medium" | "high" | "critical";
}
export declare class AnomalyDetector {
    private historicalData;
    private readonly maxHistorySize;
    private readonly anomalyThreshold;
    /**
     * Detect anomalies in current metrics
     */
    detectAnomalies(currentMetrics: MonitoringMetrics): AnomalyDetectionResult[];
    updateHistory(metrics: MonitoringMetrics): void;
    private detectPerformanceAnomaly;
    private detectErrorAnomaly;
    private detectResourceAnomaly;
    private detectAgentAnomalies;
    private identifyErrorSources;
}
export declare class AlertManager {
    private rules;
    private activeAlerts;
    private alertHistory;
    private readonly maxHistorySize;
    /**
     * Add an alert rule
     */
    addRule(rule: AlertRule): void;
    removeRule(ruleId: string): void;
    /**
     * Evaluate metrics against all rules
     */
    evaluateRules(metrics: MonitoringMetrics): Alert[];
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string): boolean;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): boolean;
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get alert history
     */
    getAlertHistory(limit?: number): Alert[];
    private extractRelevantMetrics;
}
export declare class AdvancedMonitor {
    private anomalyDetector;
    private alertManager;
    private metricsHistory;
    private readonly maxHistorySize;
    private monitoringInterval?;
    private alertCallbacks;
    private anomalyCallbacks;
    constructor();
    /**
     * Start monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Manually collect and analyze metrics
     */
    collectAndAnalyzeMetrics(): Promise<{
        metrics: MonitoringMetrics;
        alerts: Alert[];
        anomalies: AnomalyDetectionResult[];
    }>;
    /**
     * Add alert callback
     */
    onAlert(callback: (alerts: Alert[]) => void): void;
    /**
     * Add anomaly callback
     */
    onAnomaly(callback: (anomalies: AnomalyDetectionResult[]) => void): void;
    /**
     * Get current system health status
     */
    getHealthStatus(): {
        overall: "healthy" | "degraded" | "unhealthy";
        activeAlerts: number;
        recentAnomalies: number;
        uptime: number;
        lastCheck: number;
    };
    /**
     * Get monitoring statistics
     */
    getMonitoringStats(): {
        totalMetrics: number;
        totalAlerts: number;
        totalAnomalies: number;
        activeRules: number;
        monitoringActive: boolean;
    };
    private collectMetrics;
    private initializeDefaultRules;
}
export declare const advancedMonitor: AdvancedMonitor;
//# sourceMappingURL=advanced-monitor.d.ts.map