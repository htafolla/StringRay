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
let ProcessorManager;
let StrRayStateManager;
let featuresConfigLoader;
let detectTaskType;
async function loadStrRayComponents() {
    if (ProcessorManager && StrRayStateManager && featuresConfigLoader)
        return;
    const logger = await getOrCreateLogger(process.cwd());
    // Try local dist first (for development)
    try {
        logger.log(`🔄 Attempting to load from ../../dist/`);
        const procModule = await import("../../dist/processors/processor-manager.js");
        const stateModule = await import("../../dist/state/state-manager.js");
        const featuresModule = await import("../../dist/core/features-config.js");
        ProcessorManager = procModule.ProcessorManager;
        StrRayStateManager = stateModule.StrRayStateManager;
        featuresConfigLoader = featuresModule.featuresConfigLoader;
        detectTaskType = featuresModule.detectTaskType;
        logger.log(`✅ Loaded from ../../dist/`);
        return;
    }
    catch (e) {
        logger.error(`❌ Failed to load from ../../dist/: ${e?.message || e}`);
    }
    // Try node_modules (for consumer installation)
    const pluginPaths = ["strray-ai", "strray-framework"];
    for (const pluginPath of pluginPaths) {
        try {
            logger.log(`🔄 Attempting to load from ../../node_modules/${pluginPath}/dist/`);
            const pm = await import(`../../node_modules/${pluginPath}/dist/processors/processor-manager.js`);
            const sm = await import(`../../node_modules/${pluginPath}/dist/state/state-manager.js`);
            const fm = await import(`../../node_modules/${pluginPath}/dist/core/features-config.js`);
            ProcessorManager = pm.ProcessorManager;
            StrRayStateManager = sm.StrRayStateManager;
            featuresConfigLoader = fm.featuresConfigLoader;
            detectTaskType = fm.detectTaskType;
            logger.log(`✅ Loaded from ../../node_modules/${pluginPath}/dist/`);
            return;
        }
        catch (e) {
            logger.error(`❌ Failed to load from ../../node_modules/${pluginPath}/dist/: ${e?.message || e}`);
            continue;
        }
    }
}
function spawnPromise(command, args, cwd) {
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
            }
            else {
                reject(new Error(`Process exited with code ${code}: ${stderr}`));
            }
        });
        child.on("error", (error) => {
            reject(error);
        });
    });
}
class PluginLogger {
    logPath;
    constructor(directory) {
        const logsDir = path.join(directory, ".opencode", "logs");
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const today = new Date().toISOString().split("T")[0];
        this.logPath = path.join(logsDir, `strray-plugin-${today}.log`);
    }
    async logAsync(message) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}\n`;
            await fs.promises.appendFile(this.logPath, logEntry, "utf-8");
        }
        catch (error) {
            // Silent fail - logging failure should not break plugin
        }
    }
    log(message) {
        void this.logAsync(message);
    }
    error(message, error) {
        const errorDetail = error instanceof Error ? `: ${error.message}` : "";
        this.log(`ERROR: ${message}${errorDetail}`);
    }
}
let loggerInstance = null;
let loggerInitPromise = null;
async function getOrCreateLogger(directory) {
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
function getFrameworkVersion() {
    try {
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        return packageJson.version || "1.4.6";
    }
    catch {
        return "1.4.6";
    }
}
/**
 * Get framework identity message for injection
 */
function getFrameworkIdentity() {
    const version = getFrameworkVersion();
    return `╔══════════════════════════════════════════════════════════════╗
