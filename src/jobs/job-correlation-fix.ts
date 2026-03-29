// Framework job ID correlation fix
// Integrate JobContext into all framework loggers

import { JobContext, generateJobId, frameworkLogger } from "../core/framework-logger.js";

// Global job context for correlation - frameworks should populate this
let currentJobContext: JobContext | null = null;

export function getCurrentJobId(): string | null {
  return currentJobContext?.jobId || null;
}

export function setCurrentJobContext(jobId?: string): JobContext {
  currentJobContext = new JobContext(jobId);
  return currentJobContext;
}

export function withJobContext<T>(operation: () => T, jobId?: string): T {
  const jobContext = setCurrentJobContext(jobId);
  try {
    return operation();
  } finally {
    // Auto-complete job on operation finish
    jobContext.complete(true).catch(() => {});
  }
}

// Enhanced framework logging with job correlation
export interface FrameworkLogOptions {
  jobId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: any;
}

// Enhanced log function with implicit job context
export function frameworkLog(
  component: string,
  event: string,
  level: string,
  options: FrameworkLogOptions = {},
  sessionId?: string,
  explicitJobId?: string,
) {
  // Implicit job ID from current context
  const jobId = explicitJobId || options.jobId || getCurrentJobId();

  // Enhanced log entry with job correlation
  const logEntry = {
    timestamp: new Date().toISOString(),
    jobId: jobId, // <- Now included in ALL log entries
    sessionId: sessionId || "global",
    component: component,
    event: event,
    level: level,
    correlationId: options.correlationId || generateCorrelationId(),
    data: { ...options },
  };

  // Log with job correlation
  frameworkLogger.log("job-correlation", "log-entry", "info", {
    message: `[${logEntry.timestamp}] [${logEntry.jobId || "no-job"}] [${logEntry.component}] ${logEntry.event} - ${logEntry.level}`,
  });

  // Write to activity log with job correlation
  // This would integrate with the activity logger
  writeActivityLog(logEntry);
}
