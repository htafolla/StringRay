/**
 * StrRay Codex Injection Plugin for OpenCode
 *
 * This plugin automatically injects the Universal Development Codex v1.2.0
 * into the system prompt for all AI agents, ensuring codex terms are
 * consistently enforced across the entire development session.
 *
 * @version 1.0.0
 * @author StrRay Framework
 */

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

// Dynamic imports for config-paths and framework-logger
// Uses candidate-based resolution to work from both dist/plugin/ and .opencode/plugin/
let _resolveCodexPath: any;
let _resolveStateDir: any;
let _frameworkLogger: any;

async function loadFrameworkLogger() {
  if (_frameworkLogger) return _frameworkLogger;
  const candidates = [
    "../core/framework-logger.js",
    "../../dist/core/framework-logger.js",
    "../../node_modules/strray-ai/dist/core/framework-logger.js",
  ];
  for (const p of candidates) {
    try {
      const mod = await import(p);
      _frameworkLogger = mod.frameworkLogger;
      return _frameworkLogger;
    } catch (_) {
      // try next candidate
    }
  }
  // Fallback: no-op logger so plugin doesn't crash
  _frameworkLogger = {
    log: (_module: string, _event: string, _status: string, _data?: any) => {},
  };
  return _frameworkLogger;
}

async function loadConfigPaths() {
  if (_resolveCodexPath && _resolveStateDir) return;
  const candidates = [
    "../core/config-paths.js",
    "../../dist/core/config-paths.js",
    "../../node_modules/strray-ai/dist/core/config-paths.js",
  ];
  for (const p of candidates) {
    try {
      const mod = await import(p);
      _resolveCodexPath = mod.resolveCodexPath;
      _resolveStateDir = mod.resolveStateDir;
      return;
    } catch (_) {
      // try next candidate
    }
  }
  const logger = await loadFrameworkLogger();
  logger.log("strray-codex-plugin", "config-paths-load-failed", "warning", { warning: "Failed to load config-paths module from any location" });
}

/** Convenience wrapper — must be awaited before use */
async function resolveCodexPath(...args: any[]) {
  await loadConfigPaths();
  return _resolveCodexPath(...args);
}

async function resolveStateDir(...args: any[]) {
  await loadConfigPaths();
  return _resolveStateDir(...args);
}

// Import lean system prompt generator
let SystemPromptGenerator: any;

async function importSystemPromptGenerator() {
  if (!SystemPromptGenerator) {
    const candidates = [
      "../core/system-prompt-generator.js",
      "../../dist/core/system-prompt-generator.js",
      "../../node_modules/strray-ai/dist/core/system-prompt-generator.js",
    ];
    for (const p of candidates) {
      try {
        const module = await import(p);
        SystemPromptGenerator = module.generateLeanSystemPrompt;
        return;
      } catch (_) {
        // try next candidate
      }
    }
    const logger = await loadFrameworkLogger();
    logger.log("strray-codex-plugin", "system-prompt-generator-load-failed", "warning", { warning: "Failed to load lean system prompt generator, using fallback" });
  }
}

let ProcessorManager: any;
let StrRayStateManager: any;
let featuresConfigLoader: any;
let detectTaskType: any;