║         ⚡ StringRay Framework v${version} Successfully Loaded ⚡         ║
╠══════════════════════════════════════════════════════════════╣
║  You are running under StringRay AI Orchestration Framework  ║
║                                                              ║
║  🔹 25 Specialized Agents: enforcer, architect, orchestrator ║
║     bug-triage-specialist, code-reviewer, security-auditor  ║
║     refactorer, testing-lead, researcher                    ║
║                                                              ║
║  🔹 15 MCP Servers: Skill servers, framework tools          ║
║                                                              ║
║  🔹 59-Term Universal Development Codex (99.6% prevention)  ║
║                                                              ║
║  📖 Key Documentation:                                       ║
║     • AGENTS.md - Complete agent capabilities & usage       ║
║     • .opencode/strray/codex.json - Development rules       ║
║     • .opencode/strray/config.json - Framework configuration ║
╚══════════════════════════════════════════════════════════════╝`;
}
/**
 * Run Enforcer quality gate check before operations
 */
async function runEnforcerQualityGate(input, logger) {
    const violations = [];
    const { tool, args } = input;
    // Rule 1: tests-required for new files
    if (tool === "write" && args?.filePath) {
        const filePath = args.filePath;
        // Check if this is a source file (not test, not config)
        if (filePath.endsWith(".ts") &&
            !filePath.includes(".test.") &&
            !filePath.includes(".spec.")) {
            // Check if test file exists
            const testPath = filePath.replace(".ts", ".test.ts");
            const specPath = filePath.replace(".ts", ".spec.ts");
            if (!fs.existsSync(testPath) && !fs.existsSync(specPath)) {
                violations.push(`tests-required: No test file found for ${filePath} (expected ${testPath} or ${specPath})`);
                logger.log(`⚠️ ENFORCER: tests-required violation detected for ${filePath}`);
            }
        }
    }
    // Rule 2: documentation-required for new features
    if (tool === "write" && args?.filePath?.includes("src/")) {
        const docsDir = path.join(process.cwd(), "docs");
        const readmePath = path.join(process.cwd(), "README.md");
        // Check if docs directory exists
        if (!fs.existsSync(docsDir) && !fs.existsSync(readmePath)) {
            violations.push(`documentation-required: No documentation found for new feature`);
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
                violations.push(`resolve-all-errors: Found debug/error pattern (${pattern.source}) in code`);
                logger.log(`⚠️ ENFORCER: resolve-all-errors violation detected`);
                break;
            }
        }
    }
    const passed = violations.length === 0;
    if (!passed) {
        logger.error(`🚫 Quality Gate FAILED with ${violations.length} violations`);
    }
    else {
        logger.log(`✅ Quality Gate PASSED`);
    }
    return { passed, violations };
}
/**
 * Global codex context cache (loaded once)
 */
let cachedCodexContexts = null;
/**
 * Codex file locations to search
 */
const CODEX_FILE_LOCATIONS = [
    ".opencode/strray/codex.json",
    ".opencode/codex.codex",
    ".opencode/strray/agents_template.md",
    "AGENTS.md"
];
/**
 * Read file content safely
 */
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, "utf-8");
    }
    catch (error) {
        const logger = new PluginLogger(process.cwd());
        logger.error(`Failed to read file ${filePath}`, error);
        return null;
    }
}
/**
 * Extract codex metadata from content
 */
function extractCodexMetadata(content) {
    // Try JSON format first (codex.json)
    if (content.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(content);
            const version = parsed.version || "1.6.0";
            const terms = parsed.terms || {};
            const termCount = Object.keys(terms).length;
            return { version, termCount };
        }
        catch {
            // Not valid JSON, try markdown format
        }
    }
    // Markdown format (AGENTS.md, .strray/agents_template.md)
    const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
    const version = versionMatch && versionMatch[1] ? versionMatch[1] : "1.6.0";
    const termMatches = content.match(/####\s*\d+\.\s/g);
    const termCount = termMatches ? termMatches.length : 0;
    return { version, termCount };
}
/**
 * Create codex context entry
 */
function createCodexContextEntry(filePath, content) {
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
function loadCodexContext(directory) {
    if (cachedCodexContexts) {
        return cachedCodexContexts;
    }
    const codexContexts = [];
    for (const relativePath of CODEX_FILE_LOCATIONS) {
        const fullPath = path.join(directory, relativePath);
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
        void getOrCreateLogger(directory).then((l) => l.error(`No valid codex files found. Checked: ${CODEX_FILE_LOCATIONS.join(", ")}`));
    }
    return codexContexts;
}
/**
 * Format codex context for injection
 */
function formatCodexContext(contexts) {
    if (contexts.length === 0) {
        return "";
    }
    const parts = [];
    for (const context of contexts) {
        parts.push(`# StrRay Codex Context v${context.metadata.version}`, `Source: ${context.source}`, `Terms Loaded: ${context.metadata.termCount}`, `Loaded At: ${context.metadata.loadedAt}`, "", context.content, "", "---", "");
    }
    return parts.join("\n");
}
/**
 * Main plugin function
 *
 * This plugin hooks into experimental.chat.system.transform event
 * to inject codex terms into system prompt before it's sent to LLM.
 */
