import {
  isLoggingEnabled,
  shouldLog,
  getLoggingConfig,
} from "./logging-config";

/**
 * MCP Server Logger
 * Provides structured logging for MCP protocol debugging with configurable levels
 */
export class MCPLogger {
  private serverName: string;

  constructor(serverName: string) {
    this.serverName = serverName;
  }

  debug(message: string, details?: any) {
    this.log("debug", message, details);
  }

  info(message: string, details?: any) {
    this.log("info", message, details);
  }

  warn(message: string, details?: any) {
    this.log("warn", message, details);
  }

  error(message: string, error?: any) {
    this.log("error", message, error);
  }

  private log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    details?: any,
  ) {
    if (!isLoggingEnabled() || !shouldLog(level)) {
      return;
    }

    const config = getLoggingConfig();
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.serverName}] [${level.toUpperCase()}]`;

    let logMessage = `${prefix} ${message}`;

    if (details && config.performanceMode === false) {
      // In non-performance mode, include details
      if (typeof details === "object") {
        logMessage += ` ${JSON.stringify(details, null, 2)}`;
      } else {
        logMessage += ` ${details}`;
      }
    }

    // Output based on destinations
    if (config.destinations.includes("console")) {
      const consoleMethod =
        level === "error" ? "error" : level === "warn" ? "warn" : "log";
      console[consoleMethod](logMessage);
    }

    // File logging could be added here if needed
    // if (config.destinations.includes("file")) {
    //   // Write to file
    // }
  }
}

// Factory function to create logger for MCP servers
export function createMCPLogger(serverName: string): MCPLogger {
  return new MCPLogger(serverName);
}
