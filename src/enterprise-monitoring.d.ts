/**
 * StringRay AI v1.1.1 - Enterprise Monitoring & Health Check System
 *
 * Comprehensive enterprise-scale monitoring system supporting:
 * - Multi-instance coordination and distributed deployments
 * - Load balancing and auto-scaling integration
 * - High availability with failover and recovery
 * - Real-time dashboards and historical analytics
 * - External monitoring system integrations
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import { AdvancedMonitor, MonitoringMetrics } from "./monitoring/advanced-monitor";
import { SessionMonitor } from "./session/session-monitor";
import { PerformanceSystemOrchestrator } from "./performance/performance-system-orchestrator";
/**
 * Enterprise Monitoring Architecture:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │              Enterprise Monitoring Orchestrator             │
 * │  ┌─────────────────────────────────────────────────────┐    │
 * │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
 * │  │  │Distributed  │  │ Load Bal.  │  │ Auto-Scaling│  │    │
 * │  │  │Coordinator  │  │ Integration│  │ Integration│  │    │
 * │  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
 * │  └─────────────────────────────────────────────────────┘    │
 * │                                                             │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
 * │  │Advanced     │  │Session      │  │Performance │          │
 * │  │Monitor      │  │Monitor      │  │Dashboard   │          │
 * │  │(Extended)   │  │(Extended)   │  │(Extended)  │          │
 * │  └─────────────┘  └─────────────┘  └─────────────┘          │
 * └─────────────────────────────────────────────────────────────┘
 */
