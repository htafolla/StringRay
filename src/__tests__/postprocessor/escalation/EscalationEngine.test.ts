/**
 * Tests for EscalationEngine
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EscalationEngine } from "../../../postprocessor/escalation/EscalationEngine.js";
import { PostProcessorContext } from "../../../postprocessor/types.js";
import { frameworkLogger } from "../../../core/framework-logger.js";

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
    it("should send alerts through configured channels", async () => {
      const loggerSpy = vi.spyOn(frameworkLogger, "log").mockResolvedValue(undefined);

      await engine.evaluateEscalation(mockContext, 5, "Critical error", []);

      // Check that alert was logged via frameworkLogger
      expect(loggerSpy).toHaveBeenCalledWith(
        "EscalationEngine",
        "display-alert",
        expect.any(String),
        expect.any(Object),
      );

      loggerSpy.mockRestore();
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

  describe("Incident Reporting", () => {
    it("should create incident report with external reporting payload", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        5,
        "Critical error",
        [],
      );

      expect(result).not.toBeNull();
      expect(result!.incidentReport).toBeDefined();
      expect(result!.incidentReport.id).toContain("incident-");
      expect(result!.incidentReport.commitSha).toBe(mockContext.commitSha);
    });

    it("should include timeline in incident report", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        3,
        "Test error",
        [],
      );

      expect(result!.incidentReport.timeline.length).toBeGreaterThan(0);
    });

    it("should format incident message correctly", async () => {
      const engine = new EscalationEngine({
        incidentReporting: true,
      });

      const result = await engine.evaluateEscalation(
        mockContext,
        5,
        "Critical failure",
        [],
      );

      expect(result).not.toBeNull();
    });
  });

  describe("Reporting Endpoints", () => {
    it("should add reporting endpoint", () => {
      const endpoint = {
        name: "slack",
        url: "https://hooks.slack.com/test",
        type: "slack" as const,
        enabled: true,
        priorityThreshold: "high" as const,
      };

      engine.addReportingEndpoint(endpoint);

      const endpoints = engine.getReportingEndpoints();
      expect(endpoints.length).toBe(1);
      expect(endpoints[0].name).toBe("slack");
    });

    it("should remove reporting endpoint", () => {
      const endpoint = {
        name: "test-webhook",
        url: "https://example.com/webhook",
        type: "webhook" as const,
        enabled: true,
      };

      engine.addReportingEndpoint(endpoint);
      const removed = engine.removeReportingEndpoint("test-webhook");

      expect(removed).toBe(true);
    });

    it("should return false when removing non-existent endpoint", () => {
      const removed = engine.removeReportingEndpoint("non-existent");
      expect(removed).toBe(false);
    });

    it("should get copy of reporting endpoints", () => {
      engine.addReportingEndpoint({
        name: "pagerduty",
        url: "https://events.pagerduty.com",
        type: "pagerduty",
        enabled: true,
      });

      const endpoints1 = engine.getReportingEndpoints();
      const endpoints2 = engine.getReportingEndpoints();

      expect(endpoints1).not.toBe(endpoints2);
    });
  });

  describe("Reporting History", () => {
    it("should track reporting history", async () => {
      const engine = new EscalationEngine({
        incidentReporting: true,
        reportingEndpoints: [
          {
            name: "slack",
            url: "https://hooks.slack.com/test",
            type: "slack",
            enabled: true,
            priorityThreshold: "low",
          },
        ],
      });

      await engine.evaluateEscalation(
        mockContext,
        5,
        "Critical error",
        [],
      );

      const history = engine.getReportingHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should clear reporting history", () => {
      engine.clearReportingHistory();
      const history = engine.getReportingHistory();
      expect(history.length).toBe(0);
    });
  });

  describe("Webhook Integration", () => {
    it("should format message for Slack", async () => {
      const engine = new EscalationEngine({
        incidentReporting: true,
      });

      const result = await engine.evaluateEscalation(
        mockContext,
        5,
        "Critical failure",
        [],
      );

      expect(result!.incidentReport).toBeDefined();
    });

    it("should respect priority threshold for reporting", async () => {
      const engine = new EscalationEngine({
        incidentReporting: true,
        reportingEndpoints: [
          {
            name: "high-priority-only",
            url: "https://example.com/webhook",
            type: "webhook",
            enabled: true,
            priorityThreshold: "critical",
          },
        ],
      });

      const result = await engine.evaluateEscalation(
        mockContext,
        2,
        "Low priority issue",
        [],
      );

      expect(result).not.toBeNull();
      expect(result!.level).toBe("manual-intervention");
    });
  });

  describe("Recommended Actions", () => {
    it("should provide critical severity actions", async () => {
      const engine = new EscalationEngine({
        incidentReporting: true,
      });

      const result = await engine.evaluateEscalation(
        mockContext,
        5,
        "Critical failure",
        [],
      );

      expect(result!.recommendations.length).toBeGreaterThan(0);
    });

    it("should provide rollback actions", async () => {
      const engine = new EscalationEngine();

      const result = await engine.evaluateEscalation(
        mockContext,
        3,
        "Rollback error",
        [],
      );

      expect(result).not.toBeNull();
      expect(result!.level).toBe("rollback");
    });

    it("should provide manual intervention actions", async () => {
      const engine = new EscalationEngine();

      const result = await engine.evaluateEscalation(
        mockContext,
        2,
        "Manual intervention needed",
        [],
      );

      expect(result).not.toBeNull();
      expect(result!.level).toBe("manual-intervention");
    });
  });

  describe("Incident Payload Building", () => {
    it("should build incident payload with all fields", async () => {
      const result = await engine.evaluateEscalation(
        mockContext,
        5,
        "Critical error",
        [],
      );

      const incident = result!.incidentReport;
      expect(incident.id).toBeDefined();
      expect(incident.commitSha).toBe(mockContext.commitSha);
      expect(incident.timestamp).toBeDefined();
      expect(incident.severity).toBeDefined();
      expect(incident.affectedSystems).toBeDefined();
      expect(incident.rootCause).toBeDefined();
      expect(incident.impact).toBeDefined();
      expect(incident.resolution).toBeDefined();
      expect(incident.timeline).toBeDefined();
    });
  });
});
