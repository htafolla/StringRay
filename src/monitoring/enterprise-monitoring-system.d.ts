/**
 * StringRay AI v1.1.1 - Enterprise Monitoring System
 *
 * Comprehensive enterprise-scale monitoring and health check system.
 * Supports distributed deployments, auto-scaling, and production monitoring.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
export interface SystemMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        loadAverage: number[];
        cores: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usagePercent: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        usagePercent: number;
    };
    network: {
        bytesReceived: number;
        bytesTransmitted: number;
        packetsReceived: number;
        packetsTransmitted: number;
    };
    process: {
        pid: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
    };
}
export interface ApplicationMetrics {
    timestamp: number;
    requests: {
        total: number;
        active: number;
        completed: number;
        failed: number;
        averageResponseTime: number;
    };
    agents: {
        total: number;
        active: number;
        idle: number;
        failed: number;
    };
    sessions: {
        total: number;
        active: number;
        expired: number;
    };
    performance: {
        averageLatency: number;
        p95Latency: number;
        p99Latency: number;
        throughput: number;
    };
}
export interface HealthCheckResult {
    service: string;
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    timestamp: number;
    responseTime: number;
    details: Record<string, any>;
    error?: string;
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
    threshold: number;
    severity: "low" | "medium" | "high" | "critical";
    enabled: boolean;
    cooldownMinutes: number;
    lastTriggered?: number;
}
export interface Alert {
    id: string;
    ruleId: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    resolved: boolean;
    resolvedAt?: number;
    instanceId?: string;
}
export interface MonitoringConfig {
    enabled: boolean;
    collectionInterval: number;
    retentionPeriod: number;
    alertRules: AlertRule[];
    healthChecks: {
        enabled: boolean;
        interval: number;
        timeout: number;
        services: Array<{
            name: string;
            url?: string;
            command?: string;
            type: "http" | "tcp" | "command" | "custom";
            expectedStatus?: number;
            expectedResponse?: string;
        }>;
    };
    integrations: {
        prometheus?: {
            enabled: boolean;
            endpoint: string;
            labels: Record<string, string>;
        };
        datadog?: {
            enabled: boolean;
            apiKey: string;
            tags: string[];
        };
        newRelic?: {
            enabled: boolean;
            licenseKey: string;
            appName: string;
        };
    };
    thresholds: {
        cpuWarning: number;
        cpuCritical: number;
        memoryWarning: number;
        memoryCritical: number;
        diskWarning: number;
        diskCritical: number;
        responseTimeWarning: number;
        responseTimeCritical: number;
    };
}
export interface ClusterNode {
    id: string;
    hostname: string;
    ip: string;
    port: number;
    status: "online" | "offline" | "degraded";
    lastHeartbeat: number;
    metrics: SystemMetrics;
    health: HealthCheckResult[];
}
export interface ClusterMetrics {
    nodes: ClusterNode[];
    totalRequests: number;
    averageLatency: number;
    errorRate: number;
    loadDistribution: Record<string, number>;
}
/**
 * Enterprise monitoring and health check system
 */
export declare class EnterpriseMonitoringSystem extends EventEmitter {
    private config;
    private metrics;
    private appMetrics;
    private alerts;
    private healthResults;
    private clusterNodes;
    private collectionTimer?;
    private healthCheckTimer?;
    private cleanupTimer?;
    private isRunning;
    private instanceId;
    constructor(config?: Partial<MonitoringConfig>);
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Start monitoring system
     */
    start(): Promise<void>;
    /**
     * Stop monitoring system
     */
    stop(): void;
    /**
     * Collect system and application metrics
     */
    private collectMetrics;
    /**
     * Collect system metrics
     */
    private collectSystemMetrics;
    /**
     * Collect application-specific metrics
     */
    private collectApplicationMetrics;
    /**
     * Perform health checks
     */
    private performHealthChecks;
    /**
     * Check HTTP health
     */
    private checkHttpHealth;
    /**
     * Check command health
     */
    private checkCommandHealth;
    /**
     * Check alert rules against current metrics
     */
    private checkAlertRules;
    /**
     * Send alert to external monitoring systems
     */
    private sendAlertToExternalSystems;
    /**
     * Get default alert rules
     */
    private getDefaultAlertRules;
    /**
     * Get disk usage (simplified)
     */
    private getDiskUsage;
    /**
     * Get network stats (simplified)
     */
    private getNetworkStats;
    /**
     * Generate instance ID
     */
    private generateInstanceId;
    /**
     * Start data cleanup timer
     */
    private startDataCleanup;
    /**
     * Clean up old data
     */
    private cleanupOldData;
    /**
     * Event handlers
     */
    private handleAlertTriggered;
    private handleHealthCheckFailed;
    private handleMetricsCollected;
    private handleProfileCompleted;
    private handlePerformanceAnomaly;
    private handleMemoryAnomaly;
    private handleReportGenerated;
    /**
     * Get current metrics
     */
    getMetrics(): {
        system: SystemMetrics[];
        application: ApplicationMetrics[];
    };
    /**
     * Get health check results
     */
    getHealthResults(): HealthCheckResult[];
    /**
     * Get active alerts
     */
    getAlerts(includeResolved?: boolean): Alert[];
    /**
     * Resolve alert
     */
    resolveAlert(alertId: string): Promise<boolean>;
    /**
     * Add cluster node
     */
    addClusterNode(node: Omit<ClusterNode, "status" | "lastHeartbeat" | "metrics" | "health">): Promise<void>;
    /**
     * Update cluster node heartbeat
     */
    updateClusterNodeHeartbeat(nodeId: string, metrics?: SystemMetrics, health?: HealthCheckResult[]): void;
    /**
     * Get cluster metrics
     */
    getClusterMetrics(): ClusterMetrics;
    /**
     * Get monitoring status
     */
    getMonitoringStatus(): {
        running: boolean;
        instanceId: string;
        metricsCollected: number;
        alertsActive: number;
        healthChecksPerformed: number;
        clusterNodes: number;
        uptime: number;
    };
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<MonitoringConfig>): Promise<void>;
    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: any, tags?: Record<string, string>): void;
    /**
     * Record an error for monitoring
     */
    recordError(operation: string, error: any): void;
    /**
     * Get comprehensive system status
     */
    getStatus(): {
        config: MonitoringConfig;
        metrics: {
            system: SystemMetrics[];
            application: ApplicationMetrics[];
        };
        alerts: Alert[];
        healthResults: HealthCheckResult[];
        clusterMetrics: ClusterMetrics;
        monitoringStatus: any;
    };
}
export declare const enterpriseMonitoringSystem: EnterpriseMonitoringSystem;
//# sourceMappingURL=enterprise-monitoring-system.d.ts.map