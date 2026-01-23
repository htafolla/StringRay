/**
 * StringRay AI v1.1.1 - Session Monitor
 *
 * Provides real-time monitoring of sessions with health checks,
 * performance tracking, and alerting capabilities.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { StringRayStateManager } from "../state/state-manager";
import { SessionCoordinator } from "../delegation/session-coordinator";
import { SessionCleanupManager } from "./session-cleanup-manager";
export interface SessionHealth {
    sessionId: string;
    status: "healthy" | "degraded" | "critical" | "unknown";
    lastCheck: number;
    responseTime: number;
    errorCount: number;
    activeAgents: number;
    memoryUsage: number;
    issues: string[];
}
export interface SessionMetrics {
    sessionId: string;
    timestamp: number;
    totalInteractions: number;
    successfulInteractions: number;
    failedInteractions: number;
    averageResponseTime: number;
    conflictResolutionRate: number;
    coordinationEfficiency: number;
    memoryUsage: number;
    agentCount: number;
}
export interface MonitorConfig {
    healthCheckIntervalMs: number;
    metricsCollectionIntervalMs: number;
    alertThresholds: {
        maxResponseTime: number;
        maxErrorRate: number;
        maxMemoryUsage: number;
        minCoordinationEfficiency: number;
        maxConflicts: number;
    };
    enableAlerts: boolean;
    enableMetrics: boolean;
}
export interface Alert {
    id: string;
    sessionId: string;
    type: "health" | "performance" | "resource" | "coordination";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    timestamp: number;
    resolved: boolean;
    resolvedAt?: number;
}
export declare class SessionMonitor {
    private stateManager;
    private sessionCoordinator;
    private cleanupManager;
    private config;
    private healthChecks;
    private metricsHistory;
    private activeAlerts;
    private healthCheckInterval?;
    private metricsInterval?;
    constructor(stateManager: StringRayStateManager, sessionCoordinator: SessionCoordinator, cleanupManager: SessionCleanupManager, config?: Partial<MonitorConfig>);
    private initialize;
    registerSession(sessionId: string): void;
    unregisterSession(sessionId: string): void;
    performHealthCheck(sessionId: string): Promise<SessionHealth>;
    collectMetrics(sessionId: string): SessionMetrics | null;
    getHealthStatus(sessionId: string): SessionHealth | null;
    getMetricsHistory(sessionId: string, limit?: number): SessionMetrics[];
    getActiveAlerts(sessionId?: string): Alert[];
    resolveAlert(alertId: string): boolean;
    getMonitoringStats(): {
        totalSessions: number;
        healthySessions: number;
        degradedSessions: number;
        criticalSessions: number;
        activeAlerts: number;
        totalMetricsPoints: number;
    };
    private startHealthChecks;
    private startMetricsCollection;
    private generateAlerts;
    private loadPersistedData;
    private persistHealthData;
    private persistMetricsData;
    private persistAlertData;
    shutdown(): void;
    private calculateSessionMemoryUsage;
    private countSessionConflicts;
    private calculateAverageResponseTime;
}
export declare const createSessionMonitor: (stateManager: StringRayStateManager, sessionCoordinator: SessionCoordinator, cleanupManager: SessionCleanupManager, config?: Partial<MonitorConfig>) => SessionMonitor;
//# sourceMappingURL=session-monitor.d.ts.map