export interface EnterpriseMonitoringConfig {
    distributed: {
        enabled: boolean;
        instanceId: string;
        clusterSize: number;
        leaderElectionInterval: number;
        consensusTimeout: number;
        dataReplicationFactor: number;
    };
    loadBalancing: {
        enabled: boolean;
        provider: "aws" | "azure" | "gcp" | "nginx" | "kubernetes";
        endpoints: LoadBalancerEndpoint[];
        healthCheckInterval: number;
        trafficAnalysisInterval: number;
    };
    autoScaling: {
        enabled: boolean;
        provider: "aws" | "azure" | "gcp" | "kubernetes";
        minInstances: number;
        maxInstances: number;
        scaleUpThresholds: ScalingThresholds;
        scaleDownThresholds: ScalingThresholds;
        cooldownPeriod: number;
        predictiveScaling: boolean;
    };
    highAvailability: {
        enabled: boolean;
        redundancyLevel: number;
        failoverStrategy: "active-passive" | "active-active";
        failoverTimeout: number;
        backupFrequency: number;
    };
    integrations: {
        prometheus: PrometheusConfig;
        datadog: DataDogConfig;
        newrelic: NewRelicConfig;
        slack: SlackConfig;
        pagerduty: PagerDutyConfig;
    };
    healthChecks: {
        systemHealthInterval: number;
        applicationHealthInterval: number;
        dependencyHealthInterval: number;
        securityHealthInterval: number;
        performanceHealthInterval: number;
    };
    alerting: {
        enabled: boolean;
        escalationPolicies: AlertEscalationPolicy[];
        notificationChannels: NotificationChannel[];
        alertCooldown: number;
        alertRetention: number;
    };
    dashboards: {
        enabled: boolean;
        realTimeUpdateInterval: number;
        historicalRetentionDays: number;
        customDashboards: CustomDashboard[];
    };
}
export interface LoadBalancerEndpoint {
    id: string;
    url: string;
    weight: number;
    healthCheckPath: string;
    expectedStatusCode: number;
}
export interface ScalingThresholds {
    cpuUtilization: number;
    memoryUtilization: number;
    errorRate: number;
    responseTime: number;
    queueDepth: number;
}
export interface PrometheusConfig {
    enabled: boolean;
    endpoint: string;
    scrapeInterval: number;
    metricsPath: string;
    labels: Record<string, string>;
}
export interface DataDogConfig {
    enabled: boolean;
    apiKey: string;
    appKey: string;
    site: string;
    serviceName: string;
    env: string;
}
export interface NewRelicConfig {
    enabled: boolean;
    licenseKey: string;
    appName: string;
    distributedTracing: boolean;
    aiMonitoring: boolean;
}
export interface SlackConfig {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    username: string;
}
export interface PagerDutyConfig {
    enabled: boolean;
    integrationKey: string;
    serviceId: string;
}
export interface AlertEscalationPolicy {
    id: string;
    name: string;
    conditions: AlertCondition[];
    escalationSteps: EscalationStep[];
    cooldownPeriod: number;
}
export interface AlertCondition {
    metric: string;
    operator: "gt" | "lt" | "eq" | "ne";
    threshold: number;
    duration: number;
}
export interface EscalationStep {
    delay: number;
    channels: string[];
    message: string;
}
export interface NotificationChannel {
    id: string;
    type: "slack" | "email" | "pagerduty" | "webhook";
    config: Record<string, any>;
}
export interface CustomDashboard {
    id: string;
    name: string;
    description: string;
    panels: DashboardPanel[];
    refreshInterval: number;
}
export interface DashboardPanel {
    id: string;
    title: string;
    type: "line" | "bar" | "gauge" | "table";
    metrics: string[];
    timeRange: string;
    aggregation: string;
}
export interface InstanceHealth {
    instanceId: string;
    status: "healthy" | "degraded" | "unhealthy" | "offline";
    lastSeen: number;
    metrics: MonitoringMetrics;
    leadershipRole: "leader" | "follower" | "candidate";
}
export interface ClusterHealth {
    clusterId: string;
    leaderId: string;
    totalInstances: number;
    healthyInstances: number;
    degradedInstances: number;
    unhealthyInstances: number;
    consensusStatus: "stable" | "degraded" | "broken";
    lastConsensusUpdate: number;
}
export interface TrafficMetrics {
    totalRequests: number;
    requestsPerSecond: number;
    responseTime: {
        p50: number;
        p95: number;
        p99: number;
    };
    errorRate: number;
    distribution: Record<string, number>;
}
export interface TrafficAnalysis {
    balanced: boolean;
    imbalanceRatio: number;
    overloadedInstances: string[];
    underutilizedInstances: string[];
    recommendations: string[];
}
export interface ScalingDecision {
    action: "scale-up" | "scale-down" | "no-action";
    instances: number;
    reason: string;
    confidence: number;
    predictedLoad: number;
}
export interface ScalingResult {
    success: boolean;
    newInstanceCount: number;
    instancesProvisioned: string[];
    loadBalancerUpdated: boolean;
    error?: string;
}
export interface AvailabilityStatus {
    overallStatus: "available" | "degraded" | "unavailable";
    primaryMonitor: boolean;
    backupMonitors: number;
    dataReplication: boolean;
    failoverActive: boolean;
    lastFailover: number;
}
export interface HealthCheckResult {
    component: string;
    status: "healthy" | "degraded" | "unhealthy";
    responseTime: number;
    message: string;
    details?: Record<string, any>;
}
export interface SystemHealth {
    overall: "healthy" | "degraded" | "unhealthy";
    components: HealthCheckResult[];
    timestamp: number;
    duration: number;
}
export interface Alert {
    id: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "error" | "critical";
    source: string;
    timestamp: number;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: number;
    resolved: boolean;
    resolvedAt?: number;
    tags: string[];
    metadata: Record<string, any>;
}
export interface DashboardMetrics {
    timestamp: number;
    system: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
    application: {
        activeSessions: number;
        totalTasks: number;
        queuedTasks: number;
        completedTasks: number;
        failedTasks: number;
    };
    performance: {
        throughput: number;
        latency: {
            p50: number;
            p95: number;
            p99: number;
        };
        errorRate: number;
    };
    alerts: {
        active: number;
        critical: number;
        warning: number;
        info: number;
    };
}
declare class EnterpriseMonitoringOrchestrator extends EventEmitter {
    private config;
    private components;
    private advancedMonitor;
    private sessionMonitor;
    private performanceSystem;
    constructor(config: EnterpriseMonitoringConfig, advancedMonitor: AdvancedMonitor, sessionMonitor: SessionMonitor, performanceSystem: PerformanceSystemOrchestrator);
    private initializeEnterpriseMonitoring;
    private setupEventForwarding;
    performEnterpriseHealthCheck(): Promise<{
        systemHealth: SystemHealth;
        clusterHealth?: ClusterHealth;
        loadBalancerHealth?: any;
        alerts: Alert[];
    }>;
    evaluateAutoScaling(): Promise<ScalingDecision | null>;
    getEnterpriseStatus(): {
        initialized: boolean;
        components: Record<string, boolean>;
        clusterHealth?: ClusterHealth;
        scalingStatus?: any;
        activeAlerts: number;
    };
    shutdown(): Promise<void>;
}
export declare const enterpriseMonitor: EnterpriseMonitoringOrchestrator;
export {};
//# sourceMappingURL=enterprise-monitoring.d.ts.map