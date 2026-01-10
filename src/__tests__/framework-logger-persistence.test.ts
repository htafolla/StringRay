import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

interface FrameworkLogEntry {
  timestamp: number;
  component: string;
  action: string;
  agent: string;
  status: "success" | "error" | "info";
  details?: any;
}

// Test-specific logger that writes to a unique file
class TestFrameworkLogger {
  private testLogFile: string;
  private logs: FrameworkLogEntry[] = [];
  private maxLogs = 1000;

  constructor(logFile: string) {
    this.testLogFile = logFile;
  }

  async log(
    component: string,
    action: string,
    status: "success" | "error" | "info" = "info",
    details?: any,
  ) {
    const entry: FrameworkLogEntry = {
      timestamp: Date.now(),
      component,
      action,
      agent: "test-agent",
      status,
      details,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const emoji =
      status === "success" ? "✅" : status === "error" ? "❌" : "ℹ️";
    console.log(`${emoji} [${component}] ${action} - ${status.toUpperCase()}`);

    await this.persistLog(entry);
  }

  private async persistLog(entry: FrameworkLogEntry) {
    try {
      const logDir = path.dirname(this.testLogFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = `${new Date(entry.timestamp).toISOString()} [${entry.component}] ${entry.action} - ${entry.status.toUpperCase()}\n`;
      fs.appendFileSync(this.testLogFile, logEntry);
    } catch (error) {
      console.error("Failed to persist test log to file:", error);
    }
  }
}

describe("Framework Logging File Persistence", () => {
  let testId: string;
  let logDir: string;
  let logFile: string;
  let testLogger: TestFrameworkLogger;

  beforeEach(() => {
    // Use unique test ID to avoid conflicts between parallel tests
    testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logDir = path.join(process.cwd(), ".opencode", "logs");
    logFile = path.join(logDir, `framework-activity-${testId}.log`);

    // Create test-specific logger
    testLogger = new TestFrameworkLogger(logFile);

    // Clean up any existing test file
    if (fs.existsSync(logFile)) {
      try {
        fs.unlinkSync(logFile);
      } catch (error) {
        // Ignore if file doesn't exist or can't be deleted
      }
    }
  });

  afterEach(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  it("should create log file and write entries", async () => {
    await testLogger.log("test-persistence", "file write test", "success");

    expect(fs.existsSync(logFile)).toBe(true);

    const fileContent = fs.readFileSync(logFile, "utf-8");
    expect(fileContent).toContain("[test-persistence]");
    expect(fileContent).toContain("file write test");
    expect(fileContent).toContain("SUCCESS");
  });

  it("should append multiple log entries to file", async () => {
    await testLogger.log("test-multi", "first action", "success");
    await testLogger.log("test-multi", "second action", "info");
    await testLogger.log("test-multi", "third action", "error");

    const fileContent = fs.readFileSync(logFile, "utf-8");
    const lines = fileContent.trim().split("\n");

    expect(lines.length).toBe(3);
    expect(lines[0]).toContain("first action");
    expect(lines[1]).toContain("second action");
    expect(lines[2]).toContain("third action");
  });

  it("should maintain log file format with timestamps", async () => {
    const beforeTime = Date.now();
    await testLogger.log("test-format", "format test", "success");
    const afterTime = Date.now();

    const fileContent = fs.readFileSync(logFile, "utf-8");
    const logEntry = fileContent.trim();

    expect(logEntry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(logEntry).toContain("[test-format]");
    expect(logEntry).toContain("format test");
    expect(logEntry).toContain("SUCCESS");

    const timestampMatch = logEntry.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/,
    );
    if (timestampMatch) {
      const logTime = new Date(timestampMatch[1]).getTime();
      expect(logTime).toBeGreaterThanOrEqual(beforeTime - 1000);
      expect(logTime).toBeLessThanOrEqual(afterTime + 1000);
    }
  });

  it("should create log directory if it doesn't exist", async () => {
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true, force: true });
    }

    await testLogger.log("test-dir", "directory creation test", "success");

    expect(fs.existsSync(logDir)).toBe(true);
    expect(fs.existsSync(logFile)).toBe(true);
  });
});
