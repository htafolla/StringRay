/**
 * Spawn Governance Processor
 *
 * Enforces codex terms #52-57:
 *  - #52 Agent Spawn Governance
 *  - #53 Subagent Spawning Prevention
 *  - #54 Concurrent Agent Limits
 *  - #55 Emergency Memory Cleanup
 *  - #56 Infinite Spawn Pattern Detection
 *  - #57 Spawn Rate Limiting
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { frameworkLogger } from "../core/framework-logger.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface SpawnGovernanceConfig {
  maxConcurrent: number;
  rateLimitWindowMs: number;
  maxSpawnsPerWindow: number;
  memoryThreshold: number;
  infiniteSpawnThreshold: number;
  infiniteSpawnWindowMs: number;
}

// ---------------------------------------------------------------------------
// Processor
// ---------------------------------------------------------------------------

export class SpawnGovernanceProcessor {
  static readonly DEFAULT_MAX_CONCURRENT = 5;
  static readonly DEFAULT_RATE_LIMIT_WINDOW_MS = 10000;
  static readonly DEFAULT_MAX_SPAWNS_PER_WINDOW = 10;
  static readonly DEFAULT_MEMORY_THRESHOLD = 0.8;

  private readonly config: SpawnGovernanceConfig;
  private activeSpawns: Set<string> = new Set();
  private spawnTimestamps: number[] = [];
  private agentSpawnTimestamps: Map<string, number[]> = new Map();
  private blockedCount = 0;
  private subagentDepth: Map<string, number> = new Map();

  constructor(config?: Partial<SpawnGovernanceConfig>) {
    this.config = {
      maxConcurrent: config?.maxConcurrent ?? SpawnGovernanceProcessor.DEFAULT_MAX_CONCURRENT,
      rateLimitWindowMs: config?.rateLimitWindowMs ?? SpawnGovernanceProcessor.DEFAULT_RATE_LIMIT_WINDOW_MS,
      maxSpawnsPerWindow: config?.maxSpawnsPerWindow ?? SpawnGovernanceProcessor.DEFAULT_MAX_SPAWNS_PER_WINDOW,
      memoryThreshold: config?.memoryThreshold ?? SpawnGovernanceProcessor.DEFAULT_MEMORY_THRESHOLD,
      infiniteSpawnThreshold: config?.infiniteSpawnThreshold ?? 3,
      infiniteSpawnWindowMs: config?.infiniteSpawnWindowMs ?? 10000,
    };
  }

  // -----------------------------------------------------------------------
  // Core API
  // -----------------------------------------------------------------------

  checkSpawnAllowed(agentName: string): { allowed: boolean; reason?: string } {
    const now = Date.now();

    // 1. Concurrent agent limit (#54)
    if (this.activeSpawns.size >= this.config.maxConcurrent) {
      this.blockedCount++;
      frameworkLogger.log(
        "spawn-governance",
        "concurrent-limit-exceeded",
        "warning",
        {
          agentName,
          activeSpawns: this.activeSpawns.size,
          maxConcurrent: this.config.maxConcurrent,
        },
      );
      return { allowed: false, reason: `Concurrent agent limit exceeded (${this.activeSpawns.size}/${this.config.maxConcurrent})` };
    }

    // 2. Recursive subagent spawning prevention (#53)
    const depth = this.subagentDepth.get(agentName) ?? 0;
    if (depth > 0) {
      this.blockedCount++;
      frameworkLogger.log(
        "spawn-governance",
        "recursive-subagent-blocked",
        "warning",
        { agentName, depth },
      );
      return { allowed: false, reason: `Recursive subagent spawning blocked for "${agentName}" (depth ${depth})` };
    }

    // 3. Infinite spawn pattern detection (#56)
    const agentTimes = this.agentSpawnTimestamps.get(agentName) ?? [];
    const recentAgentSpawns = agentTimes.filter(
      (t) => now - t < this.config.infiniteSpawnWindowMs,
    );
    if (recentAgentSpawns.length >= this.config.infiniteSpawnThreshold) {
      this.blockedCount++;
      frameworkLogger.log(
        "spawn-governance",
        "infinite-spawn-pattern-detected",
        "warning",
        {
          agentName,
          recentCount: recentAgentSpawns.length,
          threshold: this.config.infiniteSpawnThreshold,
          windowMs: this.config.infiniteSpawnWindowMs,
        },
      );
      return {
        allowed: false,
        reason: `Infinite spawn pattern detected for "${agentName}" (${recentAgentSpawns.length} spawns in ${this.config.infiniteSpawnWindowMs}ms)`,
      };
    }

    // 4. Spawn rate limiting (#57)
    this.purgeOldTimestamps(now);
    if (this.spawnTimestamps.length >= this.config.maxSpawnsPerWindow) {
      this.blockedCount++;
      frameworkLogger.log(
        "spawn-governance",
        "rate-limit-exceeded",
        "warning",
        {
          agentName,
          recentSpawns: this.spawnTimestamps.length,
          maxSpawns: this.config.maxSpawnsPerWindow,
          windowMs: this.config.rateLimitWindowMs,
        },
      );
      return {
        allowed: false,
        reason: `Spawn rate limit exceeded (${this.spawnTimestamps.length}/${this.config.maxSpawnsPerWindow} in ${this.config.rateLimitWindowMs}ms)`,
      };
    }

    // 5. Emergency memory check (#55)
    const memRatio = this.getMemoryUsageRatio();
    if (memRatio > this.config.memoryThreshold) {
      frameworkLogger.log(
        "spawn-governance",
        "memory-threshold-exceeded",
        "warning",
        {
          agentName,
          memoryUsage: memRatio,
          threshold: this.config.memoryThreshold,
        },
      );
      this.emergencyCleanup();
      return { allowed: false, reason: `Emergency memory cleanup triggered (heap usage ${(memRatio * 100).toFixed(1)}% > ${(this.config.memoryThreshold * 100).toFixed(0)}%)` };
    }

    return { allowed: true };
  }

  recordSpawn(agentName: string): void {
    const now = Date.now();

    this.activeSpawns.add(agentName);
    this.spawnTimestamps.push(now);

    const agentTimes = this.agentSpawnTimestamps.get(agentName) ?? [];
    agentTimes.push(now);
    this.agentSpawnTimestamps.set(agentName, agentTimes);

    // Track subagent depth: increment parent depth for new subagent
    const currentDepth = this.subagentDepth.get(agentName) ?? 0;
    this.subagentDepth.set(agentName, currentDepth);

    frameworkLogger.log(
      "spawn-governance",
      "spawn-recorded",
      "info",
      { agentName, activeSpawns: this.activeSpawns.size },
    );
  }

  recordSpawnComplete(agentName: string): void {
    this.activeSpawns.delete(agentName);
    this.subagentDepth.delete(agentName);

    frameworkLogger.log(
      "spawn-governance",
      "spawn-completed",
      "info",
      { agentName, activeSpawns: this.activeSpawns.size },
    );
  }

  // -----------------------------------------------------------------------
  // Metrics
  // -----------------------------------------------------------------------

  getMetrics(): {
    activeSpawns: number;
    recentSpawns: number;
    blockedSpawns: number;
    memoryUsage: number;
  } {
    this.purgeOldTimestamps(Date.now());
    return {
      activeSpawns: this.activeSpawns.size,
      recentSpawns: this.spawnTimestamps.length,
      blockedSpawns: this.blockedCount,
      memoryUsage: this.getMemoryUsageRatio(),
    };
  }

  // -----------------------------------------------------------------------
  // Emergency cleanup
  // -----------------------------------------------------------------------

  emergencyCleanup(): void {
    frameworkLogger.log(
      "spawn-governance",
      "emergency-cleanup-started",
      "warning",
      { activeSpawns: this.activeSpawns.size, recentSpawns: this.spawnTimestamps.length },
    );

    this.activeSpawns.clear();
    this.spawnTimestamps = [];
    this.agentSpawnTimestamps.clear();
    this.subagentDepth.clear();

    if (global.gc) {
      global.gc();
    }

    frameworkLogger.log(
      "spawn-governance",
      "emergency-cleanup-completed",
      "info",
      {},
    );
  }

  // -----------------------------------------------------------------------
  // Subagent depth management (for recursive prevention)
  // -----------------------------------------------------------------------

  setSubagentDepth(agentName: string, depth: number): void {
    this.subagentDepth.set(agentName, depth);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private purgeOldTimestamps(now: number): void {
    const cutoff = now - this.config.rateLimitWindowMs;
    this.spawnTimestamps = this.spawnTimestamps.filter((t) => t > cutoff);

    // Also purge agent-specific timestamps
    this.agentSpawnTimestamps.forEach((times, agent) => {
      const filtered = times.filter((t) => t > cutoff);
      if (filtered.length === 0) {
        this.agentSpawnTimestamps.delete(agent);
      } else {
        this.agentSpawnTimestamps.set(agent, filtered);
      }
    });
  }

  private getMemoryUsageRatio(): number {
    try {
      const mem = process.memoryUsage();
      return mem.heapUsed / mem.heapTotal;
    } catch {
      return 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Standalone runner for processor-manager integration
// ---------------------------------------------------------------------------

export async function runSpawnGovernance(context: any): Promise<{
  success: boolean;
  allowed: boolean;
  reason?: string;
  metrics: ReturnType<SpawnGovernanceProcessor["getMetrics"]>;
}> {
  const processor = new SpawnGovernanceProcessor(
    context.config as Partial<SpawnGovernanceConfig> | undefined,
  );

  const agentName = context.agentName as string | undefined;

  if (!agentName) {
    return {
      success: false,
      allowed: false,
      reason: "Missing agentName in context",
      metrics: processor.getMetrics(),
    };
  }

  const check = processor.checkSpawnAllowed(agentName);

  if (check.allowed) {
    processor.recordSpawn(agentName);
  }

  return {
    success: true,
    allowed: check.allowed,
    ...(check.reason ? { reason: check.reason } : {}),
    metrics: processor.getMetrics(),
  };
}
