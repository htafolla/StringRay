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
export declare class MemoryPool<T = any> extends EventEmitter {
    private available;
    private created;
    private totalRequests;
    private cacheHits;
    private config;
    constructor(config: MemoryPoolConfig);
    /**
     * Get an object from the pool or create a new one
     */
    get(): T;
    /**
     * Return an object to the pool for reuse
     */
    release(obj: T): void;
    /**
     * Create a new object using the factory
     */
    private createNew;
    /**
     * Get pool metrics and statistics
     */
    getMetrics(): PoolMetrics;
    /**
     * Clear all objects from the pool
     */
    clear(): void;
    /**
     * Get current pool status
     */
    getStatus(): {
        available: number;
        created: number;
        maxSize: number;
        utilization: number;
    };
}
/**
 * Global Memory Pool Manager
 * Manages multiple memory pools and provides optimization recommendations
 */
export declare class MemoryPoolManager extends EventEmitter {
    private pools;
    private monitoringInterval;
    constructor();
    /**
     * Create or get a memory pool
     */
    getPool<T>(name: string, config: MemoryPoolConfig): MemoryPool<T>;
    /**
     * Get metrics for all pools
     */
    getAllMetrics(): Record<string, PoolMetrics>;
    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): string[];
    /**
     * Start monitoring pools and emitting metrics
     */
    private startMonitoring;
    /**
     * Stop monitoring and clear all pools
     */
    stop(): void;
}
export declare const memoryPoolManager: MemoryPoolManager;
export declare function createSessionPool(maxSize?: number): MemoryPool<any>;
export declare function createMetricsPool(maxSize?: number): MemoryPool<any>;
export declare function createAlertPool(maxSize?: number): MemoryPool<any>;
//# sourceMappingURL=memory-pool.d.ts.map