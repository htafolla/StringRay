import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { StrRayStateManager } from "../../state/state-manager";
import { createSessionCoordinator } from "../../delegation/session-coordinator";
import { createSessionCleanupManager } from "../../session/session-cleanup-manager";
import { createSessionMonitor } from "../../session/session-monitor";
import { createSessionStateManager } from "../../session/session-state-manager";

describe("Session Lifecycle Management", () => {
  let stateManager: StrRayStateManager;
  let sessionCoordinator: any;
  let cleanupManager: any;
  let sessionMonitor: any;
  let stateManagerInstance: any;

  beforeEach(() => {
    stateManager = new StrRayStateManager();
    sessionCoordinator = createSessionCoordinator(stateManager);
    cleanupManager = createSessionCleanupManager(stateManager);
    sessionMonitor = createSessionMonitor(
      stateManager,
      sessionCoordinator,
      cleanupManager,
    );
    stateManagerInstance = createSessionStateManager(
      stateManager,
      sessionCoordinator,
    );
  });

  afterEach(() => {
    cleanupManager?.shutdown();
    sessionMonitor?.shutdown();
    stateManagerInstance?.shutdown();
  });

  describe("Session Creation and Initialization", () => {
    test("should create session with proper initialization", () => {
      const sessionId = "lifecycle-test-1";

      const session = sessionCoordinator.initializeSession(sessionId);
      expect(session).toBeDefined();
      expect(session.sessionId).toBe(sessionId);
      expect(session.active).toBe(true);
      expect(session.agentCount).toBe(8); // Default agents: enforcer, architect, orchestrator, bug-triage-specialist, code-reviewer, security-auditor, refactorer, test-architect
    });

    test("should register session with cleanup manager", () => {
      const sessionId = "lifecycle-test-2";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata).toBeDefined();
      expect(metadata?.sessionId).toBe(sessionId);
      expect(metadata?.isActive).toBe(true);
      expect(metadata?.createdAt).toBeGreaterThan(0);
    });

    test("should register session with monitor", () => {
      const sessionId = "lifecycle-test-3";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const health = sessionMonitor.getHealthStatus(sessionId);
      expect(health).toBeDefined();
      expect(health?.sessionId).toBe(sessionId);
      expect(health?.status).toBeDefined();
    });

    test("should initialize session with custom TTL", () => {
      const sessionId = "lifecycle-test-4";
      const customTtl = 60 * 60 * 1000;

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId, customTtl);

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata?.ttlMs).toBe(customTtl);
    });

    test("should handle duplicate session initialization", () => {
      const sessionId = "lifecycle-test-5";

      const session1 = sessionCoordinator.initializeSession(sessionId);
      const session2 = sessionCoordinator.initializeSession(sessionId);

      expect(session1).toBeDefined();
      expect(session2).toBeDefined();
      expect(session1.sessionId).toBe(session2.sessionId);
    });
  });

  describe("Session State Transitions", () => {
    test("should update session activity timestamp", async () => {
      const sessionId = "transition-test-1";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      // Small delay to ensure timestamps are different
      await new Promise((resolve) => setTimeout(resolve, 1));
      cleanupManager.updateActivity(sessionId);

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata?.lastActivity).toBeGreaterThan(metadata?.createdAt);
    });

    test("should handle session completion", () => {
      const sessionId = "transition-test-2";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, { isActive: false });

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata?.isActive).toBe(false);
    });

    test("should handle session failure and recovery", () => {
      const sessionId = "transition-test-3";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, {
        isActive: false,
        cleanupReason: "test failure",
      });

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata?.isActive).toBe(false);
      expect(metadata?.cleanupReason).toBe("test failure");
    });

    test("should update session metadata correctly", () => {
      const sessionId = "transition-test-4";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);

      const updates = {
        agentCount: 3,
        memoryUsage: 1024 * 1024,
        lastActivity: Date.now(),
      };

      cleanupManager.updateMetadata(sessionId, updates);

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata?.agentCount).toBe(updates.agentCount);
      expect(metadata?.memoryUsage).toBe(updates.memoryUsage);
      expect(metadata?.lastActivity).toBe(updates.lastActivity);
    });
  });

  describe("Session Termination and Cleanup", () => {
    test("should perform manual session cleanup", async () => {
      const sessionId = "cleanup-test-1";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const cleanupResult = await cleanupManager.manualCleanup(sessionId);
      expect(cleanupResult).toBe(true);

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata).toBeUndefined();
    });

    test("should cleanup session with custom reason", async () => {
      const sessionId = "cleanup-test-2";
      const reason = "user requested termination";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);

      const cleanupResult = await cleanupManager.manualCleanup(
        sessionId,
        reason,
      );
      expect(cleanupResult).toBe(true);

      const metadata = cleanupManager.getSessionMetadata(sessionId);
      expect(metadata).toBeUndefined();
    });

    test("should handle cleanup of non-existent session", async () => {
      const cleanupResult = await cleanupManager.manualCleanup(
        "non-existent-session",
      );
      expect(cleanupResult).toBe(true); // Cleanup succeeds for non-existent sessions
    });

    test("should perform emergency cleanup of all sessions", async () => {
      const sessionIds = ["emergency-1", "emergency-2", "emergency-3"];

      sessionIds.forEach((id) => {
        sessionCoordinator.initializeSession(id);
        cleanupManager.registerSession(id);
      });

      const cleanupResult = await cleanupManager.emergencyCleanup();
      expect(cleanupResult.sessionsCleaned).toBe(sessionIds.length);
      expect(cleanupResult.errors).toHaveLength(0);
    });

    test("should cleanup expired sessions automatically", async () => {
      const sessionId = "expired-test";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId, 100);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const cleanupResult = await cleanupManager.performCleanup();
      expect(cleanupResult.sessionsExpired).toBe(1);
    });
  });

  describe("Session Error Handling", () => {
    test("should handle session initialization errors gracefully", () => {
      expect(() => {
        sessionCoordinator.initializeSession("");
      }).toThrow();

      expect(() => {
        sessionCoordinator.initializeSession(null as any);
      }).toThrow();
    });

    test("should handle cleanup errors gracefully", async () => {
      const sessionId = "error-test-1";

      const result = await cleanupManager.manualCleanup(sessionId);
      expect(result).toBe(true); // Cleanup of non-existent session succeeds
    });

    test("should handle monitor registration errors", () => {
      const sessionId = "error-test-2";

      expect(() => {
        sessionMonitor.registerSession(sessionId);
      }).not.toThrow();
    });

    test("should handle health check errors", async () => {
      const sessionId = "error-test-3";

      sessionMonitor.registerSession(sessionId);

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health).toBeDefined();
      expect(health.status).toBe("critical"); // Session registered with monitor but not coordinator
    });
  });

  describe("Session Recovery Mechanisms", () => {
    test("should recover session state from persistence", () => {
      const sessionId = "recovery-test-1";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const newCleanupManager = createSessionCleanupManager(stateManager);
      const newSessionMonitor = createSessionMonitor(
        stateManager,
        sessionCoordinator,
        newCleanupManager,
      );

      const recoveredMetadata = newCleanupManager.getSessionMetadata(sessionId);
      expect(recoveredMetadata).toBeDefined();

      const recoveredHealth = newSessionMonitor.getHealthStatus(sessionId);
      expect(recoveredHealth).toBeDefined();

      newCleanupManager.shutdown();
      newSessionMonitor.shutdown();
    });

    test("should handle partial recovery failures", () => {
      const sessionId = "recovery-test-2";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);

      const newCleanupManager = createSessionCleanupManager(stateManager);

      const recoveredMetadata = newCleanupManager.getSessionMetadata(sessionId);
      expect(recoveredMetadata).toBeDefined();

      newCleanupManager.shutdown();
    });

    test("should maintain session isolation during recovery", () => {
      const sessionId1 = "recovery-test-3";
      const sessionId2 = "recovery-test-4";

      sessionCoordinator.initializeSession(sessionId1);
      sessionCoordinator.initializeSession(sessionId2);
      cleanupManager.registerSession(sessionId1);
      cleanupManager.registerSession(sessionId2);

      const newCleanupManager = createSessionCleanupManager(stateManager);

      const metadata1 = newCleanupManager.getSessionMetadata(sessionId1);
      const metadata2 = newCleanupManager.getSessionMetadata(sessionId2);

      expect(metadata1).toBeDefined();
      expect(metadata2).toBeDefined();
      expect(metadata1?.sessionId).not.toBe(metadata2?.sessionId);

      newCleanupManager.shutdown();
    });
  });

  describe("Session Performance and Monitoring", () => {
    test("should track session activity correctly", () => {
      const sessionId = "performance-test-1";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);

      const initialMetadata = cleanupManager.getSessionMetadata(sessionId);
      const initialActivity = initialMetadata?.lastActivity;

      cleanupManager.updateActivity(sessionId);

      const updatedMetadata = cleanupManager.getSessionMetadata(sessionId);
      expect(updatedMetadata?.lastActivity).toBeGreaterThanOrEqual(
        initialActivity!,
      );
    });

    test("should provide accurate cleanup statistics", () => {
      const stats = cleanupManager.getCleanupStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalSessions).toBe("number");
      expect(typeof stats.activeSessions).toBe("number");
      expect(typeof stats.expiredSessions).toBe("number");
      expect(typeof stats.idleSessions).toBe("number");
    });

    test("should provide accurate monitoring statistics", () => {
      const stats = sessionMonitor.getMonitoringStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalSessions).toBe("number");
      expect(typeof stats.healthySessions).toBe("number");
      expect(typeof stats.activeAlerts).toBe("number");
    });

    test("should collect metrics for active sessions", () => {
      const sessionId = "metrics-test-1";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      const metrics = sessionMonitor.collectMetrics(sessionId);
      expect(metrics).toBeDefined();
      expect(metrics?.sessionId).toBe(sessionId);
      expect(metrics?.timestamp).toBeGreaterThan(0);
    });
  });

  describe("Session Lifecycle Integration", () => {
    test("should handle complete session lifecycle", async () => {
      const sessionId = "integration-test-1";

      const session = sessionCoordinator.initializeSession(sessionId);
      expect(session.active).toBe(true);

      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateActivity(sessionId);
      cleanupManager.updateMetadata(sessionId, { agentCount: 2 });

      const health = await sessionMonitor.performHealthCheck(sessionId);
      expect(health.sessionId).toBe(sessionId);

      const metrics = sessionMonitor.collectMetrics(sessionId);
      expect(metrics?.sessionId).toBe(sessionId);

      const cleanupResult = await cleanupManager.manualCleanup(sessionId);
      expect(cleanupResult).toBe(true);

      const finalMetadata = cleanupManager.getSessionMetadata(sessionId);
      expect(finalMetadata).toBeUndefined();
    });

    test("should handle concurrent session operations", async () => {
      const sessionIds = ["concurrent-1", "concurrent-2", "concurrent-3"];

      sessionIds.forEach((id) => {
        sessionCoordinator.initializeSession(id);
        cleanupManager.registerSession(id);
        sessionMonitor.registerSession(id);
      });

      const operations = sessionIds.map(async (sessionId) => {
        cleanupManager.updateActivity(sessionId);
        const health = await sessionMonitor.performHealthCheck(sessionId);
        return health.sessionId;
      });

      const results = await Promise.all(operations);
      expect(results).toHaveLength(sessionIds.length);
      expect(results.sort()).toEqual(sessionIds.sort());
    });

    test("should maintain data consistency across lifecycle", () => {
      const sessionId = "consistency-test-1";

      sessionCoordinator.initializeSession(sessionId);
      cleanupManager.registerSession(sessionId);
      sessionMonitor.registerSession(sessionId);

      cleanupManager.updateMetadata(sessionId, { agentCount: 1 });
      cleanupManager.updateMetadata(sessionId, { memoryUsage: 512 });
      cleanupManager.updateActivity(sessionId);

      const finalMetadata = cleanupManager.getSessionMetadata(sessionId);
      expect(finalMetadata?.agentCount).toBe(1);
      expect(finalMetadata?.memoryUsage).toBe(512);
      expect(finalMetadata?.isActive).toBe(true);
    });
  });
});
