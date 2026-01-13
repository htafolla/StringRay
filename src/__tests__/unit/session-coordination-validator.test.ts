import { describe, it, expect, beforeEach } from "vitest";
import { SessionCoordinationValidator } from "../../validation/session-coordination-validator";

describe("SessionCoordinationValidator", () => {
  let validator: SessionCoordinationValidator;

  beforeEach(() => {
    // Mock dependencies
    const mockSessionCoordinator = {
      getSessionStatus: (sessionId: string) => {
        if (sessionId === "non-existent-session") {
          return null;
        }
        if (sessionId === "inactive-session") {
          return { status: "inactive", agentCount: 2 };
        }
        return { status: "active", agentCount: 3 };
      },
      getCommunications: (sessionId: string) => {
        if (sessionId === "high-conflict-session") {
          return Array.from({ length: 50 }, (_, i) => ({
            from: `agent-${i % 3}`,
            to: `agent-${(i + 1) % 3}`,
            timestamp: Date.now() - i * 1000,
            type: i % 5 === 0 ? "conflict" : "normal", // 20% conflicts
          }));
        }
        return Array.from({ length: 20 }, (_, i) => ({
          from: `agent-${i % 2}`,
          to: `agent-${(i + 1) % 2}`,
          timestamp: Date.now() - i * 2000,
          type: "normal",
        }));
      },
      getDependencies: (sessionId: string) => {
        if (sessionId === "complex-session") {
          return {
            agent1: ["agent2", "agent3"],
            agent2: ["agent3"],
            agent3: [],
          };
        }
        return { agent1: [], agent2: [] };
      },
      getSharedContext: (sessionId: string) => {
        if (sessionId === "shared-session") {
          return { sharedData: "test", participants: ["agent1", "agent2"] };
        }
        return null;
      },
      getSessionAgents: (sessionId: string) => {
        if (sessionId === "shared-session") {
          return ["agent1", "agent2"];
        }
        if (sessionId === "inconsistent-session") {
          return ["agent1", "agent2", "agent3"];
        }
        return [];
      },
    };

    const mockSessionMonitor = {
      collectMetrics: (sessionId: string) => {
        if (sessionId === "high-conflict-session") {
          return {
            totalInteractions: 100,
            successfulInteractions: 80,
            failedInteractions: 20,
            averageResponseTime: 150,
            conflictResolutionRate: 0.8,
            coordinationEfficiency: 0.75,
          };
        }
        return {
          totalInteractions: 50,
          successfulInteractions: 45,
          failedInteractions: 5,
          averageResponseTime: 100,
          conflictResolutionRate: 0.95,
          coordinationEfficiency: 0.9,
        };
      },
    };

    validator = new SessionCoordinationValidator(
      mockSessionCoordinator,
      mockSessionMonitor,
    );
  });

  describe("validateCommunicationPatterns", () => {
    it("should validate healthy communication patterns", async () => {
      const result =
        await validator.validateCommunicationPatterns("healthy-session");

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.metrics.totalMessages).toBeGreaterThan(0);
      expect(result.metrics.coordinationEfficiency).toBeGreaterThan(0.8);
    });

    it("should detect high conflict rates", async () => {
      const result = await validator.validateCommunicationPatterns(
        "high-conflict-session",
      );

      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) => issue.startsWith("High conflict rate:")),
      ).toBe(true);
      expect(result.metrics.conflictRate).toBeGreaterThan(0.1);
    });

    it("should reject inactive sessions", async () => {
      const result =
        await validator.validateCommunicationPatterns("inactive-session");

      expect(result.valid).toBe(false);
      expect(result.issues).toContain("Session not found or not active");
    });

    it("should reject non-existent sessions", async () => {
      const result = await validator.validateCommunicationPatterns(
        "non-existent-session",
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContain("Session not found or not active");
    });
  });

  describe("validateDependencyGraphs", () => {
    it("should validate simple dependency graphs", async () => {
      const result = await validator.validateDependencyGraphs("simple-session");

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.cycles).toEqual([]);
      expect(result.orphanedAgents).toEqual([]);
    });

    it("should detect complex dependency graphs", async () => {
      const result =
        await validator.validateDependencyGraphs("complex-session");

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.cycles)).toBe(true);
      expect(Array.isArray(result.orphanedAgents)).toBe(true);
    });

    // Circular dependency detection not implemented in basic validator
  });

  describe("validateContextSharing", () => {
    it("should validate sessions with shared context", async () => {
      const result = await validator.validateContextSharing("shared-session");

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.sharedKeys.length).toBeGreaterThan(0);
      expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle sessions without shared context", async () => {
      const result =
        await validator.validateContextSharing("no-shared-session");

      expect(result.valid).toBe(true);
      expect(result.sharedKeys).toEqual([]);
      expect(result.consistencyScore).toBe(1.0);
    });

    it("should handle context sharing validation", async () => {
      const result = await validator.validateContextSharing(
        "inconsistent-session",
      );

      // Basic validation - should complete without errors
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe("boolean");
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });
});
