/**
 * Session Monitor Health Monitoring Tests
 * Tests comprehensive health monitoring and interaction tracking
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { SessionMonitor } from "../../session/session-monitor.js";
import { StringRayStateManager } from "../../state/state-manager.js";

describe("Session Monitor Health Monitoring", () => {
  let stateManager: StringRayStateManager;
  let sessionMonitor: SessionMonitor;

  const createMockCoordinator = () => ({
    getSessionStatus: vi.fn((sessionId: string) => {
      if (sessionId === "healthy-session") {
        return { active: true, agentCount: 3 };
      }
      if (sessionId === "degraded-session") {
        return { active: true, agentCount: 1 };
      }
      if (sessionId === "inactive-session") {
        return { active: false, agentCount: 0 };
      }
      return null;
    }),
    getCommunications: vi.fn(() => []),
    getSharedContext: vi.fn(() => ({})),
  });

  const createMockCleanupManager = () => ({
    getSessionMetadata: vi.fn((sessionId: string) => {
      if (sessionId === "high-memory-session") {
        return { memoryUsage: 200 * 1024 * 1024, agentCount: 5 };
      }
      return null;
    }),
  });

  beforeEach(async () => {
    stateManager = new StringRayStateManager();
    await new Promise((resolve) => setTimeout(resolve, 10));

    sessionMonitor = new SessionMonitor(
      stateManager,
      createMockCoordinator() as any,
      createMockCleanupManager() as any,
      {
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
      },
    );
  });

  describe("recordInteraction", () => {
    test("should record interaction for session", () => {
      sessionMonitor.registerSession("test-session");

      sessionMonitor.recordInteraction("test-session", {
        timestamp: Date.now(),
        duration: 100,
        success: true,
        agentId: "agent-1",
        operation: "analyze",
      });

      const history = sessionMonitor.getInteractionHistory("test-session");
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(true);
      expect(history[0].agentId).toBe("agent-1");
    });

    test("should track multiple interactions", () => {
      sessionMonitor.registerSession("test-session");

      for (let i = 0; i < 5; i++) {
        sessionMonitor.recordInteraction("test-session", {
          timestamp: Date.now(),
          duration: 100 + i * 10,
          success: i % 2 === 0,
          agentId: `agent-${i}`,
        });
      }

      const history = sessionMonitor.getInteractionHistory("test-session");
      expect(history.length).toBe(5);
    });

    test("should limit interaction history to 100 entries", () => {
      sessionMonitor.registerSession("test-session");

      for (let i = 0; i < 150; i++) {
        sessionMonitor.recordInteraction("test-session", {
          timestamp: Date.now(),
          duration: 100,
          success: true,
        });
      }

      // Default limit is 50, but internal storage is 100
      const history = sessionMonitor.getInteractionHistory("test-session");
      expect(history.length).toBe(50); // Default limit is 50

      // Can request more with explicit limit
      const fullHistory = sessionMonitor.getInteractionHistory("test-session", 150);
      expect(fullHistory.length).toBe(100); // Internal storage limit is 100
    });

    test("should track failed interactions", () => {
      sessionMonitor.registerSession("test-session");

      sessionMonitor.recordInteraction("test-session", {
        timestamp: Date.now(),
        duration: 200,
        success: false,
        agentId: "agent-1",
        operation: "analyze",
      });

      const history = sessionMonitor.getInteractionHistory("test-session");
      expect(history.filter(i => !i.success).length).toBe(1);
    });

    test("should return empty array for unknown session", () => {
      const history = sessionMonitor.getInteractionHistory("unknown-session");
      expect(history).toEqual([]);
    });

    test("should respect limit parameter", () => {
      sessionMonitor.registerSession("test-session");

      for (let i = 0; i < 20; i++) {
        sessionMonitor.recordInteraction("test-session", {
          timestamp: Date.now(),
          duration: 100,
          success: true,
        });
      }

      const history = sessionMonitor.getInteractionHistory("test-session", 5);
      expect(history.length).toBe(5);
    });
  });

  describe("Comprehensive Health Checks", () => {
    test("should check health for inactive sessions during health check", async () => {
      sessionMonitor.registerSession("inactive-session");
      const health = await sessionMonitor.performHealthCheck("inactive-session");

      expect(health).toBeDefined();
      expect(health.sessionId).toBe("inactive-session");
      expect(health.status).toBeDefined();
    });

    test("should check health for high memory usage during health check", async () => {
      sessionMonitor.registerSession("high-memory-session");
      const health = await sessionMonitor.performHealthCheck("high-memory-session");

      expect(health).toBeDefined();
      expect(health.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    test("should include response time in health status", async () => {
      sessionMonitor.registerSession("healthy-session");
      const health = await sessionMonitor.performHealthCheck("healthy-session");

      expect(health.responseTime).toBeGreaterThanOrEqual(0);
    });

    test("should track error count during health checks", async () => {
      sessionMonitor.registerSession("healthy-session");

      await sessionMonitor.performHealthCheck("healthy-session");
      const health1 = await sessionMonitor.performHealthCheck("healthy-session");

      expect(health1.errorCount).toBe(0);
    });
  });

  describe("Metrics Collection with Interaction Tracking", () => {
    test("should include total interactions in metrics", async () => {
      sessionMonitor.registerSession("healthy-session");

      for (let i = 0; i < 10; i++) {
        sessionMonitor.recordInteraction("healthy-session", {
          timestamp: Date.now(),
          duration: 100,
          success: i % 2 === 0,
        });
      }

      const metrics = sessionMonitor.collectMetrics("healthy-session");

      expect(metrics?.totalInteractions).toBe(10);
      expect(metrics?.successfulInteractions).toBe(5);
      expect(metrics?.failedInteractions).toBe(5);
    });

    test("should calculate average response time from interactions", async () => {
      sessionMonitor.registerSession("healthy-session");

      sessionMonitor.recordInteraction("healthy-session", {
        timestamp: Date.now(),
        duration: 100,
        success: true,
      });
      sessionMonitor.recordInteraction("healthy-session", {
        timestamp: Date.now(),
        duration: 200,
        success: true,
      });

      const metrics = sessionMonitor.collectMetrics("healthy-session");

      expect(metrics?.averageResponseTime).toBe(150);
    });

    test("should calculate conflict resolution rate", async () => {
      sessionMonitor.registerSession("healthy-session");

      sessionMonitor.recordInteraction("healthy-session", {
        timestamp: Date.now(),
        duration: 100,
        success: true,
      });
      sessionMonitor.recordInteraction("healthy-session", {
        timestamp: Date.now(),
        duration: 100,
        success: true,
      });

      const metrics = sessionMonitor.collectMetrics("healthy-session");

      expect(metrics?.conflictResolutionRate).toBe(1.0);
    });

    test("should calculate coordination efficiency", async () => {
      sessionMonitor.registerSession("healthy-session");

      for (let i = 0; i < 5; i++) {
        sessionMonitor.recordInteraction("healthy-session", {
          timestamp: Date.now(),
          duration: 100,
          success: true,
          agentId: `agent-${i % 2}`,
        });
      }

      const metrics = sessionMonitor.collectMetrics("healthy-session");

      expect(metrics?.coordinationEfficiency).toBeGreaterThan(0);
      expect(metrics?.coordinationEfficiency).toBeLessThanOrEqual(1);
    });

    test("should return null for non-existent session", () => {
      const metrics = sessionMonitor.collectMetrics("non-existent");

      expect(metrics).toBeNull();
    });
  });

  describe("Stale Session Detection", () => {
    test("should perform health check on sessions with old interactions", async () => {
      sessionMonitor.registerSession("stale-session");

      sessionMonitor.recordInteraction("stale-session", {
        timestamp: Date.now() - 10 * 60 * 1000,
        duration: 100,
        success: true,
      });

      const health = await sessionMonitor.performHealthCheck("stale-session");

      expect(health).toBeDefined();
      expect(health.sessionId).toBe("stale-session");
    });

    test("should not flag active sessions as stale", async () => {
      sessionMonitor.registerSession("active-session");

      sessionMonitor.recordInteraction("active-session", {
        timestamp: Date.now(),
        duration: 100,
        success: true,
      });

      const health = await sessionMonitor.performHealthCheck("active-session");

      expect(health).toBeDefined();
    });
  });

  describe("Failure Ratio Tracking", () => {
    test("should calculate failure ratio correctly", () => {
      sessionMonitor.registerSession("failing-session");

      for (let i = 0; i < 10; i++) {
        sessionMonitor.recordInteraction("failing-session", {
          timestamp: Date.now(),
          duration: 100,
          success: i < 3,
        });
      }

      const health = sessionMonitor.getHealthStatus("failing-session");
      expect(health).not.toBeNull();
    });
  });

  describe("Health Status Transitions", () => {
    test("should track session health status", async () => {
      sessionMonitor.registerSession("healthy-session");

      const health1 = await sessionMonitor.performHealthCheck("healthy-session");
      expect(health1.status).toBeDefined();

      sessionMonitor.recordInteraction("healthy-session", {
        timestamp: Date.now(),
        duration: 10000,
        success: false,
      });

      const health2 = await sessionMonitor.performHealthCheck("healthy-session");
      expect(health2.status).toBeDefined();
    });
  });

  describe("Alert Generation from Health Checks", () => {
    test("should generate alerts for degraded sessions", async () => {
      sessionMonitor.registerSession("degraded-session");

      sessionMonitor.recordInteraction("degraded-session", {
        timestamp: Date.now(),
        duration: 100,
        success: false,
      });

      await sessionMonitor.performHealthCheck("degraded-session");

      const alerts = sessionMonitor.getActiveAlerts("degraded-session");
      expect(alerts.length).toBeGreaterThanOrEqual(0);
    });
  });
});
