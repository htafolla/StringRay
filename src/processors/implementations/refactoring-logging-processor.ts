/**
 * Refactoring Logging Processor
 *
 * Logs refactoring operations for tracking and auditing.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

import { PostProcessor } from "../processor-interfaces.js";
import { frameworkLogger } from "../../core/framework-logger.js";
import * as fs from "fs";
import * as path from "path";

export class RefactoringLoggingProcessor extends PostProcessor {
  readonly name = "refactoringLogging";
  readonly priority = 55;
  private logPath: string;

  constructor() {
    super();
    this.logPath = path.join(
      process.cwd(),
      "logs",
      "agents",
      "refactoring-log.md",
    );
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  protected async run(context: unknown): Promise<unknown> {
    const ctx = context as Record<string, unknown>;
    const operation = (ctx.operation as string) || "modify";
    const filePath = this.getFilePath(ctx);

    await frameworkLogger.log(
      "refactoring-logging-processor",
      "logging refactoring operation",
      "info",
      { operation, filePath: filePath?.slice(0, 100) },
    );

    // Check if this is an agent task completion context
    const isAgentContext =
      ctx.agentName &&
      ctx.task &&
      typeof ctx.startTime === "number";

    if (!isAgentContext) {
      await frameworkLogger.log(
        "refactoring-logging-processor",
        "not an agent task context, skipping log",
        "debug",
      );

      return {
        logged: false,
        message: "Not an agent task completion context",
      };
    }

    try {
      const logEntry = this.createLogEntry(ctx);
      await this.appendToLog(logEntry);

      await frameworkLogger.log(
        "refactoring-logging-processor",
        "refactoring operation logged successfully",
        "info",
        { agent: ctx.agentName, operation },
      );

      return {
        logged: true,
        success: true,
        message: "Agent refactoring completion logged successfully",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await frameworkLogger.log(
        "refactoring-logging-processor",
        "refactoring logging failed",
        "error",
        { error: errorMessage },
      );

      throw new Error(`Refactoring logging failed: ${errorMessage}`);
    }
  }

  private createLogEntry(context: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const startTime = context.startTime as number;
    const duration = Date.now() - startTime;
    const agentName = context.agentName as string;
    const task = context.task as Record<string, unknown>;
    const changes = context.changes as Array<Record<string, unknown>> | undefined;
    const files = context.files as string[] | undefined;
    const metrics = context.metrics as Record<string, unknown> | undefined;
    const complexityScore = context.complexityScore as number | undefined;

    let logEntry = `## Refactoring Operation - ${timestamp}\n\n`;
    logEntry += `**Agent:** ${agentName}\n`;
    logEntry += `**Task:** ${(task.description as string) || (task.id as string) || "Unknown"}\n`;
    logEntry += `**Duration:** ${duration}ms\n`;
    logEntry += `**Operation Type:** ${(task.operationType as string) || (context.operationType as string) || "refactor"}\n`;

    if (complexityScore) {
      logEntry += `**Complexity Score:** ${complexityScore}\n`;
    }

    if (changes && Array.isArray(changes)) {
      logEntry += `\n**Changes Made:**\n`;
      changes.forEach((change: Record<string, unknown>, index: number) => {
        logEntry += `${index + 1}. ${(change.description as string) || (change.type as string) || "Unknown change"}\n`;
      });
    }

    if (files && Array.isArray(files)) {
      logEntry += `\n**Files Modified:**\n`;
      files.forEach((file: string) => {
        logEntry += `- ${file}\n`;
      });
    }

    if (metrics) {
      logEntry += `\n**Metrics:**\n`;
      Object.entries(metrics).forEach(([key, value]) => {
        logEntry += `- ${key}: ${value}\n`;
      });
    }

    logEntry += `\n---\n\n`;

    return logEntry;
  }

  private async appendToLog(entry: string): Promise<void> {
    try {
      // Check if log file exists, create header if not
      if (!fs.existsSync(this.logPath)) {
        let header = `# StringRay Framework Refactoring Log\n\n`;
        header += `This log tracks all refactoring operations performed by StringRay agents.\n\n`;
        header += `Generated on: ${new Date().toISOString()}\n\n`;
        header += `---\n\n`;
        fs.writeFileSync(this.logPath, header, "utf8");
      }

      // Append the log entry
      fs.appendFileSync(this.logPath, entry, "utf8");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await frameworkLogger.log(
        "refactoring-logging-processor",
        "failed to append to refactoring log",
        "error",
        { error: errorMessage },
      );
      throw error;
    }
  }
}
