import { describe, it, expect, beforeEach } from "vitest";
import { SessionMonitor } from "../../session/session-monitor";
import { StrRayStateManager } from "../../state/state-manager";

describe("Session Health Monitoring - Real Metrics", () => {
  let stateManager: StrRayStateManager;
  let sessionMonitor: SessionMonitor;

  beforeEach(async () => {
    stateManager = new StrRayStateManager();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for initialization

    // Mock session coordinator with realistic data
    const mockCoordinator = {
      getSessionStatus: (sessionId: string) => {
        if (sessionId === "non-existent-session") {
          return null;
        }
        return {
          active: sessionId === "healthy-session",
          agentCount: sessionId === "healthy-session" ? 3 : 1,
        };
      },
      getCommunications: (sessionId: string) => {
        if (sessionId === "high-conflict-session") {
          return Array.from({ length: 20 }, (_, i) => ({
            from: `agent-${i % 3}`,
            to: `agent-${(i + 1) % 3}`,
            timestamp: Date.now() - i * 1000,
            encrypted: true,
          }));
        }
        return Array.from({ length: 10 }, (_, i) => ({
          from: `agent-${i % 2}`,
          to: `agent-${(i + 1) % 2}`,
          timestamp: Date.now() - i * 2000,
          encrypted: true,
        }));
      },
      getSharedContext: () => ({}),
    };

    // Mock cleanup manager
    const mockCleanupManager = {
      getSessionMetadata: () => null,
    };

    sessionMonitor = new SessionMonitor(
      stateManager,
      mockCoordinator as any,
      mockCleanupManager as any,
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

  describe("Memory Usage Calculation", () => {
    it("should calculate realistic memory usage for active sessions", async () => {
      const metrics = sessionMonitor.collectMetrics("healthy-session");

      // Verify collectMetrics returns data for existing session
      expect(metrics).not.toBeNull();
      expect(metrics!.memoryUsage).toBeGreaterThanOrEqual(0); // At least 0MB
      expect(metrics!.memoryUsage).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it("should return null for non-existent sessions", async () => {
      const metrics = sessionMonitor.collectMetrics("non-existent-session");

      expect(metrics).toBeNull();
    });
  });

  describe("Conflict Detection", () => {
    it("should detect conflict resolution rates", async () => {
      const conflictMetrics = sessionMonitor.collectMetrics(
        "high-conflict-session",
      );

      // Session metrics should be available
      expect(conflictMetrics).not.toBeNull();
      expect(conflictMetrics!.conflictResolutionRate).toBeGreaterThanOrEqual(0);
      expect(conflictMetrics!.conflictResolutionRate).toBeLessThanOrEqual(1.0);
    });

    it("should calculate conflict resolution rates from communication patterns", async () => {
      const metrics = sessionMonitor.collectMetrics("healthy-session");

      // Should have conflict resolution data
      expect(metrics).not.toBeNull();
      expect(metrics!.conflictResolutionRate).toBeGreaterThanOrEqual(0);
      expect(metrics!.conflictResolutionRate).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Response Time Analysis", () => {
    it("should calculate average response times", async () => {
      const metrics = sessionMonitor.collectMetrics("healthy-session");

      // Response time should be reasonable
      expect(metrics).not.toBeNull();
      expect(metrics!.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics!.averageResponseTime).toBeLessThan(10000); // Less than 10 seconds
    });
  });

  describe("Coordination Efficiency", () => {
    it("should measure coordination efficiency", async () => {
      const metrics = sessionMonitor.collectMetrics("healthy-session");

      expect(metrics).not.toBeNull();
      expect(metrics!.coordinationEfficiency).toBeGreaterThanOrEqual(0);
      expect(metrics!.coordinationEfficiency).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Health Status Access", () => {
    it("should provide health status for existing sessions", async () => {
      // Register the session first
      sessionMonitor.registerSession("healthy-session");

      const health = sessionMonitor.getHealthStatus("healthy-session");

      expect(health).not.toBeNull();
      expect(health!.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(["healthy", "degraded", "critical", "unknown"]).toContain(
        health!.status,
      );
    });

    it("should return null for non-existent sessions", async () => {
      const health = sessionMonitor.getHealthStatus("non-existent-session");

      expect(health).toBeNull();
    });
  });

  describe("Metrics History", () => {
    it("should maintain metrics history", async () => {
      // Collect metrics multiple times
      sessionMonitor.collectMetrics("healthy-session");
      sessionMonitor.collectMetrics("healthy-session");

      const history = sessionMonitor.getMetricsHistory("healthy-session");

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].sessionId).toBe("healthy-session");
    });
  });
});
