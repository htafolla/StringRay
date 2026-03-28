/**
 * Activity Logger
 * 
 * Comprehensive logging for all StringRay activities including:
 * - Framework operations
 * - Development sessions
 * - Script executions
 * - File operations
 * - Test results
 * 
 * Enable/Disable via:
 *   STRRAY_ACTIVITY_LOGGING=true  (enable)
 *   STRRAY_ACTIVITY_LOGGING=false (disable, default)
 * 
 * @module core/activity-logger
 * @version 1.0.0
 */

import * as fs from "fs";
import * as path from "path";

// Activity types
export type ActivityCategory = 
  | "framework" 
  | "development" 
  | "script" 
  | "file" 
  | "test" 
  | "commit" 
  | "session"
  | "agent"
  | "processor"
  | "config";

export type ActivityLevel = "debug" | "info" | "warn" | "error" | "success";

// Activity record structure
export interface ActivityRecord {
  timestamp: string;
  id: string;
  category: ActivityCategory;
  level: ActivityLevel;
  action: string;
  message: string;
  details?: Record<string, unknown>;
  sessionId?: string;
  jobId?: string;
}

// Global state
let activityLoggerEnabled = process.env.STRRAY_ACTIVITY_LOGGING !== "false";
let activityLogPath: string;
let sessionId: string;
let sessionStartTime: number;

/**
 * Initialize the activity logger
 */
function initialize(): void {
  const cwd = process.cwd();
  const logDir = path.join(cwd, "logs", "framework");
  
  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  activityLogPath = path.join(logDir, "activity.log");
  sessionId = generateSessionId();
  sessionStartTime = Date.now();
  
  // Initialize files
  initializeLogFile();
  initializeReportFile();
  
  logActivity("session", "info", "session-started", "Activity logging session started", {
    sessionId,
    cwd,
    pid: process.pid,
    nodeVersion: process.version,
  });
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `session-${timestamp}-${random}`;
}

/**
 * Generate unique activity ID
 */
function generateActivityId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `act-${timestamp}-${random}`;
}

/**
 * Initialize activity log file
 */
function initializeLogFile(): void {
  if (!fs.existsSync(activityLogPath)) {
    fs.writeFileSync(activityLogPath, "");
  }
}

/**
 * Initialize activity report JSON file
 */
function initializeReportFile(): void {
  const reportPath = path.join(path.dirname(activityLogPath), "activity-report.json");
  if (!fs.existsSync(reportPath)) {
    fs.writeFileSync(reportPath, JSON.stringify({
      sessions: [],
      activities: [],
      stats: {
        total: 0,
        byCategory: {} as Record<string, number>,
        byLevel: {} as Record<string, number>,
      }
    }, null, 2));
  }
}

/**
 * Check if activity logging is enabled
 */
export function isActivityLoggingEnabled(): boolean {
  return activityLoggerEnabled;
}

/**
 * Enable or disable activity logging
 */
export function setActivityLoggingEnabled(enabled: boolean): void {
  activityLoggerEnabled = enabled;
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
  return sessionId;
}

/**
 * Log an activity
 */
export function logActivity(
  category: ActivityCategory,
  level: ActivityLevel,
  action: string,
  message: string,
  details?: Record<string, unknown>,
  options?: { sessionId?: string; jobId?: string }
): void {
  if (!activityLoggerEnabled) {
    return;
  }

  const record: ActivityRecord = {
    timestamp: new Date().toISOString(),
    id: generateActivityId(),
    category,
    level,
    action,
    message,
    sessionId: options?.sessionId || sessionId,
  };
  
  if (details) {
    record.details = details;
  }
  if (options?.jobId) {
    record.jobId = options.jobId;
  }

  // Write to log file
  writeToLogFile(record);
  
  // Write to report JSON
  writeToReportFile(record);

  // Console output for debug mode
  if (process.env.STRRAY_ACTIVITY_CONSOLE === "true") {
    console.log(`[${record.timestamp}] [${record.category}] ${level.toUpperCase()}: ${message}`, details || "");
  }
}

/**
 * Write activity to log file
 */
function writeToLogFile(record: ActivityRecord): void {
  try {
    const detailsPart = record.details 
      ? ` | ${JSON.stringify(record.details)}` 
      : "";
    const jobIdPart = record.jobId ? `[${record.jobId}] ` : "";
    const logLine = `${record.timestamp} ${jobIdPart}[${record.category}] ${record.action} - ${record.level.toUpperCase()}${detailsPart}\n`;
    
    fs.appendFileSync(activityLogPath, logLine);
  } catch (error) {
    console.error("Failed to write to activity log:", error);
  }
}

/**
 * Write activity to report JSON
 */
function writeToReportFile(record: ActivityRecord): void {
  try {
    const reportPath = path.join(path.dirname(activityLogPath), "activity-report.json");
    
    let report: {
      sessions: Array<{ id: string; start: string; end?: string; duration?: number }>;
      activities: ActivityRecord[];
      stats: { total: number; byCategory: Record<string, number>; byLevel: Record<string, number> };
    };
    
    try {
      report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    } catch {
      // New file or invalid JSON
      report = { sessions: [], activities: [], stats: { total: 0, byCategory: {}, byLevel: {} } };
    }
    
    // Add activity
    report.activities.push(record);
    report.stats.total++;
    report.stats.byCategory[record.category] = (report.stats.byCategory[record.category] || 0) + 1;
    report.stats.byLevel[record.level] = (report.stats.byLevel[record.level] || 0) + 1;
    
    // Keep only last 1000 activities
    if (report.activities.length > 1000) {
      report.activities = report.activities.slice(-1000);
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Failed to write to activity report:", error);
  }
}

// Convenience methods
export const activity = {
  framework: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("framework", "info", action, message, details),
  
  development: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("development", "info", action, message, details),
  
  script: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("script", "info", action, message, details),
  
  file: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("file", "info", action, message, details),
  
  test: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("test", "info", action, message, details),
  
  commit: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("commit", "info", action, message, details),
  
  session: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("session", "info", action, message, details),
  
  agent: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("agent", "info", action, message, details),
  
  processor: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("processor", "info", action, message, details),
  
  config: (action: string, message: string, details?: Record<string, unknown>) => 
    logActivity("config", "info", action, message, details),
  
  success: (category: ActivityCategory, action: string, message: string, details?: Record<string, unknown>) => 
    logActivity(category, "success", action, message, details),
  
  error: (category: ActivityCategory, action: string, message: string, details?: Record<string, unknown>) => 
    logActivity(category, "error", action, message, details),
  
  warn: (category: ActivityCategory, action: string, message: string, details?: Record<string, unknown>) => 
    logActivity(category, "warn", action, message, details),
};

// Initialize on module load
initialize();

// Also listen for process events to log session end
process.on("exit", () => {
  logActivity("session", "info", "session-ended", "Activity logging session ended", {
    duration: Date.now() - sessionStartTime,
  });
});
