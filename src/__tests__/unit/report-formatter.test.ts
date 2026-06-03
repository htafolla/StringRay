import { describe, it, expect } from "vitest";
import { formatReport, formatAsMarkdown, formatAsHtml } from "../../reporting/report-formatter.js";
import type { ReportData } from "../../reporting/types.js";

function makeSampleData(overrides?: Partial<ReportData["metrics"]> & { totalEvents?: number; successRate?: number }): ReportData {
  return {
    generatedAt: new Date("2026-01-15T12:00:00Z"),
    timeRange: { start: new Date("2026-01-15T00:00:00Z"), end: new Date("2026-01-15T23:59:59Z") },
    metrics: {
      totalDelegations: 42,
      agentUsage: new Map([
        ["architect", 10],
        ["enforcer", 20],
        ["researcher", 12],
      ]),
      complexityDistribution: new Map([
        ["simple", 15],
        ["moderate", 20],
        ["complex", 7],
      ]),
      successRate: overrides?.successRate ?? 97,
      averageResponseTime: 250,
      contextOperations: 30,
      enhancementSuccessRate: 95,
      commandUsage: new Map([["edit", 15], ["write", 8]]),
      toolExecutionStats: {
        totalCommands: 100,
        uniqueTools: 8,
        mostUsedTool: "edit",
        toolSuccessRate: new Map([
          ["edit", { success: 49, total: 50, rate: 98 }],
          ["write", { success: 19, total: 20, rate: 95 }],
        ]),
      },
      systemOperationDetails: {
        fileOperations: 50,
        searchOperations: 30,
        terminalOperations: 15,
        analysisOperations: 5,
        orchestrationOperations: 10,
      },
    },
    chronologicalEvents: [],
    insights: ["System healthy"],
    recommendations: ["Keep going"],
    summary: {
      totalEvents: overrides?.totalEvents ?? 200,
      activeComponents: ["architect", "enforcer"],
      peakActivity: { timestamp: new Date("2026-01-15T14:00:00Z"), eventsPerMinute: 10 },
      healthScore: 95,
    },
  };
}

describe("Report Formatter", () => {
  describe("formatReport", () => {
    it("should return JSON when format is json", () => {
      const result = formatReport(makeSampleData(), "json");
      expect(typeof result).toBe("string");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should return markdown when format is markdown", () => {
      const result = formatReport(makeSampleData(), "markdown");
      expect(result).toContain("# Framework Report");
    });

    it("should return HTML when format is html", () => {
      const result = formatReport(makeSampleData(), "html");
      expect(result).toContain("<!DOCTYPE html>");
    });
  });

  describe("formatAsMarkdown", () => {
    it("should return markdown with title", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).toContain("# Framework Report");
      expect(result).toContain("## Summary");
    });

    it("should include dynamic success rate from data", () => {
      const result = formatAsMarkdown(makeSampleData({ successRate: 97 }));
      expect(result).toContain("97");
      expect(result).not.toContain("99.6%");
    });

    it("should include dynamic event count from data", () => {
      const result = formatAsMarkdown(makeSampleData({ totalEvents: 200 }));
      expect(result).toContain("200");
    });

    it("should not contain hardcoded test count 833", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).not.toContain("833/833");
      expect(result).not.toContain("2199 tests");
    });

    it("should not contain PRODUCTION READY", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).not.toContain("PRODUCTION READY");
    });

    it("should not contain 99.6% hardcoded rate", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).not.toContain("99.6%");
    });

    it("should include dynamic delegation count", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).toContain("42");
    });

    it("should reflect changed success rate", () => {
      const result = formatAsMarkdown(makeSampleData({ successRate: 85 }));
      expect(result).toContain("85");
    });

    it("should reflect changed event count", () => {
      const result = formatAsMarkdown(makeSampleData({ totalEvents: 5000 }));
      expect(result).toContain("5000");
    });

    it("should list agent usage from map", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).toContain("architect: 10 invocations");
      expect(result).toContain("enforcer: 20 invocations");
    });

    it("should list tool success rates from map", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).toContain("edit: 49/50");
    });

    it("should include system operation categories", () => {
      const result = formatAsMarkdown(makeSampleData());
      expect(result).toContain("File Operations");
      expect(result).toContain("Search Operations");
    });
  });

  describe("formatAsHtml", () => {
    it("should return valid HTML", () => {
      const result = formatAsHtml(makeSampleData());
      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("</html>");
      expect(result).toContain("<h1>Framework Report</h1>");
    });

    it("should not contain hardcoded claims", () => {
      const result = formatAsHtml(makeSampleData());
      expect(result).not.toContain("833/833");
      expect(result).not.toContain("99.6%");
    });

    it("should include dynamic metrics", () => {
      const result = formatAsHtml(makeSampleData());
      expect(result).toContain("42");
      expect(result).toContain("97");
    });
  });
});
