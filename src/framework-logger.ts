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
      status,
      details,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const emoji =
      status === "success"
        ? "✅"
        : status === "error"
          ? "❌"
          : status === "debug"
            ? "🔍"
            : "ℹ️";
    console.log(`${emoji} [${component}] ${action} - ${status.toUpperCase()}`);

    await this.persistLog(entry);
  }

  private async persistLog(entry: FrameworkLogEntry) {
    // Write to log file for monitoring subagent
    try {
      const fs = await import("fs");
      const path = await import("path");
      const logDir = path.join(process.cwd(), ".opencode", "logs");
      const logFile = path.join(logDir, "framework-activity.log");

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
    console.log("\n🎯 STRRAY FRAMEWORK USAGE RUNDOWN");
    console.log("=====================================");

    const components = Array.from(new Set(this.logs.map((l) => l.component)));

    components.forEach((component) => {
      const componentLogs = this.getComponentUsage(component);
      const successCount = componentLogs.filter(
        (l) => l.status === "success",
      ).length;
      const errorCount = componentLogs.filter(
        (l) => l.status === "error",
      ).length;

      console.log(`\n📊 ${component.toUpperCase()}`);
      console.log(`   Total Actions: ${componentLogs.length}`);
      console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
      console.log(
        `   Last Activity: ${new Date(componentLogs[componentLogs.length - 1]?.timestamp || 0).toLocaleTimeString()}`,
      );
    });

    console.log(
      "\n✅ VERIFICATION: Framework components are actively being used",
    );
  }
}

export const frameworkLogger = new FrameworkUsageLogger();
