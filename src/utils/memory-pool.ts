import { EventEmitter } from "events";

/**
 * Memory Pool System - Reusable object pooling to reduce GC pressure
 * Implements efficient object reuse for frequently allocated objects
 */

export interface MemoryPoolConfig {
  maxSize: number;
  factory: () => any;
  reset?: ((obj: any) => void) | undefined;
  validate?: (obj: any) => boolean;
}

export interface PoolMetrics {
  name: string;
  allocated: number;
  available: number;
  totalCreated: number;
  hitRate: number;
  averageUsage: number;
}

export class MemoryPool<T = any> extends EventEmitter {
  private available: T[] = [];
  private created = 0;
  private totalRequests = 0;
  private cacheHits = 0;
  private config: MemoryPoolConfig;

  constructor(config: MemoryPoolConfig) {
    super();
    this.config = config;
  }

  /**
   * Get an object from the pool or create a new one
   */
  get(): T {
    this.totalRequests++;

    if (this.available.length > 0) {
      this.cacheHits++;
      const obj = this.available.pop()!;

      // Validate object if validator provided
      if (this.config.validate && !this.config.validate(obj)) {
        // Object is invalid, create new one
        return this.createNew();
      }

      return obj;
    }

    return this.createNew();
  }

  /**
   * Return an object to the pool for reuse
   */
  release(obj: T): void {
    if (!obj) return;

    // Reset object if reset function provided
    if (this.config.reset) {
      try {
        this.config.reset(obj);
      } catch (error) {
        // Reset failed, don't reuse this object
        return;
      }
    }

    // Only keep if under max size
    if (this.available.length < this.config.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * Create a new object using the factory
   */
  private createNew(): T {
    this.created++;
    const obj = this.config.factory();

    this.emit("objectCreated", {
      pool: this,
      object: obj,
      totalCreated: this.created,
    });

    return obj;
  }

  /**
   * Get pool metrics and statistics
   */
  getMetrics(): PoolMetrics {
    const hitRate =
      this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;

    return {
      name: "memoryPool",
      allocated: this.created - this.available.length,
      available: this.available.length,
      totalCreated: this.created,
      hitRate,
      averageUsage:
        this.totalRequests > 0 ? this.created / this.totalRequests : 0,
    };
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    this.available = [];
    this.emit("poolCleared", { pool: this });
  }

  /**
   * Get current pool status
   */
  getStatus() {
    return {
      available: this.available.length,
      created: this.created,
      maxSize: this.config.maxSize,
      utilization:
        this.created > 0
          ? (this.created - this.available.length) / this.created
          : 0,
    };
  }
}

/**
 * Global Memory Pool Manager
 * Manages multiple memory pools and provides optimization recommendations
 */
export class MemoryPoolManager extends EventEmitter {
  private pools = new Map<string, MemoryPool<any>>();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startMonitoring();
  }

  /**
   * Create or get a memory pool
   */
  getPool<T>(name: string, config: MemoryPoolConfig): MemoryPool<T> {
    if (!this.pools.has(name)) {
      const pool = new MemoryPool<T>(config);
      this.pools.set(name, pool);

      pool.on("objectCreated", (data) => {
        this.emit("poolObjectCreated", { poolName: name, ...data });
      });

      pool.on("poolCleared", (data) => {
        this.emit("poolCleared", { poolName: name, ...data });
      });
    }

    return this.pools.get(name)!;
  }

  /**
   * Get metrics for all pools
   */
  getAllMetrics(): Record<string, PoolMetrics> {
    const metrics: Record<string, PoolMetrics> = {};

    for (const [name, pool] of this.pools) {
      metrics[name] = pool.getMetrics();
    }

    return metrics;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getAllMetrics();

    for (const [name, metric] of Object.entries(metrics)) {
      if (metric.hitRate < 0.5) {
        recommendations.push(
          `Pool '${name}' has low hit rate (${(metric.hitRate * 100).toFixed(1)}%). ` +
            "Consider reducing pool size or increasing object lifetime.",
        );
      }

      if (metric.averageUsage > 2) {
        recommendations.push(
          `Pool '${name}' has high object creation rate (${metric.averageUsage.toFixed(1)} objects per request). ` +
            "Consider increasing pool size or implementing object reuse.",
        );
      }

      if (metric.available === 0 && metric.allocated > 10) {
        recommendations.push(
          `Pool '${name}' is fully utilized (${metric.allocated} objects). ` +
            "Consider increasing max pool size.",
        );
      }
    }

    return recommendations;
  }

  /**
   * Start monitoring pools and emitting metrics
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const metrics = this.getAllMetrics();
      this.emit("metricsUpdate", metrics);

      // Check for optimization opportunities
      const recommendations = this.getOptimizationRecommendations();
      if (recommendations.length > 0) {
        this.emit("optimizationRecommendations", recommendations);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Stop monitoring and clear all pools
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.monitoringInterval = null;

    for (const pool of this.pools.values()) {
      pool.clear();
    }

    this.pools.clear();
  }
}

// Global instance
export const memoryPoolManager = new MemoryPoolManager();

// Convenience functions for common object types
export function createSessionPool(maxSize = 100): MemoryPool<any> {
  return memoryPoolManager.getPool("sessions", {
    maxSize,
    factory: () => ({
      id: "",
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata: new Map(),
      isActive: true,
    }),
    reset: (session) => {
      session.id = "";
      session.createdAt = Date.now();
      session.lastActivity = Date.now();
      session.metadata.clear();
      session.isActive = true;
    },
  });
}

export function createMetricsPool(maxSize = 200): MemoryPool<any> {
  return memoryPoolManager.getPool("metrics", {
    maxSize,
    factory: () => ({
      timestamp: Date.now(),
      type: "",
      value: 0,
      metadata: {},
    }),
    reset: (metric) => {
      metric.timestamp = Date.now();
      metric.type = "";
      metric.value = 0;
      metric.metadata = {};
    },
  });
}

export function createAlertPool(maxSize = 50): MemoryPool<any> {
  return memoryPoolManager.getPool("alerts", {
    maxSize,
    factory: () => ({
      id: "",
      type: "",
      severity: "low",
      message: "",
      timestamp: Date.now(),
      resolved: false,
    }),
    reset: (alert) => {
      alert.id = "";
      alert.type = "";
      alert.severity = "low";
      alert.message = "";
      alert.timestamp = Date.now();
      alert.resolved = false;
    },
  });
}
