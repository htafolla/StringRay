/**
 * Simple Pattern Analyzer for StringRay
 *
 * Reads activity log → Counts patterns → Generates insights
 *
 * This is the "learning" system - simple pattern matching, not ML.
 *
 * @version 1.0.0
 */

import * as fs from "fs";
import * as path from "path";
import type { Outcome, ComplexityAccuracy } from "../core/framework-logger.js";

export interface ParsedLogEntry {
  timestamp: string;
  jobId: string;
  component: string;
  action: string;
  status: string;
  duration?: number;
  complexityScore?: number;
  agentUsed?: string;
  operationType?: string;
  outcome?: Outcome;
  complexityAccuracy?: ComplexityAccuracy;
}

export interface AgentStats {
  attempts: number;
  successes: number;
  failures: number;
  escalated: number;
  autoFixed: number;
  avgDuration: number;
  totalDuration: number;
}

export interface TaskTypeStats {
  count: number;
  successRate: number;
  avgComplexity: number;
}

export interface ComplexityStats {
  underestimated: number;
  accurate: number;
  overestimated: number;
  total: number;
}

export interface PatternInsights {
  agentStats: Map<string, AgentStats>;
  taskTypeStats: Map<string, TaskTypeStats>;
  complexityStats: ComplexityStats;
  totalEntries: number;
  dateRange: { start: string; end: string };
}

export class SimplePatternAnalyzer {
  private logPath: string;
  private outcomesPath: string;

  constructor(logPath?: string) {
    const cwd = process.cwd();
    this.logPath =
      logPath || path.join(cwd, "logs", "framework", "activity.log");
    // Only use outcomes path when using default log path
    this.outcomesPath = logPath ? "" : path.join(cwd, "logs", "framework", "routing-outcomes.json");
  }

  /**
   * Main analysis method - reads log and returns insights
   */
  async analyze(limit?: number): Promise<PatternInsights> {
    const entries: ParsedLogEntry[] = [];

    // Try to read from routing-outcomes.json first (has more complete data)
    // Only when using default paths
    if (this.outcomesPath && fs.existsSync(this.outcomesPath)) {
      try {
        const outcomes = JSON.parse(fs.readFileSync(this.outcomesPath, "utf-8"));
        const outcomesToAnalyze = limit ? outcomes.slice(-limit) : outcomes;
        
        for (const outcome of outcomesToAnalyze) {
          entries.push({
            timestamp: outcome.timestamp || new Date().toISOString(),
            jobId: outcome.taskId || "",
            component: outcome.routedAgent || "unknown",
            action: "routing-outcome",
            status: outcome.success ? "success" : "error",
            agentUsed: outcome.routedAgent,
            operationType: outcome.routedSkill,
            outcome: outcome.success ? "success" : "fail",
            complexityScore: outcome.complexity,
          });
        }
      } catch {
        // Fall back to activity log parsing
      }
    }

    // Fall back to activity log parsing if no outcomes
    if (entries.length === 0 && fs.existsSync(this.logPath)) {
      const content = fs.readFileSync(this.logPath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim());
      
      // Filter to task completion entries
      const completionLines = lines.filter(
        (line) => line.includes("complex-task-completed") || 
                  line.includes("job-completed") ||
                  line.includes("task-completed")
      );

      const entriesToAnalyze = limit ? completionLines.slice(-limit) : completionLines;
      const parsedEntries = entriesToAnalyze
        .map((line) => this.parseLine(line))
        .filter((e): e is ParsedLogEntry => e !== null);
      
      entries.push(...parsedEntries);
    }

    if (entries.length === 0) {
      return this.emptyInsights();
    }

    return this.calculateStats(entries);
  }

  /**
   * Parse a single log line
   */
  private parseLine(line: string): ParsedLogEntry | null {
    // Format: 2026-02-24T10:30:00.000Z [job-123-abc] [component] action - STATUS | {"details": "..."}
    const match = line.match(
      /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+?)\s+-\s+(\w+)(?:\s*\|\s*(.+))?$/,
    );

    if (!match) {
      return null;
    }

    const [, timestamp, jobId, component, actionRaw, statusRaw, detailsRaw] = match;

    // Parse action and any embedded details
    const action = actionRaw?.trim() || "unknown";
    const status = statusRaw?.toLowerCase() || "info";

    // Parse JSON details if present
    let details: Record<string, any> = {};
    if (detailsRaw) {
      try {
        details = JSON.parse(detailsRaw.trim());
      } catch {
        // Not JSON, ignore
      }
    }

