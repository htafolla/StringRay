/**
 * Agent Metrics System
 *
 * Comprehensive metrics tracking for all agent invocations including:
 * - Invocation tracking (who, when, success/failure)
 * - Aggregation by agent type, time period, complexity level
 * - History tracking with configurable retention
 * - Export functionality (JSON, CSV, summary reports)
 *
 * @version 1.0.0
 * @since 2026-04-17
 */

import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../core/framework-logger.js";

export interface AgentInvocation {
  id: string;
  agentName: string;
  agentType: AgentType;
  timestamp: number;
  operation: string;
  description: string;
  complexityLevel: ComplexityLevel;
  complexityScore: number;
  duration: number;
  success: boolean;
  error: string | undefined;
  sessionId: string | undefined;
  parentTaskId: string | undefined;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  metadata: Record<string, unknown> | undefined;
}

export type AgentType =
  | "architect"
  | "code-analyzer"
  | "code-reviewer"
  | "researcher"
  | "frontend-engineer"
  | "backend-engineer"
  | "devops-engineer"
  | "security-auditor"
  | "database-engineer"
  | "testing-lead"
  | "performance-engineer"
  | "refactorer"
  | "bug-triage-specialist"
  | "strategist"
  | "tech-writer"
  | "content-creator"
  | "seo-consultant"
  | "growth-strategist"
  | "log-monitor"
  | "multimodal-looker"
  | "mobile-developer"
  | "frontend-ui-ux-engineer"
  | "custom"
  | "unknown";

export type ComplexityLevel = "simple" | "moderate" | "complex" | "enterprise";

export interface AgentInvocationSummary {
  agentName: string;
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  successRate: number;
  averageDuration: number;
  averageComplexity: number;
  lastInvoked: number;
  firstInvoked: number;
  operations: string[];
}

export interface TimePeriodSummary {
  period: string;
  periodType: "hour" | "day" | "week" | "month";
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  successRate: number;
  averageDuration: number;
  agents: Record<string, number>;
}

export interface ComplexitySummary {
  level: ComplexityLevel;
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  successRate: number;
  averageDuration: number;
  agents: Record<string, number>;
}

export interface AggregatedAgentMetrics {
  summary: {
    totalInvocations: number;
    totalAgents: number;
    timeRange: { start: number; end: number };
    overallSuccessRate: number;
    averageDuration: number;
  };
  byAgent: Record<string, AgentInvocationSummary>;
  byTimePeriod: Record<string, TimePeriodSummary>;
  byComplexity: Record<string, ComplexitySummary>;
}

export interface MetricsRetentionConfig {
  maxEntries: number;
  maxAgeMs: number;
  enableAutoCleanup: boolean;
  cleanupIntervalMs: number;
}

export interface MetricsExport {
  format: "json" | "csv" | "summary" | "detailed";
  data: unknown;
  exportedAt: number;
  entryCount: number;
  metadata: {
    fromDate: number | undefined;
    toDate: number | undefined;
    filter: Record<string, unknown> | undefined;
  };
}

export interface AgentMetricsFilter {
  agentNames?: string[];
  agentTypes?: AgentType[];
  timeRange?: { start: number; end: number };
  complexityLevels?: ComplexityLevel[];
  successOnly?: boolean;
  failureOnly?: boolean;
  sessionId?: string;
}

const DEFAULT_RETENTION_CONFIG: MetricsRetentionConfig = {
  maxEntries: 10000,
  maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  enableAutoCleanup: true,
  cleanupIntervalMs: 60 * 60 * 1000, // 1 hour
};

const INVOCATION_STORE_KEY = "agent_invocations";

export class AgentMetricsSystem {
  private stateManager: StringRayStateManager;
  private retentionConfig: MetricsRetentionConfig;
  private cleanupInterval: NodeJS.Timeout | undefined;
  private initialized = false;

