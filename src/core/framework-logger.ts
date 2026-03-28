import {
  isLoggingEnabled,
  shouldLog,
  getLoggingConfig,
} from "./logging-config.js";

/**
 * Generate a unique job ID for tracking work sessions
 */
export function generateJobId(prefix: string = "job"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// Global job context for correlation across all framework operations
let currentJobContext: JobContext | null = null;

export function getCurrentJobId(): string | null {
  return currentJobContext?.jobId || null;
}

export function setCurrentJobContext(jobId?: string): JobContext {
  currentJobContext = new JobContext(jobId);
  return currentJobContext;
}

export function withJobContext<T>(
  operation: () => Promise<T> | T,
  jobId?: string,
): Promise<T> {
  const originalContext = currentJobContext;
  const jobContext = setCurrentJobContext(jobId);
  try {
    const result = operation();
    if (result instanceof Promise) {
      return result.finally(async () => {
        // Auto-complete job on operation finish
        await jobContext.complete(true).catch(console.error);
        // Restore original context
        currentJobContext = originalContext;
      });
    } else {
      // Sync operation - complete immediately
      jobContext.complete(true).catch(console.error);
      currentJobContext = originalContext;
      return Promise.resolve(result);
    }
  } catch (error) {
    // Error occurred - complete job with failure
    jobContext.complete(false, { error: String(error) }).catch(console.error);
    currentJobContext = originalContext;
    throw error;
  }
}

export type LogStatus = "success" | "error" | "info" | "debug" | "warning";

/**
 * Job context for tracking work sessions
 * Enhanced with outcome and complexity accuracy tracking for pattern analytics
 */
export type Outcome = "success" | "fail" | "escalated" | "auto-fixed";

export type ComplexityAccuracy =
   | "underestimated"
   | "accurate"
   | "overestimated";

export class JobContext {
  public readonly jobId: string;
  public readonly startTime: number;
  public complexityScore?: number;
  public agentUsed?: string;
  public operationType?: string;

  // NEW: Outcome tracking for pattern analysis
  public outcome?: Outcome;

  // NEW: Predicted duration for accuracy comparison (in ms)
  public predictedDuration?: number;

  constructor(jobId?: string) {
    this.jobId = jobId || generateJobId("auto");
    this.startTime = Date.now();
  }

  /**
   * Set the outcome after task completion
   */
  setOutcome(
    success: boolean,
    escalated: boolean = false,
    autoFixed: boolean = false,
  ): void {
    if (escalated) this.outcome = "escalated";
    else if (autoFixed) this.outcome = "auto-fixed";
    else this.outcome = success ? "success" : "fail";
  }

  /**
   * Set predicted duration for complexity accuracy comparison
   */
  setPredictedDuration(completionTimeMs: number): void {
    this.predictedDuration = completionTimeMs;
  }

  /**
   * Log job completion with diagnostic info
   * Enhanced with outcome and complexity accuracy tracking
   */
  async complete(success: boolean = true, details?: any) {
    const actualDuration = Date.now() - this.startTime;

    // Calculate complexity accuracy if we have both predicted and actual
    let complexityAccuracy: ComplexityAccuracy | undefined;
    if (this.complexityScore && this.predictedDuration) {
      const ratio = actualDuration / this.predictedDuration;
      if (ratio > 1.5) {
        complexityAccuracy = "underestimated";
      } else if (ratio < 0.5) {
        complexityAccuracy = "overestimated";
      } else {
        complexityAccuracy = "accurate";
      }
    } else if (this.complexityScore && actualDuration) {
      // Fallback: estimate predicted based on complexity score
      const estimatedPredicted = this.complexityScore * 1000; // 1 second per complexity point
      const ratio = actualDuration / estimatedPredicted;
      if (ratio > 1.5) {
        complexityAccuracy = "underestimated";
      } else if (ratio < 0.5) {
        complexityAccuracy = "overestimated";
      } else {
        complexityAccuracy = "accurate";
      }
    }

    // Determine final outcome
    const finalOutcome = this.outcome || (success ? "success" : "fail");

    await frameworkLogger.log(
      "job-context",
      "job-completed",
      success ? "success" : "error",
      {
        duration: actualDuration,
        complexityScore: this.complexityScore,
        agentUsed: this.agentUsed,
        operationType: this.operationType,
        outcome: finalOutcome,
        complexityAccuracy,
        predictedDuration: this.predictedDuration,
        ...details,
      },
      undefined, // sessionId
      this.jobId,
    );
  }
}

export interface FrameworkLogEntry {
  timestamp: number;
  component: string;
  action: string;
  status: LogStatus;
  agent: string;
  sessionId?: string;
  jobId?: string;
  details?: any;
}

export class FrameworkUsageLogger {
  private logs: FrameworkLogEntry[] = [];
  private maxLogs = 1000;

  async log(
    component: string,
    action: string,
    status: LogStatus,
    details?: any,
    sessionId?: string,
    jobId?: string,
  ) {
    // Check if logging is enabled globally
    if (!isLoggingEnabled()) {
      return;
    }

    // Check if this log level should be logged
    if (!shouldLog(status)) {
      return;
    }

    // Use current job context if available, otherwise auto-generate
    const actualJobId = jobId || getCurrentJobId() || generateJobId("auto");

    // Ensure we always have a jobId
    if (!actualJobId) {
      throw new Error("JobId generation failed");
    }

    const entry: FrameworkLogEntry = {
      timestamp: Date.now(),
      component,
      action,
      status,
      agent: "orchestrator",
      ...(sessionId && { sessionId }),
      jobId: actualJobId,
      details,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Always persist to file, never output to console to avoid UI bleed-through
    try {
      this.persistLog(entry);
    } catch (error) {
      // Silently fail - logging should never break application
    }
  }

  private async persistLog(entry: FrameworkLogEntry) {
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

      const jobIdPart = entry.jobId ? `[${entry.jobId}] ` : "";
      const detailsPart = entry.details 
        ? ` | ${JSON.stringify(entry.details)}` 
        : "";
      const logEntry = `${new Date(entry.timestamp).toISOString()} ${jobIdPart}[${entry.component}] ${entry.action} - ${entry.status.toUpperCase()}${detailsPart}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Silent fail - cannot log to console as this IS the logger
    }
  }

  getRecentLogs(count: number = 50): FrameworkLogEntry[] {
    return this.logs.slice(-count);
  }

  getComponentUsage(component: string): FrameworkLogEntry[] {
    return this.logs.filter((log) => log.component === component);
  }

  printRundown() {
    // Framework usage analytics - available for debugging but should not output to console
    // Use getRecentLogs() directly instead of printing
  }
}

export const frameworkLogger = new FrameworkUsageLogger();
