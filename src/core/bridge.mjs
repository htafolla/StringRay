#!/usr/bin/env node

/**
 * StringRay Universal Bridge
 *
 * Standalone bridge that provides StringRay framework capabilities
 * to ANY consumer — no OpenCode dependency.
 *
 * Supports three transport modes:
 *   1. Stdin/Stdout (default): JSON pipe protocol
 *   2. Positional args: node bridge.mjs <command> [--json '{}'] [--cwd /path]
 *   3. HTTP server:    node bridge.mjs --http --port 18431 [--cwd /path]
 *
 * Commands:
 *   health            Framework health check
 *   codex-check       Check code against codex rules
 *   get-codex-prompt   Get formatted codex terms for system prompt injection
 *   get-config        Get full framework configuration as JSON
 *   validate          Run validation on files
 *   pre-process       Run quality gate + pre-processors
 *   post-process      Run post-processors
 *   stats             Bridge/framework statistics
 *   hooks             Manage git hooks (install/uninstall/list/status)
 *
 * Usage (stdin):
 *   echo '{"command":"health"}' | node bridge.mjs --cwd /path
 *
 * Usage (positional):
 *   node bridge.mjs health --cwd /path
 *   node bridge.mjs get-codex-prompt --cwd /path --json '{"severityFilter":["blocking"]}'
 *
 * Usage (HTTP):
 *   node bridge.mjs --http --port 18431 --cwd /path
 *   curl -X POST http://localhost:18431 -d '{"command":"get-codex-prompt"}'
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import {
  existsSync,
  readFileSync,
  appendFileSync,
  mkdirSync,
} from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { createServer } from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Framework Components (lazy-loaded)
// ============================================================================

let QualityGateModule = null;
let CodexFormatterModule = null;
let frameworkReady = false;
let frameworkLoadAttempted = false;

// ============================================================================
// Project Root Detection
// ============================================================================

function findProjectRoot() {
  const envHome = process.env.STRRAY_HOME;
  if (envHome && existsSync(join(envHome, "package.json"))) return envHome;

  const candidates = [
    process.cwd(),
    join(homedir(), "dev", "stringray"),
    join(dirname(__dirname), "..", ".."), // core/ -> project root
    join(dirname(__dirname), "..", "..", ".."), // integrations/ -> project root
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

// ============================================================================
// Log Directory
// ============================================================================

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
    appendFileSync(activityPath, `${timestamp} [bridge] ${message}\n`, "utf-8");
  } catch {
    // Silent fail — never break the consumer over logging
  }
}

// ============================================================================
// Framework Loading
// ============================================================================

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
      // Codex formatter (standalone, no deps)
      if (!CodexFormatterModule) {
        const cfPath = join(distDir, "core", "codex-formatter.js");
        if (!existsSync(cfPath)) {
          // dist/ not available for codex formatter — will use built-in fallback
        }
        if (existsSync(cfPath)) {
          const mod = await import(cfPath);
          CodexFormatterModule = mod;
        }
      }

      // Quality gate (standalone, no deps)
      if (!QualityGateModule) {
        const qgPath = join(distDir, "plugin", "quality-gate.js");
        if (existsSync(qgPath)) {
          const mod = await import(qgPath);
          QualityGateModule = mod;
        }
      }

      frameworkReady = true;
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

// ============================================================================
// Built-in Codex Fallback (when dist/ is not available)
// NOTE: The canonical source is codex-formatter.ts BUILTIN_CODEX.
// This is a minimal inline copy for bridge standalone mode only.
// ============================================================================

const BRIDGE_CODEX_FALLBACK = {
  version: "fallback-1.0.0",
  terms: [
    { id: "resolve-all-errors", title: "Resolve All Errors", description: "Never leave unhandled errors, rejected promises, or uncaught exceptions in production code.", severity: "blocking" },
    { id: "tests-required", title: "Tests Required", description: "Every new function, method, or module must have corresponding test coverage.", severity: "blocking" },
    { id: "no-console-in-production", title: "No Console in Production", description: "Use structured logging instead of console.log, console.warn, or console.error.", severity: "blocking" },
    { id: "type-safety", title: "Type Safety", description: "Prefer explicit types over 'any'. Use TypeScript strict mode features.", severity: "high" },
    { id: "input-validation", title: "Input Validation", description: "Validate all external inputs at the system boundary.", severity: "high" },
  ],
};

// ============================================================================
// Command Handlers
// ============================================================================

async function handleHealth(input) {
  const projectRoot = findProjectRoot();
  const loaded = await loadFramework(projectRoot);

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
    components: {
      codexFormatter: !!CodexFormatterModule,
      qualityGate: !!QualityGateModule,
    },
    nodeVersion: process.version,
  };
}

// ============================================================================
// Filesystem Codex Loader (bridge-native, no dist/ dependency)
// ============================================================================

/**
 * Load codex.json from the standard priority chain.
 * Same logic as codex-formatter.ts but inlined so bridge works standalone.
 */
