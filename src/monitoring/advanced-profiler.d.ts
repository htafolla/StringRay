import { EventEmitter } from "events";
interface ProfileData {
    agentName: string;
    operation: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryUsage: {
        before: NodeJS.MemoryUsage;
        after?: NodeJS.MemoryUsage;
    };
    success: boolean;
    error?: string;
    metadata: Record<string, any>;
}
interface ProfilingMetrics {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    memoryDelta: number;
    slowestOperation: string;
    fastestOperation: string;
}
export declare class AdvancedProfiler extends EventEmitter {
    private profiles;
    private activeProfiles;
    private profilingEnabled;
    private profileStoragePath;
    constructor(storagePath?: string);
    private ensureStorageDirectory;
    private setupPeriodicReporting;
    startProfiling(operationId: string, agentName: string, operation: string, metadata?: Record<string, any>): void;
    endProfiling(operationId: string, success?: boolean, error?: string): void;
    private detectAnomalies;
    private calculateMemoryDelta;
    getMetrics(agentName?: string): ProfilingMetrics;
    private generatePerformanceReport;
    private generateRecommendations;
    private cleanupOldProfiles;
    enableProfiling(): void;
    disableProfiling(): void;
    clearProfiles(): void;
    exportProfiles(): Record<string, ProfileData[]>;
}
export declare const advancedProfiler: AdvancedProfiler;
export {};
//# sourceMappingURL=advanced-profiler.d.ts.map