  constructor(
    stateManager: StringRayStateManager,
    retentionConfig: Partial<MetricsRetentionConfig> = {},
  ) {
    this.stateManager = stateManager;
    this.retentionConfig = { ...DEFAULT_RETENTION_CONFIG, ...retentionConfig };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.retentionConfig.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    this.initialized = true;
    frameworkLogger.log("agent-metrics", "initialized", "info", {
      retentionConfig: this.retentionConfig,
    });
  }

  private startAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.retentionConfig.cleanupIntervalMs);
  }

  private performCleanup(): void {
    const removed = this.cleanup(
      this.retentionConfig.maxAgeMs,
      this.retentionConfig.maxEntries,
    );
    if (removed.total > 0) {
      frameworkLogger.log("agent-metrics", "auto-cleanup", "info", removed);
    }
  }

  private getInvocations(): AgentInvocation[] {
    return (
      (this.stateManager.get(INVOCATION_STORE_KEY) as AgentInvocation[]) || []
    );
  }

  private saveInvocations(invocations: AgentInvocation[]): void {
    this.stateManager.set(INVOCATION_STORE_KEY, invocations);
  }

  private generateId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  trackInvocation(params: {
    agentName: string;
    agentType: AgentType;
    operation: string;
    description?: string;
    complexityLevel?: ComplexityLevel;
    complexityScore?: number;
    duration?: number;
    success: boolean;
    error?: string;
    sessionId?: string;
    parentTaskId?: string;
    inputTokens?: number;
    outputTokens?: number;
    metadata?: Record<string, unknown>;
  }): AgentInvocation {
    const invocation: AgentInvocation = {
      id: this.generateId(),
      agentName: params.agentName,
      agentType: params.agentType,
      timestamp: Date.now(),
      operation: params.operation,
      description: params.description || params.operation,
      complexityLevel: params.complexityLevel || "moderate",
      complexityScore: params.complexityScore || 25,
      duration: params.duration || 0,
      success: params.success,
      error: params.error,
      sessionId: params.sessionId,
      parentTaskId: params.parentTaskId,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      metadata: params.metadata,
    };

    const invocations = this.getInvocations();
    invocations.push(invocation);

    if (invocations.length > this.retentionConfig.maxEntries) {
      invocations.shift();
    }

    this.saveInvocations(invocations);

    frameworkLogger.log("agent-metrics", "invocation-tracked", "info", {
      id: invocation.id,
      agentName: invocation.agentName,
      success: invocation.success,
      duration: invocation.duration,
    });

    return invocation;
  }

  trackSuccess(params: Omit<Parameters<typeof this.trackInvocation>[0], "success" | "error">): AgentInvocation {
    return this.trackInvocation({
      ...params,
      success: true,
    });
  }

  trackFailure(params: Omit<Parameters<typeof this.trackInvocation>[0], "success"> & { error: string }): AgentInvocation {
    return this.trackInvocation({
      ...params,
      success: false,
      error: params.error,
    });
  }

  getInvocationsByAgent(agentName: string): AgentInvocation[] {
    return this.getInvocations().filter((inv) => inv.agentName === agentName);
  }

  getInvocationsBySession(sessionId: string): AgentInvocation[] {
    return this.getInvocations().filter((inv) => inv.sessionId === sessionId);
  }

  getInvocationsByTimeRange(start: number, end: number): AgentInvocation[] {
    return this.getInvocations().filter(
      (inv) => inv.timestamp >= start && inv.timestamp <= end,
    );
  }

  filterInvocations(filter: AgentMetricsFilter): AgentInvocation[] {
    let invocations = this.getInvocations();

    if (filter.agentNames?.length) {
      invocations = invocations.filter((inv) =>
        filter.agentNames!.includes(inv.agentName),
      );
    }

    if (filter.agentTypes?.length) {
      invocations = invocations.filter((inv) =>
        filter.agentTypes!.includes(inv.agentType),
      );
    }

    if (filter.timeRange) {
      invocations = invocations.filter(
        (inv) =>
          inv.timestamp >= filter.timeRange!.start &&
          inv.timestamp <= filter.timeRange!.end,
      );
    }

    if (filter.complexityLevels?.length) {
      invocations = invocations.filter((inv) =>
        filter.complexityLevels!.includes(inv.complexityLevel),
      );
    }

    if (filter.successOnly) {
      invocations = invocations.filter((inv) => inv.success);
    }

    if (filter.failureOnly) {
      invocations = invocations.filter((inv) => !inv.success);
    }

    if (filter.sessionId) {
      invocations = invocations.filter((inv) => inv.sessionId === filter.sessionId);
    }

    return invocations;
  }

  aggregateMetrics(filter?: AgentMetricsFilter): AggregatedAgentMetrics {
    const invocations = filter ? this.filterInvocations(filter) : this.getInvocations();

    if (invocations.length === 0) {
      return {
        summary: {
          totalInvocations: 0,
          totalAgents: 0,
          timeRange: { start: Date.now(), end: Date.now() },
          overallSuccessRate: 0,
          averageDuration: 0,
        },
        byAgent: {},
        byTimePeriod: {},
        byComplexity: {},
      };
    }

    const timestamps = invocations.map((inv) => inv.timestamp);
    const totalDuration = invocations.reduce((sum, inv) => sum + inv.duration, 0);
    const successfulCount = invocations.filter((inv) => inv.success).length;

    const aggregated: AggregatedAgentMetrics = {
      summary: {
        totalInvocations: invocations.length,
        totalAgents: new Set(invocations.map((inv) => inv.agentName)).size,
        timeRange: {
          start: Math.min(...timestamps),
          end: Math.max(...timestamps),
        },
        overallSuccessRate: (successfulCount / invocations.length) * 100,
        averageDuration: totalDuration / invocations.length,
      },
      byAgent: {},
      byTimePeriod: {},
      byComplexity: {},
    };

    const byAgent = new Map<string, AgentInvocation[]>();
    const byTimePeriod = new Map<string, AgentInvocation[]>();
    const byComplexity = new Map<string, AgentInvocation[]>();

    for (const inv of invocations) {
      // Group by agent
      const agentInvs = byAgent.get(inv.agentName) || [];
      agentInvs.push(inv);
      byAgent.set(inv.agentName, agentInvs);

      // Group by time period (hour)
      const hourKey = this.getHourKey(inv.timestamp);
      const hourInvs = byTimePeriod.get(hourKey) || [];
      hourInvs.push(inv);
      byTimePeriod.set(hourKey, hourInvs);

      // Group by day
      const dayKey = this.getDayKey(inv.timestamp);
      const dayInvs = byTimePeriod.get(dayKey) || [];
      dayInvs.push(inv);
      byTimePeriod.set(dayKey, dayInvs);

      // Group by week
      const weekKey = this.getWeekKey(inv.timestamp);
      const weekInvs = byTimePeriod.get(weekKey) || [];
      weekInvs.push(inv);
      byTimePeriod.set(weekKey, weekInvs);

      // Group by month
      const monthKey = this.getMonthKey(inv.timestamp);
      const monthInvs = byTimePeriod.get(monthKey) || [];
      monthInvs.push(inv);
      byTimePeriod.set(monthKey, monthInvs);

      // Group by complexity
      const complexityKey = inv.complexityLevel;
      const complexityInvs = byComplexity.get(complexityKey) || [];
      complexityInvs.push(inv);
      byComplexity.set(complexityKey, complexityInvs);
    }

    // Build agent summaries
    for (const [agentName, agentInvs] of byAgent) {
      const successful = agentInvs.filter((inv) => inv.success);
      const timestamps = agentInvs.map((inv) => inv.timestamp);
      const durations = agentInvs.map((inv) => inv.duration);
      const complexityScores = agentInvs.map((inv) => inv.complexityScore);

      aggregated.byAgent[agentName] = {
        agentName,
        totalInvocations: agentInvs.length,
        successfulInvocations: successful.length,
        failedInvocations: agentInvs.length - successful.length,
        successRate: (successful.length / agentInvs.length) * 100,
        averageDuration:
          durations.reduce((a, b) => a + b, 0) / durations.length,
        averageComplexity:
          complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length,
        lastInvoked: Math.max(...timestamps),
        firstInvoked: Math.min(...timestamps),
        operations: [...new Set(agentInvs.map((inv) => inv.operation))],
      };
    }

    // Build time period summaries
    for (const [period, periodInvs] of byTimePeriod) {
      const successful = periodInvs.filter((inv) => inv.success);
      const durations = periodInvs.map((inv) => inv.duration);
      const agents: Record<string, number> = {};
      const periodType = this.getPeriodType(period);

      for (const inv of periodInvs) {
        agents[inv.agentName] = (agents[inv.agentName] || 0) + 1;
      }

      aggregated.byTimePeriod[period] = {
        period,
        periodType,
        totalInvocations: periodInvs.length,
        successfulInvocations: successful.length,
        failedInvocations: periodInvs.length - successful.length,
        successRate: (successful.length / periodInvs.length) * 100,
        averageDuration:
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        agents,
      };
    }

    // Build complexity summaries
    for (const [level, levelInvs] of byComplexity) {
      const successful = levelInvs.filter((inv) => inv.success);
      const durations = levelInvs.map((inv) => inv.duration);
      const agents: Record<string, number> = {};

      for (const inv of levelInvs) {
        agents[inv.agentName] = (agents[inv.agentName] || 0) + 1;
      }

      aggregated.byComplexity[level] = {
        level: level as ComplexityLevel,
        totalInvocations: levelInvs.length,
        successfulInvocations: successful.length,
        failedInvocations: levelInvs.length - successful.length,
        successRate: (successful.length / levelInvs.length) * 100,
        averageDuration:
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        agents,
      };
    }

    return aggregated;
  }

  private getHourKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.toISOString().slice(0, 13)}:00`;
  }

  private getDayKey(timestamp: number): string {
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  private getWeekKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }

  private getMonthKey(timestamp: number): string {
    return new Date(timestamp).toISOString().slice(0, 7);
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getPeriodType(period: string): "hour" | "day" | "week" | "month" {
    if (period.includes("W")) return "week";
    if (period.length === 7) return "month";
    if (period.length === 10) return "day";
    return "hour";
  }

  getAgentSummary(agentName: string): AgentInvocationSummary | null {
    const invocations = this.getInvocationsByAgent(agentName);
    if (invocations.length === 0) return null;

    const successful = invocations.filter((inv) => inv.success);
    const timestamps = invocations.map((inv) => inv.timestamp);
    const durations = invocations.map((inv) => inv.duration);
    const complexityScores = invocations.map((inv) => inv.complexityScore);

    return {
      agentName,
      totalInvocations: invocations.length,
      successfulInvocations: successful.length,
      failedInvocations: invocations.length - successful.length,
      successRate: (successful.length / invocations.length) * 100,
      averageDuration:
        durations.reduce((a, b) => a + b, 0) / durations.length,
      averageComplexity:
        complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length,
      lastInvoked: Math.max(...timestamps),
      firstInvoked: Math.min(...timestamps),
      operations: [...new Set(invocations.map((inv) => inv.operation))],
    };
  }

  getTimePeriodSummary(
    period: string,
    periodType: "hour" | "day" | "week" | "month",
  ): TimePeriodSummary | null {
    const allInvocations = this.getInvocations();
    let filtered: AgentInvocation[];

    switch (periodType) {
      case "hour":
        filtered = allInvocations.filter((inv) => this.getHourKey(inv.timestamp) === period);
        break;
      case "day":
        filtered = allInvocations.filter((inv) => this.getDayKey(inv.timestamp) === period);
        break;
      case "week":
        filtered = allInvocations.filter((inv) => this.getWeekKey(inv.timestamp) === period);
        break;
      case "month":
        filtered = allInvocations.filter((inv) => this.getMonthKey(inv.timestamp) === period);
        break;
      default:
        return null;
    }

    if (filtered.length === 0) return null;

    const successful = filtered.filter((inv) => inv.success);
    const durations = filtered.map((inv) => inv.duration);
    const agents: Record<string, number> = {};

    for (const inv of filtered) {
      agents[inv.agentName] = (agents[inv.agentName] || 0) + 1;
    }

    return {
      period,
      periodType,
      totalInvocations: filtered.length,
      successfulInvocations: successful.length,
      failedInvocations: filtered.length - successful.length,
      successRate: (successful.length / filtered.length) * 100,
      averageDuration:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      agents,
    };
  }

  getComplexitySummary(level: ComplexityLevel): ComplexitySummary | null {
    const invocations = this.getInvocations().filter(
      (inv) => inv.complexityLevel === level,
    );

    if (invocations.length === 0) return null;

    const successful = invocations.filter((inv) => inv.success);
    const durations = invocations.map((inv) => inv.duration);
    const agents: Record<string, number> = {};

    for (const inv of invocations) {
      agents[inv.agentName] = (agents[inv.agentName] || 0) + 1;
    }

    return {
      level,
      totalInvocations: invocations.length,
      successfulInvocations: successful.length,
      failedInvocations: invocations.length - successful.length,
      successRate: (successful.length / invocations.length) * 100,
      averageDuration:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      agents,
    };
  }

  cleanup(olderThanMs?: number, maxEntries?: number): {
    removed: number;
    total: number;
    byAgent: Record<string, number>;
  } {
    const cutoff = olderThanMs ? Date.now() - olderThanMs : 0;
    const limit = maxEntries || this.retentionConfig.maxEntries;
    let invocations = this.getInvocations();

    const byAgent: Record<string, number> = {};

    const beforeCount = invocations.length;

    // Filter by age
    if (cutoff > 0) {
      const filtered = invocations.filter((inv) => inv.timestamp >= cutoff);
      const removed = invocations.filter((inv) => inv.timestamp < cutoff);
      for (const inv of removed) {
        byAgent[inv.agentName] = (byAgent[inv.agentName] || 0) + 1;
      }
      invocations = filtered;
    }

    // Limit by count
    if (invocations.length > limit) {
      const removed = invocations.slice(0, invocations.length - limit);
      for (const inv of removed) {
        byAgent[inv.agentName] = (byAgent[inv.agentName] || 0) + 1;
      }
      invocations = invocations.slice(invocations.length - limit);
    }

    this.saveInvocations(invocations);

    return {
      removed: beforeCount - invocations.length,
      total: invocations.length,
      byAgent,
    };
  }

  resetMetrics(): void {
    this.saveInvocations([]);
    frameworkLogger.log("agent-metrics", "metrics-reset", "info", {});
  }

  exportMetrics(
    format: "json" | "csv" | "summary" | "detailed" = "json",
    filter?: AgentMetricsFilter,
  ): MetricsExport {
    const invocations = filter ? this.filterInvocations(filter) : this.getInvocations();
    const exportedAt = Date.now();

    const metadata = {
      fromDate: filter?.timeRange?.start,
      toDate: filter?.timeRange?.end,
      filter: filter as Record<string, unknown>,
    };

    switch (format) {
      case "json":
        return {
          format: "json",
          data: invocations,
          exportedAt,
          entryCount: invocations.length,
          metadata,
        };

      case "csv":
        return {
          format: "csv",
          data: this.toCSV(invocations),
          exportedAt,
          entryCount: invocations.length,
          metadata,
        };

      case "summary":
        return {
          format: "summary",
          data: this.aggregateMetrics(filter),
          exportedAt,
          entryCount: invocations.length,
          metadata,
        };

      case "detailed":
        return {
          format: "detailed",
          data: {
            invocations,
            aggregated: this.aggregateMetrics(filter),
          },
          exportedAt,
          entryCount: invocations.length,
          metadata,
        };

      default:
        return this.exportMetrics("json", filter);
    }
  }

  private toCSV(invocations: AgentInvocation[]): string {
    const headers = [
      "id",
      "agentName",
      "agentType",
      "timestamp",
      "operation",
      "description",
      "complexityLevel",
      "complexityScore",
      "duration",
      "success",
      "error",
      "sessionId",
      "parentTaskId",
      "inputTokens",
      "outputTokens",
    ];

    const rows = [headers.join(",")];

    for (const inv of invocations) {
      const row = [
        inv.id,
        inv.agentName,
        inv.agentType,
        inv.timestamp,
        this.escapeCSV(inv.operation),
        this.escapeCSV(inv.description),
        inv.complexityLevel,
        inv.complexityScore,
        inv.duration,
        inv.success,
        this.escapeCSV(inv.error || ""),
        this.escapeCSV(inv.sessionId || ""),
        this.escapeCSV(inv.parentTaskId || ""),
        inv.inputTokens ?? "",
        inv.outputTokens ?? "",
      ];
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  private escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  getStatistics(): {
    totalInvocations: number;
    uniqueAgents: number;
    oldestInvocation: number | null;
    newestInvocation: number | null;
    successRate: number;
    averageDuration: number;
    topAgents: Array<{ name: string; count: number }>;
  } {
    const invocations = this.getInvocations();

    if (invocations.length === 0) {
      return {
        totalInvocations: 0,
        uniqueAgents: 0,
        oldestInvocation: null,
        newestInvocation: null,
        successRate: 0,
        averageDuration: 0,
        topAgents: [],
      };
    }

    const timestamps = invocations.map((inv) => inv.timestamp);
    const durations = invocations.map((inv) => inv.duration);
    const successful = invocations.filter((inv) => inv.success);

    const agentCounts: Record<string, number> = {};
    for (const inv of invocations) {
      agentCounts[inv.agentName] = (agentCounts[inv.agentName] || 0) + 1;
    }

    const topAgents = Object.entries(agentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalInvocations: invocations.length,
      uniqueAgents: new Set(invocations.map((inv) => inv.agentName)).size,
      oldestInvocation: Math.min(...timestamps),
      newestInvocation: Math.max(...timestamps),
      successRate: (successful.length / invocations.length) * 100,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      topAgents,
    };
  }

  updateRetentionConfig(config: Partial<MetricsRetentionConfig>): void {
    this.retentionConfig = { ...this.retentionConfig, ...config };

    if (this.retentionConfig.enableAutoCleanup) {
      this.startAutoCleanup();
    } else {
      const interval = this.cleanupInterval;
      if (interval) {
        clearInterval(interval);
        this.cleanupInterval = undefined as unknown as NodeJS.Timeout;
      }
    }

    frameworkLogger.log("agent-metrics", "retention-updated", "info", config);
  }

  destroy(): void {
    const interval = this.cleanupInterval;
    if (interval) {
      clearInterval(interval);
      this.cleanupInterval = undefined as unknown as NodeJS.Timeout;
    }
    this.initialized = false;
  }
}

let globalMetricsSystem: AgentMetricsSystem | null = null;

export function getAgentMetricsSystem(stateManager?: StringRayStateManager): AgentMetricsSystem {
  if (!globalMetricsSystem && stateManager) {
    globalMetricsSystem = new AgentMetricsSystem(stateManager);
  }
  return globalMetricsSystem!;
}

export function initializeAgentMetrics(stateManager: StringRayStateManager): AgentMetricsSystem {
  globalMetricsSystem = new AgentMetricsSystem(stateManager);
  return globalMetricsSystem;
}

export function resetAgentMetricsSystem(): void {
  if (globalMetricsSystem) {
    globalMetricsSystem.destroy();
    globalMetricsSystem = null;
  }
}