export default async function strrayCodexPlugin(input) {
    const { directory: inputDirectory } = input;
    const directory = inputDirectory || process.cwd();
    return {
        "experimental.chat.system.transform": async (_input, output) => {
            const codexContexts = loadCodexContext(directory);
            if (codexContexts.length === 0) {
                const logger = await getOrCreateLogger(directory);
                logger.error(`No codex files found. Checked: ${CODEX_FILE_LOCATIONS.join(", ")}`);
                return;
            }
            const formattedCodex = formatCodexContext(codexContexts);
            const welcomeMessage = getFrameworkIdentity();
            if (output.system && Array.isArray(output.system)) {
                output.system.unshift(welcomeMessage, formattedCodex);
            }
        },
        "tool.execute.before": async (input, output) => {
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
                            logger.log(`Model routed: ${input.tool} → ${taskType} → ${routing.model}`);
                        }
                    }
                }
                catch (e) {
                    logger.error("Model routing error", e);
                }
            }
            const { tool, args } = input;
            // ENFORCER QUALITY GATE CHECK - Block on violations
            const qualityGateResult = await runEnforcerQualityGate(input, logger);
            if (!qualityGateResult.passed) {
                logger.error(`🚫 Quality gate failed: ${qualityGateResult.violations.join(", ")}`);
                throw new Error(`ENFORCER BLOCKED: ${qualityGateResult.violations.join("; ")}`);
            }
            logger.log(`✅ Quality gate passed for ${tool}`);
            if (["write", "edit", "multiedit"].includes(tool)) {
                if (!ProcessorManager || !StrRayStateManager) {
                    logger.error("ProcessorManager or StrRayStateManager not loaded");
                    return;
                }
                // PHASE 1: Connect to booted framework or boot if needed
                let stateManager;
                let processorManager;
                // Check if framework is already booted (global state exists)
                const globalState = globalThis.strRayStateManager;
                if (globalState) {
                    logger.log("🔗 Connecting to booted StrRay framework");
                    stateManager = globalState;
                }
                else {
                    logger.log("🚀 StrRay framework not booted, initializing...");
                    // Create new state manager (framework not booted yet)
                    stateManager = new StrRayStateManager(path.join(directory, ".opencode", "state"));
                    // Store globally for future use
                    globalThis.strRayStateManager = stateManager;
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
                        type: "post", // FIX #3: Tests should be created AFTER source files
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
                    // Store for future use
                    stateManager.set("processor:manager", processorManager);
                    logger.log("✅ Processors registered successfully");
                }
                else {
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
                    logger.log(`📊 Pre-processor result: ${result.success ? "SUCCESS" : "FAILED"} (${result.results?.length || 0} processors)`);
                    if (!result.success) {
                        const failures = result.results?.filter((r) => !r.success) || [];
                        failures.forEach((f) => {
                            logger.error(`❌ Pre-processor ${f.processorName} failed: ${f.error}`);
                        });
                    }
                    else {
                        result.results?.forEach((r) => {
                            logger.log(`✅ Pre-processor ${r.processorName}: ${r.success ? "OK" : "FAILED"}`);
                        });
                    }
                }
                catch (error) {
                    logger.error(`💥 Pre-processor execution error`, error);
                }
                // PHASE 3: Execute post-processors after tool completion
                try {
                    logger.log(`▶️ Executing post-processors for ${tool}...`);
                    logger.log(`📝 Post-processor args: ${JSON.stringify(args)}`);
                    const postResults = await processorManager.executePostProcessors(tool, {
                        directory,
                        operation: "tool_execution",
                        filePath: args?.filePath,
                        success: true,
                    }, []);
                    // postResults is an array of ProcessorResult
                    const allSuccess = postResults.every((r) => r.success);
                    logger.log(`📊 Post-processor result: ${allSuccess ? "SUCCESS" : "FAILED"} (${postResults.length} processors)`);
                    // Log each post-processor result for debugging
                    for (const r of postResults) {
                        if (r.success) {
                            logger.log(`✅ Post-processor ${r.processorName}: OK`);
                        }
                        else {
                            logger.error(`❌ Post-processor ${r.processorName} failed: ${r.error}`);
                        }
                    }
                }
                catch (error) {
                    logger.error(`💥 Post-processor execution error`, error);
                }
            }
        },
        // Execute POST-processors AFTER tool completes (this is the correct place!)
        "tool.execute.after": async (input, _output) => {
            const logger = await getOrCreateLogger(directory);
            await loadStrRayComponents();
            const { tool, args, result } = input;
            // Debug: log full input
            logger.log(`📥 After hook input: ${JSON.stringify({ tool, hasArgs: !!args, args, hasResult: !!result }).slice(0, 200)}`);
            // Run post-processors for write/edit operations AFTER tool completes
            if (["write", "edit", "multiedit"].includes(tool)) {
                if (!ProcessorManager || !StrRayStateManager)
                    return;
                const stateManager = new StrRayStateManager(path.join(directory, ".opencode", "state"));
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
                    const postResults = await processorManager.executePostProcessors(tool, {
                        directory,
                        operation: "tool_execution",
                        filePath: args?.filePath,
                        success: result?.success !== false,
                    }, []);
                    // postResults is an array of ProcessorResult
                    const allSuccess = postResults.every((r) => r.success);
                    logger.log(`📊 Post-processor result: ${allSuccess ? "SUCCESS" : "FAILED"} (${postResults.length} processors)`);
                    // Log each post-processor result for debugging
                    for (const r of postResults) {
                        if (r.success) {
                            logger.log(`✅ Post-processor ${r.processorName}: OK`);
                        }
                        else {
                            logger.error(`❌ Post-processor ${r.processorName} failed: ${r.error}`);
                        }
                    }
                    // Log testAutoCreation results specifically
                    const testAutoResult = postResults.find((r) => r.processorName === "testAutoCreation");
                    if (testAutoResult) {
                        if (testAutoResult.success && testAutoResult.testCreated) {
                            logger.log(`✅ TEST AUTO-CREATION: Created ${testAutoResult.testFile}`);
                        }
                        else if (!testAutoResult.success) {
                            logger.log(`ℹ️ TEST AUTO-CREATION: ${testAutoResult.message || "skipped - no new files"}`);
                        }
                    }
                }
                catch (error) {
                    logger.error(`💥 Post-processor error`, error);
                }
            }
        },
        config: async (_config) => {
            const logger = await getOrCreateLogger(directory);
            logger.log("🔧 Plugin config hook triggered - initializing StrRay integration");
            // Initialize StrRay framework
            const initScriptPath = path.join(directory, ".opencode", "init.sh");
            if (fs.existsSync(initScriptPath)) {
                try {
                    const { stderr } = await spawnPromise("bash", [initScriptPath], directory);
                    if (stderr) {
                        logger.error(`Framework init error: ${stderr}`);
                    }
                    else {
                        logger.log("✅ StrRay Framework initialized successfully");
                    }
                }
                catch (error) {
                    logger.error("Framework initialization failed", error);
                }
            }
            logger.log("✅ Plugin config hook completed");
        },
    };
}
//# sourceMappingURL=strray-codex-injection.js.map