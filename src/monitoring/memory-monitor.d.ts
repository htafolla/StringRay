import { EventEmitter } from "events";
/**
 * Memory Monitor - Comprehensive memory tracking and leak detection
 * Integrates with framework logging system
 */
export interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    timestamp: number;
    sessionId?: string;
}
export interface MemoryLeakAlert {
    type: "leak_detected" | "high_usage" | "spike_detected";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    details: {
        currentUsage: number;
        threshold: number;
        trend: "increasing" | "stable" | "decreasing";
        recommendations: string[];
    };
}
export interface MemoryMonitorConfig {
    checkInterval: number;
    alertThresholds: {
        warning: number;
        critical: number;
        leakDetection: {
            growthRate: number;
            sustainedPeriod: number;
        };
    };
    enableFrameworkLogging: boolean;
    sessionTracking: boolean;
}
export interface MemorySummary {
    current: MemoryStats;
    peak: MemoryStats;
    average: number;
    trend: "increasing" | "stable" | "decreasing";
}
export declare class MemoryMonitor extends EventEmitter {
    private config;
    private monitoringInterval;
    private statsHistory;
    private maxHistorySize;
    private leakDetectionEnabled;
    private lastLeakCheck;
    private leakCheckInterval;
    constructor(config?: Partial<MemoryMonitorConfig>);
    /**
     * Start memory monitoring
     */
    start(): void;
    /**
     * Stop memory monitoring
     */
    stop(): void;
    /**
     * Get current memory statistics
     */
    getCurrentStats(): MemoryStats;
    /**
     * Check memory usage and detect issues
     */
    private checkMemory;
    /**
     * Check memory usage against thresholds
     */
    private checkThresholds;
    /**
     * Detect potential memory leaks
     */
    private detectMemoryLeaks;
    /**
     * Calculate memory usage trend
     */
    private calculateTrend;
    /**
     * Emit memory alert
     */
    private emitAlert;
    /**
     * Log memory stats to framework log
     */
    private logFrameworkMemory;
    /**
     * Get memory usage history
     */
    getHistory(hours?: number): MemoryStats[];
    /**
     * Get memory usage summary
     */
    getSummary(): MemorySummary;
    /**
     * Force garbage collection (if available)
     */
    forceGC(): boolean;
    /**
     * Internal logging method - writes to framework log only
     */
    private log;
}
export declare const memoryMonitor: MemoryMonitor;
export declare function getMemoryUsage(): MemoryStats;
export declare function logMemoryUsage(): void;
export declare function checkMemoryHealth(): {
    healthy: boolean;
    issues: string[];
};
//# sourceMappingURL=memory-monitor.d.ts.map