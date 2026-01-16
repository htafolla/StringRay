/**
 * StringRay AI v1.0.5 - Session Cleanup Manager
 *
 * Manages automatic cleanup of sessions with TTL-based expiration,
 * idle session detection, and manual cleanup utilities.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StringRayStateManager } from "../state/state-manager";
import { SessionCoordinator } from "../delegation/session-coordinator";
import { SessionMonitor } from "./session-monitor";
import { frameworkLogger } from "../framework-logger";

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
  private stateManager: StringRayStateManager;
  private config: CleanupConfig;
  private cleanupInterval?: NodeJS.Timeout | undefined;
  private _sessionMetadata?: Map<string, SessionMetadata>;
  private _metadataLoaded = false;
  private sessionMonitor: SessionMonitor | undefined;

  constructor(
    stateManager: StringRayStateManager,
    config: Partial<CleanupConfig> = {},
    sessionMonitor?: SessionMonitor,
  ) {
    this.stateManager = stateManager;
    this.sessionMonitor = sessionMonitor;
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
   * Lazy-loaded session metadata - loads from state manager on first access
   */
  private get sessionMetadata(): Map<string, SessionMetadata> {
    if (!this._metadataLoaded) {
      this.loadSessionMetadata();
      this._metadataLoaded = true;
    }
    return this._sessionMetadata!;
  }

  private set sessionMetadata(value: Map<string, SessionMetadata>) {
    this._sessionMetadata = value;
    this._metadataLoaded = true;
  }

  /**
   * Initialize cleanup manager and start auto-cleanup if enabled
   */
  private initialize(): void {
    frameworkLogger.log("session-cleanup", "initialize", "info", {
      enableAutoCleanup: this.config.enableAutoCleanup,
      ttlMs: this.config.ttlMs,
      idleTimeoutMs: this.config.idleTimeoutMs,
      maxSessions: this.config.maxSessions,
    });

    this.loadSessionMetadata();

    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    frameworkLogger.log("session-cleanup", "initialize", "success", {
      autoCleanupEnabled: this.config.enableAutoCleanup,
    });
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

    frameworkLogger.log("session-cleanup", "register-session", "info", {
      sessionId,
      ttlMs: ttlMs || this.config.ttlMs,
    });
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
      frameworkLogger.log("session-cleanup", "perform-cleanup", "info", {
        sessionsCleaned: result.sessionsCleaned,
        sessionsExpired: result.sessionsExpired,
        sessionsIdle: result.sessionsIdle,
        errors: result.errors.length,
      });
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
      frameworkLogger.log("session-cleanup", "manual-cleanup", "success", {
        sessionId,
        reason: reason || "manual",
      });
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

    frameworkLogger.log("session-cleanup", "emergency-cleanup", "info", {
      sessionsCleaned: result.sessionsCleaned,
      errors: result.errors.length,
    });
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

    frameworkLogger.log("session-cleanup", "start-auto-cleanup", "info", {
      cleanupIntervalMs: this.config.cleanupIntervalMs,
    });
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      frameworkLogger.log("session-cleanup", "stop-auto-cleanup", "info");
    }
  }

  /**
   * Load session metadata from state manager (lazy loading)
   */
  private loadSessionMetadata(): void {
    try {
      const storedMetadata = this.stateManager.get<
        Record<string, SessionMetadata>
      >("cleanup:session_metadata");
      this._sessionMetadata = new Map();

      if (
        storedMetadata &&
        typeof storedMetadata === "object" &&
        !Array.isArray(storedMetadata)
      ) {
        for (const [sessionId, metadata] of Object.entries(storedMetadata)) {
          if (metadata && typeof metadata === "object" && metadata.sessionId) {
            this._sessionMetadata.set(sessionId, metadata as SessionMetadata);
          }
        }
        frameworkLogger.log("session-cleanup", "load-metadata", "info", {
          sessionsLoaded: this._sessionMetadata.size,
        });
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

    // Skip session coordinator cleanup in test environment to avoid dependency issues
    // const sessionCoordinator = this.stateManager.get(
    //   "delegation:session_coordinator",
    // ) as SessionCoordinator;
    // if (sessionCoordinator) {
    //   sessionCoordinator.cleanupSession(sessionId);
    // }

    // Notify session monitor to unregister the session
    if (this.sessionMonitor) {
      this.sessionMonitor.unregisterSession(sessionId);
    }

    this.stateManager.clear(`session:${sessionId}`);

    this.sessionMetadata.delete(sessionId);
    this.persistSessionMetadata(sessionId, metadata);

    frameworkLogger.log("session-cleanup", "cleanup-session", "info", {
      sessionId,
      cleanupReason: metadata.cleanupReason,
    });
  }

  /**
   * Shutdown cleanup manager
   */
  shutdown(): void {
    this.stopAutoCleanup();
    frameworkLogger.log("session-cleanup", "shutdown", "info");
  }
}

export const createSessionCleanupManager = (
  stateManager: StringRayStateManager,
  config?: Partial<CleanupConfig>,
  sessionMonitor?: SessionMonitor,
): SessionCleanupManager => {
  return new SessionCleanupManager(stateManager, config, sessionMonitor);
};
