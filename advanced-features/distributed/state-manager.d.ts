/**
 * StringRay AI v1.1.1 - Distributed State Management Layer
 *
 * Enterprise-grade distributed state management with Redis/ETCD integration
 * for multi-instance deployments with strong consistency guarantees.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
export interface DistributedStateConfig {
    redisUrl: string;
    clusterMode: boolean;
    keyPrefix: string;
    ttlSeconds: number;
    consistencyLevel: "strong" | "eventual";
    replicationFactor: number;
    heartbeatInterval: number;
    failoverTimeout: number;
}
export interface StateOperation {
    id: string;
    type: "set" | "get" | "delete" | "watch";
    key: string;
    value?: any;
    timestamp: number;
    instanceId: string;
    version: number;
}
export interface StateConflict {
    key: string;
    localVersion: number;
    remoteVersion: number;
    localValue: any;
    remoteValue: any;
    timestamp: number;
    resolution?: "local" | "remote" | "merge";
}
export interface InstanceHealth {
    instanceId: string;
    lastHeartbeat: number;
    status: "healthy" | "unhealthy" | "failed";
    loadFactor: number;
    activeSessions: number;
    memoryUsage: number;
}
/**
 * Distributed State Manager - Core of multi-instance architecture
 */
export declare class DistributedStateManager extends EventEmitter {
    private redis;
    private config;
    private instanceId;
    private localCache;
    private pendingOperations;
    private watchers;
    private heartbeatTimer?;
    private conflictResolver;
    private raftConsensus;
    private circuitBreakerRegistry;
    constructor(config?: Partial<DistributedStateConfig>);
    private initializeRedis;
    private startHeartbeat;
    private setupEventHandlers;
    /**
     * Set distributed state with conflict resolution and circuit breaker protection
     */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        force?: boolean;
    }): Promise<boolean>;
    /**
     * Get distributed state with caching and circuit breaker protection
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Watch for state changes
     */
    watch<T>(key: string, callback: (value: T, version: number) => void): () => void;
    /**
     * Delete distributed state
     */
    delete(key: string): Promise<boolean>;
    /**
     * Get all active instances with circuit breaker protection
     */
    getActiveInstances(): Promise<InstanceHealth[]>;
    /**
     * Elect leader instance for coordination using Raft consensus
     */
    electLeader(): Promise<string>;
    /**
     * Check if this instance is the leader
     */
    isLeader(): Promise<boolean>;
    private checkForConflicts;
    private handleRemoteStateChange;
    private notifyStateChange;
    private triggerWatchers;
    private getNextVersion;
    private isCacheValid;
    private getActiveSessionCount;
    private cleanupStaleInstances;
    shutdown(): Promise<void>;
}
/**
 * Conflict Resolution Strategies
 */
export declare class ConflictResolver {
    private stateManager;
    constructor(stateManager: DistributedStateManager);
    resolve(conflict: StateConflict): Promise<boolean>;
}
/**
 * Distributed Lock Manager for critical sections
 */
export declare class DistributedLockManager {
    private redis;
    private locks;
    constructor(redis: Redis);
    acquireLock(key: string, ttlMs?: number): Promise<string | null>;
    releaseLock(key: string, token: string): Promise<boolean>;
}
export declare const createDistributedStateManager: (config?: Partial<DistributedStateConfig>) => DistributedStateManager;
//# sourceMappingURL=state-manager.d.ts.map