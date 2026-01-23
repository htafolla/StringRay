/**
 * StrRay Codex Injection Plugin for OpenCode
 *
 * This plugin automatically injects the Universal Development Codex v1.1.1
 * into the system prompt for all AI agents, ensuring codex terms are
 * consistently enforced across the entire development session.
 *
 * @version 1.0.0
 * @author StrRay Framework
 */
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
// Dynamic import to handle npm deployment paths
let ProcessorManager;
let StrRayStateManager;
async function loadStrRayComponents() {
    if (ProcessorManager && StrRayStateManager)
        return;
    try {
        // Try relative import first (development)
        const procModule = await import("../../dist/processors/processor-manager.js");
        const stateModule = await import("../../dist/state/state-manager.js");
        ProcessorManager = procModule.ProcessorManager;
        StrRayStateManager = stateModule.StrRayStateManager;
    }
    catch (error) {
        // Silently fail for plugin compatibility - components may not be available
        // This prevents console bleed-through in oh-my-opencode UI
        console.debug?.("StrRay: Optional components not available in this environment");
        return;
        // Fallback for npm deployment - find plugin in node_modules
        const pluginPaths = [
            "strray-framework",
            "@strray/strray-framework",
            "oh-my-opencode/plugins/strray-framework",
        ];
        for (const pluginPath of pluginPaths) {
            try {
                ({ ProcessorManager } = await import(`../../../../../node_modules/${pluginPath}/dist/processors/processor-manager.js`));
                ({ StrRayStateManager } = await import(`../../../../../node_modules/${pluginPath}/dist/state/state-manager.js`));
                break;
            }
            catch {
                continue;
            }
        }
        if (!ProcessorManager || !StrRayStateManager) {
            throw new Error("StrRay Framework components not found. Ensure the plugin is properly installed.");
        }
    }
}
function spawnPromise(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            stdio: ["ignore", "inherit", "pipe"],
        });
        const stdout = "";
        let stderr = "";
        if (child.stderr) {
            child.stderr.on("data", (data) => {
                stderr += data.toString();
            });
        }
        child.on("close", (code) => {
            if (code === 0) {
                resolve({ stdout: "", stderr });
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
            console.error("Failed to write to log file:", error);
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
 * Global codex context cache (loaded once)
 */
let cachedCodexContexts = null;
/**
 * Codex file locations to search
 */
const CODEX_FILE_LOCATIONS = [".strray/agents_template.md", "AGENTS.md"];
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
    const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
    const version = versionMatch && versionMatch[1] ? versionMatch[1] : "1.2.20";
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
function loadCodexContext() {
    if (cachedCodexContexts) {
        return cachedCodexContexts;
    }
    const codexContexts = [];
    for (const relativePath of CODEX_FILE_LOCATIONS) {
        const fullPath = path.join(process.cwd(), relativePath);
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
        void getOrCreateLogger(process.cwd()).then((l) => l.error(`No valid codex files found. Checked: ${CODEX_FILE_LOCATIONS.join(", ")}`));
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
            const codexContexts = loadCodexContext();
            if (codexContexts.length === 0) {
                const logger = await getOrCreateLogger(directory);
                logger.error(`No codex files found. Checked: ${CODEX_FILE_LOCATIONS.join(", ")}`);
                return;
            }
            const formattedCodex = formatCodexContext(codexContexts);
            const welcomeMessage = "✨ Welcome StrRay 1.0.0 Agentic Framework Successfully Loaded.";
            if (output.system && Array.isArray(output.system)) {
                output.system.unshift(welcomeMessage, formattedCodex);
            }
        },
        "tool.execute.before": async (input, _output) => {
            const logger = await getOrCreateLogger(directory);
            logger.log(`PLUGIN HOOK TRIGGERED: tool=${input.tool}, hasArgs=${!!input.args}`);
            const { tool, args } = input;
            if (["write", "edit", "multiedit"].includes(tool)) {
                // Initialize StrRay components if not already loaded
                await loadStrRayComponents();
                // Initialize state manager and processor manager
                const stateManager = new StrRayStateManager(path.join(directory, ".opencode", "state"));
                const processorManager = new ProcessorManager(stateManager);
                logger.log(`StrRay processor pipeline active for ${tool}`);
                // Execute pre-processors
                try {
                    const result = await processorManager.executePreProcessors({
                        tool,
                        args,
                        context: { directory, operation: "tool_execution" }
                    });
                    if (!result.success) {
                        logger.error(`Pre-processor execution failed: ${result.results.find((r) => !r.success)?.error || 'Unknown error'}`);
                        // Continue with operation despite processor failure
                    }
                    else {
                        logger.log(`Pre-processor execution completed successfully (${result.results.length} processors)`);
                    }
                }
                catch (error) {
                    logger.error(`Pre-processor execution error: ${error}`);
                    // Continue with operation despite processor error
                }
                // Fallback: Continue with operation (processor pipeline handles validation)
                logger.log(`Continuing with ${tool} operation after processor execution`);
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