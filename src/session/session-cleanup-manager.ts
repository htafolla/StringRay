/**
 * StrRay Framework v1.0.0 - Session Cleanup Manager
 *
 * Manages automatic cleanup of sessions with TTL-based expiration,
 * idle session detection, and manual cleanup utilities.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StrRayStateManager } from "../state/state-manager";
import { SessionCoordinator } from "../delegation/session-coordinator";

export interface SessionMetadata {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  ttlMs: number;
  isActive: boolean;
  agentCount: number;
  memoryUsage: number;
  cleanupReason?: string;
}

export interface CleanupConfig {
  ttlMs: number;
  idleTimeoutMs: number;
  maxSessions: number;
  cleanupIntervalMs: number;
  enableAutoCleanup: boolean;
}

export interface CleanupResult {
  sessionsCleaned: number;
  sessionsExpired: number;
  sessionsIdle: number;
  errors: string[];
}

export class SessionCleanupManager {
  private stateManager: StrRayStateManager;
  private config: CleanupConfig;
  private cleanupInterval?: NodeJS.Timeout | undefined;
  private sessionMetadata = new Map<string, SessionMetadata>();

  constructor(
    stateManager: StrRayStateManager,
    config: Partial<CleanupConfig> = {},
  ) {
    this.stateManager = stateManager;
    this.config = {
      ttlMs: 24 * 60 * 60 * 1000,
      idleTimeoutMs: 2 * 60 * 60 * 1000,
      maxSessions: 100,
      cleanupIntervalMs: 5 * 60 * 1000,
      enableAutoCleanup: true,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize cleanup manager and start auto-cleanup if enabled
   */
  private initialize(): void {
    console.log("🧹 Session Cleanup Manager: Initializing...");

    this.loadSessionMetadata();

    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    console.log("✅ Session Cleanup Manager: Initialized");
  }

  /**
   * Register a new session for cleanup tracking
   */
  registerSession(sessionId: string, ttlMs?: number): void {
    const metadata: SessionMetadata = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ttlMs: ttlMs || this.config.ttlMs,
      isActive: true,
      agentCount: 0,
      memoryUsage: 0,
    };

    this.sessionMetadata.set(sessionId, metadata);
    this.persistSessionMetadata(sessionId, metadata);

    console.log(
      `📋 Session Cleanup Manager: Registered session ${sessionId} with TTL ${ttlMs || this.config.ttlMs}ms`,
    );
  }

  updateActivity(sessionId: string): void {
    const metadata = this.sessionMetadata.get(sessionId);
    if (metadata) {
      metadata.lastActivity = Date.now();
      this.persistSessionMetadata(sessionId, metadata);
    }
  }

  updateMetadata(sessionId: string, updates: Partial<SessionMetadata>): void {
    const metadata = this.sessionMetadata.get(sessionId);
    if (metadata) {
      Object.assign(metadata, updates);
      this.persistSessionMetadata(sessionId, metadata);
    }
  }

  /**
   * Check if session should be cleaned up
   */
  shouldCleanup(sessionId: string): boolean {
    const metadata = this.sessionMetadata.get(sessionId);
    if (!metadata) return false;

    const now = Date.now();

    if (now - metadata.createdAt > metadata.ttlMs) {
      return true;
    }

    if (now - metadata.lastActivity > this.config.idleTimeoutMs) {
      return true;
    }

    return false;
  }

  /**
   * Perform cleanup of expired/idle sessions
   */
  async performCleanup(): Promise<CleanupResult> {
    const result: CleanupResult = {
      sessionsCleaned: 0,
      sessionsExpired: 0,
      sessionsIdle: 0,
      errors: [],
    };

    const sessionsToCleanup: string[] = [];

    for (const [sessionId, metadata] of this.sessionMetadata) {
      if (!metadata.isActive) continue;

      const now = Date.now();

      if (now - metadata.createdAt > metadata.ttlMs) {
        sessionsToCleanup.push(sessionId);
        result.sessionsExpired++;
      } else if (now - metadata.lastActivity > this.config.idleTimeoutMs) {
        sessionsToCleanup.push(sessionId);
        result.sessionsIdle++;
      }
    }

    if (this.sessionMetadata.size > this.config.maxSessions) {
      const sortedSessions = Array.from(this.sessionMetadata.entries())
        .filter(([_, metadata]) => metadata.isActive)
        .sort((a, b) => a[1].lastActivity - b[1].lastActivity);

      const excessCount = sortedSessions.length - this.config.maxSessions;
      for (let i = 0; i < excessCount && i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        if (session) {
          sessionsToCleanup.push(session[0]);
        }
      }
    }

    for (const sessionId of sessionsToCleanup) {
      try {
        await this.cleanupSession(sessionId);
        result.sessionsCleaned++;
      } catch (error) {
        result.errors.push(`Failed to cleanup session ${sessionId}: ${error}`);
      }
    }

    if (result.sessionsCleaned > 0) {
      console.log(
        `🧹 Session Cleanup Manager: Cleaned up ${result.sessionsCleaned} sessions (${result.sessionsExpired} expired, ${result.sessionsIdle} idle)`,
      );
    }

    return result;
  }

  /**
   * Manually cleanup a specific session
   */
  async manualCleanup(sessionId: string, reason?: string): Promise<boolean> {
    try {
      const metadata = this.sessionMetadata.get(sessionId);
      if (metadata) {
        metadata.cleanupReason = reason || "manual";
        this.persistSessionMetadata(sessionId, metadata);
      }

      await this.cleanupSession(sessionId);
      console.log(
        `🧹 Session Cleanup Manager: Manual cleanup completed for session ${sessionId}`,
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Session Cleanup Manager: Manual cleanup failed for session ${sessionId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Cleanup all sessions (emergency cleanup)
   */
  async emergencyCleanup(): Promise<CleanupResult> {
    const result: CleanupResult = {
      sessionsCleaned: 0,
      sessionsExpired: 0,
      sessionsIdle: 0,
      errors: [],
    };

    for (const sessionId of this.sessionMetadata.keys()) {
      try {
        await this.cleanupSession(sessionId);
        result.sessionsCleaned++;
      } catch (error) {
        result.errors.push(`Failed to cleanup session ${sessionId}: ${error}`);
      }
    }

    console.log(
      `🚨 Session Cleanup Manager: Emergency cleanup completed - ${result.sessionsCleaned} sessions cleaned`,
    );
    return result;
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    idleSessions: number;
    nextCleanup: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    let idleCount = 0;

    for (const metadata of this.sessionMetadata.values()) {
      if (!metadata.isActive) continue;

      if (now - metadata.createdAt > metadata.ttlMs) {
        expiredCount++;
      } else if (now - metadata.lastActivity > this.config.idleTimeoutMs) {
        idleCount++;
      }
    }

    return {
      totalSessions: this.sessionMetadata.size,
      activeSessions: Array.from(this.sessionMetadata.values()).filter(
        (m) => m.isActive,
      ).length,
      expiredSessions: expiredCount,
      idleSessions: idleCount,
      nextCleanup: this.cleanupInterval
        ? Date.now() + this.config.cleanupIntervalMs
        : 0,
    };
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(sessionId: string): SessionMetadata | undefined {
    return this.sessionMetadata.get(sessionId);
  }

  /**
   * List all sessions with metadata
   */
  listSessions(): SessionMetadata[] {
    return Array.from(this.sessionMetadata.values());
  }

  /**
   * Start automatic cleanup interval
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error(
          "❌ Session Cleanup Manager: Auto-cleanup failed:",
          error,
        );
      }
    }, this.config.cleanupIntervalMs);

    console.log(
      `⏰ Session Cleanup Manager: Auto-cleanup started (interval: ${this.config.cleanupIntervalMs}ms)`,
    );
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      console.log("⏹️ Session Cleanup Manager: Auto-cleanup stopped");
    }
  }

  /**
   * Load session metadata from state manager
   */
  private loadSessionMetadata(): void {
    try {
      const storedMetadata = this.stateManager.get<
        Record<string, SessionMetadata>
      >("cleanup:session_metadata");
      if (
        storedMetadata &&
        typeof storedMetadata === "object" &&
        !Array.isArray(storedMetadata)
      ) {
        for (const [sessionId, metadata] of Object.entries(storedMetadata)) {
          if (metadata && typeof metadata === "object" && metadata.sessionId) {
            this.sessionMetadata.set(sessionId, metadata as SessionMetadata);
          }
        }
        console.log(
          `📋 Session Cleanup Manager: Loaded metadata for ${this.sessionMetadata.size} sessions`,
        );
      } else if (storedMetadata) {
        console.warn(
          "⚠️ Session Cleanup Manager: Corrupted session metadata detected, skipping load",
        );
      }
    } catch (error) {
      console.error(
        "❌ Session Cleanup Manager: Failed to load session metadata:",
        error,
      );
    }
  }

  /**
   * Persist session metadata to state manager
   */
  private persistSessionMetadata(
    sessionId: string,
    metadata: SessionMetadata,
  ): void {
    const allMetadata = Object.fromEntries(this.sessionMetadata);
    this.stateManager.set("cleanup:session_metadata", allMetadata);
  }

  /**
   * Cleanup a specific session
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    const metadata = this.sessionMetadata.get(sessionId);
    if (!metadata) return;

    metadata.isActive = false;
    this.persistSessionMetadata(sessionId, metadata);

    const sessionCoordinator = this.stateManager.get(
      "delegation:session_coordinator",
    ) as SessionCoordinator;
    if (sessionCoordinator) {
      sessionCoordinator.cleanupSession(sessionId);
    }

    this.stateManager.clear(`session:${sessionId}`);

    this.sessionMetadata.delete(sessionId);
    this.persistSessionMetadata(sessionId, metadata);

    console.log(`🧹 Session Cleanup Manager: Cleaned up session ${sessionId}`);
  }

  /**
   * Shutdown cleanup manager
   */
  shutdown(): void {
    this.stopAutoCleanup();
    console.log("🛑 Session Cleanup Manager: Shutdown complete");
  }
}

export const createSessionCleanupManager = (
  stateManager: StrRayStateManager,
  config?: Partial<CleanupConfig>,
): SessionCleanupManager => {
  return new SessionCleanupManager(stateManager, config);
};
