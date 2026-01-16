import {
  isLoggingEnabled,
  shouldLog,
  getLoggingConfig,
} from "./logging-config.js";

export interface FrameworkLogEntry {
  timestamp: number;
  component: string;
  action: string;
  agent: string;
  sessionId?: string | undefined;
  status: "success" | "error" | "info" | "debug";
  details?: any;
}

export class FrameworkUsageLogger {
  private logs: FrameworkLogEntry[] = [];
  private maxLogs = 1000;

  async log(
    component: string,
    action: string,
    status: "success" | "error" | "info" | "debug" = "info",
    details?: any,
    sessionId?: string,
  ) {
    // Check if logging is enabled globally
    if (!isLoggingEnabled()) {
      return;
    }

    // Check if this log level should be logged
    if (!shouldLog(status)) {
      return;
    }

    const entry: FrameworkLogEntry = {
      timestamp: Date.now(),
      component,
      action,
      agent: "sisyphus",
      sessionId,
      status,
      details,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Suppress console output when running in OpenCode CLI mode to avoid breaking the interface
    const isCliMode = process.env.STRRAY_CLI_MODE === "true" || process.env.OPENCODE_CLI === "true";
    if (!isCliMode) {
      const emoji =
        status === "success"
          ? "✅"
          : status === "error"
            ? "❌"
            : status === "debug"
              ? "🔍"
              : "ℹ️";
      console.log(`${emoji} [${component}] ${action} - ${status.toUpperCase()}`);
    }

    // Override console methods in CLI mode to prevent breaking the interface
    if (isCliMode) {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args: any[]) => {
        // Only allow essential user-facing CLI messages through
        if (args[0] && typeof args[0] === 'string' &&
            (args[0].includes('🎉') || args[0].includes('✅') ||
             args[0].includes('🎯') || args[0].includes('🚀'))) {
          originalConsoleLog(...args);
        }
        // Suppress all other console output in CLI mode
      };

      console.error = (...args: any[]) => {
        // Suppress error output in CLI mode to avoid breaking interface
      };

      console.warn = (...args: any[]) => {
        // Suppress warning output in CLI mode to avoid breaking interface
      };
    }

    await this.persistLog(entry);
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

      const logEntry = `${new Date(entry.timestamp).toISOString()} [${entry.component}] ${entry.action} - ${entry.status.toUpperCase()}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error("Failed to persist log to file:", error);
    }
  }

  getRecentLogs(count: number = 50): FrameworkLogEntry[] {
    return this.logs.slice(-count);
  }

  getComponentUsage(component: string): FrameworkLogEntry[] {
    return this.logs.filter((log) => log.component === component);
  }

  printRundown() {
    // Framework usage analytics - kept for debugging but could be made conditional
    console.log("Framework usage rundown:", this.getRecentLogs(10));
  }
}

export const frameworkLogger = new FrameworkUsageLogger();
