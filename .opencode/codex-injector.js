/**
 * StrRay Codex Injection Plugin for OpenCode
 *
 * This plugin automatically injects the Universal Development Codex v1.2.20
 * into the system prompt for all AI agents, ensuring codex terms are
 * consistently enforced across the entire development session.
 *
 * @version 1.0.0
 * @author StrRay Framework
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

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
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("close", (code) => {
      // Always resolve with the output, let caller decide based on exit code
      resolve({ stdout, stderr, code });
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

class PluginLogger {
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
    } catch (error) {
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
  } catch (error) {
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
  const version = versionMatch ? versionMatch[1] : "1.2.20";

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
    void getOrCreateLogger(process.cwd()).then((l) =>
      l.error(
        `No valid codex files found. Checked: ${CODEX_FILE_LOCATIONS.join(", ")}`,
      ),
    );
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
async function strrayCodexPlugin(input) {
  const { directory: inputDirectory } = input;
  const directory = inputDirectory || process.cwd();

  return {
    "experimental.chat.system.transform": async (_input, output) => {
      const codexContexts = loadCodexContext();

      if (codexContexts.length === 0) {
        const logger = await getOrCreateLogger(directory);
        logger.error(
          `No codex files found. Checked: ${CODEX_FILE_LOCATIONS.join(", ")}`,
        );
        return;
      }

      const formattedCodex = formatCodexContext(codexContexts);

      const welcomeMessage =
        "✨ Welcome StrRay 1.0.0 Agentic Framework Successfully Loaded.";

      if (output.system && Array.isArray(output.system)) {
        output.system.unshift(welcomeMessage, formattedCodex);
      }
    },

    "tool.execute.before": async (input, _output) => {
      const { tool, args } = input;

      if (["write", "edit", "multiedit"].includes(tool)) {
        const code = args?.content || "";
        const filePath = args?.filePath || "<unknown>";

        if (code.length > 0) {
          const validationScript = path.join(
            directory,
            ".opencode",
            "scripts",
            "validate-codex.py",
          );

          if (fs.existsSync(validationScript)) {
            const logger = await getOrCreateLogger(directory);
            const { stdout, code } = await spawnPromise(
              "python3",
              [validationScript, "--code", code, "--file", filePath],
              directory,
            );

            if (!stdout || stdout.trim().length === 0) {
              logger.error(
                `Validation script returned no output for ${filePath}`,
              );
              return;
            }

            const result = JSON.parse(stdout.trim());

            if (!result || typeof result !== "object") {
              logger.error(
                `Validation script returned malformed data for ${filePath}`,
              );
              return;
            }

            if (!result.compliant) {
              logger.error(`CODEX VIOLATION in ${filePath}`);
              for (const violation of result.violations) {
                logger.error(
                  `  Term ${violation.term_id}: ${violation.term_title} - ${violation.message}`,
                );
              }

              throw new Error(
                `Codex violation: ${result.violation_count} violations detected. Review logs for details.`,
              );
            }
          }
        }
      }
    },

    config: async (_config) => {
      const logger = await getOrCreateLogger(directory);
      const initScriptPath = path.join(directory, ".opencode", "init.sh");
      if (fs.existsSync(initScriptPath)) {
        try {
          const { stderr } = await spawnPromise(
            "bash",
            [initScriptPath],
            directory,
          );

          if (stderr) {
            logger.error(`Framework init error: ${stderr}`);
          }
        } catch (error) {
          logger.error("Framework initialization failed", error);
        }
      }
    },
  };
}

module.exports = strrayCodexPlugin;