function loadCodexFromFs(projectRoot) {
  const envDir = process.env.STRRAY_CONFIG_DIR;
  const candidates = [];

  if (envDir) candidates.push(resolve(projectRoot, envDir, "codex.json"));
  candidates.push(join(projectRoot, ".strray", "codex.json"));
  candidates.push(join(projectRoot, ".opencode", "strray", "codex.json"));
  candidates.push(join(projectRoot, "codex.json"));

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) {
        const raw = readFileSync(candidate, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version && Array.isArray(parsed.terms)) {
          return { codex: parsed, source: candidate };
        }
      }
    } catch {
      continue;
    }
  }

  return { codex: null, source: null };
}

async function handleGetCodexPrompt(input, projectRoot, logDir) {
  const { severityFilter, includeExamples, maxTerms, compressed } = input;
  logToActivity(logDir, `get-codex-prompt: severity=${severityFilter || "all"} compressed=${!!compressed}`);

  let prompt, termCount, totalTerms, version, source, charCount;

  if (CodexFormatterModule && CodexFormatterModule.formatCodexPrompt) {
    const result = CodexFormatterModule.formatCodexPrompt({
      projectRoot,
      severityFilter,
      includeExamples,
      maxTerms,
      compressed,
    });
    prompt = result.prompt;
    termCount = result.termCount;
    totalTerms = result.totalTerms;
    version = result.version;
    source = result.configPath;
    charCount = result.charCount;
  } else {
    // Try filesystem first, fall back to built-in
    const { codex, source: fsSource } = loadCodexFromFs(projectRoot);
    const termsSource = codex || BRIDGE_CODEX_FALLBACK;

    let terms = termsSource.terms;
    if (severityFilter) {
      terms = terms.filter((t) => severityFilter.includes(t.severity));
    }
    const severityOrder = { blocking: 0, high: 1, medium: 2 };
    terms.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));
    if (maxTerms) terms = terms.slice(0, maxTerms);

    const lines = [`## StringRay Universal Development Codex v${termsSource.version}`];
    const emojis = { blocking: "🔴", high: "🟡", medium: "🟢" };
    const labels = { blocking: "BLOCKING", high: "HIGH PRIORITY", medium: "MEDIUM" };

    for (const term of terms) {
      lines.push(`\n**${emojis[term.severity] || "⚪"} ${term.id}** [${labels[term.severity] || term.severity}]`);
      if (!compressed || term.severity !== "medium") {
        lines.push(`  ${term.description}`);
      }
    }

    prompt = lines.join("\n");
    termCount = terms.length;
    totalTerms = termsSource.terms.length;
    version = termsSource.version;
    source = fsSource;
    charCount = prompt.length;
  }

  return {
    status: "ok",
    prompt,
    termCount,
    totalTerms,
    version,
    source,
    charCount,
    via: CodexFormatterModule ? "framework" : (source ? "filesystem" : "builtin"),
  };
}

async function handleGetConfig(input, projectRoot, logDir) {
  logToActivity(logDir, "get-config");

  const result = {
    status: "ok",
    projectRoot,
    nodeVersion: process.version,
  };

  // Load codex.json
  const codexPaths = [];
  const envDir = process.env.STRRAY_CONFIG_DIR;
  if (envDir) codexPaths.push(join(projectRoot, envDir, "codex.json"));
  codexPaths.push(join(projectRoot, ".strray", "codex.json"));
  codexPaths.push(join(projectRoot, ".opencode", "strray", "codex.json"));

  let codexPath = null;
  for (const p of codexPaths) {
    if (existsSync(p)) { codexPath = p; break; }
  }

  if (codexPath) {
    try {
      const codex = JSON.parse(readFileSync(codexPath, "utf-8"));
      result.codex = {
        path: codexPath,
        version: codex.version,
        termCount: codex.terms?.length || 0,
        categories: Object.keys(codex.categories || {}),
      };
    } catch {
      result.codex = { path: codexPath, error: "failed to parse" };
    }
  } else {
    result.codex = { path: null, note: "using built-in fallback codex" };
  }

  // Load features.json
  const featurePaths = [];
  if (envDir) featurePaths.push(join(projectRoot, envDir, "features.json"));
  featurePaths.push(join(projectRoot, ".strray", "features.json"));
  featurePaths.push(join(projectRoot, ".opencode", "strray", "features.json"));

  let featurePath = null;
  for (const p of featurePaths) {
    if (existsSync(p)) { featurePath = p; break; }
  }

  if (featurePath) {
    try {
      result.features = JSON.parse(readFileSync(featurePath, "utf-8"));
    } catch {
      result.features = { path: featurePath, error: "failed to parse" };
    }
  } else {
    result.features = { path: null, note: "no features.json found, using defaults" };
  }

  return result;
}