async function loadStrRayComponents() {
  if (ProcessorManager && StrRayStateManager && featuresConfigLoader) return;

  const logger = await getOrCreateLogger(process.cwd());

  // Try local dist first (for development)
  try {
    logger.log(`🔄 Attempting to load from ../../dist/`);
    const procModule = await import(
      "../../dist/processors/processor-manager.js" as any
    );
    const stateModule = await import(
      "../../dist/state/state-manager.js" as any
    );
    const featuresModule = await import(
      "../../dist/core/features-config.js" as any
    );
    ProcessorManager = procModule.ProcessorManager;
    StrRayStateManager = stateModule.StrRayStateManager;
    featuresConfigLoader = featuresModule.featuresConfigLoader;
    detectTaskType = featuresModule.detectTaskType;
    logger.log(`✅ Loaded from ../../dist/`);
    return;
  } catch (e: any) {
    logger.error(`❌ Failed to load from ../../dist/: ${e?.message || e}`);
  }

  // Try node_modules (for consumer installation)
  const pluginPaths = ["strray-ai", "strray-framework"];

  for (const pluginPath of pluginPaths) {
    try {
      logger.log(
        `🔄 Attempting to load from ../../node_modules/${pluginPath}/dist/`,
      );
      const pm = await import(
        `../../node_modules/${pluginPath}/dist/processors/processor-manager.js`
      );
      const sm = await import(
        `../../node_modules/${pluginPath}/dist/state/state-manager.js`
      );
      const fm = await import(
        `../../node_modules/${pluginPath}/dist/core/features-config.js`
      );
      ProcessorManager = pm.ProcessorManager;
      StrRayStateManager = sm.StrRayStateManager;
      featuresConfigLoader = fm.featuresConfigLoader;
      detectTaskType = fm.detectTaskType;
      logger.log(`✅ Loaded from ../../node_modules/${pluginPath}/dist/`);
      return;
    } catch (e: any) {
      logger.error(
        `❌ Failed to load from ../../node_modules/${pluginPath}/dist/: ${e?.message || e}`,
      );
      continue;
    }
  }
}

function spawnPromise(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "inherit", "pipe"], // Original working stdio - stdout to terminal (ASCII visible)
    });
    let stdout = "";
    let stderr = "";

    // Capture stderr only (stdout goes to inherit/terminal)
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

class PluginLogger {
  private logPath: string;

  constructor(directory: string) {
    const logsDir = path.join(directory, ".opencode", "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const today = new Date().toISOString().split("T")[0];
    this.logPath = path.join(logsDir, `strray-plugin-${today}.log`);
  }

  async logAsync(message: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      await fs.promises.appendFile(this.logPath, logEntry, "utf-8");
    } catch (error) {
      // Silent fail - logging failure should not break plugin
    }
  }

  log(message: string): void {
    void this.logAsync(message);
  }

  error(message: string, error?: unknown): void {
    const errorDetail = error instanceof Error ? `: ${error.message}` : "";
    this.log(`ERROR: ${message}${errorDetail}`);
  }
}

let loggerInstance: PluginLogger | null = null;
let loggerInitPromise: Promise<PluginLogger> | null = null;

async function getOrCreateLogger(directory: string): Promise<PluginLogger> {
  if (loggerInstance) {
    return loggerInstance;
  }

  if (loggerInitPromise) {
    return loggerInitPromise;
  }

  loggerInitPromise = (async () => {
    const logger = new PluginLogger(directory);
    loggerInstance = logger;
    return logger;
  })();

  return loggerInitPromise;
}

/**
 * Get the current framework version from package.json
 */
function getFrameworkVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "1.4.6";
  } catch {
    return "1.4.6";
  }
}

/**
 * Get lean framework identity message (token-efficient version)
 */
function getFrameworkIdentity(): string {
  const version = getFrameworkVersion();
  return `StringRay Framework v${version} - AI Orchestration

🔧 Core: enforcer, architect, orchestrator, code-reviewer, refactorer, testing-lead
📚 Codex: 5 Essential Terms (99.6% Error Prevention Target)
🎯 Goal: Progressive, production-ready development workflow

📖 Documentation: config dir (codex, config, agents docs) — resolved via config-paths
`;
}

/**
 * Run Enforcer quality gate check before operations
 */
