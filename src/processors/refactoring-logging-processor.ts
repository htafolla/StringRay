/**
 * StringRay AI v1.0.7 - Refactoring Logging Processor
 *
 * Post-processor that automatically logs agent task completions to REFACTORING_LOG.md
 * for pattern analysis and continuous improvement.
 *
 * @version 1.0.0
 * @since 2026-01-12
 */

import * as fs from "fs";
import * as path from "path";
import { ProcessorHook, ProcessorRegistration } from "./processor-types";
import { frameworkLogger } from "../framework-logger.js";

export interface AgentTaskContext {
  agentName: string;
  task: string;
  startTime: number;
  endTime: number;
  success: boolean;
  result?: any;
  capabilities?: string[] | undefined;
  sessionId?: string | undefined;
}

/**
 * Refactoring Logging Post-Processor
 * Automatically logs agent task completions for pattern analysis
 */
export class RefactoringLoggingProcessor implements ProcessorHook {
  name = "refactoring-logging";
  priority = 100; // High priority to ensure logging happens
  enabled = true;
  debugEnabled = process.env.STRRAY_DEBUG_LOGGING === "true" || process.env.NODE_ENV === "development" || false;

  async execute(context: any): Promise<any> {
    if (this.debugEnabled) {
      console.log(
        "🔍 RefactoringLoggingProcessor.execute called with context:",
        {
          hasAgentName: !!context.agentName,
          hasTask: !!context.task,
          hasStartTime: typeof context.startTime === "number",
          contextKeys: Object.keys(context),
        },
      );
    }

    // Check if this is an agent task completion context
    if (!this.isAgentTaskContext(context)) {
      if (this.debugEnabled) {
        console.log("❌ Not an agent task context, returning early");
      }
      return { logged: false, reason: "Not an agent task context" };
    }

    if (this.debugEnabled) {
      console.log(
        "✅ Valid agent task context detected, proceeding with logging",
      );
    }

    const taskContext = context as AgentTaskContext;
    const duration = taskContext.endTime - taskContext.startTime;

    try {
      // Format the log entry
      const logEntry = this.formatLogEntry(taskContext, duration);

      // Write to REFACTORING_LOG.md
      await this.appendToRefactoringLog(logEntry);

      // Also log to framework logger
      await frameworkLogger.log(
        "refactoring-logging",
        "agent-task-logged",
        "info",
        {
          agentName: taskContext.agentName,
          task: taskContext.task.substring(0, 100),
          duration,
          success: taskContext.success,
        },
      );

      return {
        logged: true,
        logEntry: logEntry.substring(0, 200) + "...", // Truncated for response
        duration,
      };
    } catch (error) {
      await frameworkLogger.log(
        "refactoring-logging",
        "logging-failed",
        "error",
        {
          agentName: taskContext.agentName,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      return {
        logged: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private isAgentTaskContext(context: any): context is AgentTaskContext {
    return (
      context &&
      typeof context.agentName === "string" &&
      typeof context.task === "string" &&
      typeof context.startTime === "number" &&
      typeof context.endTime === "number" &&
      typeof context.success === "boolean"
    );
  }

  private formatLogEntry(context: AgentTaskContext, duration: number): string {
    const timestamp = new Date().toISOString();
    const durationSeconds = (duration / 1000).toFixed(2);

    return `## 🤖 Agent Task Completion: ${context.agentName}

**Agent**: ${context.agentName}
**Task**: ${context.task}
**Execution Time**: ${durationSeconds} seconds
**Timestamp**: ${timestamp}
**Capabilities Used**: ${context.capabilities?.join(", ") || "unknown"}

### Agent Context
- Agent Type: TypeScript Agent
- Session ID: ${context.sessionId || "unknown"}
- Framework Version: StringRay v1.0.7
- Auto-logged: True

### Performance Metrics
- Task Duration: ${durationSeconds}s
- Success Status: ${context.success ? "✅ Completed" : "❌ Failed"}
- Result Size: ${JSON.stringify(context.result).length} characters

### Task Result Summary
${this.summarizeResult(context.result)}

### Pattern Analysis Data
- Task Category: ${this.categorizeTask(context.task)}
- Complexity Level: ${this.assessComplexity(context.task, duration)}
- Success Factors: ${this.identifySuccessFactors(context)}`;
  }

  private summarizeResult(result: any): string {
    if (!result) return "No result data available";

    if (typeof result === "string") {
      return result.length > 500 ? result.substring(0, 500) + "..." : result;
    }

    try {
      const jsonStr = JSON.stringify(result, null, 2);
      return jsonStr.length > 500 ? jsonStr.substring(0, 500) + "..." : jsonStr;
    } catch {
      return "Complex result data (cannot serialize)";
    }
  }

  private categorizeTask(task: string): string {
    const lowerTask = task.toLowerCase();

    if (lowerTask.includes("review") || lowerTask.includes("audit"))
      return "Code Review";
    if (lowerTask.includes("design") || lowerTask.includes("architect"))
      return "System Design";
    if (lowerTask.includes("test") || lowerTask.includes("testing"))
      return "Testing";
    if (lowerTask.includes("refactor") || lowerTask.includes("improve"))
      return "Refactoring";
    if (lowerTask.includes("debug") || lowerTask.includes("fix"))
      return "Debugging";
    if (lowerTask.includes("security")) return "Security";

    return "General Development";
  }

  private assessComplexity(task: string, duration: number): string {
    const words = task.split(" ").length;
    const durationMinutes = duration / (1000 * 60);

    if (durationMinutes > 10 || words > 50) return "High";
    if (durationMinutes > 5 || words > 25) return "Medium";
    return "Low";
  }

  private identifySuccessFactors(context: AgentTaskContext): string {
    const factors = [];

    if (context.capabilities && context.capabilities.length > 0) {
      factors.push("capabilities-utilized");
    }

    if (context.success) {
      factors.push("task-completed");
    } else {
      factors.push("task-failed");
    }

    if (context.result) {
      factors.push("result-generated");
    }

    return factors.join(", ");
  }

  /**
   * Enable or disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  private async appendToRefactoringLog(content: string): Promise<void> {
    const projectRoot = process.cwd();
    const logPath = path.join(projectRoot, "logs", "agents", "refactoring-log.md");

    // Ensure directory exists
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Format entry with separators
    const entry = `\n\n---\n\n${content}\n\n---\n\n_This entry was automatically logged by the StringRay Framework refactoring logging processor._`;

    // Append to file
    await fs.promises.appendFile(logPath, entry, "utf-8");
  }
}

// Create processor registration
export const refactoringLoggingProcessor: ProcessorRegistration = {
  name: "refactoring-logging",
  type: "post",
  hook: new RefactoringLoggingProcessor(),
};

/**


}

/**
 * Helper function to create agent task context for logging
 */
export function createAgentTaskContext(
  agentName: string,
  task: string,
  startTime: number,
  success: boolean,
  result?: any,
  capabilities?: string[],
  sessionId?: string,
): AgentTaskContext {
  return {
    agentName,
    task,
    startTime,
    endTime: Date.now(),
    success,
    result,
    capabilities,
    sessionId,
  };
}

/**
 * Manual test function to verify refactoring logging works
 */
export async function testRefactoringLogging(): Promise<void> {
  console.log("🧪 Testing Refactoring Logging Processor...");

  const processor = new RefactoringLoggingProcessor();
  processor.setDebugEnabled(true);

  // Create test context
  const testContext = createAgentTaskContext(
    "test-agent",
    "Test task for REFACTORING_LOG.md verification",
    Date.now() - 5000, // 5 seconds ago
    true, // success
    "This is a test result that should be logged verbatim to REFACTORING_LOG.md",
    ["testing", "logging", "verification"],
    "test-session-123"
  );

  console.log("📝 Test context created:", {
    agentName: testContext.agentName,
    task: testContext.task.substring(0, 50) + "...",
    duration: testContext.endTime - testContext.startTime,
    success: testContext.success
  });

  try {
    const result = await processor.execute(testContext);
    console.log("✅ Refactoring logging test result:", result);

    // Check if file was written
    const fs = await import("fs");
    const path = await import("path");
    const logPath = path.join(process.cwd(), ".opencode", "REFACTORING_LOG.md");

    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf-8");
      const hasTestEntry = content.includes("test-agent");
      console.log("📄 REFACTORING_LOG.md exists:", hasTestEntry ? "✅ Contains test entry" : "❌ Missing test entry");

      if (hasTestEntry) {
        console.log("🎯 SUCCESS: Agent summary was written to REFACTORING_LOG.md");
      }
    } else {
      console.log("❌ REFACTORING_LOG.md file not found");
    }

  } catch (error) {
    console.error("❌ Refactoring logging test failed:", error);
  }
}
