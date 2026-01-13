/**
 * StrRay Framework v1.0.0 - Session Monitor
 *
 * Provides real-time monitoring of sessions with health checks,
 * performance tracking, and alerting capabilities.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StrRayStateManager } from "../state/state-manager";
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

export class SessionMonitor {
  private stateManager: StrRayStateManager;
  private sessionCoordinator: SessionCoordinator;
  private cleanupManager: SessionCleanupManager | undefined;
  private config: MonitorConfig;
  private healthChecks = new Map<string, SessionHealth>();
  private metricsHistory = new Map<string, SessionMetrics[]>();
  private activeAlerts = new Map<string, Alert>();
  private healthCheckInterval?: NodeJS.Timeout | undefined;
  private metricsInterval?: NodeJS.Timeout | undefined;

  constructor(
    stateManager: StrRayStateManager,
    sessionCoordinator: SessionCoordinator,
    cleanupManager: SessionCleanupManager,
    config: Partial<MonitorConfig> = {},
  ) {
    this.stateManager = stateManager;
    this.sessionCoordinator = sessionCoordinator;
    this.cleanupManager = cleanupManager;
    this.config = {
      healthCheckIntervalMs: 30000,
      metricsCollectionIntervalMs: 60000,
  alertThresholds: {
    maxResponseTime: 5000,
    maxErrorRate: 0.1,
    maxMemoryUsage: 100 * 1024 * 1024,
    minCoordinationEfficiency: 0.8,
    maxConflicts: 10,
  },
      enableAlerts: true,
      enableMetrics: true,
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    console.log("📊 Session Monitor: Initializing...");

    this.loadPersistedData();

    if (this.config.enableAlerts) {
      this.startHealthChecks();
    }

    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    console.log("✅ Session Monitor: Initialized");
  }

  registerSession(sessionId: string): void {
    const health: SessionHealth = {
      sessionId,
      status: "unknown",
      lastCheck: 0,
      responseTime: 0,
      errorCount: 0,
      activeAgents: 0,
      memoryUsage: 0,
      issues: [],
    };

    this.healthChecks.set(sessionId, health);
    this.metricsHistory.set(sessionId, []);
    this.persistHealthData();

    console.log(`📊 Session Monitor: Registered session ${sessionId}`);
  }

  unregisterSession(sessionId: string): void {
    this.healthChecks.delete(sessionId);
    this.metricsHistory.delete(sessionId);

    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.sessionId === sessionId) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
      }
    }

    this.persistHealthData();
    console.log(`📊 Session Monitor: Unregistered session ${sessionId}`);
  }

  async performHealthCheck(sessionId: string): Promise<SessionHealth> {
    const startTime = Date.now();
    const health = this.healthChecks.get(sessionId);

    if (!health) {
      throw new Error(`Session ${sessionId} not registered for monitoring`);
    }

    const issues: string[] = [];
    let status: SessionHealth["status"] = "healthy";

    try {
      const sessionStatus = this.sessionCoordinator.getSessionStatus(sessionId);
      if (!sessionStatus) {
        // Session was cleaned up but monitor wasn't notified - auto-unregister silently
        console.log(
          `🧹 Session Monitor: Auto-unregistering cleaned up session ${sessionId}`,
        );
        this.unregisterSession(sessionId);
        // Return a basic health status for the cleaned up session
        return {
          sessionId,
          status: "unknown" as const,
          lastCheck: Date.now(),
          responseTime: 0,
          errorCount: 0,
          activeAgents: 0,
          memoryUsage: 0,
          issues: ["Session was cleaned up"],
        };
      } else {
        health.activeAgents = sessionStatus.agentCount;

        // Simplified health checks for now
        // TODO: Implement comprehensive session health monitoring
      }

      const metadata = this.cleanupManager?.getSessionMetadata(sessionId);
      if (metadata) {
        health.memoryUsage = metadata.memoryUsage;
        health.activeAgents = metadata.agentCount;

        if (metadata.memoryUsage > this.config.alertThresholds.maxMemoryUsage) {
          issues.push(
            `High memory usage: ${Math.round(metadata.memoryUsage / 1024 / 1024)}MB`,
          );
          status = "degraded";
        }
      } else {
        // Calculate real session metrics when metadata not available
        health.memoryUsage = this.calculateSessionMemoryUsage(sessionId);
        health.activeAgents = sessionStatus.agentCount;
      }

      // Check for coordination issues
      const conflictCount = this.countSessionConflicts(sessionId);
      if (conflictCount > this.config.alertThresholds.maxConflicts) {
        issues.push(`High conflict rate: ${conflictCount} unresolved conflicts`);
        status = "degraded";
      }

      // Check for communication delays
      const avgResponseTime = this.calculateAverageResponseTime(sessionId);
      if (avgResponseTime > this.config.alertThresholds.maxResponseTime) {
        issues.push(`Slow response time: ${avgResponseTime}ms average`);
        status = "degraded";
      }
    } catch (error) {
      issues.push(`Health check failed: ${error}`);
      status = "critical";
      health.errorCount++;
    }

    const responseTime = Date.now() - startTime;

    if (responseTime > this.config.alertThresholds.maxResponseTime) {
      issues.push(`Slow response time: ${responseTime}ms`);
      status = "degraded";
    }

    health.status = status;
    health.lastCheck = Date.now();
    health.responseTime = responseTime;
    health.issues = issues;

    this.persistHealthData();

    if (issues.length > 0 && this.config.enableAlerts) {
      this.generateAlerts(sessionId, issues, status);
    }

    return { ...health };
  }

  collectMetrics(sessionId: string): SessionMetrics | null {
    const sessionStatus = this.sessionCoordinator.getSessionStatus(sessionId);
    if (!sessionStatus) return null;

    const metadata = this.cleanupManager?.getSessionMetadata(sessionId);

    const metrics: SessionMetrics = {
      timestamp: Date.now(),
      sessionId,
      totalInteractions: 0, // TODO: Implement interaction tracking
      successfulInteractions: 0,
      failedInteractions: 0,
      averageResponseTime: 0,
      conflictResolutionRate: 1.0, // Simplified
      coordinationEfficiency: 1.0,
      memoryUsage: metadata?.memoryUsage || 0,
      agentCount: sessionStatus.agentCount,
    };

    const history = this.metricsHistory.get(sessionId) || [];
    history.push(metrics);

    if (history.length > 100) {
      history.shift();
    }

    this.metricsHistory.set(sessionId, history);
    this.persistMetricsData();

    return metrics;
  }

  getHealthStatus(sessionId: string): SessionHealth | null {
    return this.healthChecks.get(sessionId) || null;
  }

  getMetricsHistory(sessionId: string, limit = 50): SessionMetrics[] {
    const history = this.metricsHistory.get(sessionId) || [];
    return history.slice(-limit);
  }

  getActiveAlerts(sessionId?: string): Alert[] {
    const alerts = Array.from(this.activeAlerts.values());
    if (sessionId) {
      return alerts.filter((alert) => alert.sessionId === sessionId);
    }
    return alerts;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertId);
      this.persistAlertData();
      console.log(`📊 Session Monitor: Resolved alert ${alertId}`);
      return true;
    }
    return false;
  }

  getMonitoringStats(): {
    totalSessions: number;
    healthySessions: number;
    degradedSessions: number;
    criticalSessions: number;
    activeAlerts: number;
    totalMetricsPoints: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let critical = 0;

    for (const health of this.healthChecks.values()) {
      switch (health.status) {
        case "healthy":
          healthy++;
          break;
        case "degraded":
          degraded++;
          break;
        case "critical":
          critical++;
          break;
      }
    }

    let totalMetrics = 0;
    for (const history of this.metricsHistory.values()) {
      totalMetrics += history.length;
    }

    return {
      totalSessions: this.healthChecks.size,
      healthySessions: healthy,
      degradedSessions: degraded,
      criticalSessions: critical,
      activeAlerts: this.activeAlerts.size,
      totalMetricsPoints: totalMetrics,
    };
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const sessionId of this.healthChecks.keys()) {
        try {
          await this.performHealthCheck(sessionId);
        } catch (error) {
          console.error(
            `❌ Session Monitor: Health check failed for ${sessionId}:`,
            error,
          );
        }
      }
    }, this.config.healthCheckIntervalMs);

    console.log(
      `⏰ Session Monitor: Health checks started (interval: ${this.config.healthCheckIntervalMs}ms)`,
    );
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      for (const sessionId of this.metricsHistory.keys()) {
        try {
          this.collectMetrics(sessionId);
        } catch (error) {
          console.error(
            `❌ Session Monitor: Metrics collection failed for ${sessionId}:`,
            error,
          );
        }
      }
    }, this.config.metricsCollectionIntervalMs);

    console.log(
      `⏰ Session Monitor: Metrics collection started (interval: ${this.config.metricsCollectionIntervalMs}ms)`,
    );
  }

  private generateAlerts(
    sessionId: string,
    issues: string[],
    status: SessionHealth["status"],
  ): void {
    const severity =
      status === "critical" ? "high" : status === "degraded" ? "medium" : "low";

    for (const issue of issues) {
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        type: "health",
        severity,
        message: issue,
        timestamp: Date.now(),
        resolved: false,
      };

      this.activeAlerts.set(alert.id, alert);
      console.log(
        `🚨 Session Monitor: Alert generated for ${sessionId}: ${issue}`,
      );
    }

    this.persistAlertData();
  }

  private loadPersistedData(): void {
    const healthData =
      this.stateManager.get<Record<string, SessionHealth>>("monitor:health");
    if (healthData) {
      for (const [sessionId, health] of Object.entries(healthData)) {
        this.healthChecks.set(sessionId, health);
      }
    }

    const metricsData =
      this.stateManager.get<Record<string, SessionMetrics[]>>(
        "monitor:metrics",
      );
    if (metricsData) {
      for (const [sessionId, history] of Object.entries(metricsData)) {
        this.metricsHistory.set(sessionId, history);
      }
    }

    const alertData =
      this.stateManager.get<Record<string, Alert>>("monitor:alerts");
    if (alertData) {
      for (const [alertId, alert] of Object.entries(alertData)) {
        this.activeAlerts.set(alertId, alert);
      }
    }
  }

  private persistHealthData(): void {
    const healthData = Object.fromEntries(this.healthChecks);
    this.stateManager.set("monitor:health", healthData);
  }

  private persistMetricsData(): void {
    const metricsData = Object.fromEntries(this.metricsHistory);
    this.stateManager.set("monitor:metrics", metricsData);
  }

  private persistAlertData(): void {
    const alertData = Object.fromEntries(this.activeAlerts);
    this.stateManager.set("monitor:alerts", alertData);
  }

  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    console.log("🛑 Session Monitor: Shutdown complete");
  }

  private calculateSessionMemoryUsage(sessionId: string): number {
    // Estimate memory usage based on session activity
    const metrics = this.collectMetrics(sessionId);
    if (!metrics) return 0;

    // Base memory + per-interaction overhead
    const baseMemory = 1024 * 1024; // 1MB base
    const perInteractionMemory = 8 * 1024; // 8KB per interaction
    const totalInteractions = metrics.totalInteractions;

    return baseMemory + (totalInteractions * perInteractionMemory);
  }

  private countSessionConflicts(sessionId: string): number {
    // Estimate conflicts based on failed interactions
    const metrics = this.collectMetrics(sessionId);
    if (!metrics) return 0;

    // Conflicts are estimated as failed interactions that might indicate coordination issues
    return Math.floor(metrics.failedInteractions * 0.1); // Assume 10% of failures are conflicts
  }

  private calculateAverageResponseTime(sessionId: string): number {
    // Calculate average response time from recent metrics
    const history = this.getMetricsHistory(sessionId, 10); // Last 10 metrics
    if (history.length === 0) return 0;

    const totalResponseTime = history.reduce((sum, metric) => {
      // Estimate response time based on coordination efficiency
      // This is a simplified calculation
      return sum + (metric.successfulInteractions > 0 ?
        1000 / metric.successfulInteractions : 1000);
    }, 0);

    return totalResponseTime / history.length;
  }
}

export const createSessionMonitor = (
  stateManager: StrRayStateManager,
  sessionCoordinator: SessionCoordinator,
  cleanupManager: SessionCleanupManager,
  config?: Partial<MonitorConfig>,
): SessionMonitor => {
  return new SessionMonitor(
    stateManager,
    sessionCoordinator,
    cleanupManager,
    config,
  );
};