async function runEnforcerQualityGate(
  input: { tool: string; args?: { content?: string; filePath?: string } },
  logger: PluginLogger,
): Promise<{ passed: boolean; violations: string[] }> {
  const violations: string[] = [];
  const { tool, args } = input;

  // Rule 1: tests-required for new files
  if (tool === "write" && args?.filePath) {
    const filePath = args.filePath;
    // Check if this is a source file (not test, not config)
    if (
      filePath.endsWith(".ts") &&
      !filePath.includes(".test.") &&
      !filePath.includes(".spec.")
    ) {
      // Check if test file exists
      const testPath = filePath.replace(".ts", ".test.ts");
      const specPath = filePath.replace(".ts", ".spec.ts");

      if (!fs.existsSync(testPath) && !fs.existsSync(specPath)) {
        violations.push(
          `tests-required: No test file found for ${filePath} (expected ${testPath} or ${specPath})`,
        );
        logger.log(
          `⚠️ ENFORCER: tests-required violation detected for ${filePath}`,
        );
      }
    }
  }

  // Rule 2: documentation-required for new features
  if (tool === "write" && args?.filePath?.includes("src/")) {
    const docsDir = path.join(process.cwd(), "docs");
    const readmePath = path.join(process.cwd(), "README.md");

    // Check if docs directory exists
    if (!fs.existsSync(docsDir) && !fs.existsSync(readmePath)) {
      violations.push(
        `documentation-required: No documentation found for new feature`,
      );
      logger.log(`⚠️ ENFORCER: documentation-required violation detected`);
    }
  }

  // Rule 3: resolve-all-errors - check if we're creating code with error patterns
  if (args?.content) {
    const errorPatterns = [
      /console\.log\s*\(/g,
      /TODO\s*:/gi,
      /FIXME\s*:/gi,
      /throw\s+new\s+Error\s*\(\s*['"]test['"]\s*\)/gi,
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(args.content)) {
        violations.push(
          `resolve-all-errors: Found debug/error pattern (${pattern.source}) in code`,
        );
        logger.log(`⚠️ ENFORCER: resolve-all-errors violation detected`);
        break;
      }
    }
  }

  const passed = violations.length === 0;

  if (!passed) {
    logger.error(`🚫 Quality Gate FAILED with ${violations.length} violations`);
  } else {
    logger.log(`✅ Quality Gate PASSED`);
  }

  return { passed, violations };
}

interface CodexContextEntry {
  id: string;
  source: string;
  content: string;
  priority: "critical" | "high" | "normal" | "low";
  metadata: {
    version: string;
    termCount: number;
    loadedAt: string;
  };
}

/**
 * Global codex context cache (loaded once)
 */
let cachedCodexContexts: CodexContextEntry[] | null = null;

/**
 * Codex file locations resolved through the standard priority chain.
 * Falls back to additional OpenCode-specific files not covered by the resolver.
 */
async function getCodexFileLocations(directory?: string): Promise<string[]> {
  const root = directory || process.cwd();
  const resolved = await resolveCodexPath(root);
  // Add OpenCode-specific fallbacks not in the standard chain
  resolved.push(
    path.join(root, ".opencode", "codex.codex"),
    path.join(root, ".strray", "agents_template.md"),
    path.join(root, ".opencode", "strray", "agents_template.md"),
    path.join(root, "AGENTS.md"),
  );
  return resolved;
}

/**
 * Read file content safely
 */
function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    const logger = new PluginLogger(process.cwd());
    logger.error(`Failed to read file ${filePath}`, error);
    return null;
  }
}

/**
 * Extract codex metadata from content
 */
function extractCodexMetadata(content: string): {
  version: string;
  termCount: number;
} {
  // Try JSON format first (codex.json)
  if (content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      const version = parsed.version || "1.6.0";
      const terms = parsed.terms || {};
      const termCount = Object.keys(terms).length;
      return { version, termCount };
    } catch {
      // Not valid JSON, try markdown format
    }
  }

  // Markdown format (AGENTS.md, agents_template.md via config-paths resolver)
  const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
  const version = versionMatch && versionMatch[1] ? versionMatch[1] : "1.6.0";

  const termMatches = content.match(/####\s*\d+\.\s/g);
  const termCount = termMatches ? termMatches.length : 0;

  return { version, termCount };
}

/**
 * Create codex context entry
 */
function createCodexContextEntry(
  filePath: string,
  content: string,
): CodexContextEntry {
  const metadata = extractCodexMetadata(content);

  return {
    id: `strray-codex-${path.basename(filePath)}`,
    source: filePath,
    content,
    priority: "critical",
    metadata: {
      version: metadata.version,
      termCount: metadata.termCount,
      loadedAt: new Date().toISOString(),
    },
  };
}

/**
 * Load codex context (cached globally, loaded once)
 */
