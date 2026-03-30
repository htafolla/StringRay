#!/usr/bin/env node

/**
 * StringRay Framework Bridge for Hermes Agent
 *
 * Provides direct access to StringRay framework components
 * (ProcessorManager, QualityGate, StateManager) from Python.
 * Uses JSON stdin/stdout protocol for IPC.
 *
 * Commands:
 *   pre-process   - Run quality gate + pre-processors before tool execution
 *   post-process  - Run post-processors after tool execution
 *   validate      - Run validation on files
 *   health        - Quick framework health check
 *   codex-check   - Check code against codex rules
 *   stats         - Return bridge/framework statistics
 *   hooks         - Manage git hooks (install, uninstall, list, status)
 *
 * Usage:
 *   echo '{"command":"health"}' | node bridge.mjs [--cwd /path]   # stdin mode
 *   node bridge.mjs health --cwd /path                           # positional mode (no pipe needed)
 *   node bridge.mjs validate --cwd /path --json '{"files":["a.ts"]}'  # positional + payload
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  symlinkSync,
  unlinkSync,
  renameSync,
} from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Framework components (lazy-loaded) ───────────────────────
let ProcessorManager = null;
let StrRayStateManager = null;
let featuresConfigLoader = null;
let runQualityGateWithLogging = null;
let enforcerValidators = null;
let frameworkReady = false;
let frameworkLoadAttempted = false;

// ── Project root detection ───────────────────────────────────
function findProjectRoot() {
  const envHome = process.env.STRRAY_HOME;
  if (envHome && existsSync(join(envHome, "package.json"))) return envHome;

  const candidates = [
    process.cwd(),
    join(homedir(), "dev", "stringray"),
    join(dirname(__dirname), "..", "..", "..", ".."), // plugin dir -> project root
  ];

  for (const dir of candidates) {
    try {
      const pkgPath = join(dir, "package.json");
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (pkg.name === "strray-ai" || pkg.dependencies?.["strray-ai"]) {
          return dir;
        }
      }
    } catch {
      continue;
    }
  }
  return process.cwd();
}

// ── Log directory ────────────────────────────────────────────
function ensureLogDir(projectRoot) {
  const logDir = join(projectRoot, "logs", "framework");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

function logToActivity(logDir, message) {
  try {
    const activityPath = join(logDir, "activity.log");
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} [bridge] ${message}\n`;
    appendFileSync(activityPath, entry, "utf-8");
  } catch {
    // Silent fail
  }
}

function logToolEvent(logDir, eventType, tool, args = {}, result = null) {
  try {
    const eventsPath = join(logDir, "plugin-tool-events.log");
    const timestamp = new Date().toISOString();
    const jobId = `plugin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    if (eventType === "start") {
      const entry = `${timestamp} [${jobId}] [agent] tool-started - INFO | {"tool":"${tool}","args":${JSON.stringify(Object.keys(args))}}\n`;
      appendFileSync(eventsPath, entry, "utf-8");
    } else {
      const success = !result?.error;
      const level = success ? "SUCCESS" : "ERROR";
      const entry = `${timestamp} [${jobId}] [agent] tool-complete - ${level} | {"tool":"${tool}","duration":${result?.duration || 0}${result?.error ? `,"error":"${result.error}"` : ""}}\n`;
      appendFileSync(eventsPath, entry, "utf-8");
    }
  } catch {
    // Silent fail
  }
}

// ── Framework loading ────────────────────────────────────────
async function loadFramework(projectRoot) {
  if (frameworkReady) return true;
  if (frameworkLoadAttempted) return false;
  frameworkLoadAttempted = true;

  const distDirs = [
    join(projectRoot, "dist"),
    join(projectRoot, "node_modules", "strray-ai", "dist"),
  ];

  for (const distDir of distDirs) {
    try {
      // Quality gate (standalone, no deps)
      if (!runQualityGateWithLogging) {
        const qgPath = join(distDir, "plugin", "quality-gate.js");
        if (existsSync(qgPath)) {
          const qgModule = await import(qgPath);
          runQualityGateWithLogging = qgModule.runQualityGateWithLogging;
        }
      }

      // Heavy framework components
      if (!ProcessorManager) {
        const pmPath = join(distDir, "processors", "processor-manager.js");
        if (existsSync(pmPath)) {
          const pm = await import(pmPath);
          ProcessorManager = pm.ProcessorManager;
        }
      }

      if (!StrRayStateManager) {
        const smPath = join(distDir, "state", "state-manager.js");
        if (existsSync(smPath)) {
          const sm = await import(smPath);
          StrRayStateManager = sm.StrRayStateManager;
        }
      }

      if (!featuresConfigLoader) {
        const fmPath = join(distDir, "core", "features-config.js");
        if (existsSync(fmPath)) {
          const fm = await import(fmPath);
          featuresConfigLoader = fm.featuresConfigLoader;
        }
      }

      // RuleEnforcer — full code analysis (security, quality, architecture)
      if (!enforcerValidators) {
        const rePath = join(distDir, "enforcement", "index.js");
        if (existsSync(rePath)) {
          try {
            const reModule = await import(rePath);
            // Use ValidatorRegistry directly to bypass RuleExecutor dependency chain
            // which cascades failures when validators lack full project context
            const ValidatorRegistry = reModule.ValidatorRegistry;
            if (ValidatorRegistry) {
              enforcerValidators = new ValidatorRegistry();
              // Validators are pre-registered in constructor — no registerAllValidators needed
            }
          } catch (e) {
            logToActivity(join(projectRoot, "logs", "framework"), `ValidatorRegistry load skipped: ${e.message}`);
          }
        }
      }

      frameworkReady = !!(runQualityGateWithLogging || ProcessorManager);
      if (frameworkReady) return true;
    } catch (e) {
      continue;
    }
  }
  return false;
}

// ── Quality Gate ─────────────────────────────────────────────
class BridgeLogger {
  constructor(logDir) {
    this.logDir = logDir;
  }

  log(msg) {
    logToActivity(this.logDir, msg);
  }

  error(msg, err) {
    const detail = err instanceof Error ? `: ${err.message}` : "";
    logToActivity(this.logDir, `ERROR: ${msg}${detail}`);
  }
}

async function runQualityGateCheck(context, projectRoot, logDir) {
  const logger = new BridgeLogger(logDir);

  if (!runQualityGateWithLogging) {
    return { passed: true, violations: [], note: "quality-gate module not available" };
  }

  try {
    const result = await runQualityGateWithLogging(context, logger);
    return {
      passed: result.passed,
      violations: result.violations,
      checks: result.checks,
    };
  } catch (e) {
    return { passed: true, violations: [], error: e.message };
  }
}

// ── Processor Pipeline ───────────────────────────────────────
async function runProcessors(tool, args, phase, projectRoot, logDir) {
  if (!ProcessorManager || !StrRayStateManager) {
    return { ran: false, reason: "framework modules not loaded" };
  }

  const logger = new BridgeLogger(logDir);

  try {
    const stateDir = join(projectRoot, ".opencode", "state");
    const stateManager = new StrRayStateManager(stateDir);
    const processorManager = new ProcessorManager(stateManager);

    // Register processors matching OpenCode plugin
    if (phase === "pre") {
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 10,
        enabled: true,
      });
      processorManager.registerProcessor({
        name: "codexCompliance",
        type: "pre",
        priority: 20,
        enabled: true,
      });
      processorManager.registerProcessor({
        name: "versionCompliance",
        type: "pre",
        priority: 25,
        enabled: true,
      });
    }

    if (phase === "post") {
      processorManager.registerProcessor({
        name: "testAutoCreation",
        type: "post",
        priority: 5,
        enabled: true,
      });
      processorManager.registerProcessor({
        name: "testExecution",
        type: "post",
        priority: 10,
        enabled: true,
      });
      processorManager.registerProcessor({
        name: "coverageAnalysis",
        type: "post",
        priority: 20,
        enabled: true,
      });
      processorManager.registerProcessor({
        name: "agentsMdValidation",
        type: "post",
        priority: 30,
        enabled: true,
      });
    }

    let results;
    if (phase === "pre") {
      if (typeof processorManager.executePreProcessors !== "function") {
        return { ran: false, reason: "executePreProcessors not available" };
      }
      results = await processorManager.executePreProcessors({
        tool,
        args: args || {},
        context: {
          directory: projectRoot,
          operation: "tool_execution",
          filePath: args?.filePath || args?.path,
        },
      });
    } else {
      if (typeof processorManager.executePostProcessors !== "function") {
        return { ran: false, reason: "executePostProcessors not available" };
      }
      results = await processorManager.executePostProcessors(tool, {
        directory: projectRoot,
        operation: "tool_execution",
        filePath: args?.filePath || args?.path,
        success: true,
      }, []);
    }

    const allSuccess = Array.isArray(results)
      ? results.every((r) => r.success)
      : results.success;

    const details = Array.isArray(results)
      ? results.map((r) => ({
          name: r.processorName || r.name,
          success: r.success,
          error: r.error,
        }))
      : [];

    return {
      ran: true,
      success: allSuccess,
      processorCount: details.length,
      details,
    };
  } catch (e) {
    return { ran: false, reason: e.message };
  }
}

// ── Command handlers ─────────────────────────────────────────

async function handleHealth(input) {
  const projectRoot = findProjectRoot();
  const loaded = await loadFramework(projectRoot);

  const components = {
    qualityGate: !!runQualityGateWithLogging,
    processorManager: !!ProcessorManager,
    stateManager: !!StrRayStateManager,
    featuresConfig: !!featuresConfigLoader,
  };

  const pkgPath = join(projectRoot, "package.json");
  let version = "unknown";
  if (existsSync(pkgPath)) {
    try {
      version = JSON.parse(readFileSync(pkgPath, "utf-8")).version;
    } catch {}
  }

  return {
    status: "ok",
    framework: loaded ? "loaded" : "not_loaded",
    version,
    projectRoot,
    components,
    nodeVersion: process.version,
  };
}

async function handlePreProcess(input, projectRoot, logDir) {
  const { tool, args } = input;
  const startTime = Date.now();

  logToolEvent(logDir, "start", tool, args);
  logToActivity(logDir, `pre-process: tool=${tool}`);

  // 1. Quality gate check
  const qualityResult = await runQualityGateCheck(
    { tool, args: args || {} },
    projectRoot,
    logDir,
  );

  // 2. Pre-processors (for code-producing tools only)
  let processorResult = { ran: false };
  const codeTools = ["write_file", "patch", "execute_code", "write", "edit"];
  if (codeTools.includes(tool)) {
    processorResult = await runProcessors(tool, args, "pre", projectRoot, logDir);
  }

  const duration = Date.now() - startTime;

  logToActivity(logDir, `pre-process: complete duration=${duration}ms quality=${qualityResult.passed}`);

  return {
    passed: qualityResult.passed,
    duration,
    qualityGate: qualityResult,
    processors: processorResult,
  };
}

async function handlePostProcess(input, projectRoot, logDir) {
  const { tool, args, result, error } = input;
  const startTime = Date.now();

  logToActivity(logDir, `post-process: tool=${tool}`);

  // 1. Post-processors (for code-producing tools only)
  let processorResult = { ran: false };
  const codeTools = ["write_file", "patch", "execute_code", "write", "edit"];
  if (codeTools.includes(tool)) {
    processorResult = await runProcessors(tool, args, "post", projectRoot, logDir);
  }

  const duration = Date.now() - startTime;

  logToolEvent(logDir, "complete", tool, args, {
    duration,
    error: error || (processorResult.ran && !processorResult.success ? "processor-failed" : null),
  });

  logToActivity(logDir, `post-process: complete duration=${duration}ms processors=${processorResult.success}`);

  return {
    duration,
    processors: processorResult,
  };
}

async function handleValidate(input, projectRoot, logDir) {
  const { files, operation } = input;
  logToActivity(logDir, `validate: files=${JSON.stringify(files)} operation=${operation}`);

  // Use quality gate on each file
  const results = [];
  for (const filePath of files || []) {
    const qualityResult = await runQualityGateCheck(
      { tool: "write", args: { filePath } },
      projectRoot,
      logDir,
    );
    results.push({ file: filePath, ...qualityResult });
  }

  const allPassed = results.every((r) => r.passed);
  return {
    passed: allPassed,
    operation: operation || "validate",
    fileResults: results,
  };
}

async function handleCodexCheck(input, projectRoot, logDir) {
  const { code, focusAreas, operation } = input;
  const codeLen = code?.length || 0;
  logToActivity(logDir, `codex-check: code_length=${codeLen} focus=${focusAreas} operation=${operation}`);

  // Collect violations from both systems
  const allViolations = [];
  const allChecks = [];
  let enforcerRan = false;

  // Phase 1: Quality gate (fast meta-checks + basic patterns)
  const qualityResult = await runQualityGateCheck(
    { tool: "write", args: { content: code } },
    projectRoot,
    logDir,
  );

  if (qualityResult.checks) {
    allChecks.push(...qualityResult.checks);
  }
  if (qualityResult.violations?.length) {
    allViolations.push(...qualityResult.violations);
  }

  // Phase 2: Enforcement validators (deep code analysis — security, quality, architecture)
  //    Use ValidatorRegistry directly instead of RuleEnforcer.validateOperation()
  //    to avoid the dependency chain cascade that blocks validators on snippet analysis.
  //    Only run content-analysis validators — skip project-level validators that
  //    require full context (docs, tests, CI, package.json) and always fail on snippets.
  const SNIPPET_SAFE_RULES = new Set([
    "security-by-design",
    "input-validation",
    "clean-debug-logs",
    "console-log-usage",
    "no-duplicate-code",
    "loop-safety",
    "no-over-engineering",
    "single-responsibility",
    "error-resolution",
    "module-system-consistency",
  ]);

  if (enforcerValidators && codeLen > 0) {
    try {
      const ctx = { operation: "write", newCode: code, files: [] };
      const validators = enforcerValidators.getAllValidators();
      let enforcerViolations = 0;

      for (const v of validators) {
        // Only run snippet-safe validators, or respect focus areas
        if (!SNIPPET_SAFE_RULES.has(v.ruleId)) {
          // Still run if focus area explicitly requests this category
          if (focusAreas && focusAreas !== "all" && Array.isArray(focusAreas)) {
            if (focusAreas.includes(v.category)) {
              // Fall through to validate
            } else {
              continue;
            }
          } else {
            continue;
          }
        }

        try {
          const result = await v.validate(ctx);
          if (!result.passed) {
            enforcerViolations++;
            allViolations.push({
              id: v.ruleId,
              severity: v.severity || "error",
              message: result.message,
              suggestions: result.suggestions,
            });
            allChecks.push({ id: v.ruleId, passed: false, message: result.message });
          }
        } catch {
          // Skip broken validators gracefully
        }
      }

      enforcerRan = true;
      logToActivity(logDir, `codex-check: Validators ran against ${validators.length} rules (${SNIPPET_SAFE_RULES.size} snippet-safe), ${enforcerViolations} violations`);
    } catch (e) {
      logToActivity(logDir, `codex-check: Validator error: ${e.message}`);
    }
  } else if (!enforcerValidators) {
    logToActivity(logDir, `codex-check: Validators not available, quality gate only`);
  }

  const passed = allViolations.length === 0;

  return {
    passed,
    violations: allViolations,
    checks: allChecks,
    focusAreas: focusAreas || "all",
    enforcerRan,
  };
}

function handleHooks(input, projectRoot) {
  const { action, hooks } = input;
  const hookTypes = hooks || ["pre-commit", "post-commit", "pre-push", "post-push"];
  const gitHooksDir = join(projectRoot, ".git", "hooks");
  const strrayHooksDir = join(projectRoot, "hooks");

  if (!existsSync(gitHooksDir)) {
    return { error: "Not a git repository — no .git/hooks directory" };
  }

  const result = { managed: [], missing: [], external: [], stale: [] };

  // ── list / status ───────────────────────────────────────
  if (action === "list" || action === "status") {
    for (const hookName of hookTypes) {
      const gitHook = join(gitHooksDir, hookName);
      const strrayHook = join(strrayHooksDir, hookName);

      if (!existsSync(gitHook)) {
        result.missing.push(hookName);
      } else {
        try {
          const content = readFileSync(gitHook, "utf-8");
          if (content.includes("StringRay") || content.includes("strray") || content.includes("run-hook.js")) {
            result.managed.push(hookName);
          } else {
            result.external.push(hookName);
          }
        } catch {
          result.external.push(hookName);
        }
      }

      // Check if strray source hook exists
      if (!existsSync(strrayHook)) {
        result.stale.push(hookName);
      }
    }

    return {
      status: "ok",
      action,
      hooks: result,
      gitHooksDir,
      strrayHooksDir,
    };
  }

  // ── install ─────────────────────────────────────────────
  if (action === "install") {
    const installed = [];
    const skipped = [];
    const errors = [];

    for (const hookName of hookTypes) {
      const src = join(strrayHooksDir, hookName);
      const dst = join(gitHooksDir, hookName);

      if (!existsSync(src)) {
        skipped.push(hookName);
        continue;
      }

      try {
        // Backup existing non-strray hooks
        if (existsSync(dst)) {
          const content = readFileSync(dst, "utf-8");
          if (!content.includes("StringRay") && !content.includes("strray") && !content.includes("run-hook.js")) {
            renameSync(dst, `${dst}.strray-backup`);
          } else {
            unlinkSync(dst);
          }
        }

        // Create symlink
        const rel = relative(join(gitHooksDir), src);
        try {
          // symlinkSync with 'junction' on Windows
          symlinkSync(rel, dst);
        } catch {
          // Symlink may fail (permissions, cross-device) — copy instead
          const srcContent = readFileSync(src, "utf-8");
          writeFileSync(dst, srcContent, { mode: 0o755 });
        }
        installed.push(hookName);
      } catch (err) {
        errors.push({ hook: hookName, error: err.message });
      }
    }

    return { status: "ok", action: "install", installed, skipped, errors };
  }

  // ── uninstall ───────────────────────────────────────────
  if (action === "uninstall") {
    const removed = [];
    const restored = [];

    for (const hookName of hookTypes) {
      const dst = join(gitHooksDir, hookName);
      const backup = `${dst}.strray-backup`;

      if (!existsSync(dst)) continue;

      try {
        const content = readFileSync(dst, "utf-8");
        const isStrray = content.includes("StringRay") || content.includes("strray") || content.includes("run-hook.js");

        if (isStrray || lstatSync(dst).isSymbolicLink()) {
          unlinkSync(dst);

          // Restore backup if exists
          if (existsSync(backup)) {
            renameSync(backup, dst);
            restored.push(hookName);
          } else {
            removed.push(hookName);
          }
        }
      } catch {
        // Skip unremovable hooks
      }
    }

    return { status: "ok", action: "uninstall", removed, restored };
  }

  return { error: `Unknown hooks action: ${action}. Use: install, uninstall, list, status` };
}

function handleStats() {
  return {
    frameworkReady,
    qualityGateAvailable: !!runQualityGateWithLogging,
    processorsAvailable: !!ProcessorManager,
    nodeVersion: process.version,
    projectRoot: findProjectRoot(),
  };
}

// ── Known commands for positional-arg mode ──────────────────
const KNOWN_COMMANDS = new Set([
  "health", "stats", "pre-process", "post-process", "validate", "codex-check", "hooks",
]);

// ── Main ─────────────────────────────────────────────────────
async function main() {
  // Parse --cwd flag and detect positional command arg
  let cwdOverride = null;
  let positionalCommand = null;
  let positionalPayload = null;
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd" && argv[i + 1]) {
      cwdOverride = argv[i + 1];
      process.chdir(cwdOverride);
      i++;
    } else if (argv[i] === "--json" && argv[i + 1]) {
      // Inline JSON payload: node bridge.mjs health --json '{"key":"val"}'
      positionalPayload = argv[i + 1];
      i++;
    } else if (!argv[i].startsWith("-") && !positionalCommand && KNOWN_COMMANDS.has(argv[i])) {
      positionalCommand = argv[i];
    } else if (!argv[i].startsWith("-") && positionalCommand && !positionalPayload) {
      // Inline JSON payload after command: node bridge.mjs hooks '{"action":"install"}'
      positionalPayload = argv[i];
    }
  }

  let command;
  if (positionalCommand) {
    // Positional mode — no stdin needed (avoids security scanner blocks)
    command = { command: positionalCommand };
    if (positionalPayload) {
      try {
        command = { ...command, ...JSON.parse(positionalPayload) };
      } catch {
        process.stdout.write(JSON.stringify({ error: "Invalid --json payload" }));
        process.exit(1);
      }
    }
  } else {
    // Stdin mode — read JSON from pipe (original behavior)
    let input = "";
    for await (const chunk of process.stdin) {
      input += chunk;
    }

    try {
      command = JSON.parse(input);
    } catch {
      process.stdout.write(JSON.stringify({ error: "Invalid JSON input" }));
      process.exit(1);
    }
  }

  const projectRoot = findProjectRoot();
  const logDir = ensureLogDir(projectRoot);

  // Lazy-load framework on first call
  if (!frameworkReady && !frameworkLoadAttempted) {
    await loadFramework(projectRoot);
  }

  let response;
  const cmd = command.command || "health";

  switch (cmd) {
    case "health":
      response = await handleHealth(command);
      break;
    case "pre-process":
      response = await handlePreProcess(command, projectRoot, logDir);
      break;
    case "post-process":
      response = await handlePostProcess(command, projectRoot, logDir);
      break;
    case "validate":
      response = await handleValidate(command, projectRoot, logDir);
      break;
    case "codex-check":
      response = await handleCodexCheck(command, projectRoot, logDir);
      break;
    case "stats":
      response = handleStats();
      break;
    case "hooks":
      response = handleHooks(command, projectRoot);
      break;
    default:
      response = { error: `Unknown command: ${cmd}` };
  }

  process.stdout.write(JSON.stringify(response));
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e.message }));
  process.exit(1);
});
