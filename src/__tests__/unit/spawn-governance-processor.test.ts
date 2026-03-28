/**
 * Tests for spawn-governance-processor.ts
 *
 * Enforces codex terms #52-57.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SpawnGovernanceProcessor,
  runSpawnGovernance,
  type SpawnGovernanceConfig,
} from "../../processors/spawn-governance-processor.js";

// ---------------------------------------------------------------------------
// Mock process.memoryUsage so we can control memory thresholds
// ---------------------------------------------------------------------------

const mockMemoryUsage = vi.fn(() => ({
  rss: 100_000_000,
  heapTotal: 100_000_000,
  heapUsed: 30_000_000,
  external: 5_000_000,
  arrayBuffers: 2_000_000,
}));

vi.stubGlobal("process", {
  ...globalThis.process,
  memoryUsage: mockMemoryUsage,
});

describe("spawn-governance-processor", () => {
  let processor: SpawnGovernanceProcessor;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());
    mockMemoryUsage.mockReturnValue({
      rss: 100_000_000,
      heapTotal: 100_000_000,
      heapUsed: 30_000_000,
      external: 5_000_000,
      arrayBuffers: 2_000_000,
    });
    processor = new SpawnGovernanceProcessor();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Basic: allow spawn under limits
  // -----------------------------------------------------------------------

  describe("allow spawn under limits", () => {
    it("should allow spawn when no active spawns and limits not hit", () => {
      const result = processor.checkSpawnAllowed("agent-1");
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should allow spawn up to max concurrent limit", () => {
      for (let i = 0; i < SpawnGovernanceProcessor.DEFAULT_MAX_CONCURRENT; i++) {
        const check = processor.checkSpawnAllowed(`agent-${i}`);
        expect(check.allowed).toBe(true);
        processor.recordSpawn(`agent-${i}`);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Concurrent agent limits (#54)
  // -----------------------------------------------------------------------

  describe("concurrent agent limits (#54)", () => {
    it("should block spawn when concurrent limit exceeded", () => {
      // Fill up to max
      for (let i = 0; i < SpawnGovernanceProcessor.DEFAULT_MAX_CONCURRENT; i++) {
        processor.recordSpawn(`agent-${i}`);
      }

      const result = processor.checkSpawnAllowed("agent-extra");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Concurrent agent limit exceeded");
    });

    it("should allow spawn after an agent completes", () => {
      for (let i = 0; i < SpawnGovernanceProcessor.DEFAULT_MAX_CONCURRENT; i++) {
        processor.recordSpawn(`agent-${i}`);
      }

      // One finishes
      processor.recordSpawnComplete("agent-0");

      const result = processor.checkSpawnAllowed("agent-new");
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Infinite spawn pattern detection (#56)
  // -----------------------------------------------------------------------

  describe("infinite spawn pattern detection (#56)", () => {
    it("should detect infinite spawn patterns (same agent rapid fire)", () => {
      // Spawn the same agent 3 times rapidly
      for (let i = 0; i < 3; i++) {
        const check = processor.checkSpawnAllowed("loop-agent");
        if (check.allowed) {
          processor.recordSpawn("loop-agent");
          processor.recordSpawnComplete("loop-agent");
        }
      }

      // The 4th attempt should be blocked
      const result = processor.checkSpawnAllowed("loop-agent");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Infinite spawn pattern detected");
      expect(result.reason).toContain("loop-agent");
    });

    it("should allow same agent after infinite spawn window expires", () => {
      for (let i = 0; i < 3; i++) {
        const check = processor.checkSpawnAllowed("loop-agent");
        if (check.allowed) {
          processor.recordSpawn("loop-agent");
          processor.recordSpawnComplete("loop-agent");
        }
      }

      // Advance past the 10s window
      vi.advanceTimersByTime(11_000);

      const result = processor.checkSpawnAllowed("loop-agent");
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Rate limiting (#57)
  // -----------------------------------------------------------------------

  describe("rate limiting (#57)", () => {
    it("should enforce rate limiting", () => {
      const p = new SpawnGovernanceProcessor({
        maxConcurrent: 100,
        maxSpawnsPerWindow: 3,
        rateLimitWindowMs: 10000,
      });

      for (let i = 0; i < 3; i++) {
        const check = p.checkSpawnAllowed(`agent-${i}`);
        expect(check.allowed).toBe(true);
        p.recordSpawn(`agent-${i}`);
      }

      const result = p.checkSpawnAllowed("agent-next");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Spawn rate limit exceeded");
    });

    it("should allow spawns after rate window expires", () => {
      const p = new SpawnGovernanceProcessor({
        maxConcurrent: 100,
        maxSpawnsPerWindow: 2,
        rateLimitWindowMs: 10000,
      });

      p.recordSpawn("agent-a");
      p.recordSpawn("agent-b");

      const blocked = p.checkSpawnAllowed("agent-c");
      expect(blocked.allowed).toBe(false);

      vi.advanceTimersByTime(10_001);

      const allowed = p.checkSpawnAllowed("agent-c");
      expect(allowed.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Emergency memory cleanup (#55)
  // -----------------------------------------------------------------------

  describe("emergency memory cleanup (#55)", () => {
    it("should trigger emergency cleanup on memory threshold", () => {
      mockMemoryUsage.mockReturnValue({
        rss: 200_000_000,
        heapTotal: 100_000_000,
        heapUsed: 85_000_000,
        external: 5_000_000,
        arrayBuffers: 2_000_000,
      });

      // Seed some state
      processor.recordSpawn("agent-1");
      processor.recordSpawn("agent-2");

      const result = processor.checkSpawnAllowed("agent-3");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Emergency memory cleanup triggered");

      // After emergency cleanup, metrics should be reset
      const metrics = processor.getMetrics();
      expect(metrics.activeSpawns).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Recursive subagent spawning prevention (#53)
  // -----------------------------------------------------------------------

  describe("recursive subagent spawning prevention (#53)", () => {
    it("should block recursive subagent spawning", () => {
      // Simulate a subagent already running
      processor.setSubagentDepth("sub-agent-a", 1);

      const result = processor.checkSpawnAllowed("sub-agent-a");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Recursive subagent spawning blocked");
    });

    it("should allow spawn for agents with no subagent depth", () => {
      const result = processor.checkSpawnAllowed("fresh-agent");
      expect(result.allowed).toBe(true);
    });

    it("should clear subagent depth on spawn complete", () => {
      processor.setSubagentDepth("sub-agent", 1);

      processor.recordSpawnComplete("sub-agent");

      // After clearing, a new check should succeed
      const result = processor.checkSpawnAllowed("sub-agent");
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Metrics tracking
  // -----------------------------------------------------------------------

  describe("metrics tracking", () => {
    it("should track metrics accurately", () => {
      processor.recordSpawn("agent-a");
      processor.recordSpawn("agent-b");

      const metrics = processor.getMetrics();
      expect(metrics.activeSpawns).toBe(2);
      expect(metrics.recentSpawns).toBe(2);
      expect(metrics.blockedSpawns).toBe(0);

      // Block a spawn
      processor.checkSpawnAllowed("agent-c"); // allowed - concurrent not exceeded yet (only 2 active, max 5)

      // Block via concurrent limit
      for (let i = 2; i < 5; i++) {
        processor.recordSpawn(`agent-${String.fromCharCode(97 + i)}`);
      }
      const blockedResult = processor.checkSpawnAllowed("agent-extra");
      expect(blockedResult.allowed).toBe(false);

      const metricsAfter = processor.getMetrics();
      expect(metricsAfter.activeSpawns).toBe(5);
      expect(metricsAfter.blockedSpawns).toBe(1);
    });

    it("should report memory usage", () => {
      const metrics = processor.getMetrics();
      // 30M / 100M = 0.3
      expect(metrics.memoryUsage).toBe(0.3);
    });
  });

  // -----------------------------------------------------------------------
  // Purge old rate limit entries
  // -----------------------------------------------------------------------

  describe("purge old rate limit entries", () => {
    it("should purge old rate limit entries", () => {
      const p = new SpawnGovernanceProcessor({
        maxConcurrent: 100,
        maxSpawnsPerWindow: 5,
        rateLimitWindowMs: 5000,
      });

      // Record 5 spawns
      for (let i = 0; i < 5; i++) {
        p.recordSpawn(`agent-${i}`);
      }

      expect(p.getMetrics().recentSpawns).toBe(5);

      // Advance past the window
      vi.advanceTimersByTime(6000);

      // getMetrics purges old entries
      expect(p.getMetrics().recentSpawns).toBe(0);

      // Should be able to spawn again
      const check = p.checkSpawnAllowed("agent-new");
      expect(check.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Recovery after emergency cleanup
  // -----------------------------------------------------------------------

  describe("recovery after emergency cleanup", () => {
    it("should recover after emergency cleanup", () => {
      // Saturate
      for (let i = 0; i < 5; i++) {
        processor.recordSpawn(`agent-${i}`);
      }

      processor.blockedCount = 42;

      processor.emergencyCleanup();

      // After cleanup everything should be reset
      const metrics = processor.getMetrics();
      expect(metrics.activeSpawns).toBe(0);
      expect(metrics.recentSpawns).toBe(0);

      // Should be able to spawn again (memory mock still returns safe values)
      mockMemoryUsage.mockReturnValue({
        rss: 100_000_000,
        heapTotal: 100_000_000,
        heapUsed: 30_000_000,
        external: 5_000_000,
        arrayBuffers: 2_000_000,
      });

      const result = processor.checkSpawnAllowed("agent-fresh");
      expect(result.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // runSpawnGovernance standalone
  // -----------------------------------------------------------------------

  describe("runSpawnGovernance", () => {
    it("should return allowed=true when spawn is permitted", async () => {
      const result = await runSpawnGovernance({ agentName: "test-agent" });
      expect(result.success).toBe(true);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.metrics.activeSpawns).toBe(1);
    });

    it("should return allowed=false when agentName is missing", async () => {
      const result = await runSpawnGovernance({});
      expect(result.success).toBe(false);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Missing agentName");
    });
  });

  // -----------------------------------------------------------------------
  // Static defaults
  // -----------------------------------------------------------------------

  describe("static defaults", () => {
    it("should expose correct static defaults", () => {
      expect(SpawnGovernanceProcessor.DEFAULT_MAX_CONCURRENT).toBe(5);
      expect(SpawnGovernanceProcessor.DEFAULT_RATE_LIMIT_WINDOW_MS).toBe(10000);
      expect(SpawnGovernanceProcessor.DEFAULT_MAX_SPAWNS_PER_WINDOW).toBe(10);
      expect(SpawnGovernanceProcessor.DEFAULT_MEMORY_THRESHOLD).toBe(0.8);
    });
  });
});
