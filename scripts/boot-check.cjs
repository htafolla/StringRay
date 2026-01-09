#!/usr/bin/env node

/**
 * StrRay Framework Boot Health Check
 *
 * Validates that the framework can boot successfully with proper logging.
 * This script performs end-to-end boot validation and reports results.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */

const fs = require("fs");
const path = require("path");

// Import framework (adjust path as needed)
let initializeStrRay;
try {
  const frameworkPath = path.join(__dirname, "..", "dist", "index.js");
  if (fs.existsSync(frameworkPath)) {
    initializeStrRay = require(frameworkPath).initializeStrRay;
  } else {
    process.exit(1);
  }
} catch (error) {
  process.exit(1);
}

class BootChecker {
  constructor() {
    this.startTime = Date.now();
    this.checks = [];
    this.errors = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
  }

  async runCheck(name, checkFn) {
    try {
      this.log(`Running check: ${name}`);
      const result = await checkFn();
      this.checks.push({ name, success: true, result });
      this.log(`Check passed: ${name}`, "success");
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.errors.push({ name, error: errorMessage });
      this.checks.push({ name, success: false, error: errorMessage });
      this.log(`Check failed: ${name} - ${errorMessage}`, "error");
      return null;
    }
  }

  async checkEnvironment() {
    // Check Node.js version
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith("v18") && !nodeVersion.startsWith("v20")) {
      throw new Error(
        `Unsupported Node.js version: ${nodeVersion}. Requires v18+`,
      );
    }

    // Check for required directories
    const requiredDirs = ["src", "dist"];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        throw new Error(`Required directory missing: ${dir}`);
      }
    }

    // Check for codex files
    const codexFiles = ["src/agents_template.md", "AGENTS.md"];
    let hasCodex = false;
    for (const file of codexFiles) {
      if (fs.existsSync(file)) {
        hasCodex = true;
        break;
      }
    }
    if (!hasCodex) {
      throw new Error(
        "No codex files found. Expected src/agents_template.md or AGENTS.md",
      );
    }

    return { nodeVersion, hasCodex: true };
  }

  async checkFrameworkBoot() {
    const config = {
      codexVersion: "1.2.20",
      contextPath: "src",
      enableLogging: false, // Disable for testing
      timeoutMs: 10000,
    };

    const result = await initializeStrRay(config);

    if (!result.success) {
      throw new Error(`Boot failed: ${result.message}`);
    }

    if (!result.codex) {
      throw new Error("Boot succeeded but no codex returned");
    }

    if (!result.context) {
      throw new Error("Boot succeeded but no context returned");
    }

    return result;
  }

  async checkLogging() {
    // Check if log directory was created during boot
    const logDir = ".strray/logs";
    if (!fs.existsSync(logDir)) {
      // This is OK if logging was disabled
      return { logFiles: 0, loggingDisabled: true };
    }

    // Check for recent log files
    const files = fs.readdirSync(logDir);
    const logFiles = files.filter(
      (f) => f.startsWith("strray-") && f.endsWith(".log"),
    );

    if (logFiles.length === 0) {
      return { logFiles: 0, loggingDisabled: false };
    }

    // Check most recent log file
    const latestLog = logFiles.sort().reverse()[0];
    const logPath = path.join(logDir, latestLog);
    const logContent = fs.readFileSync(logPath, "utf-8");

    // Check for boot completion log
    if (!logContent.includes("Boot process completed successfully")) {
      throw new Error("Boot completion not logged");
    }

    return { logFiles: logFiles.length, latestLog };
  }

  async run() {
    try {
      // Run all checks
      const envResult = await this.runCheck("Environment Setup", () =>
        this.checkEnvironment(),
      );
      const bootResult = await this.runCheck("Framework Boot", () =>
        this.checkFrameworkBoot(),
      );
      const logResult = await this.runCheck("Logging System", () =>
        this.checkLogging(),
      );

      // Calculate duration
      const duration = Date.now() - this.startTime;

      // Report results

      const passedChecks = this.checks.filter((c) => c.success).length;
      const totalChecks = this.checks.length;

      if (bootResult) {
      }

      if (this.errors.length === 0) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (error) {
      process.exit(1);
    }
  }
}

// Run the health check
const checker = new BootChecker();
checker.run().catch((error) => {
  process.exit(1);
});
