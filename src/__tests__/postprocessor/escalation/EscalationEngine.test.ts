/**
 * Tests for EscalationEngine
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EscalationEngine } from "../../../postprocessor/escalation/EscalationEngine";
import { PostProcessorContext } from "../../../postprocessor/types";

describe("EscalationEngine", () => {
  let engine: EscalationEngine;
  let mockContext: PostProcessorContext;

  beforeEach(() => {
    engine = new EscalationEngine();
    mockContext = {
      commitSha: "abc123",
      repository: "test/repo",
      branch: "main",
      author: "test-user",
      files: ["test.js"],
      trigger: "git-hook",
    };

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("evaluateEscalation", () => {
    it("should not escalate for low attempt counts", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        1,
        "Test error",
        [],
      );

      expect(result).toBeNull();
    });

    it("should escalate to manual-intervention at threshold", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        2,
        "Test error",
        [],
      );

      expect(result).not.toBeNull();
      expect(result?.level).toBe("manual-intervention");
      expect(result?.reason).toContain(
        "Manual intervention threshold exceeded",
      );
    });

    it("should escalate to rollback at higher threshold", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        3,
        "Test error",
        [],
      );

      expect(result).not.toBeNull();
      expect(result?.level).toBe("rollback");
      expect(result?.reason).toContain("Rollback threshold exceeded");
    });

    it("should escalate to emergency at critical threshold", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        5,
        "Test error",
        [],
      );

      expect(result).not.toBeNull();
      expect(result?.level).toBe("emergency");
      expect(result?.reason).toContain("Emergency threshold exceeded");
    });
  });

  describe("Incident Management", () => {
    it("should create and track incidents", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        3,
        "Test error",
        [],
      );

      expect(result?.incidentReport).toBeDefined();
      const incidentId = result!.incidentReport.id;

      const retrieved = engine.getIncidentReport(incidentId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.commitSha).toBe(mockContext.commitSha);
      expect(retrieved?.severity).toBe("high");
    });

    it("should resolve incidents", () => {
      // First create an incident
      engine.evaluateEscalation(mockContext, 3, "Test error", []);

      const incidents = engine.getActiveIncidents();
      expect(incidents.length).toBeGreaterThan(0);

      const incidentId = incidents[0].id;
      const resolved = engine.resolveIncident(
        incidentId,
        "Issue fixed manually",
      );

      expect(resolved).toBe(true);

      const retrieved = engine.getIncidentReport(incidentId);
      expect(retrieved?.resolution).toBe("Issue fixed manually");
    });

    it("should return active incidents only", async () => {
      // Create two incidents
      await engine.evaluateEscalation(mockContext, 3, "Error 1", []);
      await engine.evaluateEscalation(
        { ...mockContext, commitSha: "def456" },
        3,
        "Error 2",
        [],
      );

      const activeIncidents = engine.getActiveIncidents();
      expect(activeIncidents.length).toBe(2);

      // Resolve one
      const resolved = engine.resolveIncident(
        activeIncidents[0].id,
        "Resolved",
      );
      expect(resolved).toBe(true);

      const activeAfterResolve = engine.getActiveIncidents();
      expect(activeAfterResolve.length).toBe(1);
    });
  });

  describe("Alerting", () => {
    it.skip("should send alerts through configured channels", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await engine.evaluateEscalation(mockContext, 5, "Critical error", []);

      // Check that alert was sent (should contain the escalation message)
      expect(consoleSpy).toHaveBeenCalledWith("🚨 CI/CD Escalation: EMERGENCY");
    });
  });

  describe("Statistics", () => {
    it("should provide escalation statistics", async () => {
      await engine.evaluateEscalation(
        mockContext,
        2,
        "Manual intervention",
        [],
      );
      await engine.evaluateEscalation(
        { ...mockContext, commitSha: "def456" },
        3,
        "Rollback",
        [],
      );
      await engine.evaluateEscalation(
        { ...mockContext, commitSha: "ghi789" },
        5,
        "Emergency",
        [],
      );

      const stats = engine.getStats();

      expect(stats.totalIncidents).toBe(3);
      expect(stats.activeIncidents).toBe(3);
      expect(stats.escalationsByLevel.medium).toBe(1);
      expect(stats.escalationsByLevel.high).toBe(1);
      expect(stats.escalationsByLevel.critical).toBe(1);
    });
  });

  describe("Configuration", () => {
    it("should use custom configuration", async () => {
      const customEngine = new EscalationEngine({
        manualInterventionThreshold: 5,
        rollbackThreshold: 8,
        emergencyThreshold: 10,
      });

      // Should not escalate at attempt 2 with custom threshold of 5
      const result = await customEngine.evaluateEscalation(
        mockContext,
        2,
        "Test",
        [],
      );
      expect(result).toBeNull();
    });
  });
});
