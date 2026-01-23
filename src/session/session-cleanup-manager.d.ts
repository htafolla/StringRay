/**
 * StringRay AI v1.1.1 - Session Cleanup Manager
 *
 * Manages automatic cleanup of sessions with TTL-based expiration,
 * idle session detection, and manual cleanup utilities.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { StringRayStateManager } from "../state/state-manager";
import { SessionMonitor } from "./session-monitor";
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
export declare class SessionCleanupManager {
    private stateManager;
    private config;
    private cleanupInterval?;
    private _sessionMetadata?;
    private _metadataLoaded;
    private sessionMonitor;
    constructor(stateManager: StringRayStateManager, config?: Partial<CleanupConfig>, sessionMonitor?: SessionMonitor);
    /**
     * Lazy-loaded session metadata - loads from state manager on first access
     */
    private get sessionMetadata();
    private set sessionMetadata(value);
    /**
     * Initialize cleanup manager and start auto-cleanup if enabled
     */
    private initialize;
    /**
     * Register a new session for cleanup tracking
     */
    registerSession(sessionId: string, ttlMs?: number): void;
    updateActivity(sessionId: string): void;
    updateMetadata(sessionId: string, updates: Partial<SessionMetadata>): void;
    /**
     * Check if session should be cleaned up
     */
    shouldCleanup(sessionId: string): boolean;
    /**
     * Perform cleanup of expired/idle sessions
     */
    performCleanup(): Promise<CleanupResult>;
    /**
     * Manually cleanup a specific session
     */
    manualCleanup(sessionId: string, reason?: string): Promise<boolean>;
    /**
     * Cleanup all sessions (emergency cleanup)
     */
    emergencyCleanup(): Promise<CleanupResult>;
    /**
     * Get cleanup statistics
     */
    getCleanupStats(): {
        totalSessions: number;
        activeSessions: number;
        expiredSessions: number;
        idleSessions: number;
        nextCleanup: number;
    };
    /**
     * Get session metadata
     */
    getSessionMetadata(sessionId: string): SessionMetadata | undefined;
    /**
     * List all sessions with metadata
     */
    listSessions(): SessionMetadata[];
    /**
     * Start automatic cleanup interval
     */
    private startAutoCleanup;
    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup(): void;
    /**
     * Load session metadata from state manager (lazy loading)
     */
    private loadSessionMetadata;
    /**
     * Persist session metadata to state manager
     */
    private persistSessionMetadata;
    /**
     * Cleanup a specific session
     */
    private cleanupSession;
    /**
     * Shutdown cleanup manager
     */
    shutdown(): void;
}
export declare const createSessionCleanupManager: (stateManager: StringRayStateManager, config?: Partial<CleanupConfig>, sessionMonitor?: SessionMonitor) => SessionCleanupManager;
//# sourceMappingURL=session-cleanup-manager.d.ts.map