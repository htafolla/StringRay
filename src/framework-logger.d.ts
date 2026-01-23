/**
 * Generate a unique job ID for tracking work sessions
 */
export declare function generateJobId(prefix?: string): string;
/**
 * Job context for tracking work sessions
 */
export declare class JobContext {
    readonly jobId: string;
    readonly startTime: number;
    complexityScore?: number;
    agentUsed?: string;
    operationType?: string;
    constructor(prefix?: string);
    /**
     * Log job completion with diagnostic info
     */
    complete(success?: boolean, details?: any): Promise<void>;
}
export interface FrameworkLogEntry {
    timestamp: number;
    component: string;
    action: string;
    agent: string;
    sessionId?: string | undefined;
    jobId?: string | undefined;
    status: "success" | "error" | "info" | "debug";
    details?: any;
}
export declare class FrameworkUsageLogger {
    private logs;
    private maxLogs;
    log(component: string, action: string, status?: "success" | "error" | "info" | "debug", details?: any, sessionId?: string, jobId?: string): Promise<void>;
    private persistLog;
    getRecentLogs(count?: number): FrameworkLogEntry[];
    getComponentUsage(component: string): FrameworkLogEntry[];
    printRundown(): void;
}
export declare const frameworkLogger: FrameworkUsageLogger;
//# sourceMappingURL=framework-logger.d.ts.map