/**
 * Agent Spawn Governor
 *
 * Critical governance component that prevents infinite agent spawning
 * and enforces spawn limits across the multi-agent orchestration system.
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

import { frameworkLogger } from "../core/framework-logger.js";

export interface SpawnContext {
  agentType: string;
  parentAgent?: string;
  operation?: string;
  triggeredBy?: string;
  sessionId?: string;
  priority?: "high" | "medium" | "low";
}

export interface SpawnRecord {
  id: string;
  agentType: string;
  parentAgent?: string | undefined;
  timestamp: number;
  status: "active" | "completed" | "failed" | "terminated";
  context: SpawnContext;
}

export interface SpawnLimits {
  perAgentType: Record<string, number>;
  totalConcurrent: number;
  spawnRateLimit: {
    maxPerMinute: number;
    windowMs: number;
  };
  memoryLimit: {
    maxMemoryMB: number; // Memory ceiling
    emergencyThresholdMB: number; // Emergency cleanup trigger
    cleanupIntervalMs: number; // Cleanup frequency
  };
}

export interface SpawnAuthorization {
  authorized: boolean;
  trackingId?: string;
  reason?: string;
  warnings?: string[];
}

export class AgentSpawnGovernor {
  private activeAgents = new Map<string, SpawnRecord[]>();
  private spawnHistory: SpawnRecord[] = [];
  private readonly maxHistorySize = 100; // Reduced from 1000
  private readonly cleanupInterval = 30000; // 30 second cleanup interval
  private readonly persistenceTimeout = 5000; // 5 second timeout
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay
  private cleanupTimer?: NodeJS.Timeout;
  private memoryMonitorInterval?: NodeJS.Timeout;
  private authorizationQueue: Array<() => void> = []; // Queue for serializing authorizations
  private isProcessingAuthorization = false;

  private readonly defaultLimits: SpawnLimits = {
    perAgentType: {
      researcher: 1,
      orchestrator: 3,
      enforcer: 2,
      architect: 2,
      "bug-triage-specialist": 2,
      "code-reviewer": 2,
      "security-auditor": 2,
      refactorer: 2,
      "testing-lead": 2,
      explore: 1,
    },
    totalConcurrent: 8, // System-wide concurrent limit
    spawnRateLimit: {
      maxPerMinute: 10,
      windowMs: 60000, // 1 minute
    },
    memoryLimit: {
      maxMemoryMB: 100, // 100MB ceiling
      emergencyThresholdMB: 80, // Emergency cleanup trigger
      cleanupIntervalMs: 30000, // 30 second cleanup interval
    },
  };

  constructor(private limits: Partial<SpawnLimits> = {}) {
    this.limits = { ...this.defaultLimits, ...limits };
    this.startPeriodicCleanup();
    this.startMemoryMonitoring();
  }

  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.aggressiveCleanup();
    }, this.cleanupInterval);
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitorInterval = setInterval(() => {
      this.checkMemoryBudget();
    }, this.limits.memoryLimit?.cleanupIntervalMs ?? 30000);
  }

  private checkMemoryBudget(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const maxMemoryMB = this.limits.memoryLimit?.maxMemoryMB ?? 100;
    const emergencyThresholdMB =
      this.limits.memoryLimit?.emergencyThresholdMB ?? 80;

    if (heapUsedMB > maxMemoryMB) {
      this.emergencyMemoryCleanup(heapUsedMB);
    } else if (heapUsedMB > emergencyThresholdMB) {
      this.aggressiveCleanup();
    }
  }

  private emergencyMemoryCleanup(heapUsedMB: number): void {
    frameworkLogger.log(
      "agent-spawn-governor",
      "emergency-memory-cleanup-triggered",
      "error",
      {
        heapUsedMB,
        maxMemoryMB: this.limits.memoryLimit?.maxMemoryMB ?? 100,
        activeAgents: this.getTotalActive(),
        historySize: this.spawnHistory.length,
      },
    );

    this.spawnHistory = this.spawnHistory.filter((r) => r.status === "active");

    const oneMinuteAgo = Date.now() - 60000;
    for (const [agentType, records] of this.activeAgents.entries()) {
      const filtered = records.filter(
        (r) => r.status === "active" || r.timestamp > oneMinuteAgo,
      );

      if (filtered.length === 0) {
        this.activeAgents.delete(agentType);
      } else {
        this.activeAgents.set(agentType, filtered);
      }
    }

    if (global.gc) {
      global.gc();
    }
  }

  private aggressiveCleanup(): void {
    const now = Date.now();
    const activeRecordAge = 60 * 60 * 1000; // 1 hour for active records
    const completedRecordAge = 5 * 60 * 1000; // 5 minutes for completed records

    let cleanedCount = 0;

    for (const [agentType, records] of this.activeAgents.entries()) {
      const filtered = records.filter((r) => {
        if (r.status === "active") {
          return now - r.timestamp < activeRecordAge;
        } else {
          return now - r.timestamp < completedRecordAge;
        }
      });

      if (filtered.length !== records.length) {
        cleanedCount += records.length - filtered.length;
      }

      if (filtered.length === 0) {
        this.activeAgents.delete(agentType);
      } else {
        this.activeAgents.set(agentType, filtered);
      }
    }

    this.deepCleanupContexts();

    if (this.spawnHistory.length > this.maxHistorySize) {
      const cutoffTime = now - 10 * 60 * 1000;
      this.spawnHistory = this.spawnHistory.filter(
        (r) => r.status === "active" || r.timestamp > cutoffTime,
      );

      if (this.spawnHistory.length > this.maxHistorySize) {
        this.spawnHistory = this.spawnHistory.slice(-this.maxHistorySize);
      }
    }

    if (cleanedCount > 0) {
      frameworkLogger.log("agent-spawn-governor", "memory-cleanup", "info", {
        cleanedRecords: cleanedCount,
        remainingActive: this.getTotalActive(),
        historySize: this.spawnHistory.length,
      });
    }
  }

  private deepCleanupContexts(): void {
    for (const records of this.activeAgents.values()) {
      for (const record of records) {
        if (record.context && typeof record.context === "object") {
          this.sanitizeContext(record.context);
        }
      }
    }
  }

  private sanitizeContext(context: SpawnContext): void {
    if ("largeObject" in context) {
      delete (context as any).largeObject;
    }
  }

  /**
   * Authorize a new agent spawn
   */
  async authorizeSpawn(context: SpawnContext): Promise<SpawnAuthorization> {
    const trackingId = this.generateTrackingId();

    return new Promise<SpawnAuthorization>((resolve, reject) => {
      const processAuthorization = async () => {
        try {
          const result = await this.withTimeout(
            this.performAuthorization(context, trackingId),
            this.persistenceTimeout,
            "Spawn authorization timeout",
          );
          resolve(result);
        } catch (error) {
          await this.handleAuthorizationError(error, trackingId, context);
          reject(error);
        } finally {
          // Process next authorization in queue
          this.isProcessingAuthorization = false;
          this.processNextAuthorization();
        }
      };

      // Add to queue and process if not already processing
      this.authorizationQueue.push(processAuthorization);
      if (!this.isProcessingAuthorization) {
        this.processNextAuthorization();
      }
    });
  }

  private processNextAuthorization(): void {
    if (this.authorizationQueue.length > 0 && !this.isProcessingAuthorization) {
      this.isProcessingAuthorization = true;
      const nextAuthorization = this.authorizationQueue.shift();
      if (nextAuthorization) {
        nextAuthorization();
      }
    }
  }

  private async performAuthorization(
    context: SpawnContext,
    trackingId: string,
  ): Promise<SpawnAuthorization> {
    const { agentType } = context;

    try {
      // Check spawn rate limits with retry
      const rateLimitOk = await this.withRetry(
        () => Promise.resolve(this.checkSpawnRateLimit(agentType)),
        "Rate limit check",
      );
      if (!rateLimitOk) {
        return {
          authorized: false,
          trackingId,
          reason: `Spawn rate limit exceeded for ${agentType}`,
          warnings: ["Too many spawn attempts in short time window"],
        };
      }

      // Check per-agent type limits with retry
      const canSpawn = await this.checkAgentLimitsWithRetry(agentType);
      if (!canSpawn) {
        return {
          authorized: false,
          trackingId,
          reason: `Agent type limit exceeded for ${agentType}`,
          warnings: ["Maximum concurrent agents reached"],
        };
      }

      // Check total concurrent limit with retry
      const totalActive = await this.getTotalActiveWithRetry();
      const concurrentLimit = this.limits.totalConcurrent ?? 8;
      if (totalActive >= concurrentLimit) {
        return {
          authorized: false,
          trackingId,
          reason: `Total concurrent limit exceeded: ${totalActive}/${concurrentLimit}`,
          warnings: ["System at maximum concurrent agent capacity"],
        };
      }

      // Detect potential infinite spawn patterns
      if (this.detectInfiniteSpawn(agentType, context)) {
        return {
          authorized: false,
          trackingId,
          reason: "Infinite spawn pattern detected",
          warnings: [
            "Recursive spawning prevented to avoid system instability",
          ],
        };
      }

      // Register the spawn with retry
      await this.registerSpawnWithRetry(context, trackingId);

      return {
        authorized: true,
        trackingId,
      };
    } catch (error) {
      throw new Error(
        `Authorization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async checkAgentLimitsWithRetry(agentType: string): Promise<boolean> {
    return this.withRetry(async () => {
      const currentCount = this.getActiveCount(agentType);
      const typeLimit = this.limits.perAgentType?.[agentType] ?? 1;
      return currentCount < typeLimit;
    }, "Agent limit check");
  }

  private async getTotalActiveWithRetry(): Promise<number> {
    return this.withRetry(() => {
      return Promise.resolve(this.getTotalActive());
    }, "Total active count");
  }

  private async registerSpawnWithRetry(
    context: SpawnContext,
    trackingId: string,
  ): Promise<void> {
    return this.withRetry(async () => {
      const record: SpawnRecord = {
        id: trackingId,
        agentType: context.agentType,
        parentAgent: context.parentAgent,
        timestamp: Date.now(),
        status: "active",
        context,
      };

      this.registerSpawn(record);

      await frameworkLogger.log(
        "agent-spawn-governor",
        "spawn-authorized",
        "info",
        {
          trackingId,
          agentType: context.agentType,
          parentAgent: context.parentAgent,
          activeCount: this.getActiveCount(context.agentType),
          totalActive: this.getTotalActive(),
        },
      );
    }, "Spawn registration");
  }

  private async handleAuthorizationError(
    error: any,
    trackingId: string,
    context: SpawnContext,
  ): Promise<void> {
    const errorType = this.categorizeError(error);

    await frameworkLogger.log(
      "agent-spawn-governor",
      "spawn-authorization-error",
      "error",
      {
        trackingId,
        agentType: context.agentType,
        errorType,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    if (errorType === "persistence") {
      this.emergencyCleanup(`Authorization failure: ${errorType}`);
    }
  }

  private categorizeError(error: any): string {
    if (error.message?.includes("timeout")) return "timeout";
    if (error.message?.includes("persistence")) return "persistence";
    if (error.message?.includes("memory")) return "memory";
    return "unknown";
  }

  private emergencyCleanup(reason: string): void {
    this.aggressiveCleanup();

    frameworkLogger.log("agent-spawn-governor", "emergency-cleanup", "error", {
      reason,
      remainingActive: this.getTotalActive(),
      historySize: this.spawnHistory.length,
    });
  }

  /**
   * Complete an agent spawn (mark as completed)
   */
  async completeSpawn(trackingId: string, result?: any): Promise<void> {
    const record = this.findRecord(trackingId);
    if (record) {
      record.status = "completed";
      await frameworkLogger.log(
        "agent-spawn-governor",
        "spawn-completed",
        "info",
        {
          trackingId,
          agentType: record.agentType,
          duration: Date.now() - record.timestamp,
          result: result ? "success" : "failure",
        },
      );
    }
  }

  /**
   * Fail an agent spawn
   */
  async failSpawn(trackingId: string, error?: Error): Promise<void> {
    const record = this.findRecord(trackingId);
    if (record) {
      record.status = "failed";
      await frameworkLogger.log(
        "agent-spawn-governor",
        "spawn-failed",
        "error",
        {
          trackingId,
          agentType: record.agentType,
          duration: Date.now() - record.timestamp,
          error: error?.message,
        },
      );
    }
  }

  /**
   * Terminate an agent spawn (force stop)
   */
  async terminateSpawn(trackingId: string, reason?: string): Promise<void> {
    const record = this.findRecord(trackingId);
    if (record) {
      record.status = "terminated";
      await frameworkLogger.log(
        "agent-spawn-governor",
        "spawn-terminated",
        "info",
        {
          trackingId,
          agentType: record.agentType,
          duration: Date.now() - record.timestamp,
          reason,
        },
      );
    }
  }

  /**
   * Get current active count for agent type
   */
  getActiveCount(agentType: string): number {
    return (
      this.activeAgents.get(agentType)?.filter((r) => r.status === "active")
        .length ?? 0
    );
  }

  /**
   * Get total active agents system-wide
   */
  getTotalActive(): number {
    let total = 0;
    for (const records of this.activeAgents.values()) {
      total += records.filter((r) => r.status === "active").length;
    }
    return total;
  }

  /**
   * Get spawn statistics
   */
  getSpawnStats(): {
    perAgentType: Record<string, { active: number; total: number }>;
    totalActive: number;
    totalHistory: number;
  } {
    const perAgentType: Record<string, { active: number; total: number }> = {};

    for (const [agentType, records] of this.activeAgents.entries()) {
      const active = records.filter((r) => r.status === "active").length;
      const total = records.length;
      perAgentType[agentType] = { active, total };
    }

    return {
      perAgentType,
      totalActive: this.getTotalActive(),
      totalHistory: this.spawnHistory.length,
    };
  }

  /**
   * Emergency: Terminate all active agents
   */
  async emergencyShutdown(reason?: string): Promise<void> {
    const activeRecords: SpawnRecord[] = [];

    for (const records of this.activeAgents.values()) {
      activeRecords.push(...records.filter((r) => r.status === "active"));
    }

    for (const record of activeRecords) {
      await this.terminateSpawn(record.id, reason || "Emergency shutdown");
    }

    await frameworkLogger.log(
      "agent-spawn-governor",
      "emergency-shutdown",
      "error",
      {
        terminatedCount: activeRecords.length,
        reason: reason || "Emergency shutdown initiated",
      },
    );
  }

  // Private methods

  private registerSpawn(record: SpawnRecord): void {
    const { agentType } = record;

    if (!this.activeAgents.has(agentType)) {
      this.activeAgents.set(agentType, []);
    }

    this.activeAgents.get(agentType)!.push(record);
    this.spawnHistory.push(record);

    // Maintain history size limit
    if (this.spawnHistory.length > this.maxHistorySize) {
      this.spawnHistory.shift();
    }

    // Clean up old completed records periodically
    this.cleanupOldRecords();
  }

  private checkSpawnRateLimit(agentType: string): boolean {
    const now = Date.now();
    const rateLimit =
      this.limits.spawnRateLimit ?? this.defaultLimits.spawnRateLimit;
    const windowStart = now - rateLimit.windowMs;

    const recentSpawns = this.spawnHistory.filter(
      (r) =>
        r.agentType === agentType &&
        r.timestamp >= windowStart &&
        r.timestamp <= now,
    );

    return recentSpawns.length < rateLimit.maxPerMinute;
  }

  private detectInfiniteSpawn(
    agentType: string,
    context: SpawnContext,
  ): boolean {
    // Check for rapid repeated spawns of same type
    const recentSpawns = this.getRecentSpawns(agentType, 300000); // 5 minutes
    if (recentSpawns.length > 5) {
      return true;
    }

    // Check for recursive spawning (agent spawning itself)
    if (context.parentAgent === agentType) {
      return true;
    }

    // Check for cascading researcher spawns (specific known issue)
    if (agentType === "researcher") {
      const researcherSpawns = recentSpawns.filter(
        (r) => r.agentType === "researcher",
      );
      if (researcherSpawns.length > 2) {
        return true;
      }
    }

    return false;
  }

  private getRecentSpawns(
    agentType: string,
    timeWindowMs: number,
  ): SpawnRecord[] {
    const now = Date.now();
    const windowStart = now - timeWindowMs;

    return this.spawnHistory.filter(
      (r) => r.agentType === agentType && r.timestamp >= windowStart,
    );
  }

  private findRecord(trackingId: string): SpawnRecord | undefined {
    for (const records of this.activeAgents.values()) {
      const record = records.find((r) => r.id === trackingId);
      if (record) return record;
    }
    return undefined;
  }

  private generateTrackingId(): string {
    return `spawn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private cleanupOldRecords(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [agentType, records] of this.activeAgents.entries()) {
      const filtered = records.filter(
        (r) => r.status === "active" || now - r.timestamp < maxAge,
      );

      if (filtered.length === 0) {
        this.activeAgents.delete(agentType);
      } else {
        this.activeAgents.set(agentType, filtered);
      }
    }

    // Clean up spawn history to prevent memory leaks (retains active records and recent history for 7 days)
    const historyMaxAge = 7 * 24 * 60 * 60 * 1000;
    this.spawnHistory = this.spawnHistory.filter(
      (r) => r.status === "active" || now - r.timestamp < historyMaxAge,
    );
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));

          await frameworkLogger.log(
            "agent-spawn-governor",
            "retry-attempt",
            "info",
            {
              operation: operationName,
              attempt,
              delay,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }
      }
    }

    throw lastError;
  }

  // Cleanup on destruction
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    this.aggressiveCleanup(); // Final cleanup
  }
}

// Export singleton instance
export const agentSpawnGovernor = new AgentSpawnGovernor();