async function loadCodexContext(directory: string): Promise<CodexContextEntry[]> {
  if (cachedCodexContexts) {
    return cachedCodexContexts;
  }

  const codexContexts: CodexContextEntry[] = [];

  const locations = await getCodexFileLocations(directory);
  for (const fileLocation of locations) {
    const fullPath = path.isAbsolute(fileLocation) ? fileLocation : path.join(directory, fileLocation);
    const content = readFileContent(fullPath);

    if (content && content.trim().length > 0) {
      const entry = createCodexContextEntry(fullPath, content);
      if (entry.metadata.termCount > 0) {
        codexContexts.push(entry);
      }
    }
  }

  cachedCodexContexts = codexContexts;

  if (codexContexts.length === 0) {
    void getOrCreateLogger(directory).then((l) =>
      l.error(
        `No valid codex files found. Checked: ${locations.join(", ")}`,
      ),
    );
  }

  return codexContexts;
}

/**
 * Format codex context for injection
 */
function formatCodexContext(contexts: CodexContextEntry[]): string {
  if (contexts.length === 0) {
    return "";
  }

  const parts: string[] = [];

  for (const context of contexts) {
    parts.push(
      `# StrRay Codex Context v${context.metadata.version}`,
      `Source: ${context.source}`,
      `Terms Loaded: ${context.metadata.termCount}`,
      `Loaded At: ${context.metadata.loadedAt}`,
      "",
      context.content,
      "",
      "---",
      "",
    );
  }

  return parts.join("\n");
}

/**
 * Main plugin function
 *
 * This plugin hooks into experimental.chat.system.transform event
 * to inject codex terms into system prompt before it's sent to LLM.
 */

/** Inference tuning: run every N tool calls */
const INFERENCE_TUNE_INTERVAL = 100;
let _openCodeToolCallCount = 0;
let _lastTuneToolCallCount = 0;

/**
 * Map tool names to agent/skill identifiers for outcome tracking.
 * This lets the analytics pipeline correlate tool usage patterns
 * with agent routing effectiveness.
 */
const TOOL_AGENT_MAP: Record<string, { agent: string; skill: string }> = {
  write:     { agent: "code-reviewer", skill: "write" },
  edit:      { agent: "code-reviewer", skill: "edit" },
  multiedit: { agent: "code-reviewer", skill: "multiedit" },
  bash:      { agent: "testing-lead", skill: "execution" },
  search:    { agent: "researcher",    skill: "search" },
  read:      { agent: "researcher",    skill: "read" },
  glob:      { agent: "researcher",    skill: "glob" },
  grep:      { agent: "researcher",    skill: "search" },
  ls:        { agent: "researcher",    skill: "list" },
};

/**
 * Classify a tool call into a meaningful task type for analytics.
 * Mirrors _classify_task_type in the Hermes plugin so both plugins
 * produce comparable outcome data for the inference tuner.
 */
function classifyTaskType(tool: string, args?: Record<string, unknown>): string {
  const cmd = String(args?.command ?? "").toLowerCase().trim();

  if (tool === "bash" && cmd) {
    if (/(npm|yarn|pnpm)\s+test|jest|vitest|mocha|pytest/.test(cmd)) return "testing";
    if (/(npm|yarn|pnpm)\s+run|npx|cargo|go run|make\s/.test(cmd)) return "build";
    if (/audit|security|snyk|owasp|bandit/.test(cmd)) return "security";
    if (/eslint|prettier|black|ruff|lint|format/.test(cmd)) return "lint";
    if (/git\s/.test(cmd)) return "git";
    if (/(npm|yarn|pnpm)\s+install|pip install|cargo add/.test(cmd)) return "install";
    if (/grep|rg |find |ls |cat |head |tail /.test(cmd)) return "search";
  }

  if (tool === "write") return "write";
  if (tool === "edit" || tool === "multiedit") return "edit";
  if (tool === "read") return "read";
  if (tool === "search" || tool === "grep" || tool === "glob") return "search";

  return "unknown";
}

