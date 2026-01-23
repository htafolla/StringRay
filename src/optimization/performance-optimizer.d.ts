/**
 * StringRay AI v1.1.1 - Performance Optimization System
 *
 * Sub-millisecond optimization techniques for minimal overhead operations.
 * Implements advanced caching, memory optimization, and computational efficiency.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { MemoryPool } from "../utils/memory-pool";
/**
 * LRU Cache with automatic eviction policies for performance optimization
 */
export declare class LRUCache<T> {
    private cache;
    private accessOrder;
    private maxSize;
    private defaultTTL;
    constructor(maxSize?: number, defaultTTL?: number);
    /**
     * Get value from cache with LRU update
     */
    get(key: string): T | undefined;
    /**
     * Set value in cache with LRU eviction
     */
    set(key: string, value: T, ttl?: number): void;
    /**
     * Delete entry from cache
     */
    delete(key: string): boolean;
    /**
     * Clear expired entries
     */
    cleanupExpired(): number;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        utilization: number;
        hitRate: number;
        totalAccesses: number;
        averageTTL: number;
    };
    /**
     * Update access order for LRU
     */
    private updateAccessOrder;
    /**
     * Evict least recently used entry
     */
    private evictLRU;
    /**
     * Estimate object size (simplified)
     */
    private estimateSize;
}
export interface OptimizationMetrics {
    operation: string;
    originalTime: number;
    optimizedTime: number;
    improvement: number;
    memoryBefore: number;
    memoryAfter: number;
    memorySaved: number;
    timestamp: number;
}
export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
}
export interface CacheConfig {
    maxSize: number;
    maxMemory: number;
    ttl: number;
    evictionPolicy: "lru" | "lfu" | "size" | "ttl";
}
export declare class HighPerformanceCache<T> {
    private cache;
    private config;
    private totalMemory;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get cached value with high-performance lookup
     */
    get(key: string): T | undefined;
    /**
     * Set cached value with memory tracking
     */
    set(key: string, value: T): void;
    /**
     * Delete cached entry
     */
    delete(key: string): boolean;
    /**
     * Clear all cached entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        memoryUsage: number;
        hitRate: number;
        averageAccessTime: number;
    };
    private evictEntries;
    private estimateSize;
}
export declare class OptimizedTaskProcessor {
    private cache;
    private resultPool;
    /**
     * Process task with optimizations
     */
    processTask(task: any): Promise<any>;
    /**
     * Batch process multiple tasks efficiently
     */
    processBatch(tasks: any[]): Promise<any[]>;
    private executeOptimizedTask;
    private optimizeValidation;
    private optimizeComputation;
    private optimizeDataProcessing;
    private executeStandardTask;
    private generateCacheKey;
    private isCacheable;
    private validateChunk;
    private computeCustom;
    private applyDataOperation;
    private processTaskGroup;
}
export declare class PerformanceOptimizer {
    private optimizations;
    private taskProcessor;
    private poolManager;
    /**
     * Apply performance optimizations to framework operations
     */
    optimizeOperation<T>(operation: string, originalFn: () => Promise<T> | T, optimizedFn: () => Promise<T> | T): Promise<T>;
    /**
     * Get optimization statistics
     */
    getOptimizationStats(): {
        totalOptimizations: number;
        averageImprovement: number;
        totalMemorySaved: number;
        bestOptimization: string;
        worstOptimization: string;
    };
    /**
     * Create optimized memory pool for specific object type
     */
    createMemoryPool<T>(name: string, config: {
        factory: () => T;
        reset?: (obj: T) => void;
        maxSize?: number;
    }): MemoryPool<T>;
    /**
     * Process task with optimizations
     */
    processOptimizedTask(task: any): Promise<any>;
    /**
     * Get memory pool statistics
     */
    getMemoryPoolStats(): Record<string, any>;
    /**
     * Clear optimization history
     */
    clearOptimizationHistory(): void;
}
export declare const performanceOptimizer: PerformanceOptimizer;
//# sourceMappingURL=performance-optimizer.d.ts.map