async function handleStats() {
  return {
    frameworkReady,
    codexFormatterAvailable: !!CodexFormatterModule,
    qualityGateAvailable: !!QualityGateModule,
    nodeVersion: process.version,
    projectRoot: findProjectRoot(),
  };
}

// ============================================================================
// Known Commands
// ============================================================================

const KNOWN_COMMANDS = new Set([
  "health", "stats", "get-codex-prompt", "get-config", "validate",
  "codex-check", "pre-process", "post-process", "hooks",
]);

// ============================================================================
// HTTP Server Mode
// ============================================================================

function startHttpServer(port, projectRoot) {
  const logDir = ensureLogDir(projectRoot);

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      // CORS headers (wildcard — restrict via STRRAY_HTTP_CORS_ORIGIN env var in production)
      const corsOrigin = process.env.STRRAY_HTTP_CORS_ORIGIN || "*";
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method !== "POST" && req.method !== "GET") {
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
        return;
      }

      // GET /health and GET /stats convenience endpoints
      if (req.method === "GET") {
        const url = new URL(req.url, `http://localhost:${port}`);
        if (url.pathname === "/health") {
          const result = await handleHealth({});
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }
        if (url.pathname === "/stats") {
          const result = await handleStats();
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not found. POST / with JSON body." }));
        return;
      }

      // POST handler (1MB body size limit)
      const MAX_BODY_SIZE = 1024 * 1024;
      let body = "";
      let bodySize = 0;
      req.on("data", (chunk) => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          res.writeHead(413);
          res.end(JSON.stringify({ error: "Request body too large (max 1MB)" }));
          req.destroy();
          return;
        }
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const command = JSON.parse(body);
          const response = await dispatchCommand(command, projectRoot, logDir);
          const status = response.error ? 500 : 200;
          res.writeHead(status);
          res.end(JSON.stringify(response));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: `Invalid JSON: ${err.message}` }));
        }
      });
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} already in use`));
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      const timestamp = new Date().toISOString();
      logToActivity(logDir, `HTTP server started on port ${port}`);
      console.error(`[bridge] HTTP server listening on port ${port}`);
      resolve(server);
    });
  });
}

// ============================================================================
// Command Dispatcher
// ============================================================================

async function dispatchCommand(command, projectRoot, logDir) {
  const cmd = command.command || "health";

  switch (cmd) {
    case "health":
      return await handleHealth(command);
    case "get-codex-prompt":
      return await handleGetCodexPrompt(command, projectRoot, logDir);
    case "get-config":
      return await handleGetConfig(command, projectRoot, logDir);
    case "stats":
      return handleStats();
    default:
      return { error: `Unknown command: ${cmd}. Known: ${[...KNOWN_COMMANDS].join(", ")}` };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const argv = process.argv.slice(2);

  // Parse flags
  let cwdOverride = null;
  let httpMode = false;
  let httpPort = 18431;
  let positionalCommand = null;
  let positionalPayload = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cwd" && argv[i + 1]) {
      cwdOverride = argv[i + 1];
      process.chdir(cwdOverride);
      i++;
    } else if (argv[i] === "--http") {
      httpMode = true;
    } else if (argv[i] === "--port" && argv[i + 1]) {
      httpPort = parseInt(argv[i + 1], 10);
      i++;
    } else if (argv[i] === "--json" && argv[i + 1]) {
      positionalPayload = argv[i + 1];
      i++;
    } else if (!argv[i].startsWith("-") && !positionalCommand && KNOWN_COMMANDS.has(argv[i])) {
      positionalCommand = argv[i];
    }
  }

  const projectRoot = findProjectRoot();
  const logDir = ensureLogDir(projectRoot);

  // Lazy-load framework
  if (!frameworkReady && !frameworkLoadAttempted) {
    await loadFramework(projectRoot);
  }

  // HTTP mode
  if (httpMode) {
    await startHttpServer(httpPort, projectRoot);
    return; // Server keeps running
  }

  // Stdin mode or positional mode
  let command;

  if (positionalCommand) {
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
    // Stdin mode
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

  const response = await dispatchCommand(command, projectRoot, logDir);
  process.stdout.write(JSON.stringify(response));
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e.message }));
  process.exit(1);
});
