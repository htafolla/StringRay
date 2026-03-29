/**
 * Git Hook Trigger for Post-Processor
 */

import { PostProcessor } from "../PostProcessor.js";
import { PostProcessorContext } from "../types.js";
import * as fs from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";
import { frameworkLogger } from "../../core/framework-logger.js";

interface LogArchiveConfig {
  archiveDirectory: string;
  maxFileSizeMB: number;
  rotationIntervalHours: number;
  compressionEnabled: boolean;
  maxAgeHours: number;
  directories: string[];
  excludePatterns: string[];
}

// Re-export for backwards compatibility and external usage
export { cleanupLogFiles };
export { archiveLogFiles };  // Export for use in hooks
import { execSync } from "child_process";

/**
 * Configuration for log cleanup
 */
interface LogCleanupConfig {
  maxAgeHours: number;
  excludePatterns: string[];
  directories: string[];
  enabled: boolean;
}

/**
 * Archive and rotate log files to prevent unbounded growth
 */
async function archiveLogFiles(
  config: LogArchiveConfig,
): Promise<{ archived: number; errors: string[] }> {
  const jobId = `log-archive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result: { archived: number; errors: string[] } = {
    archived: 0,
    errors: [],
  };

  try {
    const fs = await import("fs");
    const path = await import("path");
    const zlib = await import("zlib");

    // Ensure archive directory exists
    if (!fs.existsSync(config.archiveDirectory)) {
      fs.mkdirSync(config.archiveDirectory, { recursive: true });
    }

    const activityLogPath = path.join(
      process.cwd(),
      "logs",
      "framework",
      "activity.log",
    );
    if (fs.existsSync(activityLogPath)) {
      const stats = fs.statSync(activityLogPath);
      const shouldArchive =
        stats.size > config.maxFileSizeMB * 1024 * 1024 || // Size-based
        Date.now() - stats.mtime.getTime() >
          config.rotationIntervalHours * 60 * 60 * 1000; // Time-based

      if (shouldArchive) {
        // Use full timestamp to prevent overwriting same-day archives
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // YYYY-MM-DDTHH-MM-SS-mmm
        const archiveName = `framework-activity-${timestamp}.log`; // Unique per run
        const archivePath = path.join(
          process.cwd(),
          "logs",
          "framework",
          archiveName,
        ); // Archive in same directory

        let archiveSuccess = false;
        let finalArchivePath = archivePath;

        try {
          // Copy current log to archive
          fs.copyFileSync(activityLogPath, archivePath);

          // Compress if enabled
          if (config.compressionEnabled) {
            const compressedPath = `${archivePath}.gz`;
            const gzip = zlib.createGzip();
            const input = fs.createReadStream(archivePath);
            const output = fs.createWriteStream(compressedPath);

            // Use pipeline for proper error handling
            await pipeline(input, gzip, output);

            // Verify compression succeeded
            if (fs.existsSync(compressedPath)) {
              const compressedStats = fs.statSync(compressedPath);
              if (compressedStats.size > 0) {
                fs.unlinkSync(archivePath); // Remove uncompressed
                archiveSuccess = true;
                finalArchivePath = compressedPath;
              }
            }
          } else {
            // Verify uncompressed archive
            const archiveStats = fs.statSync(archivePath);
            archiveSuccess = archiveStats.size > 0;
          }

          // ONLY reset if archive was created successfully
          if (archiveSuccess) {
            const header = `# Log rotated on ${new Date().toISOString()}\n`;
            fs.writeFileSync(activityLogPath, header);
            result.archived++;
          } else {
            // Archive failed - don't reset the log, leave it intact
            result.errors.push(`Archive creation failed for ${archivePath} - log left intact`);
            await frameworkLogger.log(
              "log-archiver",
              "archive-failed-log-intact",
              "error",
              {
                jobId,
                reason: "Archive creation failed, log not reset",
                activityLogPath,
              },
            );
            return result; // Exit early, log not modified
          }
        } catch (archiveError) {
          // Archive failed - don't reset the log, leave it intact
          const errorMsg = archiveError instanceof Error ? archiveError.message : String(archiveError);
          result.errors.push(`Archive failed: ${errorMsg} - log left intact`);
          
          // Clean up partial archive if it exists
          if (fs.existsSync(archivePath)) {
            try { fs.unlinkSync(archivePath); } catch { /* ignore cleanup error */ }
          }
          const compressedPath = `${archivePath}.gz`;
          if (fs.existsSync(compressedPath)) {
            try { fs.unlinkSync(compressedPath); } catch { /* ignore cleanup error */ }
          }
          
          await frameworkLogger.log(
            "log-archiver",
            "archive-error-log-intact",
            "error",
            {
              jobId,
              error: errorMsg,
              activityLogPath,
            },
          );
          return result; // Exit early, log not modified
        }

        await frameworkLogger.log(
          "log-archiver",
          "activity-log-rotated",
          "success",
          {
            jobId,
            archivePath: config.compressionEnabled
              ? `${archivePath}.gz`
              : archivePath,
            originalSize: stats.size,
            rotationReason:
              stats.size > config.maxFileSizeMB * 1024 * 1024 ? "size" : "time",
            compatibleWithReporting: true, // Uses framework-activity-*.log.gz naming
          },
        );
      }
    }

    // Clean up old archives beyond retention period (integrate with existing cleanup)
    // Note: Framework reporting system already handles cleanup of framework-activity-*.log.gz files
    // This ensures compatibility and prevents double-cleanup
  } catch (error) {
    const errorMsg = `Log archiving failed: ${error}`;
    result.errors.push(errorMsg);

    await frameworkLogger.log("log-archiver", "archiving-error", "error", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}

/**
 * Special archiving strategy for critical historical logs
 */
async function archiveCriticalHistoricalLogs(): Promise<{
  archived: number;
  errors: string[];
}> {
  const jobId = `critical-archive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result: { archived: number; errors: string[] } = {
    archived: 0,
    errors: [],
  };

  try {
    const fs = await import("fs");
    const path = await import("path");

    const historicalDir = path.join(process.cwd(), "logs", "historical");
    if (!fs.existsSync(historicalDir)) {
      fs.mkdirSync(historicalDir, { recursive: true });
    }

    const refactoringLogPath = path.join(
      process.cwd(),
      "logs",
      "agents",
      "refactoring-log.md",
    );
    if (fs.existsSync(refactoringLogPath)) {
      const stats = fs.statSync(refactoringLogPath);
      const lastModified = new Date(stats.mtime);
      const currentMonth = `${lastModified.getFullYear()}-${String(lastModified.getMonth() + 1).padStart(2, "0")}`;

      const monthlyArchiveName = `refactoring-log-${currentMonth}.md`;
      const monthlyArchivePath = path.join(historicalDir, monthlyArchiveName);

      if (!fs.existsSync(monthlyArchivePath)) {
        fs.copyFileSync(refactoringLogPath, monthlyArchivePath);

        result.archived++;

        await frameworkLogger.log(
          "log-archiver",
          "refactoring-log-archived",
          "info",
          {
            jobId,
            archivePath: monthlyArchivePath,
            size: stats.size,
            snapshotMonth: currentMonth,
          },
        );
      }
    }
  } catch (error) {
    const errorMsg = `Critical log archiving failed: ${error}`;
    result.errors.push(errorMsg);

    await frameworkLogger.log(
      "log-archiver",
      "critical-archiving-error",
      "error",
      {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
  }

  return result;
}

async function cleanupLogFiles(
  config: any,
): Promise<{ cleaned: number; errors: string[] }> {
  const jobId = `log-cleanup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result: { cleaned: number; errors: string[] } = {
    cleaned: 0,
    errors: [],
  };
  const maxAgeMs = config.maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();

  for (const dir of config.directories) {
    try {
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip directories
        if (stat.isDirectory()) continue;

        // Check if file should be excluded
        const shouldExclude = config.excludePatterns.some((pattern: string) =>
          file.includes(pattern.replace("*", "")),
        );

        if (shouldExclude) continue;

        // Check if file is too old
        const ageMs = now - stat.mtime.getTime();
        if (ageMs > maxAgeMs) {
          try {
            fs.unlinkSync(filePath);
            result.cleaned++;

            await frameworkLogger.log("git-hooks", "log-file-cleaned", "info", {
              jobId,
              file: filePath,
              age: Math.round(ageMs / (1000 * 60 * 60)), // hours
              size: stat.size,
            });
          } catch (error) {
            const errorMsg = `Failed to clean log file ${filePath}: ${error}`;
            result.errors.push(errorMsg);

            await frameworkLogger.log(
              "git-hooks",
              "log-cleanup-error",
              "error",
              {
                jobId,
                file: filePath,
                error: error instanceof Error ? error.message : String(error),
              },
            );
          }
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process directory ${dir}: ${error}`;
      result.errors.push(errorMsg);

      await frameworkLogger.log(
        "git-hooks",
        "log-cleanup-directory-error",
        "error",
        {
          jobId,
          directory: dir,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  return result;
}

export class GitHookTrigger {
  private initialized = false;

  constructor(private postProcessor: PostProcessor) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const hooksDir = path.join(process.cwd(), ".opencode", "hooks");
    const gitHooksDir = path.join(process.cwd(), ".git", "hooks");
    const postCommitHook = path.join(hooksDir, "post-commit");
    const postPushHook = path.join(hooksDir, "post-push");

    // Ensure our hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Ensure .git/hooks directory exists (should exist in git repo)
    if (!fs.existsSync(gitHooksDir)) {
      await frameworkLogger.log(
        "git-hook-trigger",
        "git-hooks-directory-not-found",
        "warning",
        { gitHooksDir },
      );
      return;
    }

    // Install hooks in our directory first
    this.installHook(postCommitHook, "post-commit");
    this.installHook(postPushHook, "post-push");

    // Create symlinks in .git/hooks to activate them
    await this.activateGitHooks(gitHooksDir, postCommitHook, postPushHook);

    this.initialized = true;
  }

  private installHook(hookPath: string, hookType: string): void {
    const hookContent = this.generateHookScript(hookType);

    // Check if hook already exists and has our content
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, "utf8");
      if (existing.includes("postprocessor-trigger")) {
        return; // Already installed
      }
      // Backup existing hook
      fs.renameSync(hookPath, `${hookPath}.backup`);
    }

    fs.writeFileSync(hookPath, hookContent);
    fs.chmodSync(hookPath, "755");
  }

  private generateHookScript(hookType: string): string {
    const isPushHook = hookType === "post-push";

    return `#!/bin/bash
# StringRay Post-Processor ${hookType} Hook
# Automatically triggers post-processor after ${hookType}

# Get hook type from script name
HOOK_NAME=$(basename "$0")
COMMIT_SHA=""

if [ "$HOOK_NAME" = "post-commit" ]; then
  # Light monitoring for local commits - just basic validation
  COMMIT_SHA=$(git rev-parse HEAD)
  MONITORING_LEVEL="basic"
elif [ "$HOOK_NAME" = "post-push" ]; then
  # Full monitoring for pushes - comprehensive validation
  # For push hooks, we need to parse the pushed refs from stdin
  while read local_ref local_sha remote_ref remote_sha; do
    if [ "$local_sha" != "0000000000000000000000000000000000000000" ]; then
      COMMIT_SHA=$local_sha
      break
    fi
  done
  MONITORING_LEVEL="full"
else
  COMMIT_SHA=$(git rev-parse HEAD)
  MONITORING_LEVEL="basic"
fi

if [ -z "$COMMIT_SHA" ]; then
  echo "Warning: Could not determine commit SHA for post-processor"
  exit 0
fi

# Get repository info
REPO="strray-framework/stringray"  # Placeholder for now
BRANCH=$(git rev-parse --abbrev-ref HEAD)
AUTHOR=$(git log -1 --pretty=format:'%an <%ae>')

# Get changed files (different logic for commit vs push)
if [ "$HOOK_NAME" = "post-commit" ]; then
  FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached)
else
  FILES=$(git log --name-only --oneline -1 $COMMIT_SHA | tail -n +2)
fi

# Trigger post-processor asynchronously (don't block git operations)
(
  cd "$(dirname "$0")/../.." # Navigate to project root

  # Find the StringRay plugin in node_modules or current project (development)
  STRRAY_PLUGIN=""
  if [ -d "node_modules/strray-framework" ]; then
    STRRAY_PLUGIN="node_modules/strray-framework"
  elif [ -d "node_modules/@strray/strray-framework" ]; then
    STRRAY_PLUGIN="node_modules/@strray/strray-framework"
  elif [ -d "node_modules/OpenCode/plugins/strray-framework" ]; then
    STRRAY_PLUGIN="node_modules/OpenCode/plugins/strray-framework"
  elif [ -f "dist/postprocessor/PostProcessor.js" ]; then
    # Development mode - use current project
    STRRAY_PLUGIN="."
  fi

  if command -v node >/dev/null 2>&1 && [ -n "$STRRAY_PLUGIN" ]; then
    # Call a separate script to avoid bash variable issues
    export COMMIT_SHA="$COMMIT_SHA"
    export REPO="$REPO"
    export BRANCH="$BRANCH"
    export AUTHOR="$AUTHOR"
    export STRRAY_PLUGIN="$STRRAY_PLUGIN"
    export MONITORING_LEVEL="$MONITORING_LEVEL"
    export IS_FULL_MONITORING="$([ "$MONITORING_LEVEL" = "full" ] && echo "true" || echo "false")"

    # Run appropriate monitoring based on hook type
    if [ "$HOOK_NAME" = "post-commit" ]; then
      # LIGHT MONITORING: Quick validation, don't block git workflow
      # Timeout: 2 seconds max, log metrics for monitoring
      START_TIME=\$(date +%s)
      timeout 2 node -e "
      (async () => {
        try {
          // Use import resolver to avoid hardcoded dist paths
          const { importResolver } = await import('./utils/import-resolver.js');
          const { LightweightValidator } = await importResolver.importModule('postprocessor/validation/LightweightValidator');

          const validator = new LightweightValidator();
          const result = await validator.validate();

          if (result.warnings.length > 0) {
            await frameworkLogger.log('-git-hook-trigger', '-result-warnings-length-warning-s-found-', 'info', { message: '⚠️ ' + result.warnings.length + ' warning(s) found:' });
            result.warnings.forEach(w => await frameworkLogger.log('-git-hook-trigger', '-w-', 'info', { message: '   ' + w) });
          }

          if (!result.passed) {
            await frameworkLogger.log('-git-hook-trigger', '-result-errors-length-error-s-found-', 'error', { message: '❌ ' + result.errors.length + ' error(s) found:' });
            result.errors.forEach(e => await frameworkLogger.log('-git-hook-trigger', '-e-', 'info', { message: '   ' + e) });
            process.exit(1);
          }

          await frameworkLogger.log('-git-hook-trigger', '-post-commit-validation-passed-in-result-duration-', 'success', { message: '✅ Post-commit: Validation passed in ' + result.duration + 'ms' });
        } catch (error) {
          await frameworkLogger.log('git-hook-trigger', 'post-commit-validation-failed', 'error', { error: error instanceof Error ? error.message : String(error) });
          process.exit(1);
        }
      })();
      " 2>/dev/null
      EXIT_CODE=\$?
      END_TIME=\$(date +%s)
      DURATION=\$((END_TIME - START_TIME))

      # Log metrics for monitoring (convert to milliseconds)
      DURATION_MS=\$((DURATION * 1000))
      # LOG CLEANUP: Remove old log files after validation
      # Use relative path from CWD - works in both dev and consumer
      node -e "
      (async () => {
        try {
          // Use dynamic import that works in both dev and consumer
          const basePath = process.env.STRRAY_BASE_PATH || '.';
          // First archive logs (compress and rotate) before cleanup
          const { archiveLogFiles } = await import(basePath + '/dist/postprocessor/triggers/GitHookTrigger.js');
          const archiveResult = await archiveLogFiles({
            archiveDirectory: 'logs/framework',
            maxFileSizeMB: 10,  // Archive if > 10MB
            rotationIntervalHours: 24,  // Archive if > 24 hours old
            compressionEnabled: true,
            maxAgeHours: 168,  // Keep archives for 7 days
            directories: ['logs/framework'],
            excludePatterns: []
          });
          if (archiveResult.archived > 0) {
            await frameworkLogger.log('-git-hook-trigger', '-archived-log-files-', 'info', { message: \`📦 Archived \${archiveResult.archived} log files\` });
          }

          // Then cleanup old files
          const { cleanupLogFiles } = await import(basePath + '/dist/postprocessor/triggers/GitHookTrigger.js');
          const result = await cleanupLogFiles({
            maxAgeHours: 24,
            excludePatterns: [
              // Core inference/logging - NEVER DELETE
              'activity.log',           
              'framework-activity-',
              'strray-plugin-',
              
              // Analysis & reflections - Contains inference data
              'kernel-',
              'reflection-',
              
              // Documentation & plans - Important artifacts
              '.md',
              'AUTOMATED_',
              'REFACTORING-',
              'release-',
              
              // Subdirectories with important data (but test-activity should be cleaned)
              'deployment/',
              'monitoring/',
              'reports/',
              'reflections/',
              
              // Init logs can be cleaned but keep recent
              'strray-init-2026-01-2',   // Keep Jan 20s
              'strray-init-2026-01-3',   // Keep Jan 30s
              
              // Other important files
              'current-session.log',
              'full-test-run.log',
              'kernel-codex',
              'kernel-methodology',
              'kernel-status',
              'kernel-update',
              'kernel-v2',
            ],
            directories: ['logs/'],
            enabled: true
          });
          if (result.cleaned > 0) {
            await frameworkLogger.log('-git-hook-trigger', '-cleaned-result-cleaned-old-log-files-', 'info', { message: '🧹 Cleaned ' + result.cleaned + ' old log files' });
          }
          if (result.errors.length > 0) {
            await frameworkLogger.log('git-hook-trigger', 'log-cleanup-errors', 'error', { errors: result.errors });
          }
        } catch (error) {
          await frameworkLogger.log('git-hook-trigger', 'log-cleanup-failed', 'error', { error: error instanceof Error ? error.message : String(error) });
        }
      })();
      "

      echo "HOOK_METRICS: post-commit duration=\${DURATION_MS}ms exit_code=\${EXIT_CODE}" >&2
      collector.recordMetrics('post-commit', \${DURATION_MS}, \${EXIT_CODE});
      " 2>/dev/null
      EXIT_CODE=\$?
      END_TIME=\$(date +%s)
      DURATION=\$((END_TIME - START_TIME))

      # Log comprehensive metrics for monitoring (convert to milliseconds)
      DURATION_MS=\$((DURATION * 1000))
      echo "HOOK_METRICS: post-push duration=\${DURATION_MS}ms exit_code=\${EXIT_CODE}" >&2

      # Record metrics using metrics collector (direct import for reliability)
      # Use environment variable for base path - works in both dev and consumer
      node -e "
      (async () => {
        try {
          const basePath = process.env.STRRAY_BASE_PATH || '.';
          const distPath = process.env.STRRAY_DIST_PATH || 'dist';
          const { HookMetricsCollector } = await import(basePath + '/' + distPath + '/postprocessor/validation/HookMetricsCollector.js');
          const collector = new HookMetricsCollector();
          collector.recordMetrics('post-push', \${DURATION_MS}, \${EXIT_CODE});
        } catch (error) {
          // Silently fail if metrics collection fails
        }
      })();
      " 2>/dev/null || true

      [ \$EXIT_CODE -eq 0 ] && exit 0 || exit 1
    fi
  else
    echo "Warning: StringRay plugin not found or Node.js not available, skipping post-processor"
  fi
)

# Don't wait for background process
exit 0
`;
  }

  private async activateGitHooks(
    gitHooksDir: string,
    postCommitHook: string,
    postPushHook: string,
  ): Promise<void> {
    try {
      // Define the target hook paths in .git/hooks
      const gitPostCommitHook = path.join(gitHooksDir, "post-commit");
      const gitPostPushHook = path.join(gitHooksDir, "post-push");

      // Create relative symlinks from .git/hooks to our hooks
      const relativePostCommit = path.relative(gitHooksDir, postCommitHook);
      const relativePostPush = path.relative(gitHooksDir, postPushHook);

      // Handle existing hooks by backing them up
      this.backupExistingHook(gitPostCommitHook);
      this.backupExistingHook(gitPostPushHook);

      // Create symlinks to activate our hooks
      fs.symlinkSync(relativePostCommit, gitPostCommitHook);
      fs.symlinkSync(relativePostPush, gitPostPushHook);
    } catch (error) {
      await frameworkLogger.log(
        "git-hook-trigger",
        "git-hooks-activation-failed",
        "error",
        { error: String(error) },
      );
      await frameworkLogger.log(
        "git-hook-trigger",
        "manual-activation-hint",
        "info",
        { message: "💡 To activate manually, run:" },
      );
      await frameworkLogger.log(
        "git-hook-trigger",
        "manual-activation-command-1",
        "info",
        {
          message: `   ln -s "../../.opencode/hooks/post-commit" ".git/hooks/post-commit"`,
        },
      );
      await frameworkLogger.log(
        "git-hook-trigger",
        "manual-activation-command-2",
        "info",
        {
          message: `   ln -s "../../.opencode/hooks/post-push" ".git/hooks/post-push"`,
        },
      );
    }
  }

  private backupExistingHook(hookPath: string): void {
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, "utf8");
      if (!existing.includes("postprocessor-trigger")) {
        // Backup non-postprocessor hooks
        fs.renameSync(hookPath, `${hookPath}.backup`);
      } else {
        // Remove our existing symlink
        fs.unlinkSync(hookPath);
      }
    }
  }

  async triggerPostProcessor(context: PostProcessorContext): Promise<void> {
    await this.postProcessor.executePostProcessorLoop(context);
  }
}