    return {
      timestamp: timestamp || "",
      jobId: jobId || "",
      component: component || "unknown",
      action,
      status,
      duration: details.duration,
      complexityScore: details.complexityScore,
      agentUsed: details.agentUsed || details.agent || details.taskType,
      operationType: details.operationType || details.taskType,
      outcome: details.outcome,
      complexityAccuracy: details.complexityAccuracy,
    };
  }

  /**
   * Calculate statistics from parsed entries
   */
  private calculateStats(entries: ParsedLogEntry[]): PatternInsights {
    const agentStats = new Map<string, AgentStats>();
    const taskTypeStats = new Map<string, TaskTypeStats>();
    const complexityStats: ComplexityStats = {
      underestimated: 0,
      accurate: 0,
      overestimated: 0,
      total: 0,
    };

    // Filter to entries with analytics data (task completions or routing outcomes)
    const relevantEntries = entries.filter(
      (e) => e.action === "job-completed" || 
             e.action === "routing-outcome" ||
             e.action.includes("completed") ||
             e.outcome !== undefined
    );

    for (const entry of relevantEntries) {
      const agent = entry.agentUsed || entry.component || "unknown";

      // Agent stats
      if (!agentStats.has(agent)) {
        agentStats.set(agent, {
          attempts: 0,
          successes: 0,
          failures: 0,
          escalated: 0,
          autoFixed: 0,
          avgDuration: 0,
          totalDuration: 0,
        });
      }

      const stats = agentStats.get(agent)!;
      stats.attempts++;

      if (entry.duration) {
        stats.totalDuration += entry.duration;
        stats.avgDuration = stats.totalDuration / stats.attempts;
      }

      // Outcome tracking
      const outcome =
        entry.outcome || (entry.status === "success" ? "success" : "fail");
      switch (outcome) {
        case "success":
          stats.successes++;
          break;
        case "fail":
          stats.failures++;
          break;
        case "escalated":
          stats.escalated++;
          break;
        case "auto-fixed":
          stats.autoFixed++;
          break;
      }

      // Task type stats
      const taskType = entry.operationType || "unknown";
      if (!taskTypeStats.has(taskType)) {
        taskTypeStats.set(taskType, {
          count: 0,
          successRate: 0,
          avgComplexity: 0,
        });
      }

      const taskStat = taskTypeStats.get(taskType)!;
      taskStat.count++;
      if (entry.complexityScore) {
        taskStat.avgComplexity =
          (taskStat.avgComplexity * (taskStat.count - 1) +
            entry.complexityScore) /
          taskStat.count;
      }

      // Complexity accuracy
      if (entry.complexityAccuracy) {
        complexityStats.total++;
        switch (entry.complexityAccuracy) {
          case "underestimated":
            complexityStats.underestimated++;
            break;
          case "accurate":
            complexityStats.accurate++;
            break;
          case "overestimated":
            complexityStats.overestimated++;
            break;
        }
      }
    }

    // Calculate success rates
    for (const [agent, stats] of agentStats) {
      if (stats.attempts > 0) {
        // We'll calculate in the output
      }
    }

    for (const [taskType, stats] of taskTypeStats) {
      const agentStatsForTask = Array.from(agentStats.values()).reduce(
        (acc, s) => ({
          attempts: acc.attempts + s.attempts,
          successes: acc.successes + s.successes,
        }),
        { attempts: 0, successes: 0 },
      );
      stats.successRate =
        agentStatsForTask.attempts > 0
          ? (agentStatsForTask.successes / agentStatsForTask.attempts) * 100
          : 0;
    }

    const sortedEntries = [...entries].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      agentStats,
      taskTypeStats,
      complexityStats,
      totalEntries: entries.length,
      dateRange: {
        start: sortedEntries[0]?.timestamp || "",
        end: sortedEntries[sortedEntries.length - 1]?.timestamp || "",
      },
    };
  }

  /**
   * Generate human-readable insights
   */
  generateInsights(insights: PatternInsights): string[] {
    const output: string[] = [];

    if (insights.totalEntries === 0) {
      return ["No activity log entries found."];
    }

    // Agent performance
    output.push("=== Agent Performance ===");
    for (const [agent, stats] of insights.agentStats) {
      const successRate =
        stats.attempts > 0
          ? ((stats.successes / stats.attempts) * 100).toFixed(1)
          : "0.0";
      const avgDuration =
        stats.avgDuration > 0
          ? (stats.avgDuration / 1000).toFixed(1) + "s"
          : "N/A";

      output.push(
        `- ${agent}: ${successRate}% success (${stats.attempts} tasks), avg ${avgDuration}`,
      );
    }

    // Complexity accuracy
    output.push("");
    output.push("=== Complexity Accuracy ===");
    const { underestimated, accurate, overestimated, total } =
      insights.complexityStats;
    if (total > 0) {
      output.push(
        `- Underestimated: ${((underestimated / total) * 100).toFixed(1)}% (tasks took longer than predicted)`,
      );
      output.push(
        `- Accurate: ${((accurate / total) * 100).toFixed(1)}% (predictions within 50%)`,
      );
      output.push(
        `- Overestimated: ${((overestimated / total) * 100).toFixed(1)}% (tasks completed faster than predicted)`,
      );
    } else {
      output.push("- Not enough data to determine accuracy");
    }

    // Task type breakdown
    output.push("");
    output.push("=== Task Types ===");
    for (const [taskType, stats] of insights.taskTypeStats) {
      output.push(
        `- ${taskType}: ${stats.count} tasks, avg complexity ${stats.avgComplexity.toFixed(0)}`,
      );
    }

    return output;
  }

  /**
   * Generate insights as a formatted report
   */
  async generateReport(): Promise<string> {
    const insights = await this.analyze();
    const insightsLines = this.generateInsights(insights);

    const report = [
      "╔════════════════════════════════════════════════════════════╗",
      "║           StringRay Pattern Analytics Report             ║",
      "╚════════════════════════════════════════════════════════════╝",
      "",
      `Analyzed: ${insights.totalEntries} log entries`,
      `Date Range: ${insights.dateRange.start || "N/A"} to ${insights.dateRange.end || "N/A"}`,
      "",
      ...insightsLines,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "Generated by StringRay Simple Pattern Analyzer",
    ];

    return report.join("\n");
  }

  private emptyInsights(): PatternInsights {
    return {
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
  }
}

// Export singleton for easy use
export const patternAnalyzer = new SimplePatternAnalyzer();
