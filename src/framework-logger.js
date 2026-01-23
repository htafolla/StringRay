import { isLoggingEnabled, shouldLog, } from "./logging-config";
/**
 * Generate a unique job ID for tracking work sessions
 */
export function generateJobId(prefix = 'job') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
}
/**
 * Job context for tracking work sessions
 */
export class JobContext {
    jobId;
    startTime;
    complexityScore;
    agentUsed;
    operationType;
    constructor(prefix = 'job') {
        this.jobId = generateJobId(prefix);
        this.startTime = Date.now();
    }
    /**
     * Log job completion with diagnostic info
     */
    async complete(success = true, details) {
        const duration = Date.now() - this.startTime;
        await frameworkLogger.log('job-context', 'job-completed', success ? 'success' : 'error', {
            duration,
            complexityScore: this.complexityScore,
            agentUsed: this.agentUsed,
            operationType: this.operationType,
            ...details
        }, undefined, // sessionId
        this.jobId);
    }
}
export class FrameworkUsageLogger {
    logs = [];
    maxLogs = 1000;
    async log(component, action, status = "info", details, sessionId, jobId) {
        // Check if logging is enabled globally
        if (!isLoggingEnabled()) {
            return;
        }
        // Check if this log level should be logged
        if (!shouldLog(status)) {
            return;
        }
        // Auto-generate jobId if not provided
        const actualJobId = jobId || generateJobId('auto');
        // Ensure we always have a jobId
        if (!actualJobId) {
            throw new Error('JobId generation failed');
        }
        const entry = {
            timestamp: Date.now(),
            component,
            action,
            agent: "orchestrator",
            sessionId,
            jobId: actualJobId,
            status,
            details,
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        // Always persist to file, never output to console to avoid UI bleed-through
        try {
            this.persistLog(entry);
        }
        catch (error) {
            // Silently fail - logging should never break the application
        }
    }
    async persistLog(entry) {
        // Write to log file for monitoring subagent
        try {
            const fs = await import("fs");
            const path = await import("path");
            const cwd = process.cwd();
            if (!cwd) {
                // Skip logging if cwd is not available (e.g., in test environments)
                return;
            }
            const logDir = path.join(cwd, "logs", "framework");
            const logFile = path.join(logDir, "activity.log");
            // Ensure log directory exists
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const jobIdPart = entry.jobId ? `[${entry.jobId}] ` : '';
            const logEntry = `${new Date(entry.timestamp).toISOString()} ${jobIdPart}[${entry.component}] ${entry.action} - ${entry.status.toUpperCase()}\n`;
            fs.appendFileSync(logFile, logEntry);
        }
        catch (error) {
            // Fallback to console if file writing fails
            console.error("Failed to persist log to file:", error);
        }
    }
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    getComponentUsage(component) {
        return this.logs.filter((log) => log.component === component);
    }
    printRundown() {
        // Framework usage analytics - available for debugging but should not output to console
        // Use getRecentLogs() directly instead of printing
    }
}
export const frameworkLogger = new FrameworkUsageLogger();
//# sourceMappingURL=framework-logger.js.map