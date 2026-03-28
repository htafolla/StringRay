/**
 * Log Protection Processor
 *
 * Prevents deletion of critical inference log files that are essential
 * for the tuning engines and pattern learning system.
 *
 * Protected files:
 * - routing-outcomes.json (routing analytics - NEVER delete)
 * - activity.log (framework activity - NEVER delete)
 * - strray-plugin-*.log (plugin logs)
 *
 * Archival flow is ALLOWED:
 * - framework-activity-*.log.gz (archived/compressed logs)
 * - Copy operations to create new archive files
 *
 * @module processors/implementations
 * @version 1.1.0
 */

import { PreProcessor } from "../processor-interfaces.js";
import { ProcessorContext, ProcessorResult } from "../processor-types.js";
import { frameworkLogger } from "../../core/framework-logger.js";

/**
 * Files that are ACTIVE and MUST be protected (never delete)
 */
const ACTIVE_LOG_PATTERNS = [
  /routing-outcomes\.json$/,
  /activity\.log$/,
  /activity\.log\.gz$/,
];

/**
 * Archived log files that CAN be cleaned up (old rotations)
 */
const ARCHIVE_PATTERNS = [
  /framework-activity-.+\.log\.gz$/,
  /strray-plugin-.+\.log\.gz$/,
];

/**
 * Directories/files that are protected
 */
const PROTECTED_PATH_PATTERNS = [
  /\.opencode\/state\//,
  /routing-outcomes\.json$/,
];

export class LogProtectionProcessor extends PreProcessor {
  readonly name = "logProtection";
  readonly priority = 10;

  protected async run(context: ProcessorContext): Promise<unknown> {
    const filePath = this.getFilePath(context);
    const operation = this.getOperation(context);

    if (!filePath) {
      return { allowed: true, reason: "no file path specified" };
    }

    const normalizedPath = filePath.replace(/\\/g, "/");
    const isDeleteOp = this.isDeleteOperation(operation);

    if (!isDeleteOp) {
      return { allowed: true, reason: "not a delete operation" };
    }

    // Check if this is an archive cleanup operation (allowed)
    if (this.isArchiveCleanup(normalizedPath)) {
      frameworkLogger.log(
        "log-protection-processor",
        "archive-cleanup-allowed",
        "info",
        { filePath: normalizedPath, operation }
      );
      return { allowed: true, isArchiveCleanup: true };
    }

    // Check if trying to delete active log files
    const activeFile = this.getActiveLogFile(normalizedPath);
    if (activeFile) {
      frameworkLogger.log(
        "log-protection-processor",
        "deletion-blocked",
        "warning",
        {
          filePath: normalizedPath,
          operation,
          reason: `Active log file '${activeFile}' - deletion prohibited`,
        }
      );

      return {
        allowed: false,
        reason: `Deletion of active log file '${activeFile}' is prohibited. These files are essential for the inference engine and pattern learning system.`,
        suggestion: "Use 'npx strray-ai archive-logs' to safely archive and rotate logs.",
        protectedFiles: [
          "routing-outcomes.json - routing analytics data (NEVER delete)",
          "activity.log - framework activity tracking (NEVER delete)",
        ],
      };
    }

    return { allowed: true };
  }

  private isDeleteOperation(operation: string | undefined): boolean {
    if (!operation) return false;
    const deleteOps = ["delete", "remove", "rm", "unlink", "del", "erase", "clear"];
    return deleteOps.some((op) => operation.toLowerCase().includes(op));
  }

  private isArchiveCleanup(filePath: string): boolean {
    const fileName = filePath.split("/").pop() || "";

    // Archived files (with timestamps) can be cleaned up
    for (const pattern of ARCHIVE_PATTERNS) {
      if (pattern.test(fileName) || pattern.test(filePath)) {
        return true;
      }
    }

    return false;
  }

  private getActiveLogFile(filePath: string): string | null {
    const fileName = filePath.split("/").pop() || "";

    // Check for active log files
    for (const pattern of ACTIVE_LOG_PATTERNS) {
      if (pattern.test(fileName)) {
        return fileName;
      }
    }

    // Check protected paths
    for (const pattern of PROTECTED_PATH_PATTERNS) {
      if (pattern.test(filePath)) {
        return filePath.split("/").pop() || filePath;
      }
    }

    return null;
  }

  private getOperation(context: ProcessorContext): string | undefined {
    return (context.operation || context.toolInput?.args?.operation) as string | undefined;
  }
}

export const logProtectionProcessor = new LogProtectionProcessor();
