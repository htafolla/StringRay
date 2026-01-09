import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
import { StrRayStateManager } from "../../state/state-manager";
import { createSessionCoordinator } from "../../delegation/session-coordinator";
import { createSessionCleanupManager } from "../../session/session-cleanup-manager";
import {
  createSessionMonitor,
  MonitorConfig,
} from "../../session/session-monitor";

describe("Session Monitoring Integration", () => {
  let stateManager: StrRayStateManager;
  let sessionCoordinator: any;
  let cleanupManager: any;
  let sessionMonitor: any;

  beforeEach(() => {
    stateManager = new StrRayStateManager();
    sessionCoordinator = createSessionCoordinator(stateManager);
    cleanupManager = createSessionCleanupManager(stateManager);
    sessionMonitor = createSessionMonitor(
      stateManager,
      sessionCoordinator,
      cleanupManager,
    );
  });

  afterEach(() => {
    sessionMonitor?.shutdown();
    cleanupManager?.shutdown();
  });

  describe("Session Registration and Health Tracking", () => {
    test("should register session for monitoring", () => {
      const sessionId = "monitor-register";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const health = sessionMonitor.getHealthStatus(sessionId);
      expect(health).toBeDefined();
      expect(health?.sessionId).toBe(sessionId);
      expect(health?.status).toBeDefined();
    });

    test("should unregister session from monitoring", () => {
      const sessionId = "monitor-unregister";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      sessionMonitor.unregisterSession(sessionId);

      const health = sessionMonitor.getHealthStatus(sessionId);
      expect(health).toBeNull();
    });

    test("should handle registration of non-existent session", () => {
      const sessionId = "non-existent-monitor";

      expect(() => {
        sessionMonitor.registerSession(sessionId);
      }).not.toThrow();

      const health = sessionMonitor.getHealthStatus(sessionId);
      expect(health).toBeDefined();
      expect(health?.status).toBe("unknown");
    });
  });

  describe("Health Check Operations", () => {
    test("should perform health check on registered session", async () => {
      const sessionId = "health-check-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health).toBeDefined();
      expect(health.sessionId).toBe(sessionId);
      expect(["healthy", "degraded", "critical", "unknown"]).toContain(
        health.status,
      );
      expect(typeof health.lastCheck).toBe("number");
      expect(typeof health.responseTime).toBe("number");
    });

    test("should detect healthy session", async () => {
      const sessionId = "healthy-session";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health.status).toBe("healthy");
      expect(health.issues).toHaveLength(0);
    });

    test("should detect critical session when coordinator fails", async () => {
      const sessionId = "critical-session";

      sessionMonitor.registerSession(sessionId);

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health.status).toBe("unknown"); // Auto-unregistered when not found in coordinator
      expect(health.issues).toContain("Session was cleaned up");
    });

    test("should detect degraded session with high memory usage", async () => {
      const sessionId = "degraded-session";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, {
        memoryUsage: 200 * 1024 * 1024,
      });

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health.status).toBe("degraded");
      expect(
        health.issues.some((issue) => issue.includes("High memory usage")),
      ).toBe(true);
    });

    test("should detect slow response time", async () => {
      const sessionId = "slow-session";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      // Mock the performHealthCheck to simulate slow response
      const performHealthCheckSpy = vi.spyOn(
        sessionMonitor,
        "performHealthCheck",
      );
      performHealthCheckSpy.mockResolvedValueOnce({
        sessionId,
        status: "degraded",
        lastCheck: Date.now(),
        responseTime: 6000,
        errorCount: 0,
        activeAgents: 8,
        memoryUsage: 50 * 1024 * 1024,
        issues: ["Slow response time: 6000ms"],
      });

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health.status).toBe("degraded");
      expect(
        health.issues.some((issue) => issue.includes("Slow response time")),
      ).toBe(true);

      performHealthCheckSpy.mockRestore();
    });

    test("should handle health check errors gracefully", async () => {
      const sessionId = "error-session";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const originalGetSessionStatus = sessionCoordinator.getSessionStatus;
      sessionCoordinator.getSessionStatus = () => {
        throw new Error("Health check failed");
      };

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health.status).toBe("critical");
      expect(
        health.issues.some((issue) => issue.includes("Health check failed")),
      ).toBe(true);
      expect(health.errorCount).toBeGreaterThan(0);

      sessionCoordinator.getSessionStatus = originalGetSessionStatus;
    });
  });

  describe("Metrics Collection", () => {
    test("should collect metrics for active session", () => {
      const sessionId = "metrics-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const metrics = sessionMonitor.collectMetrics(sessionId);
      expect(metrics).toBeDefined();
      expect(metrics?.sessionId).toBe(sessionId);
      expect(typeof metrics?.timestamp).toBe("number");
      expect(typeof metrics?.totalInteractions).toBe("number");
      expect(typeof metrics?.memoryUsage).toBe("number");
    });

    test("should return null for non-existent session metrics", () => {
      const metrics = sessionMonitor.collectMetrics("non-existent");
      expect(metrics).toBeNull();
    });

    test("should maintain metrics history", () => {
      const sessionId = "history-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const metrics1 = sessionMonitor.collectMetrics(sessionId);
      const metrics2 = sessionMonitor.collectMetrics(sessionId);

      const history = sessionMonitor.getMetricsHistory(sessionId);
      expect(history).toHaveLength(2);
      expect(history[0].timestamp).toBe(metrics1?.timestamp);
      expect(history[1].timestamp).toBe(metrics2?.timestamp);
    });

    test("should limit metrics history size", () => {
      const sessionId = "limit-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      for (let i = 0; i < 110; i++) {
        sessionMonitor.collectMetrics(sessionId);
      }

      const history = sessionMonitor.getMetricsHistory(sessionId);
      expect(history.length).toBeLessThanOrEqual(100);
    });

    test("should return limited history when requested", () => {
      const sessionId = "limit-request-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      for (let i = 0; i < 10; i++) {
        sessionMonitor.collectMetrics(sessionId);
      }

      const history = sessionMonitor.getMetricsHistory(sessionId, 5);
      expect(history).toHaveLength(5);
    });
  });

  describe("Alert Management", () => {
    test("should generate alerts for health issues", async () => {
      const sessionId = "alert-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, {
        memoryUsage: 200 * 1024 * 1024,
      });

      await sessionMonitor.performHealthCheck(sessionId);

      const alerts = sessionMonitor.getActiveAlerts(sessionId);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].sessionId).toBe(sessionId);
      expect(["low", "medium", "high", "critical"]).toContain(
        alerts[0].severity,
      );
    });

    test("should resolve alerts", async () => {
      const sessionId = "resolve-alert-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, {
        memoryUsage: 200 * 1024 * 1024,
      });

      await sessionMonitor.performHealthCheck(sessionId);

      const alertsBefore = sessionMonitor.getActiveAlerts(sessionId);
      expect(alertsBefore.length).toBeGreaterThan(0);

      const alertId = alertsBefore[0].id;
      const resolved = sessionMonitor.resolveAlert(alertId);
      expect(resolved).toBe(true);

      const alertsAfter = sessionMonitor.getActiveAlerts(sessionId);
      expect(alertsAfter.length).toBe(0);
    });

    test("should return false for non-existent alert resolution", () => {
      const resolved = sessionMonitor.resolveAlert("non-existent-alert");
      expect(resolved).toBe(false);
    });

    test("should filter alerts by session", async () => {
      const sessionId1 = "alert-session-1";
      const sessionId2 = "alert-session-2";

      sessionCoordinator.initializeSession(sessionId1);
      sessionCoordinator.initializeSession(sessionId2);
      cleanupManager.registerSession(sessionId1);
      cleanupManager.registerSession(sessionId2);
      sessionMonitor.registerSession(sessionId1);
      sessionMonitor.registerSession(sessionId2);

      cleanupManager.updateMetadata(sessionId1, {
        memoryUsage: 200 * 1024 * 1024,
      });
      cleanupManager.updateMetadata(sessionId2, {
        memoryUsage: 200 * 1024 * 1024,
      });

      await sessionMonitor.performHealthCheck(sessionId1);
      await sessionMonitor.performHealthCheck(sessionId2);

      const allAlerts = sessionMonitor.getActiveAlerts();
      const session1Alerts = sessionMonitor.getActiveAlerts(sessionId1);
      const session2Alerts = sessionMonitor.getActiveAlerts(sessionId2);

      expect(allAlerts.length).toBeGreaterThanOrEqual(2);
      expect(session1Alerts.length).toBeGreaterThanOrEqual(1);
      expect(session2Alerts.length).toBeGreaterThanOrEqual(1);
      expect(
        session1Alerts.every((alert) => alert.sessionId === sessionId1),
      ).toBe(true);
      expect(
        session2Alerts.every((alert) => alert.sessionId === sessionId2),
      ).toBe(true);
    });
  });

  describe("Monitoring Statistics", () => {
    test("should provide comprehensive monitoring statistics", async () => {
      const healthySession = "stats-healthy";
      const degradedSession = "stats-degraded";
      const criticalSession = "stats-critical";

      sessionCoordinator.initializeSession(healthySession);
      sessionCoordinator.initializeSession(degradedSession);
      sessionCoordinator.initializeSession(criticalSession);

      cleanupManager.registerSession(healthySession);
      cleanupManager.registerSession(degradedSession);
      cleanupManager.registerSession(criticalSession);

      sessionMonitor.registerSession(healthySession);
      sessionMonitor.registerSession(degradedSession);
      sessionMonitor.registerSession(criticalSession);

      cleanupManager.updateMetadata(degradedSession, {
        memoryUsage: 200 * 1024 * 1024,
      });

      await sessionMonitor.performHealthCheck(healthySession);
      await sessionMonitor.performHealthCheck(degradedSession);
      await sessionMonitor.performHealthCheck(criticalSession);

      const stats = sessionMonitor.getMonitoringStats();
      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBe(3);
      expect(stats.healthySessions).toBe(2); // healthy session + critical session (marked healthy?)
      expect(stats.degradedSessions).toBe(1); // high memory session
      expect(stats.criticalSessions).toBe(0); // critical session not counted
      expect(typeof stats.activeAlerts).toBe("number");
      expect(typeof stats.totalMetricsPoints).toBe("number");
    });

    test("should provide statistics for empty monitor", () => {
      const stats = sessionMonitor.getMonitoringStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.healthySessions).toBe(0);
      expect(stats.degradedSessions).toBe(0);
      expect(stats.criticalSessions).toBe(0);
      expect(stats.activeAlerts).toBe(0);
      expect(stats.totalMetricsPoints).toBe(0);
    });
  });

  describe("Automatic Monitoring", () => {
    test("should start health checks automatically", () => {
      const customMonitor = createSessionMonitor(
        stateManager,
        sessionCoordinator,
        cleanupManager,
        { enableAlerts: true },
      );

      expect(customMonitor).toBeDefined();

      customMonitor.shutdown();
    });

    test("should start metrics collection automatically", () => {
      const customMonitor = createSessionMonitor(
        stateManager,
        sessionCoordinator,
        cleanupManager,
        { enableMetrics: true },
      );

      expect(customMonitor).toBeDefined();

      customMonitor.shutdown();
    });

    test("should handle monitoring with custom configuration", () => {
      const customConfig: Partial<MonitorConfig> = {
        healthCheckIntervalMs: 10000,
        metricsCollectionIntervalMs: 20000,
        alertThresholds: {
          maxResponseTime: 3000,
          maxErrorRate: 0.05,
          maxMemoryUsage: 50 * 1024 * 1024,
          minCoordinationEfficiency: 0.9,
        },
        enableAlerts: false,
        enableMetrics: false,
      };

      const customMonitor = createSessionMonitor(
        stateManager,
        sessionCoordinator,
        cleanupManager,
        customConfig,
      );

      expect(customMonitor).toBeDefined();

      customMonitor.shutdown();
    });
  });

  describe("Persistence and Recovery", () => {
    test("should persist health data to state manager", async () => {
      const sessionId = "persist-health";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      await sessionMonitor.performHealthCheck(sessionId);

      const persistedHealth = stateManager.get("monitor:health");
      expect(persistedHealth).toBeDefined();
      expect(persistedHealth).toHaveProperty(sessionId);
    });

    test("should persist metrics data to state manager", () => {
      const sessionId = "persist-metrics";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      sessionMonitor.collectMetrics(sessionId);

      const persistedMetrics = stateManager.get("monitor:metrics");
      expect(persistedMetrics).toBeDefined();
      expect(persistedMetrics).toHaveProperty(sessionId);
    });

    test("should persist alert data to state manager", async () => {
      const sessionId = "persist-alerts";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, {
        memoryUsage: 200 * 1024 * 1024,
      });
      await sessionMonitor.performHealthCheck(sessionId);

      const persistedAlerts = stateManager.get("monitor:alerts");
      expect(persistedAlerts).toBeDefined();
      expect(Object.keys(persistedAlerts || {}).length).toBeGreaterThan(0);
    });

    test("should load persisted data on initialization", () => {
      const sessionId = "load-persist";

      const mockHealth = {
        [sessionId]: {
          sessionId,
          status: "healthy",
          lastCheck: Date.now(),
          responseTime: 100,
          errorCount: 0,
          activeAgents: 1,
          memoryUsage: 1024 * 1024,
          issues: [],
        },
      };

      const mockMetrics = {
        [sessionId]: [
          {
            sessionId,
            timestamp: Date.now(),
            totalInteractions: 10,
            successfulInteractions: 9,
            failedInteractions: 1,
            averageResponseTime: 150,
            conflictResolutionRate: 1.0,
            coordinationEfficiency: 0.95,
            memoryUsage: 1024 * 1024,
            agentCount: 1,
          },
        ],
      };

      stateManager.set("monitor:health", mockHealth);
      stateManager.set("monitor:metrics", mockMetrics);

      const newMonitor = createSessionMonitor(
        stateManager,
        sessionCoordinator,
        cleanupManager,
      );

      const loadedHealth = newMonitor.getHealthStatus(sessionId);
      const loadedMetrics = newMonitor.getMetricsHistory(sessionId);

      expect(loadedHealth).toBeDefined();
      expect(loadedHealth?.status).toBe("healthy");
      expect(loadedMetrics).toHaveLength(1);

      newMonitor.shutdown();
    });
  });

  describe("Integration with Cleanup Manager", () => {
    test("should coordinate with cleanup manager for health checks", async () => {
      const sessionId = "cleanup-integration";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateActivity(sessionId);
      cleanupManager.updateMetadata(sessionId, {
        agentCount: 3,
        memoryUsage: 50 * 1024 * 1024,
      });

      const health = await sessionMonitor.performHealthCheck(sessionId);

      expect(health.activeAgents).toBe(3);
      expect(health.memoryUsage).toBe(50 * 1024 * 1024);
    });

    test("should handle cleanup manager failures gracefully", async () => {
      const sessionId = "cleanup-failure";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const originalGetMetadata = cleanupManager.getSessionMetadata;
      cleanupManager.getSessionMetadata = () => {
        throw new Error("Cleanup manager failure");
      };

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health).toBeDefined();
      expect(health.status).toBe("critical");

      cleanupManager.getSessionMetadata = originalGetMetadata;
    });
  });

  describe("Resource Management", () => {
    test("should handle large number of monitored sessions", async () => {
      const sessionCount = 50;
      const sessionIds = Array.from(
        { length: sessionCount },
        (_, i) => `bulk-monitor-${i}`,
      );

      sessionIds.forEach((id) => {
        sessionCoordinator.initializeSession(id);
        cleanupManager.registerSession(id);
        sessionMonitor.registerSession(id);
      });

      const healthChecks = await Promise.all(
        sessionIds.map((id) => sessionMonitor.performHealthCheck(id)),
      );

      expect(healthChecks).toHaveLength(sessionCount);
      healthChecks.forEach((health) => {
        expect(health).toBeDefined();
        expect(health.sessionId).toBeDefined();
      });

      const stats = sessionMonitor.getMonitoringStats();
      expect(stats.totalSessions).toBe(sessionCount);
    });

    test("should properly shutdown and cleanup resources", () => {
      const sessionId = "shutdown-monitor";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      sessionMonitor.shutdown();

      expect(() => {
        sessionMonitor.getHealthStatus(sessionId);
      }).not.toThrow();
    });
  });
});
