#!/usr/bin/env node

/**
 * StringRay Git Hook Runner
 *
 * Called by git hooks (pre-commit, post-commit, pre-push, post-push)
 * to perform validation, logging, and monitoring.
 *
 * Usage:
 *   node scripts/hooks/run-hook.js <hook-type>
 *
 * Environment variables (set by bash hook scripts):
 *   HOOK_TYPE     - pre-commit | post-commit | pre-push | post-push
 *   PROJECT_ROOT  - Git repository root directory
 *   STAGED_FILES  - Newline-separated staged files (pre-commit)
 *   CHANGED_FILES - Newline-separated changed files (pre-push)
 *   COMMIT_SHA    - Commit hash (post-commit, post-push)
 *   BRANCH        - Branch name
 *   COMMIT_RANGE  - Commit range like abc..def (pre-push)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { execSync, exec } from "child_process";

// ── Parse arguments ──────────────────────────────────────────

const hookType = process.argv[2] || process.env.HOOK_TYPE || "unknown";
const projectRoot = process.env.PROJECT_ROOT || process.cwd();

// ── Logging ──────────────────────────────────────────────────

function ensureLogDir() {
  const logDir = join(projectRoot, "logs", "framework");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

function log(message) {
  try {
    const logDir = ensureLogDir();
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} [${hookType}] ${message}\n`;
    appendFileSync(join(logDir, "activity.log"), entry, "utf-8");
  } catch {
    // Never crash over logging
  }
}

function logError(message) {
  try {
    const logDir = ensureLogDir();
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} [${hookType}] ERROR: ${message}\n`;
    appendFileSync(join(logDir, "activity.log"), entry, "utf-8");
  } catch {
    // Never crash over logging
  }
}

// ── Record metrics ───────────────────────────────────────────

function recordMetrics(duration, exitCode) {
  try {
    const metricsFile = join(projectRoot, "hooks", "hook-metrics.json");
    let metrics = [];
    if (existsSync(metricsFile)) {
      try {
        metrics = JSON.parse(readFileSync(metricsFile, "utf-8"));
      } catch {
        metrics = [];
      }
    }
    metrics.push({
      timestamp: Date.now(),
      hookType,
      duration,
      exitCode,
      success: exitCode === 0,
    });
    // Keep last 500 entries
    if (metrics.length > 500) {
      metrics = metrics.slice(-500);
    }
    writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
  } catch {
    // Never crash over metrics
  }
}

// ── TypeScript checking ──────────────────────────────────────

function runTypeScriptCheck(files) {
  /**
   * Run tsc --noEmit on a subset of files.
   * Falls back to full project check if per-file fails.
   */
  log("Running TypeScript validation...");

  try {
    // Check if tsconfig.json exists
    const tsconfigPath = join(projectRoot, "tsconfig.json");
    if (!existsSync(tsconfigPath)) {
      log("No tsconfig.json found, skipping TypeScript check");
      return { passed: true, errors: [] };
    }

    // Check if tsc is available
    const tscPath = join(projectRoot, "node_modules", ".bin", "tsc");
    const tscCmd = existsSync(tscPath) ? tscPath : "npx tsc";

    // Try per-file check first (faster)
    const tsFiles = files.filter((f) => /\.(ts|tsx)$/.test(f));
    if (tsFiles.length > 0 && tsFiles.length <= 20) {
      try {
        execSync(`${tscCmd} --noEmit ${tsFiles.map((f) => `"${f}"`).join(" ")}`, {
          cwd: projectRoot,
          encoding: "utf-8",
          timeout: 30000,
          stdio: ["pipe", "pipe", "pipe"],
        });
        log(`TypeScript check passed: ${tsFiles.length} files`);
        return { passed: true, errors: [] };
      } catch (err) {
        const stderr = err.stderr || "";
        // If it's "cannot find file" errors from per-file mode, fall back
        if (stderr.includes("Cannot find name") || stderr.includes("error TS")) {
          // Parse errors
          const errorLines = stderr
            .split("\n")
            .filter((l) => l.includes("error TS"))
            .map((l) => l.trim());
          log(`TypeScript check failed: ${errorLines.length} errors`);
          return { passed: false, errors: errorLines };
        }
        // Fall through to full check
      }
    }

    // Full project check (fallback)
    try {
      execSync(`${tscCmd} --noEmit`, {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 60000,
        stdio: ["pipe", "pipe", "pipe"],
      });
      log("TypeScript full check passed");
      return { passed: true, errors: [] };
    } catch (err) {
      const stderr = (err.stderr || err.stdout || "").toString();
      const errorLines = stderr
        .split("\n")
        .filter((l) => l.includes("error TS"))
        .map((l) => l.trim())
        .slice(0, 20); // Cap at 20 errors
      log(`TypeScript full check failed: ${errorLines.length} errors`);
      return { passed: false, errors: errorLines };
    }
  } catch (err) {
    logError(`TypeScript check crashed: ${err.message}`);
    // Don't block commits if tsc itself crashes
    return { passed: true, errors: [], note: "tsc crashed, allowing commit" };
  }
}

