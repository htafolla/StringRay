import { frameworkLogger } from "../framework-logger";
import * as fs from "fs";
import * as path from "path";

export class RefactoringLoggingProcessor {
  private logPath: string;

  constructor() {
    this.logPath = path.join(process.cwd(), "logs", "agents", "refactoring-log.md");
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async execute(context: any): Promise<{ logged: boolean; success: boolean; message: string; error?: string }> {
    try {
      // Check if context is agent task completion context
      if (
        context.agentName &&
        context.task &&
        typeof context.startTime === "number"
      ) {
        const logEntry = this.createLogEntry(context);
        await this.appendToLog(logEntry);

        return {
          logged: true,
          success: true,
          message: "Agent refactoring completion logged successfully",
        };
      }

      return {
        logged: false,
        success: true,
        message: "Not an agent task completion context",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await frameworkLogger.log('refactoring-logging-processor', '-refactoring-logging-failed-error-instanceof-error-', 'error', { message: `Refactoring logging failed: ${errorMessage}` });

      return {
        logged: false,
        success: false,
        message: `Refactoring logging failed: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  private createLogEntry(context: any): string {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - context.startTime;

    let logEntry = `## Refactoring Operation - ${timestamp}\n\n`;
    logEntry += `**Agent:** ${context.agentName}\n`;
    logEntry += `**Task:** ${context.task.description || context.task.id || 'Unknown'}\n`;
    logEntry += `**Duration:** ${duration}ms\n`;
    logEntry += `**Operation Type:** ${context.task.operationType || context.operationType || 'refactor'}\n`;

    if (context.complexityScore) {
      logEntry += `**Complexity Score:** ${context.complexityScore}\n`;
    }

    if (context.changes && Array.isArray(context.changes)) {
      logEntry += `\n**Changes Made:**\n`;
      context.changes.forEach((change: any, index: number) => {
        logEntry += `${index + 1}. ${change.description || change.type || 'Unknown change'}\n`;
      });
    }

    if (context.files && Array.isArray(context.files)) {
      logEntry += `\n**Files Modified:**\n`;
      context.files.forEach((file: string) => {
        logEntry += `- ${file}\n`;
      });
    }

    if (context.metrics) {
      logEntry += `\n**Metrics:**\n`;
      Object.entries(context.metrics).forEach(([key, value]) => {
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
        fs.writeFileSync(this.logPath, header, 'utf8');
      }

      // Append the log entry
      fs.appendFileSync(this.logPath, entry, 'utf8');

      await frameworkLogger.log('refactoring-logging-processor', '-refactoring-operation-logged-successfully-', 'info', { message: "Refactoring operation logged successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await frameworkLogger.log('refactoring-logging-processor', '-failed-to-append-to-refactoring-log-error-instanceof-', 'error', { message: `Failed to append to refactoring log: ${errorMessage}` });
      throw error;
    }
  }
}