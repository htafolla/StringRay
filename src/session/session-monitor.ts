/**
 * Session Monitor
 *
 * Provides real-time monitoring of sessions with health checks,
 * performance tracking, and alerting capabilities.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StringRayStateManager } from "../state/state-manager.js";
import { SessionCoordinator } from "../delegation/session-coordinator.js";
import { SessionCleanupManager } from "./session-cleanup-manager.js";
import { frameworkLogger } from "../core/framework-logger.js";

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

export interface InteractionRecord {
  timestamp: number;
  duration: number;
  success: boolean;
  agentId?: string;
  operation?: string;
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
  private stateManager: StringRayStateManager;
  private sessionCoordinator: SessionCoordinator;
  private cleanupManager: SessionCleanupManager | undefined;
  private config: MonitorConfig;
  private healthChecks = new Map<string, SessionHealth>();
  private metricsHistory = new Map<string, SessionMetrics[]>();
  private activeAlerts = new Map<string, Alert>();
  private healthCheckInterval?: NodeJS.Timeout | undefined;
  private metricsInterval?: NodeJS.Timeout | undefined;
  private interactionHistory = new Map<string, InteractionRecord[]>();
  private sessionResponseTimes = new Map<string, number[]>();
  private sessionErrors = new Map<string, number>();

  constructor(
    stateManager: StringRayStateManager,
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
    this.loadPersistedData();

    if (this.config.enableAlerts) {
      this.startHealthChecks();
    }

    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }
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

    frameworkLogger.log("session-monitor", "session-registered", "info", {
      sessionId,
    });
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
    frameworkLogger.log("session-monitor", "session-unregistered", "info", {
      sessionId,
    });
  }

  async performHealthCheck(sessionId: string): Promise<SessionHealth> {
    const jobId = `session-health-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        frameworkLogger.log(
          "session-monitor",
          "auto-unregister-cleaned-session",
          "info",
          { jobId, sessionId },
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

        this.performComprehensiveHealthChecks(sessionId, health, issues, sessionStatus);

        if (health.errorCount > 10) {
          issues.push(`High error count: ${health.errorCount} errors detected`);
          status = "degraded";
        }

        if (health.responseTime > this.config.alertThresholds.maxResponseTime * 2) {
          issues.push(`Critical response time: ${health.responseTime}ms (exceeded 2x threshold)`);
          status = "critical";
        }

        const recentInteractions = this.interactionHistory.get(sessionId) || [];
        const failedRatio = this.calculateFailureRatio(recentInteractions);
        if (failedRatio > this.config.alertThresholds.maxErrorRate) {
          issues.push(`High failure rate: ${(failedRatio * 100).toFixed(1)}% failed interactions`);
          status = status === "healthy" ? "degraded" : status;
        }
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
        issues.push(
          `High conflict rate: ${conflictCount} unresolved conflicts`,
        );
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
    const interactions = this.interactionHistory.get(sessionId) || [];
    const responseTimes = this.sessionResponseTimes.get(sessionId) || [];
    const errorCount = this.sessionErrors.get(sessionId) || 0;

    const successfulInteractions = interactions.filter(i => i.success).length;
    const failedInteractions = interactions.filter(i => !i.success).length;
    const totalInteractions = interactions.length;

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const conflictResolutionRate = this.calculateConflictResolutionRate(sessionId, interactions);
    const coordinationEfficiency = this.calculateCoordinationEfficiency(sessionId, interactions);

    const metrics: SessionMetrics = {
      timestamp: Date.now(),
      sessionId,
      totalInteractions,
      successfulInteractions,
      failedInteractions,
      averageResponseTime: avgResponseTime,
      conflictResolutionRate,
      coordinationEfficiency,
      memoryUsage: metadata?.memoryUsage || this.calculateSessionMemoryUsage(sessionId),
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
      frameworkLogger.log("session-monitor", "alert-resolved", "info", {
        alertId,
      });
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

    frameworkLogger.log("session-monitor", "health-checks-started", "info", {
      intervalMs: this.config.healthCheckIntervalMs,
    });
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

    frameworkLogger.log(
      "session-monitor",
      "metrics-collection-started",
      "info",
      { intervalMs: this.config.metricsCollectionIntervalMs },
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
      frameworkLogger.log("session-monitor", "alert-generated", "info", {
        sessionId,
        issue,
      });
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

    frameworkLogger.log("session-monitor", "shutdown-complete", "info");
  }

  /**
   * Record an interaction for tracking
   */
  recordInteraction(
    sessionId: string,
    interaction: InteractionRecord,
  ): void {
    if (!this.interactionHistory.has(sessionId)) {
      this.interactionHistory.set(sessionId, []);
    }

    const interactions = this.interactionHistory.get(sessionId)!;
    interactions.push(interaction);

    if (interactions.length > 100) {
      interactions.shift();
    }

    if (!this.sessionResponseTimes.has(sessionId)) {
      this.sessionResponseTimes.set(sessionId, []);
    }
    this.sessionResponseTimes.get(sessionId)!.push(interaction.duration);

    if (!interaction.success) {
      const currentErrors = this.sessionErrors.get(sessionId) || 0;
      this.sessionErrors.set(sessionId, currentErrors + 1);
    }

    this.persistInteractionData();
  }

  /**
   * Get interaction history for a session
   */
  getInteractionHistory(sessionId: string, limit = 50): InteractionRecord[] {
    const history = this.interactionHistory.get(sessionId) || [];
    return history.slice(-limit);
  }

  /**
   * Perform comprehensive health checks on a session
   */
  private performComprehensiveHealthChecks(
    sessionId: string,
    health: SessionHealth,
    issues: string[],
    sessionStatus: { active: boolean; agentCount: number },
  ): void {
    if (!sessionStatus.active) {
      issues.push("Session is not active");
      health.status = "degraded";
    }

    const interactions = this.interactionHistory.get(sessionId) || [];
    const recentWindow = interactions.slice(-20);
    const staleThreshold = 5 * 60 * 1000;

    if (recentWindow.length > 0) {
      const lastInteraction = recentWindow[recentWindow.length - 1];
      if (lastInteraction) {
        const timeSinceLastInteraction = Date.now() - lastInteraction.timestamp;

        if (timeSinceLastInteraction > staleThreshold) {
          issues.push(`Stale session: no activity for ${Math.round(timeSinceLastInteraction / 1000)}s`);
          health.status = "degraded";
        }
      }
    }

    const responseTimes = this.sessionResponseTimes.get(sessionId) || [];
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      if (avgResponseTime > this.config.alertThresholds.maxResponseTime * 1.5) {
        issues.push(`Elevated response time: ${avgResponseTime.toFixed(0)}ms average`);
      }
    }

    const coordinationEfficiency = this.calculateCoordinationEfficiency(sessionId, interactions);
    if (coordinationEfficiency < this.config.alertThresholds.minCoordinationEfficiency) {
      issues.push(`Low coordination efficiency: ${(coordinationEfficiency * 100).toFixed(0)}%`);
      health.status = "degraded";
    }
  }

  /**
   * Calculate failure ratio from interactions
   */
  private calculateFailureRatio(interactions: InteractionRecord[]): number {
    if (interactions.length === 0) return 0;
    const failures = interactions.filter(i => !i.success).length;
    return failures / interactions.length;
  }

  /**
   * Calculate conflict resolution rate from interactions
   */
  private calculateConflictResolutionRate(
    sessionId: string,
    interactions: InteractionRecord[],
  ): number {
    if (interactions.length === 0) return 1.0;

    const successfulInteractions = interactions.filter(i => i.success).length;
    return successfulInteractions / interactions.length;
  }

  /**
   * Calculate coordination efficiency from interactions
   */
  private calculateCoordinationEfficiency(
    sessionId: string,
    interactions: InteractionRecord[],
  ): number {
    if (interactions.length === 0) return 1.0;

    const successfulInteractions = interactions.filter(i => i.success).length;
    const baseEfficiency = successfulInteractions / interactions.length;

    const recentInteractions = interactions.slice(-10);
    const hasMultipleAgents = new Set(recentInteractions.map(i => i.agentId).filter(Boolean)).size > 1;
    const agentDiversityBonus = hasMultipleAgents ? 0.1 : 0;

    return Math.min(1.0, baseEfficiency + agentDiversityBonus);
  }

  private persistInteractionData(): void {
    const interactionData: Record<string, InteractionRecord[]> = {};
    for (const [sessionId, history] of this.interactionHistory) {
      interactionData[sessionId] = history;
    }
    this.stateManager.set("monitor:interactions", interactionData);
  }

  private calculateSessionMemoryUsage(sessionId: string): number {
    // Estimate memory usage based on session activity
    const interactions = this.interactionHistory.get(sessionId) || [];

    // Base memory + per-interaction overhead
    const baseMemory = 1024 * 1024; // 1MB base
    const perInteractionMemory = 8 * 1024; // 8KB per interaction
    const totalInteractions = interactions.length;

    return baseMemory + totalInteractions * perInteractionMemory;
  }

  private countSessionConflicts(sessionId: string): number {
    // Estimate conflicts based on failed interactions
    const interactions = this.interactionHistory.get(sessionId) || [];
    const failedInteractions = interactions.filter(i => !i.success).length;

    // Conflicts are estimated as failed interactions that might indicate coordination issues
    return Math.floor(failedInteractions * 0.1); // Assume 10% of failures are conflicts
  }

  private calculateAverageResponseTime(sessionId: string): number {
    // Calculate average response time from recent metrics
    const history = this.getMetricsHistory(sessionId, 10); // Last 10 metrics
    if (history.length === 0) return 0;

    const totalResponseTime = history.reduce((sum, metric) => {
      // Estimate response time based on coordination efficiency
      // This is a simplified calculation
      return (
        sum +
        (metric.successfulInteractions > 0
          ? 1000 / metric.successfulInteractions
          : 1000)
      );
    }, 0);

    return totalResponseTime / history.length;
  }
}

export const createSessionMonitor = (
  stateManager: StringRayStateManager,
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
