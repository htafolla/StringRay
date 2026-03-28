/**
 * StrRay Codex Injection Plugin for OpenCode
 *
 * This plugin automatically injects the Universal Development Codex
 * into the system prompt for all AI agents, ensuring codex terms are
 * consistently enforced across the entire development session.
 *
 * @author StrRay Framework
 */
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
// Dynamic imports with absolute paths at runtime
let runQualityGateWithLogging;
let qualityGateDirectory = "";
async function importQualityGate(directory) {
    if (!runQualityGateWithLogging || qualityGateDirectory !== directory) {
        try {
            const qualityGatePath = path.join(directory, "dist", "plugin", "quality-gate.js");
            const module = await import(qualityGatePath);
            runQualityGateWithLogging = module.runQualityGateWithLogging;
            qualityGateDirectory = directory;
        }
        catch (e) {
            // Quality gate not available
        }
    }
}
// Direct activity logging - writes to activity.log without module isolation issues
let activityLogPath = "";
let activityLogInitialized = false;
function initializeActivityLog(directory) {
    if (activityLogInitialized && activityLogPath)
        return;
    const logDir = path.join(directory, "logs", "framework");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    // Use a separate file for plugin tool events to avoid framework overwrites
    activityLogPath = path.join(logDir, "plugin-tool-events.log");
    activityLogInitialized = true;
}
function logToolActivity(directory, eventType, tool, args, result, error, duration) {
    initializeActivityLog(directory);
    const timestamp = new Date().toISOString();
    const jobId = `plugin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    if (eventType === "start") {
        const entry = `${timestamp} [${jobId}] [agent] tool-started - INFO | {"tool":"${tool}","args":${JSON.stringify(Object.keys(args || {}))}}\n`;
        fs.appendFileSync(activityLogPath, entry);
    }
    else if (eventType === "routing") {
        const entry = `${timestamp} [${jobId}] [agent] routing-detected - INFO | {"tool":"${tool}","routing":${JSON.stringify(args)}}\n`;
        fs.appendFileSync(activityLogPath, entry);
    }
    else {
        const success = !error;
        const level = success ? "SUCCESS" : "ERROR";
        const entry = `${timestamp} [${jobId}] [agent] tool-${success ? "complete" : "failed"} - ${level} | {"tool":"${tool}","duration":${duration || 0}${error ? `,"error":"${error}"` : ""}}\n`;
        fs.appendFileSync(activityLogPath, entry);
    }
}
// Import lean system prompt generator
let SystemPromptGenerator;
async function importSystemPromptGenerator() {
    if (!SystemPromptGenerator) {
        try {
            const module = await import("../core/system-prompt-generator.js");
            SystemPromptGenerator = module.generateLeanSystemPrompt;
        }
        catch (e) {
            // Fallback to original implementation - silent fail
        }
    }
}
let ProcessorManager;
let StrRayStateManager;
let featuresConfigLoader;
let detectTaskType;
let TaskSkillRouter;
let taskSkillRouterInstance;
async function loadStrRayComponents() {
    if (ProcessorManager && StrRayStateManager && featuresConfigLoader) {
        return;
    }
    const tempLogger = await getOrCreateLogger(process.cwd());
    tempLogger.log(`[StrRay] 🔄 loadStrRayComponents() called - attempting to load framework components`);
    // Try local dist first (for development)
    try {
        tempLogger.log(`[StrRay] 🔄 Attempting to load from ../../dist/`);
        const procModule = await import("../../dist/processors/processor-manager.js");
        const stateModule = await import("../../dist/state/state-manager.js");
        const featuresModule = await import("../../dist/core/features-config.js");
        ProcessorManager = procModule.ProcessorManager;
        StrRayStateManager = stateModule.StrRayStateManager;
        featuresConfigLoader = featuresModule.featuresConfigLoader;
        detectTaskType = featuresModule.detectTaskType;
        tempLogger.log(`[StrRay] ✅ Loaded from ../../dist/`);
        return;
    }
    catch (e) {
        tempLogger.error(`[StrRay] ❌ Failed to load from ../../dist/: ${e?.message || e}`);
    }
    // Try node_modules (for consumer installation)
    const pluginPaths = ["strray-ai", "strray-framework"];
    for (const pluginPath of pluginPaths) {
        try {
            tempLogger.log(`[StrRay] 🔄 Attempting to load from ../../node_modules/${pluginPath}/dist/`);
            const pm = await import(`../../node_modules/${pluginPath}/dist/processors/processor-manager.js`);
            const sm = await import(`../../node_modules/${pluginPath}/dist/state/state-manager.js`);
            const fm = await import(`../../node_modules/${pluginPath}/dist/core/features-config.js`);
            ProcessorManager = pm.ProcessorManager;
            StrRayStateManager = sm.StrRayStateManager;
            featuresConfigLoader = fm.featuresConfigLoader;
            detectTaskType = fm.detectTaskType;
            tempLogger.log(`[StrRay] ✅ Loaded from ../../node_modules/${pluginPath}/dist/`);
            return;
        }
        catch (e) {
            tempLogger.error(`[StrRay] ❌ Failed to load from ../../node_modules/${pluginPath}/dist/: ${e?.message || e}`);
            continue;
        }
    }
    tempLogger.error(`[StrRay] ❌ Could not load StrRay components from any path`);
}
/**
 * Extract task description from tool input
 */
function extractTaskDescription(input) {
    const { tool, args } = input;
    // Extract meaningful task description from various inputs
    if (args?.content) {
        const content = String(args.content);
        // Get first 200 chars as description
        return content.slice(0, 200);
    }
    if (args?.filePath) {
        return `${tool} ${args.filePath}`;
    }
    if (args?.command) {
        return String(args.command);
    }
    // Fallback: Use tool name as task description for routing
    // This enables routing even when OpenCode doesn't pass args
    if (tool) {
        return `execute ${tool} tool`;
    }
    return null;
}
/**
 * Extract action words from command for better routing
 * Maps verbs/intents to skill categories
 */
function extractActionWords(command) {
    if (!command || command.length < 3)
        return null;
    // Strip quotes and escape sequences for cleaner matching
    const cleanCommand = command.replace(/["']/g, ' ').replace(/\\./g, ' ');
    // Action word -> skill mapping (ordered by priority)
    const actionMap = [
        // Review patterns - check first since user likely wants to review content
        { pattern: /\b(review|check|audit|examine|inspect|assess|evaluate)\b/i, skill: "code-review" },
        // Analyze patterns  
        { pattern: /\b(analyze|investigate|study)\b/i, skill: "code-analyzer" },
        // Fix patterns
        { pattern: /\b(fix|debug|resolve|troubleshoot|repair)\b/i, skill: "bug-triage" },
        // Create patterns
        { pattern: /\b(create|write|generate|build|make|add)\b/i, skill: "content-creator" },
        // Test patterns
        { pattern: /\b(test|validate|verify)\b/i, skill: "testing" },
        // Design patterns
        { pattern: /\b(design|plan|architect)\b/i, skill: "architecture" },
        // Optimize patterns
        { pattern: /\b(optimize|improve|enhance|speed)\b/i, skill: "performance" },
        // Security patterns
        { pattern: /\b(scan|secure|vulnerability)\b/i, skill: "security" },
        // Refactor patterns
        { pattern: /\b(refactor|clean|restructure)\b/i, skill: "refactoring" },
    ];
    // Search for action words anywhere in the command
    for (const { pattern } of actionMap) {
        const match = cleanCommand.match(pattern);
        if (match) {
            // Return the matched word plus context after it
            const word = match[0];
            const idx = cleanCommand.toLowerCase().indexOf(word.toLowerCase());
            const after = cleanCommand.slice(idx + word.length, Math.min(idx + word.length + 25, cleanCommand.length)).trim();
            return `${word} ${after}`.trim().slice(0, 40);
        }
    }
    // If no action word found, return null to use default routing
    return null;
}
/**
 * Estimate complexity score based on message content
 * Higher complexity = orchestrator routing
 * Lower complexity = code-reviewer routing
 */
function estimateComplexity(message) {
    const text = message.toLowerCase();
    // High complexity indicators
    const highComplexityKeywords = [
        "architecture", "system", "design", "complex", "multiple",
        "integrate", "database", "migration", "refactor",
        "performance", "optimize", "security", "audit",
        "orchestrate", "coordinate", "workflow"
    ];
    // Low complexity indicators  
    const lowComplexityKeywords = [
        "review", "check", "simple", "quick", "fix",
        "small", "typo", "format", "lint", "test"
    ];
    let score = 50; // default medium
    // Check message length
    if (message.length > 200)
        score += 10;
    if (message.length > 500)
        score += 15;
    // Check for high complexity keywords
    for (const keyword of highComplexityKeywords) {
        if (text.includes(keyword))
            score += 8;
    }
    // Check for low complexity keywords
    for (const keyword of lowComplexityKeywords) {
        if (text.includes(keyword))
            score -= 5;
    }
    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
}
async function loadTaskSkillRouter() {
    if (taskSkillRouterInstance) {
        return; // Already loaded
    }
    // Try local dist first (for development)
    try {
        const module = await import("../../dist/delegation/task-skill-router.js");
        TaskSkillRouter = module.TaskSkillRouter;
        taskSkillRouterInstance = new TaskSkillRouter();
    }
    catch (distError) {
        // Try node_modules (for consumer installs)
        try {
            const module = await import("strray-ai/dist/delegation/task-skill-router.js");
            TaskSkillRouter = module.TaskSkillRouter;
            taskSkillRouterInstance = new TaskSkillRouter();
        }
        catch (nmError) {
            // Task routing not available - continue without it
        }
    }
}
function spawnPromise(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        if (child.stdout) {
            child.stdout.on("data", (data) => {
                const text = data.toString();
                stdout += text;
                process.stdout.write(text);
            });
        }
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
 * Get lean framework identity message (token-efficient version)
 */
function getFrameworkIdentity() {
    const version = getFrameworkVersion();
    return `StringRay Framework v${version} - AI Orchestration

🔧 Core: enforcer, architect, orchestrator, code-reviewer, refactorer, testing-lead
📚 Codex: 5 Essential Terms (99.6% Error Prevention Target)
🎯 Goal: Progressive, production-ready development workflow

📖 Documentation: .opencode/strray/ (codex, config, agents docs)
`;
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
    "AGENTS.md",
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
    if (content.trim().startsWith("{")) {
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
    // Markdown format (AGENTS.md, .opencode/strray/agents_template.md)
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
 *
 * OpenCode expects hooks to be nested under a "hooks" key.
 */
export default async function strrayCodexPlugin(input) {
    const { directory: inputDirectory } = input;
    const directory = inputDirectory || process.cwd();
    return {
        "experimental.chat.system.transform": async (_input, output) => {
            try {
                await importSystemPromptGenerator();
                let leanPrompt = getFrameworkIdentity();
                if (SystemPromptGenerator) {
                    leanPrompt = await SystemPromptGenerator({
                        showWelcomeBanner: true,
                        showCodexContext: false,
                        enableTokenOptimization: true,
                        maxTokenBudget: 3000,
                        showCriticalTermsOnly: true,
                        showEssentialLinks: true
                    });
                }
                // Routing is handled in chat.message hook - this hook only does system prompt injection
                if (output.system && Array.isArray(output.system)) {
                    output.system = [leanPrompt];
                }
            }
            catch (error) {
                const logger = await getOrCreateLogger(directory);
                logger.error("System prompt injection failed:", error);
                const fallback = getFrameworkIdentity();
                if (output.system && Array.isArray(output.system)) {
                    output.system = [fallback];
                }
            }
        },
        "tool.execute.before": async (input, output) => {
            const logger = await getOrCreateLogger(directory);
            // Retrieve original user message for context preservation (file-based)
            let originalMessage = null;
            try {
                const contextDir = path.join(directory, ".opencode", "logs");
                if (fs.existsSync(contextDir)) {
                    const contextFiles = fs.readdirSync(contextDir)
                        .filter(f => f.startsWith("context-") && f.endsWith(".json"))
                        .map(f => ({
                        name: f,
                        time: fs.statSync(path.join(contextDir, f)).mtime.getTime()
                    }))
                        .sort((a, b) => b.time - a.time);
                    if (contextFiles.length > 0 && contextFiles[0]) {
                        const latestContext = JSON.parse(fs.readFileSync(path.join(contextDir, contextFiles[0].name), "utf-8"));
                        originalMessage = latestContext.userMessage;
                    }
                }
            }
            catch (e) {
                // Silent fail
            }
            if (originalMessage) {
                logger.log(`📌 Original intent: "${originalMessage.slice(0, 80)}..."`);
            }
            // Log tool start to activity logger (direct write - no module isolation issues)
            logToolActivity(directory, "start", input.tool, input.args || {});
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
            // Extract action words from command for better tool routing
            const command = args?.command ? String(args.command) : "";
            let taskDescription = null;
            if (command) {
                const actionWords = extractActionWords(command);
                if (actionWords) {
                    taskDescription = actionWords;
                    logger.log(`📝 Action words extracted: "${actionWords}"`);
                }
            }
            // Also try to extract from content if no command
            if (!taskDescription) {
                taskDescription = extractTaskDescription(input);
            }
            // Route tool commands based on extracted action words
            if (taskDescription) {
                try {
                    await loadTaskSkillRouter();
                    if (taskSkillRouterInstance) {
                        const routingResult = taskSkillRouterInstance.routeTask(taskDescription, {
                            source: "tool_command",
                            complexity: estimateComplexity(taskDescription),
                        });
                        if (routingResult && routingResult.agent) {
                            logger.log(`🎯 Tool routed: ${tool} → @${routingResult.agent} (${Math.round(routingResult.confidence * 100)}%)`);
                            // Log routing for analytics
                            logToolActivity(directory, "routing", tool, {
                                taskDescription,
                                agent: routingResult.agent,
                                confidence: routingResult.confidence
                            });
                        }
                    }
                }
                catch (e) {
                    // Silent fail - routing should not break tool execution
                    logger.log(`📝 Tool routing skipped: ${e}`);
                }
            }
            // ENFORCER QUALITY GATE CHECK - Block on violations
            await importQualityGate(directory);
            if (!runQualityGateWithLogging) {
                logger.log("Quality gate not available, skipping");
            }
            else {
                const qualityGateResult = await runQualityGateWithLogging({ tool, args }, logger);
                if (!qualityGateResult.passed) {
                    logger.error(`🚫 Quality gate failed: ${qualityGateResult.violations.join(", ")}`);
                    throw new Error(`ENFORCER BLOCKED: ${qualityGateResult.violations.join("; ")}`);
                }
            }
            // Run processors for ALL tools (not just write/edit)
            if (ProcessorManager || StrRayStateManager) {
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
                }
                else {
                    logger.log("✅ Using existing processor manager");
                }
                // PHASE 2: Execute pre-processors with detailed logging
                try {
                    // Check if processorManager and method exist
                    if (!processorManager || typeof processorManager.executePreProcessors !== 'function') {
                        logger.log(`⏭️ Pre-processors skipped: processor manager not available`);
                        return;
                    }
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
                    // Check if processorManager and method exist
                    if (!processorManager || typeof processorManager.executePostProcessors !== 'function') {
                        logger.log(`⏭️ Post-processors skipped: processor manager not available`);
                        return;
                    }
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
            const { tool, args, result } = input;
            // Log tool completion to activity logger (direct write - no module isolation issues)
            logToolActivity(directory, "complete", tool, args || {}, result, result?.error, result?.duration);
            await loadStrRayComponents();
            // Debug: log full input
            logger.log(`📥 After hook input: ${JSON.stringify({ tool, hasArgs: !!args, args, hasResult: !!result }).slice(0, 200)}`);
            // Run post-processors for ALL tools AFTER tool completes
            if (ProcessorManager || StrRayStateManager) {
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
                    // Check if processorManager and method exist
                    if (!processorManager || typeof processorManager.executePostProcessors !== 'function') {
                        logger.log(`⏭️ Post-processors skipped: processor manager not available`);
                        return;
                    }
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
        /**
         * chat.message - Intercept user messages for routing
         * Output contains message and parts with user content
         */
        "chat.message": async (input, output) => {
            const logger = await getOrCreateLogger(directory);
            // DEBUG: Log ALL output
            const debugLogPath = path.join(process.cwd(), "logs", "framework", "routing-debug.log");
            fs.appendFileSync(debugLogPath, `\n[${new Date().toISOString()}] === chat.message HOOK FIRED ===\n`);
            fs.appendFileSync(debugLogPath, `OUTPUT KEYS: ${JSON.stringify(Object.keys(output || {}))}\n`);
            fs.appendFileSync(debugLogPath, `MESSAGE: ${JSON.stringify(output?.message)}\n`);
            fs.appendFileSync(debugLogPath, `PARTS: ${JSON.stringify(output?.parts)}\n`);
            // Extract user message from parts (TextPart has type="text" and text field)
            let userMessage = "";
            if (output?.parts && Array.isArray(output.parts)) {
                for (const part of output.parts) {
                    if (part?.type === "text" && part?.text) {
                        userMessage = part.text;
                        break;
                    }
                }
            }
            // Store original user message for tool hooks (context preservation via file)
            const sessionId = output?.message?.sessionID || "default";
            const contextPath = path.join(directory, ".opencode", "logs", `context-${sessionId}.json`);
            try {
                fs.writeFileSync(contextPath, JSON.stringify({
                    sessionId,
                    userMessage,
                    timestamp: new Date().toISOString()
                }), "utf-8");
                logger.log(`💾 Context saved: ${sessionId}`);
            }
            catch (e) {
                logger.error(`Context save failed: ${e}`);
            }
            globalThis.__strRayOriginalMessage = userMessage;
            logger.log(`userMessage: "${userMessage.slice(0, 100)}"`);
            if (!userMessage || userMessage.length === 0) {
                fs.appendFileSync(debugLogPath, `SKIP: No user text found\n`);
                return;
            }
            logger.log(`👤 User message: "${userMessage.slice(0, 50)}..."`);
            try {
                await loadTaskSkillRouter();
                if (taskSkillRouterInstance) {
                    // Get complexity score for tiebreaking
                    let complexityScore = 50; // default medium
                    try {
                        if (featuresConfigLoader) {
                            const config = featuresConfigLoader.loadConfig();
                            if (config.model_routing?.complexity?.enabled) {
                                // Estimate complexity based on message length and keywords
                                complexityScore = estimateComplexity(userMessage);
                            }
                        }
                    }
                    catch (e) {
                        // Silent fail for complexity estimation
                    }
                    fs.appendFileSync(debugLogPath, `Complexity estimated: ${complexityScore}\n`);
                    // Route with complexity context
                    const routingResult = taskSkillRouterInstance.routeTask(userMessage, {
                        source: "chat_message",
                        complexity: complexityScore,
                    });
                    fs.appendFileSync(debugLogPath, `Routing result: ${JSON.stringify(routingResult)}\n`);
                    if (routingResult && routingResult.agent) {
                        // Apply weighted confidence scoring
                        let finalConfidence = routingResult.confidence;
                        let routingMethod = "keyword";
                        // If keyword confidence is low, use complexity-based routing
                        if (routingResult.confidence < 0.7 && complexityScore > 50) {
                            // High complexity tasks get orchestrator boost
                            if (complexityScore > 70) {
                                routingResult.agent = "orchestrator";
                                finalConfidence = Math.min(0.85, routingResult.confidence + 0.15);
                                routingMethod = "complexity";
                            }
                        }
                        // If low complexity and low confidence, boost code-reviewer
                        if (routingResult.confidence < 0.6 && complexityScore < 30) {
                            routingResult.agent = "code-reviewer";
                            finalConfidence = Math.min(0.75, routingResult.confidence + 0.15);
                            routingMethod = "complexity";
                        }
                        logger.log(`🎯 Routed to: @${routingResult.agent} (${Math.round(finalConfidence * 100)}%) via ${routingMethod}`);
                        fs.appendFileSync(debugLogPath, `Final agent: ${routingResult.agent}, confidence: ${finalConfidence}, method: ${routingMethod}\n`);
                        // Store routing in session for later use
                        const sessionRoutingPath = path.join(process.cwd(), "logs", "framework", "session-routing.json");
                        try {
                            fs.appendFileSync(sessionRoutingPath, JSON.stringify({
                                timestamp: new Date().toISOString(),
                                message: userMessage.slice(0, 100),
                                agent: routingResult.agent,
                                confidence: finalConfidence,
                                method: routingMethod,
                                complexity: complexityScore,
                            }) + "\n");
                        }
                        catch (e) {
                            // Silent fail for session routing logging
                        }
                    }
                }
            }
            catch (e) {
                logger.error("Chat message routing error:", e);
                fs.appendFileSync(debugLogPath, `ERROR: ${e}\n`);
            }
            fs.appendFileSync(debugLogPath, `=== END chat.message ===\n`);
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