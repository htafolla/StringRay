/**
 * StringRay AI v1.0.5 - Delegation System Integration Tests
 *
 * Tests the complete automatic multi-agent delegation system.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { StringRayStateManager } from "../../state/state-manager.js";
import {
  createAgentDelegator,
  createSessionCoordinator,
} from "../../delegation/index.js";

describe("StringRay Delegation System Integration", () => {
  let stateManager: StringRayStateManager;
  let agentDelegator: any;
  let sessionCoordinator: any;

  beforeEach(() => {
    vi.clearAllMocks();
    stateManager = new StringRayStateManager();
    agentDelegator = createAgentDelegator(stateManager);
    sessionCoordinator = createSessionCoordinator(stateManager);

    // Register mock agents for testing
    const mockAgent = {
      execute: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1)); // Small delay to ensure duration > 0
        return { result: "success" };
      }),
      getCapabilities: vi
        .fn()
        .mockReturnValue({ name: "test-architect", performance: 0.8 }),
    };
    stateManager.set("agent:test-architect", mockAgent);
    stateManager.set("agent:enforcer", mockAgent);
    stateManager.set("agent:architect", mockAgent);
    stateManager.set("agent:security-auditor", mockAgent);
  });

  describe("Session Management", () => {
    it("should initialize session with proper metadata", () => {
      const session = sessionCoordinator.initializeSession("test_session");

      expect(session).toBeDefined();
      expect(session.sessionId).toBe("test_session");
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.agentCount).toBeGreaterThan(0);
    });

    it("should track session status correctly", () => {
      sessionCoordinator.initializeSession("status_test");

      const status = sessionCoordinator.getSessionStatus("status_test");
      expect(status).toBeDefined();
      expect(status.active).toBe(true);
      expect(status.agentCount).toBeGreaterThan(0);
    });

    it("should cleanup session properly", () => {
      sessionCoordinator.initializeSession("cleanup_test");
      sessionCoordinator.cleanupSession("cleanup_test");

      const status = sessionCoordinator.getSessionStatus("cleanup_test");
      expect(status).toBeNull(); // Session should be completely removed after cleanup
    });
  });

  describe("Complexity Analysis", () => {
    it("should analyze simple operations correctly", async () => {
      const request = {
        operation: "format",
        description: "Format a single file",
        context: {
          files: ["utils.ts"],
          changeVolume: 10,
          dependencies: 0,
          riskLevel: "low" as const,
        },
      };

      const delegation = await agentDelegator.analyzeDelegation(request);

      expect(delegation.complexity.level).toBe("simple");
      expect(delegation.strategy).toBe("single-agent");
      expect(delegation.agents).toHaveLength(1);
    });

    it("should analyze complex operations correctly", async () => {
      const request = {
        operation: "refactor",
        description: "Refactor complex authentication module",
        context: {
          files: ["auth.ts", "user.ts", "permissions.ts", "database.ts"],
          changeVolume: 500,
          dependencies: 8,
          riskLevel: "high" as const,
        },
      };

      const delegation = await agentDelegator.analyzeDelegation(request);

      expect(delegation.complexity.level).toBe("complex");
      expect(delegation.strategy).toBe("multi-agent");
      expect(delegation.agents.length).toBeGreaterThan(1);
    });
  });

  describe("Agent Coordination", () => {
    it("should send and receive messages between agents", async () => {
      const session = sessionCoordinator.initializeSession("msg_test");

      await sessionCoordinator.sendMessage(
        session.sessionId,
        "architect",
        "enforcer",
        {
          type: "design_review",
          data: "Please review the architectural changes",
        },
      );

      const messages = sessionCoordinator.receiveMessages(
        session.sessionId,
        "enforcer",
      );
      expect(messages).toHaveLength(1);
      expect(messages[0].message.type).toBe("design_review");
    });

    it("should share and retrieve context data", async () => {
      const session = sessionCoordinator.initializeSession("context_test");

      sessionCoordinator.shareContext(
        session.sessionId,
        "design_decisions",
        {
          pattern: "observer",
          reasoning: "For loose coupling between auth components",
        },
        "architect",
      );

      const sharedData = sessionCoordinator.getSharedContext(
        session.sessionId,
        "design_decisions",
      );
      expect(sharedData).toBeDefined();
      expect(sharedData!.pattern).toBe("observer");
      expect(sharedData!.sharedBy).toBe("architect");
    });
  });

  describe("Conflict Resolution", () => {
    it("should resolve conflicts using majority vote", async () => {
      const session = sessionCoordinator.initializeSession("conflict_test");

      // Simulate conflicting recommendations
      sessionCoordinator.shareContext(
        session.sessionId,
        "recommendation",
        "Option A",
        "architect",
      );
      sessionCoordinator.shareContext(
        session.sessionId,
        "recommendation",
        "Option A",
        "enforcer",
      );
      sessionCoordinator.shareContext(
        session.sessionId,
        "recommendation",
        "Option B",
        "refactorer",
      );

      const resolved = sessionCoordinator.resolveConflict(
        session.sessionId,
        "recommendation",
        "majority_vote",
      );
      expect(resolved).toBe("Option A");
    });

    it("should resolve conflicts using expert priority", async () => {
      const session = sessionCoordinator.initializeSession("expert_test");

      sessionCoordinator.shareContext(
        session.sessionId,
        "security_review",
        "Approved",
        "security-auditor",
      );
      sessionCoordinator.shareContext(
        session.sessionId,
        "security_review",
        "Rejected",
        "architect",
      );

      const resolved = sessionCoordinator.resolveConflict(
        session.sessionId,
        "security_review",
        "expert_priority",
      );
      expect(resolved).toBe("Approved"); // Security expert takes priority
    });
  });

  describe("Performance and Monitoring", () => {
    it("should track delegation performance metrics", async () => {
      const request = {
        operation: "test",
        description: "Performance test",
        context: {
          files: ["test.ts"],
          changeVolume: 50,
          dependencies: 2,
          riskLevel: "medium" as const,
        },
      };

      const startTime = Date.now();

      // Analyze and then execute the delegation to generate performance metrics
      const delegation = await agentDelegator.analyzeDelegation(request);
      await agentDelegator.executeDelegation(delegation, request);

      const endTime = Date.now();

      const metrics = agentDelegator.getPerformanceMetrics();
      expect(metrics.totalDelegations).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within reasonable time
    });

    it("should maintain session performance under load", () => {
      // Create multiple sessions
      for (let i = 0; i < 10; i++) {
        sessionCoordinator.initializeSession(`perf_test_${i}`);
      }

      // All sessions should be active
      for (let i = 0; i < 10; i++) {
        const status = sessionCoordinator.getSessionStatus(`perf_test_${i}`);
        expect(status.active).toBe(true);
      }

      // Cleanup should work efficiently
      const cleanupStart = Date.now();
      for (let i = 0; i < 10; i++) {
        sessionCoordinator.cleanupSession(`perf_test_${i}`);
      }
      const cleanupTime = Date.now() - cleanupStart;

      expect(cleanupTime).toBeLessThan(100); // Should cleanup quickly
    });
  });
});
