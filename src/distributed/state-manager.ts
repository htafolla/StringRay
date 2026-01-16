/**
 * StringRay AI v1.0.9 - Distributed State Management Layer
 *
 * Enterprise-grade distributed state management with Redis/ETCD integration
 * for multi-instance deployments with strong consistency guarantees.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import Redis from "ioredis";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { RaftConsensus } from "./raft-consensus";
import { CircuitBreakerRegistry } from "../circuit-breaker/circuit-breaker";

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
export class DistributedStateManager extends EventEmitter {
  private redis!: Redis;
  private config: DistributedStateConfig;
  private instanceId: string;
  private localCache = new Map<
    string,
    { value: any; version: number; timestamp: number }
  >();
  private pendingOperations = new Map<string, StateOperation>();
  private watchers = new Map<
    string,
    Set<(value: any, version: number) => void>
  >();
  private heartbeatTimer?: NodeJS.Timeout;
  private conflictResolver: ConflictResolver;
  private raftConsensus: RaftConsensus;
  private circuitBreakerRegistry: CircuitBreakerRegistry;

  constructor(config: Partial<DistributedStateConfig> = {}) {
    super();

    this.config = {
      redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
      clusterMode: false,
      keyPrefix: "strray:state:",
      ttlSeconds: 3600,
      consistencyLevel: "strong",
      replicationFactor: 3,
      heartbeatInterval: 5000,
      failoverTimeout: 30000,
      ...config,
    };

    this.instanceId = uuidv4();
    this.conflictResolver = new ConflictResolver(this);
    this.raftConsensus = new RaftConsensus(this.instanceId, this);
    this.circuitBreakerRegistry = new CircuitBreakerRegistry({
      failureThreshold: 3,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
      timeout: 5000,
      name: "distributed-state-manager",
    });

    this.initializeRedis();
    this.startHeartbeat();
    this.setupEventHandlers();
  }

  private initializeRedis(): void {
    this.redis = new Redis(this.config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    this.redis.on("connect", () => {
      console.log(
        `🔗 Distributed State: Connected to Redis (${this.instanceId})`,
      );
    });

    this.redis.on("error", (error: Error) => {
      console.error("❌ Distributed State: Redis connection error:", error);
      this.emit("redisError", error);
    });

    this.redis.on("ready", () => {
      this.emit("ready");
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        const healthData: InstanceHealth = {
          instanceId: this.instanceId,
          lastHeartbeat: Date.now(),
          status: "healthy",
          loadFactor: process.cpuUsage().user / 1000000, // CPU usage in seconds
          activeSessions: this.getActiveSessionCount(),
          memoryUsage: process.memoryUsage().heapUsed,
        };

        await this.redis.setex(
          `${this.config.keyPrefix}heartbeat:${this.instanceId}`,
          Math.ceil(this.config.heartbeatInterval / 1000) * 2,
          JSON.stringify(healthData),
        );

        // Clean up stale heartbeats
        await this.cleanupStaleInstances();
      } catch (error) {
        console.error("❌ Distributed State: Heartbeat failed:", error);
        this.emit("heartbeatFailed", error);
      }
    }, this.config.heartbeatInterval);
  }

  private setupEventHandlers(): void {
    // Listen for state change notifications
    this.redis.subscribe(`${this.config.keyPrefix}changes`, (err) => {
      if (err) {
        console.error(
          "❌ Distributed State: Failed to subscribe to changes:",
          err,
        );
      }
    });

    this.redis.on("message", (channel, message) => {
      if (channel === `${this.config.keyPrefix}changes`) {
        try {
          const change: StateOperation = JSON.parse(message);
          this.handleRemoteStateChange(change);
        } catch (error) {
          console.error(
            "❌ Distributed State: Failed to parse state change:",
            error,
          );
        }
      }
    });
  }

  /**
   * Set distributed state with conflict resolution and circuit breaker protection
   */
  async set<T>(
    key: string,
    value: T,
    options: { ttl?: number; force?: boolean } = {},
  ): Promise<boolean> {
    return this.circuitBreakerRegistry
      .execute("redis-set", async () => {
        const fullKey = `${this.config.keyPrefix}${key}`;
        const operation: StateOperation = {
          id: uuidv4(),
          type: "set",
          key,
          value,
          timestamp: Date.now(),
          instanceId: this.instanceId,
          version: this.getNextVersion(key),
        };

        // Check for conflicts if strong consistency is required
        if (this.config.consistencyLevel === "strong" && !options.force) {
          const conflict = await this.checkForConflicts(key, operation);
          if (conflict) {
            const resolved = await this.conflictResolver.resolve(conflict);
            if (!resolved) {
              throw new Error(`State conflict unresolved for key: ${key}`);
            }
          }
        }

        // Store in Redis with versioning
        const stateData = {
          value,
          version: operation.version,
          timestamp: operation.timestamp,
          instanceId: this.instanceId,
        };

        await this.redis.setex(
          fullKey,
          options.ttl || this.config.ttlSeconds,
          JSON.stringify(stateData),
        );

        // Update local cache
        this.localCache.set(key, {
          value,
          version: operation.version,
          timestamp: operation.timestamp,
        });

        // Notify other instances with circuit breaker protection
        await this.notifyStateChange(operation);

        // Trigger watchers
        this.triggerWatchers(key, value, operation.version);

        console.log(`✅ Distributed State: Set ${key} v${operation.version}`);
        return true;
      })
      .then((result) => result.success)
      .catch(() => false);
  }

  /**
   * Get distributed state with caching and circuit breaker protection
   */
  async get<T>(key: string): Promise<T | undefined> {
    // Check local cache first
    const cached = this.localCache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.value as T;
    }

    const result = await this.circuitBreakerRegistry.execute(
      "redis-get",
      async () => {
        const fullKey = `${this.config.keyPrefix}${key}`;
        const data = await this.redis.get(fullKey);

        if (!data) return undefined;

        const stateData = JSON.parse(data);
        const value = stateData.value as T;

        // Update local cache
        this.localCache.set(key, {
          value,
          version: stateData.version,
          timestamp: stateData.timestamp,
        });

        return value;
      },
    );

    if (!result.success) {
      console.error(
        `❌ Distributed State: Failed to get ${key}:`,
        result.error,
      );
      return undefined;
    }

    return result.data;
  }

  /**
   * Watch for state changes
   */
  watch<T>(
    key: string,
    callback: (value: T, version: number) => void,
  ): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }

    this.watchers.get(key)!.add(callback as any);

    // Return unsubscribe function
    return () => {
      const watchers = this.watchers.get(key);
      if (watchers) {
        watchers.delete(callback as any);
        if (watchers.size === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }

  /**
   * Delete distributed state
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = `${this.config.keyPrefix}${key}`;

    try {
      await this.redis.del(fullKey);
      this.localCache.delete(key);

      const operation: StateOperation = {
        id: uuidv4(),
        type: "delete",
        key,
        timestamp: Date.now(),
        instanceId: this.instanceId,
        version: this.getNextVersion(key),
      };

      await this.notifyStateChange(operation);
      this.triggerWatchers(key, undefined, operation.version);

      console.log(`🗑️ Distributed State: Deleted ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Distributed State: Failed to delete ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all active instances with circuit breaker protection
   */
  async getActiveInstances(): Promise<InstanceHealth[]> {
    const result = await this.circuitBreakerRegistry.execute(
      "redis-keys",
      async () => {
        const keys = await this.redis.keys(
          `${this.config.keyPrefix}heartbeat:*`,
        );
        const instances: InstanceHealth[] = [];

        for (const key of keys) {
          const data = await this.redis.get(key);
          if (data) {
            instances.push(JSON.parse(data));
          }
        }

        return instances.filter(
          (instance) =>
            Date.now() - instance.lastHeartbeat < this.config.failoverTimeout,
        );
      },
    );

    if (!result.success) {
      console.error(
        "❌ Distributed State: Failed to get active instances:",
        result.error,
      );
      return [];
    }

    return result.data || [];
  }

  /**
   * Elect leader instance for coordination using Raft consensus
   */
  async electLeader(): Promise<string> {
    await this.raftConsensus.startElection();
    return this.raftConsensus.getLeader() || this.instanceId;
  }

  /**
   * Check if this instance is the leader
   */
  async isLeader(): Promise<boolean> {
    return this.raftConsensus.isLeader();
  }

  private async checkForConflicts(
    key: string,
    operation: StateOperation,
  ): Promise<StateConflict | null> {
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const existing = await this.redis.get(fullKey);

      if (!existing) return null;

      const existingData = JSON.parse(existing);

      if (existingData.version >= operation.version) {
        return {
          key,
          localVersion: operation.version,
          remoteVersion: existingData.version,
          localValue: operation.value,
          remoteValue: existingData.value,
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error(
        `❌ Distributed State: Conflict check failed for ${key}:`,
        error,
      );
      return null;
    }
  }

  private async handleRemoteStateChange(
    operation: StateOperation,
  ): Promise<void> {
    // Skip our own operations
    if (operation.instanceId === this.instanceId) return;

    console.log(
      `🔄 Distributed State: Remote change ${operation.type} ${operation.key} v${operation.version}`,
    );

    // Update local cache
    if (operation.type === "set") {
      this.localCache.set(operation.key, {
        value: operation.value,
        version: operation.version,
        timestamp: operation.timestamp,
      });
    } else if (operation.type === "delete") {
      this.localCache.delete(operation.key);
    }

    // Trigger watchers
    this.triggerWatchers(operation.key, operation.value, operation.version);
  }

  private async notifyStateChange(operation: StateOperation): Promise<void> {
    await this.circuitBreakerRegistry
      .execute("redis-publish", async () => {
        await this.redis.publish(
          `${this.config.keyPrefix}changes`,
          JSON.stringify(operation),
        );
      })
      .catch((error) => {
        console.error(
          "❌ Distributed State: Failed to notify state change:",
          error,
        );
      });
  }

  private triggerWatchers(key: string, value: any, version: number): void {
    const watchers = this.watchers.get(key);
    if (watchers) {
      for (const callback of watchers) {
        try {
          callback(value, version);
        } catch (error) {
          console.error(
            `❌ Distributed State: Watcher error for ${key}:`,
            error,
          );
        }
      }
    }
  }

  private getNextVersion(key: string): number {
    const cached = this.localCache.get(key);
    return cached ? cached.version + 1 : 1;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < (this.config.ttlSeconds * 1000) / 2; // Half TTL
  }

  private getActiveSessionCount(): number {
    // This would integrate with session management
    return Math.floor(Math.random() * 100); // Placeholder
  }

  private async cleanupStaleInstances(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}heartbeat:*`);
      const now = Date.now();

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const health: InstanceHealth = JSON.parse(data);
          if (now - health.lastHeartbeat > this.config.failoverTimeout) {
            await this.redis.del(key);
            console.log(
              `🧹 Distributed State: Cleaned up stale instance ${health.instanceId}`,
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ Distributed State: Failed to cleanup stale instances:",
        error,
      );
    }
  }

  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Shutdown Raft consensus
    await this.raftConsensus.shutdown();

    // Remove our heartbeat with circuit breaker protection
    await this.circuitBreakerRegistry
      .execute("redis-del-heartbeat", async () => {
        await this.redis.del(
          `${this.config.keyPrefix}heartbeat:${this.instanceId}`,
        );
      })
      .catch((error) => {
        console.warn(
          "⚠️ Distributed State: Failed to remove heartbeat during shutdown:",
          error,
        );
      });

    await this.redis.quit();
    console.log("🛑 Distributed State: Shutdown complete");
  }
}

/**
 * Conflict Resolution Strategies
 */
export class ConflictResolver {
  constructor(private stateManager: DistributedStateManager) {}

  async resolve(conflict: StateConflict): Promise<boolean> {
    // Strategy 1: Last Write Wins (LWW)
    if (conflict.localVersion > conflict.remoteVersion) {
      return true; // Local wins
    }

    // Strategy 2: Timestamp-based resolution
    // Could implement more sophisticated strategies here

    console.warn(
      `⚠️ Distributed State: Conflict detected for ${conflict.key}, using LWW strategy`,
    );
    return false; // Remote wins (don't force local)
  }
}

/**
 * Distributed Lock Manager for critical sections
 */
export class DistributedLockManager {
  private redis: Redis;
  private locks = new Map<string, { token: string; expires: number }>();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async acquireLock(
    key: string,
    ttlMs: number = 30000,
  ): Promise<string | null> {
    const token = uuidv4();
    const fullKey = `lock:${key}`;

    try {
      const result = await this.redis.set(fullKey, token, "PX", ttlMs, "NX");

      if (result === "OK") {
        this.locks.set(key, { token, expires: Date.now() + ttlMs });
        return token;
      }

      return null;
    } catch (error) {
      console.error(`❌ Distributed Lock: Failed to acquire ${key}:`, error);
      return null;
    }
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    const lock = this.locks.get(key);
    if (!lock || lock.token !== token) {
      return false;
    }

    const fullKey = `lock:${key}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(script, 1, fullKey, token);
      if (result === 1) {
        this.locks.delete(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Distributed Lock: Failed to release ${key}:`, error);
      return false;
    }
  }
}

// Factory function
export const createDistributedStateManager = (
  config: Partial<DistributedStateConfig> = {},
): DistributedStateManager => {
  return new DistributedStateManager(config);
};