export default async function strrayCodexPlugin(input: {
  client?: string;
  directory?: string;
  worktree?: string;
}) {
  const { directory: inputDirectory } = input;
  const directory = inputDirectory || process.cwd();

  return {
    "experimental.chat.system.transform": async (
      _input: Record<string, unknown>,
      output: { system?: string[] },
    ) => {
      try {
        // Use lean system prompt generator for token efficiency
        await importSystemPromptGenerator();
        
        let leanPrompt = getFrameworkIdentity();

        // Use lean generator if available, otherwise fall back to minimal logic
        if (SystemPromptGenerator) {
          leanPrompt = await SystemPromptGenerator({
            showWelcomeBanner: true,
            showCodexContext: false,  // Disabled for token efficiency
            enableTokenOptimization: true,
            maxTokenBudget: 3000,     // Conservative token budget
            showCriticalTermsOnly: true,
            showEssentialLinks: true
          });
        }

        if (output.system && Array.isArray(output.system)) {
          // Replace verbose system prompt with lean version
          output.system = [leanPrompt];
        }
      } catch (error) {
        // Critical failure - log error but don't break the plugin
        const logger = await getOrCreateLogger(directory);
        logger.error("System prompt injection failed:", error);
        // Fallback to minimal prompt
        const fallback = getFrameworkIdentity();
        if (output.system && Array.isArray(output.system)) {
          output.system = [fallback];
        }
      }
    },

    "tool.execute.before": async (
      input: {
        tool: string;
        args?: { content?: string; filePath?: string };
      },
      output: any,
    ) => {
      const logger = await getOrCreateLogger(directory);
      logger.log(`🚀 TOOL EXECUTE BEFORE HOOK FIRED: ${input.tool}`);
      logger.log(`📥 Full input: ${JSON.stringify(input)}`);
      await loadStrRayComponents();

      if (featuresConfigLoader && detectTaskType) {
        try {
          const config = featuresConfigLoader.loadConfig();
          if (config.model_routing?.enabled) {
            const taskType = detectTaskType(input.tool);
            const routing = config.model_routing.task_routing?.[taskType];
            if (routing?.model) {
              output.model = routing.model;
              logger.log(
                `Model routed: ${input.tool} → ${taskType} → ${routing.model}`,
              );
            }
          }
        } catch (e) {
          logger.error("Model routing error", e);
        }
      }

      const { tool, args } = input;

      // ENFORCER QUALITY GATE CHECK - Block on violations
      const qualityGateResult = await runEnforcerQualityGate(input, logger);
      if (!qualityGateResult.passed) {
        logger.error(
          `🚫 Quality gate failed: ${qualityGateResult.violations.join(", ")}`,
        );
        throw new Error(
          `ENFORCER BLOCKED: ${qualityGateResult.violations.join("; ")}`,
        );
      }
      logger.log(`✅ Quality gate passed for ${tool}`);

      if (["write", "edit", "multiedit"].includes(tool)) {
        if (!ProcessorManager || !StrRayStateManager) {
          logger.error("ProcessorManager or StrRayStateManager not loaded");
          return;
        }

        // PHASE 1: Connect to booted framework or boot if needed
        let stateManager: any;
        let processorManager: any;

        // Check if framework is already booted (global state exists)
        const globalState = (globalThis as any).strRayStateManager;
        if (globalState) {
          logger.log("🔗 Connecting to booted StrRay framework");
          stateManager = globalState;
        } else {
          logger.log("🚀 StrRay framework not booted, initializing...");
          // Create new state manager (framework not booted yet)
          stateManager = new StrRayStateManager(
            await resolveStateDir(directory),
          );
          // Store globally for future use
          (globalThis as any).strRayStateManager = stateManager;
        }

        // Get processor manager from state
        processorManager = stateManager.get("processor:manager");

        if (!processorManager) {
          logger.log("⚙️ Creating and registering processors...");
          processorManager = new ProcessorManager(stateManager);

          // Register the same processors as boot-orchestrator
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
          processorManager.registerProcessor({
            name: "testAutoCreation",
            type: "post",
            priority: 5, // FIX: Run BEFORE testExecution so tests exist when we run them
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

          // Store for future use
          stateManager.set("processor:manager", processorManager);
          logger.log("✅ Processors registered successfully");
        } else {
          logger.log("✅ Using existing processor manager");
        }

        // PHASE 2: Execute pre-processors with detailed logging
        try {
          logger.log(`▶️ Executing pre-processors for ${tool}...`);
          const result = await processorManager.executePreProcessors({
            tool,
            args,
            context: {
              directory,
              operation: "tool_execution",
              filePath: args?.filePath,
            },
          });

          logger.log(
            `📊 Pre-processor result: ${result.success ? "SUCCESS" : "FAILED"} (${result.results?.length || 0} processors)`,
          );

          if (!result.success) {
            const failures =
              result.results?.filter((r: any) => !r.success) || [];
            failures.forEach((f: any) => {
              logger.error(
                `❌ Pre-processor ${f.processorName} failed: ${f.error}`,
              );
            });
          } else {
            result.results?.forEach((r: any) => {
              logger.log(
                `✅ Pre-processor ${r.processorName}: ${r.success ? "OK" : "FAILED"}`,
              );
            });
          }
        } catch (error) {
          logger.error(`💥 Pre-processor execution error`, error);
        }

        // PHASE 3: Execute post-processors after tool completion
        try {
          logger.log(`▶️ Executing post-processors for ${tool}...`);
          logger.log(`📝 Post-processor args: ${JSON.stringify(args)}`);
          const postResults = await processorManager.executePostProcessors(
            tool,
            {
              directory,
              operation: "tool_execution",
              filePath: args?.filePath,
              success: true,
            },
            [],
          );

          // postResults is an array of ProcessorResult
          const allSuccess = postResults.every((r: any) => r.success);
          logger.log(
            `📊 Post-processor result: ${allSuccess ? "SUCCESS" : "FAILED"} (${postResults.length} processors)`,
          );

          // Log each post-processor result for debugging
          for (const r of postResults) {
            if (r.success) {
              logger.log(`✅ Post-processor ${r.processorName}: OK`);
            } else {
              logger.error(
                `❌ Post-processor ${r.processorName} failed: ${r.error}`,
              );
            }
          }
        } catch (error) {
          logger.error(`💥 Post-processor execution error`, error);
        }
      }
    },

    // Execute POST-processors AFTER tool completes (this is the correct place!)
    "tool.execute.after": async (
      input: {
        tool: string;
        args?: { content?: string; filePath?: string };
        result?: any;
      },
      _output: any,
    ) => {
      const logger = await getOrCreateLogger(directory);
      await loadStrRayComponents();

      const { tool, args, result } = input;

      // Record routing outcome for analytics pipeline.
      // This feeds the inference tuner with real tool usage data so it
      // can refine keyword mappings and improve predictive analytics.
      try {
        const { routingOutcomeTracker } = await import(
          "../delegation/analytics/outcome-tracker.js"
        );
        const mapping = TOOL_AGENT_MAP[tool];
        const taskType = classifyTaskType(tool, args as Record<string, unknown> | undefined);
        const rawDesc = args?.content
          ? String(args.content).slice(0, 150)
          : args?.filePath
            ? String(args.filePath)
            : (args as Record<string, unknown>)?.command
              ? String((args as Record<string, unknown>).command).slice(0, 150)
              : tool;
        const description = `[${taskType}] ${rawDesc}`;
        const outcomeFields: Record<string, unknown> = {
          taskId: `opencode-${_openCodeToolCallCount}`,
          taskDescription: description,
          routedAgent: mapping?.agent ?? "direct",
          routedSkill: mapping?.skill ?? tool,
          confidence: mapping ? 0.8 : 0.5,
          success: result?.error == null,
          routingMethod: mapping ? "keyword" : "default",
        };
        if (taskType !== "unknown") outcomeFields.taskType = taskType;
        routingOutcomeTracker.recordOutcome(
          outcomeFields as Parameters<typeof routingOutcomeTracker.recordOutcome>[0]
        );
      } catch {
        // Outcome tracker not available — skip silently
      }

      // Debug: log full input
      logger.log(
        `📥 After hook input: ${JSON.stringify({ tool, hasArgs: !!args, args, hasResult: !!result }).slice(0, 200)}`,
      );

      // Run post-processors for write/edit operations AFTER tool completes
      if (["write", "edit", "multiedit"].includes(tool)) {
        if (!ProcessorManager || !StrRayStateManager) return;

        const stateManager = new StrRayStateManager(
          await resolveStateDir(directory),
        );
        const processorManager = new ProcessorManager(stateManager);

        // Register post-processors
        processorManager.registerProcessor({
          name: "testAutoCreation",
          type: "post",
          priority: 50,
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

        try {
          // Execute post-processors AFTER tool - with actual filePath for testAutoCreation
          logger.log(`📝 Post-processor tool: ${tool}`);
          logger.log(`📝 Post-processor args: ${JSON.stringify(args)}`);
          logger.log(`📝 Post-processor directory: ${directory}`);

          const postResults = await processorManager.executePostProcessors(
            tool,
            {
              directory,
              operation: "tool_execution",
              filePath: args?.filePath,
              success: result?.success !== false,
            },
            [],
          );

          // postResults is an array of ProcessorResult
          const allSuccess = postResults.every((r: any) => r.success);
          logger.log(
            `📊 Post-processor result: ${allSuccess ? "SUCCESS" : "FAILED"} (${postResults.length} processors)`,
          );

          // Log each post-processor result for debugging
          for (const r of postResults) {
            if (r.success) {
              logger.log(`✅ Post-processor ${r.processorName}: OK`);
            } else {
              logger.error(
                `❌ Post-processor ${r.processorName} failed: ${r.error}`,
              );
            }
          }

          // Log testAutoCreation results specifically
          const testAutoResult = postResults.find(
            (r: any) => r.processorName === "testAutoCreation",
          );
          if (testAutoResult) {
            if (testAutoResult.success && testAutoResult.testCreated) {
              logger.log(
                `✅ TEST AUTO-CREATION: Created ${testAutoResult.testFile}`,
              );
            } else if (!testAutoResult.success) {
              logger.log(
                `ℹ️ TEST AUTO-CREATION: ${testAutoResult.message || "skipped - no new files"}`,
              );
            }
          }
        } catch (error) {
          logger.error(`💥 Post-processor error`, error);
        }
      }

      // Auto inference tuning: every INFERENCE_TUNE_INTERVAL tool calls,
      // run a single tuning cycle to close the feedback loop.
      _openCodeToolCallCount++;
      if (
        _openCodeToolCallCount - _lastTuneToolCallCount >= INFERENCE_TUNE_INTERVAL
      ) {
        _lastTuneToolCallCount = _openCodeToolCallCount;
        try {
          const { inferenceTuner } = await import(
            "../services/inference-tuner.js"
          );
          inferenceTuner
            .runTuningCycle()
            .then(() => {
              logger.log(
                `🔄 Inference tuning cycle completed (call #${_openCodeToolCallCount})`,
              );
            })
            .catch((err: unknown) => {
              logger.log(
                `⚠️ Inference tuning cycle skipped: ${err instanceof Error ? err.message : String(err)}`,
              );
            });
        } catch {
          // Tuner not available in this environment — skip silently
        }
      }
    },

    config: async (_config: Record<string, unknown>) => {
      // Guard: only run init.sh once per startup session
      // OpenCode may fire the config hook multiple times in fresh contexts
      // where globalThis is reset, so we use a TTL lockfile
      const lockFile = path.join(directory, ".opencode", "logs", ".strray-init.lock");
      const now = Date.now();
      try {
        if (fs.existsSync(lockFile)) {
          const stat = fs.statSync(lockFile);
          if (now - stat.mtimeMs < 15000) {
            return; // already ran within 15s window
          }
        }
        fs.writeFileSync(lockFile, String(now));
      } catch {
        // lock check failed — proceed anyway
      }

      const logger = await getOrCreateLogger(directory);
      logger.log(
        "🔧 Plugin config hook triggered - initializing StrRay integration",
      );

      // Initialize StrRay framework
      // Primary: project .opencode/init.sh (copied by postinstall)
      // Fallback: package .opencode/init.sh (works when postinstall skips for Hermes consumers)
      let initScriptPath = path.join(directory, ".opencode", "init.sh");
      const pkgInitPath = path.join(directory, "node_modules", "strray-ai", ".opencode", "init.sh");
      if (!fs.existsSync(initScriptPath) && fs.existsSync(pkgInitPath)) {
        initScriptPath = pkgInitPath;
      }
      if (fs.existsSync(initScriptPath)) {
        try {
          const { stderr } = await spawnPromise(
            "bash",
            [initScriptPath],
            directory,
          );

          if (stderr) {
            logger.error(`Framework init error: ${stderr}`);
          } else {
            logger.log("✅ StrRay Framework initialized successfully");
          }
        } catch (error: unknown) {
          logger.error("Framework initialization failed", error);
        }
      }

      logger.log("✅ Plugin config hook completed");
    },
  };
}
