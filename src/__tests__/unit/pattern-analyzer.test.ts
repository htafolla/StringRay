/**
 * Simple Pattern Analyzer Unit Tests
 *
 * Tests the pattern analysis and insights generation functionality.
 *
 * @version 1.0.0
 * @since 2026-02-25
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  SimplePatternAnalyzer,
  type PatternInsights,
} from "../../analytics/simple-pattern-analyzer.js";

describe("SimplePatternAnalyzer", () => {
  let analyzer: SimplePatternAnalyzer;
  let tempLogPath: string;

  beforeEach(() => {
    // Create temp log file in logs/test-activity/ directory
    const logsDir = path.join(process.cwd(), "logs", "test-activity");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    tempLogPath = path.join(logsDir, `test-activity-${Date.now()}.log`);
    analyzer = new SimplePatternAnalyzer(tempLogPath);
  });

  test("should return empty insights when log file does not exist", async () => {
    const insights = await analyzer.analyze();

    expect(insights.totalEntries).toBe(0);
    expect(insights.agentStats.size).toBe(0);
    expect(insights.taskTypeStats.size).toBe(0);
  });

  test("should parse valid log lines correctly", () => {
    const validLine =
      "2026-02-25T10:30:00.000Z [job-123-abc] [enforcer] code-validation - SUCCESS";
    const entry = (analyzer as any).parseLine(validLine);

    expect(entry).toBeTruthy();
    expect(entry?.timestamp).toBe("2026-02-25T10:30:00.000Z");
    expect(entry?.jobId).toBe("job-123-abc");
    expect(entry?.component).toBe("enforcer");
    expect(entry?.action).toBe("code-validation");
    expect(entry?.status).toBe("success");
  });

  test("should return null for invalid log lines", () => {
    const invalidLine = "This is not a valid log line";
    const entry = (analyzer as any).parseLine(invalidLine);

    expect(entry).toBeNull();
  });

  test("should analyze log entries and generate stats", async () => {
    // Write test log entries
    const logContent = [
      "2026-02-25T10:00:00.000Z [job-001] [enforcer] job-completed - SUCCESS",
      "2026-02-25T10:05:00.000Z [job-002] [orchestrator] job-completed - SUCCESS",
      "2026-02-25T10:10:00.000Z [job-003] [enforcer] job-completed - ERROR",
      "2026-02-25T10:15:00.000Z [job-004] [architect] job-completed - SUCCESS",
    ].join("\n");

    fs.writeFileSync(tempLogPath, logContent);

    const insights = await analyzer.analyze();

    expect(insights.totalEntries).toBe(4);
    expect(insights.agentStats.size).toBeGreaterThan(0);
  });

  test("should limit analysis to last N entries", async () => {
    // Write test log entries
    const logContent = Array.from(
      { length: 20 },
      (_, i) =>
        `2026-02-25T1${i.toString().padStart(2, "0")}:00:000Z [job-${i.toString().padStart(3, "0")}] [enforcer] job-completed - SUCCESS`,
    ).join("\n");

    fs.writeFileSync(tempLogPath, logContent);

    const insightsLimited = await analyzer.analyze(5);
    const insightsFull = await analyzer.analyze();

    // With limit, should get last 5 entries
    expect(insightsLimited.totalEntries).toBe(5);
    // Without limit, should get all 20
    expect(insightsFull.totalEntries).toBe(20);
  });

  test("should generate human-readable insights", async () => {
    const mockInsights: PatternInsights = {
      agentStats: new Map([
        [
          "enforcer",
          {
            attempts: 10,
            successes: 8,
            failures: 2,
            escalated: 0,
            autoFixed: 0,
            avgDuration: 5000,
            totalDuration: 50000,
          },
        ],
      ]),
      taskTypeStats: new Map([
        ["analyze", { count: 5, successRate: 80, avgComplexity: 25 }],
        ["refactor", { count: 3, successRate: 100, avgComplexity: 60 }],
      ]),
      complexityStats: {
        underestimated: 3,
        accurate: 5,
        overestimated: 2,
        total: 10,
      },
      totalEntries: 10,
      dateRange: {
        start: "2026-02-25T10:00:00.000Z",
        end: "2026-02-25T12:00:00.000Z",
      },
    };

    const insightsText = analyzer.generateInsights(mockInsights);

    expect(insightsText).toBeTruthy();
    expect(insightsText.length).toBeGreaterThan(0);
    expect(insightsText.join("\n")).toContain("Agent Performance");
    expect(insightsText.join("\n")).toContain("enforcer");
  });

  test("should handle empty insights in generateInsights", () => {
    const mockInsights: PatternInsights = {
      agentStats: new Map(),
      taskTypeStats: new Map(),
      complexityStats: {
        underestimated: 0,
        accurate: 0,
        overestimated: 0,
        total: 0,
      },
      totalEntries: 0,
      dateRange: { start: "", end: "" },
    };

    const insightsText = analyzer.generateInsights(mockInsights);

    expect(insightsText).toEqual(["No activity log entries found."]);
  });

  test("should generate full report", async () => {
    // Write test log entries
    const logContent = [
      "2026-02-25T10:00:00.000Z [job-001] [enforcer] job-completed - SUCCESS",
    ].join("\n");

    fs.writeFileSync(tempLogPath, logContent);

    const report = await analyzer.generateReport();

    expect(report).toContain("StringRay Pattern Analytics Report");
    expect(report).toContain("Analyzed:");
  });

  test("should use custom log path when provided", () => {
    const customPath = "/custom/path/activity.log";
    const customAnalyzer = new SimplePatternAnalyzer(customPath);

    expect((customAnalyzer as any).logPath).toBe(customPath);
  });

  test("should filter to completed entries only", async () => {
    // Write mixed log entries
    const logContent = [
      "2026-02-25T10:00:00.000Z [job-001] [enforcer] job-completed - SUCCESS",
      "2026-02-25T10:01:00.000Z [job-002] [enforcer] delegating-task - INFO",
      "2026-02-25T10:02:00.000Z [job-003] [orchestrator] job-completed - SUCCESS",
    ].join("\n");

    fs.writeFileSync(tempLogPath, logContent);

    const insights = await analyzer.analyze();

    // Should filter to only 2 completed entries
    expect(insights.totalEntries).toBe(2);
  });

  test("should calculate complexity accuracy percentages", async () => {
    const mockInsights: PatternInsights = {
      agentStats: new Map(),
      taskTypeStats: new Map(),
      complexityStats: {
        underestimated: 2,
        accurate: 4,
        overestimated: 4,
        total: 10,
      },
      totalEntries: 10,
      dateRange: { start: "", end: "" },
    };

    const insightsText = analyzer.generateInsights(mockInsights);
    const text = insightsText.join("\n");

    expect(text).toContain("Underestimated: 20.0%");
    expect(text).toContain("Accurate: 40.0%");
    expect(text).toContain("Overestimated: 40.0%");
  });
});