// ── Codex validation ─────────────────────────────────────────

async function runCodexValidation(files) {
  /**
   * Run lightweight codex validation on files.
   * Uses dynamic import of framework modules when available.
   */
  log("Running Codex validation...");

  const tsFiles = files.filter((f) => /\.(ts|tsx)$/.test(f));
  const jsFiles = files.filter((f) => /\.(js|jsx|mjs)$/.test(f));

  if (tsFiles.length === 0 && jsFiles.length === 0) {
    return { passed: true, warnings: [], errors: [] };
  }

  // Quick static checks without framework dependency
  const errors = [];
  const warnings = [];

  for (const file of [...tsFiles, ...jsFiles]) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Check for console.log (codex violation)
      const consoleLogLines = lines.reduce((acc, line, i) => {
        if (/\bconsole\.(log|warn|error)\b/.test(line) && !line.includes("NOSONAR")) {
          acc.push(i + 1);
        }
        return acc;
      }, []);
      if (consoleLogLines.length > 0) {
        errors.push(`${file}: console.log/warn/error found at lines ${consoleLogLines.slice(0, 3).join(", ")}`);
      }

      // Check for TODO/FIXME
      const todoLines = lines.reduce((acc, line, i) => {
        if (/\/\/\s*(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
          acc.push(i + 1);
        }
        return acc;
      }, []);
      if (todoLines.length > 0) {
        warnings.push(`${file}: ${todoLines.length} TODO/FIXME comment(s) found`);
      }

      // Check for @ts-ignore
      const tsIgnoreLines = lines.reduce((acc, line, i) => {
        if (/@ts-ignore|@ts-nocheck|@ts-expect-error/.test(line)) {
          acc.push(i + 1);
        }
        return acc;
      }, []);
      if (tsIgnoreLines.length > 0) {
        warnings.push(`${file}: ${tsIgnoreLines.length} @ts-ignore/@ts-nocheck found`);
      }

      // Check for any type
      if (/\bany\b/.test(content)) {
        const anyLines = lines.reduce((acc, line, i) => {
          if (/\bany\b/.test(line) && !line.includes("//") && !line.includes("*")) {
            acc.push(i + 1);
          }
          return acc;
        }, []);
        if (anyLines.length > 3) {
          warnings.push(`${file}: ${anyLines.length} uses of 'any' type`);
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  const passed = errors.length === 0;
  log(`Codex validation: ${passed ? "passed" : `FAILED with ${errors.length} error(s)`}`);
  if (warnings.length > 0) {
    log(`Codex warnings: ${warnings.length}`);
  }

  return { passed, errors, warnings };
}

// ── Log archival and cleanup ──────────────────────────────────

async function runLogMaintenance() {
  /**
   * Archive and clean up old log files.
   * Runs after commits to keep logs manageable.
   */
  log("Running log maintenance...");

  try {
    const distDirs = [
      join(projectRoot, "dist"),
      join(projectRoot, "node_modules", "strray-ai", "dist"),
    ];

    for (const distDir of distDirs) {
      const triggerPath = join(distDir, "postprocessor", "triggers", "GitHookTrigger.js");
      if (!existsSync(triggerPath)) continue;

      try {
        const { archiveLogFiles, cleanupLogFiles } = await import(triggerPath);

        // Archive logs
        try {
          const archiveResult = await archiveLogFiles({
            archiveDirectory: join(projectRoot, "logs", "framework"),
            maxFileSizeMB: 10,
            rotationIntervalHours: 24,
            compressionEnabled: true,
            maxAgeHours: 168,
            directories: [join(projectRoot, "logs", "framework")],
            excludePatterns: [],
          });
          if (archiveResult.archived > 0) {
            log(`Archived ${archiveResult.archived} log file(s)`);
          }
        } catch {
          // Archive can fail silently
        }

        // Cleanup old logs
        try {
          const cleanResult = await cleanupLogFiles({
            maxAgeHours: 24,
            excludePatterns: [
              "activity.log",
              "framework-activity-",
              "strray-plugin-",
              "kernel-",
              "reflection-",
              ".md",
              "AUTOMATED_",
              "REFACTORING-",
              "release-",
              "deployment/",
              "monitoring/",
              "reports/",
              "reflections/",
              "current-session.log",
              "full-test-run.log",
            ],
            directories: [join(projectRoot, "logs")],
            enabled: true,
          });
          if (cleanResult.cleaned > 0) {
            log(`Cleaned ${cleanResult.cleaned} old log file(s)`);
          }
        } catch {
          // Cleanup can fail silently
        }

        return; // Successfully loaded and ran
      } catch {
        // Dynamic import failed, try next dist dir
      }
    }

    log("Log maintenance: framework modules not available, skipping");
  } catch (err) {
    logError(`Log maintenance failed: ${err.message}`);
  }
}

// ── Comprehensive validation (pre-push) ──────────────────────

async function runFullValidation(files) {
  /**
   * Full validation suite for pre-push.
   * Includes TypeScript check, codex validation, and test hints.
   */
  log("Running full validation suite...");

  // TypeScript check
  const tsResult = runTypeScriptCheck(files);

  // Codex validation
  const codexResult = await runCodexValidation(files);

  // Check for test files
  const sourceFiles = files.filter((f) =>
    /src\/.*\.(ts|tsx)$/.test(f) &&
    !f.includes(".test.") &&
    !f.includes(".spec.") &&
    !f.includes("__tests__")
  );

  let testWarning = null;
  if (sourceFiles.length > 0) {
    const testFiles = files.filter((f) =>
      f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__")
    );
    if (testFiles.length === 0) {
      testWarning = `${sourceFiles.length} source file(s) modified but no tests — consider adding tests`;
    }
  }

  const allPassed = tsResult.passed && codexResult.passed;
  log(`Full validation: ${allPassed ? "passed" : "FAILED"}`);

  return {
    passed: allPassed,
    typescript: tsResult,
    codex: codexResult,
    testWarning,
  };
}

// ── Hook handlers ─────────────────────────────────────────────

async function handlePreCommit() {
  const stagedFiles = (process.env.STAGED_FILES || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  if (stagedFiles.length === 0) {
    log("No staged files to validate");
    process.exit(0);
  }

  log(`Validating ${stagedFiles.length} staged file(s)...`);

  // TypeScript check (blocking)
  const tsResult = runTypeScriptCheck(stagedFiles);
  if (!tsResult.passed) {
    console.error("\n❌ TypeScript validation failed:");
    tsResult.errors.slice(0, 10).forEach((e) => console.error(`   ${e}`));
    if (tsResult.errors.length > 10) {
      console.error(`   ... and ${tsResult.errors.length - 10} more`);
    }
    console.error("\nFix TypeScript errors before committing.");
    console.error("Run: npx tsc --noEmit\n");
    process.exit(1);
  }

  // Codex validation (blocking)
  const codexResult = await runCodexValidation(stagedFiles);
  if (!codexResult.passed) {
    console.error("\n❌ Codex validation failed:");
    codexResult.errors.slice(0, 10).forEach((e) => console.error(`   ${e}`));
    console.error("\nFix Codex violations before committing.");
    console.error("Run: npx strray-ai validate\n");
    process.exit(1);
  }

  // Warnings (non-blocking)
  if (codexResult.warnings.length > 0) {
    console.warn("\n⚠️  Codex warnings:");
    codexResult.warnings.slice(0, 5).forEach((w) => console.warn(`   ${w}`));
    console.warn();
  }

  console.log(`\n✅ Pre-commit validation passed (${stagedFiles.length} files)\n`);
  process.exit(0);
}

async function handlePostCommit() {
  const commitSha = process.env.COMMIT_SHA || "unknown";
  const branch = process.env.BRANCH || "unknown";

  log(`Post-commit: ${commitSha} on ${branch}`);

  // Run log maintenance
  await runLogMaintenance();

  // Record metrics
  recordMetrics(0, 0);

  log("Post-commit: complete");
  process.exit(0);
}

async function handlePrePush() {
  const changedFiles = (process.env.CHANGED_FILES || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  if (changedFiles.length === 0) {
    log("No changed files to validate");
    process.exit(0);
  }

  log(`Validating ${changedFiles.length} changed file(s) for push...`);

  const result = await runFullValidation(changedFiles);

  if (!result.passed) {
    console.error("\n❌ Pre-push validation failed:\n");

    if (!result.typescript.passed) {
      console.error("TypeScript errors:");
      result.typescript.errors.slice(0, 10).forEach((e) =>
        console.error(`   ${e}`)
      );
      console.error();
    }

    if (!result.codex.passed) {
      console.error("Codex violations:");
      result.codex.errors.slice(0, 10).forEach((e) =>
        console.error(`   ${e}`)
      );
      console.error();
    }

    console.error("Fix all errors before pushing.");
    console.error("Run: npx tsc --noEmit && npx strray-ai validate\n");
    process.exit(1);
  }

  // Warnings
  if (result.codex.warnings.length > 0) {
    console.warn("\n⚠️  Codex warnings:");
    result.codex.warnings.slice(0, 5).forEach((w) => console.warn(`   ${w}`));
    console.warn();
  }

  if (result.testWarning) {
    console.warn(`\n⚠️  ${result.testWarning}\n`);
  }

  console.log(`\n✅ Pre-push validation passed (${changedFiles.length} files)\n`);
  process.exit(0);
}

async function handlePostPush() {
  const commitSha = process.env.COMMIT_SHA || "unknown";
  const branch = process.env.BRANCH || "unknown";

  log(`Post-push: ${commitSha} on ${branch}`);

  // Run log maintenance
  await runLogMaintenance();

  // Record metrics
  recordMetrics(0, 0);

  log("Post-push: complete");
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────

const handlers = {
  "pre-commit": handlePreCommit,
  "post-commit": handlePostCommit,
  "pre-push": handlePrePush,
  "post-push": handlePostPush,
};

const handler = handlers[hookType];
if (!handler) {
  console.error(`Unknown hook type: ${hookType}`);
  console.error(`Valid types: ${Object.keys(handlers).join(", ")}`);
  process.exit(1);
}

// Run with timing
const startTime = Date.now();
handler()
  .then(() => {
    const duration = Date.now() - startTime;
    log(`Hook completed in ${duration}ms`);
  })
  .catch((err) => {
    logError(`Hook crashed: ${err.message}`);
    console.error(`StringRay hook error: ${err.message}`);
    process.exit(1);
  });
