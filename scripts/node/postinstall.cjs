#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const packageRoot = path.join(__dirname, "..", "..");

let targetDir;
if (__dirname.includes("node_modules/strray-ai")) {
  targetDir = path.join(__dirname, "..", "..", "..", "..");
} else {
  targetDir = process.env.PWD || process.cwd();
}

const resolvedPackage = path.resolve(packageRoot);
const resolvedTarget = path.resolve(targetDir);

const SKIP_DIRS = new Set(["node_modules", "logs"]);

// Copy .strray/ to consumer project (incremental: only new files)
const strraySource = path.join(packageRoot, ".strray");
const strrayDest = path.join(targetDir, ".strray");

if (fs.existsSync(strraySource)) {
  const resolvedStrraySource = path.resolve(strraySource);
  const resolvedStrrayDest = path.resolve(strrayDest);
  if (resolvedStrraySource !== resolvedStrrayDest) {
    function copyNewFiles(s, d) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
        const srcPath = path.join(s, entry.name);
        const destPath = path.join(d, entry.name);
        if (entry.isDirectory()) {
          copyNewFiles(srcPath, destPath);
        } else if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    copyNewFiles(strraySource, strrayDest);
  }
}

// Copy Grok plugin for Grok CLI (first-class citizen, same level as OpenCode)
const grokPluginSource = path.join(packageRoot, "src/integrations/grok/plugin/strray-ai");
const grokPluginSourceBuilt = path.join(packageRoot, ".grok/plugins/strray-ai"); // if we copy during build later
const grokPluginDest = path.join(targetDir, ".grok/plugins/strray-ai");

const actualGrokSource = fs.existsSync(grokPluginSource) ? grokPluginSource : grokPluginSourceBuilt;

if (fs.existsSync(actualGrokSource) && resolvedPackage !== resolvedTarget) {
  function copyGrokPlugin(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyGrokPlugin(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyGrokPlugin(actualGrokSource, grokPluginDest);
  console.log('[postinstall] Copied Grok plugin for strray-ai');
}

// Copy AGENTS-consumer.md → AGENTS.md
const agentsConsumer = path.join(packageRoot, "AGENTS-consumer.md");
const agentsDest = path.join(targetDir, "AGENTS.md");
if (fs.existsSync(agentsConsumer) && resolvedPackage !== resolvedTarget) {
  fs.copyFileSync(agentsConsumer, agentsDest);
}

// Register MCP servers with Grok CLI (if available) using absolute paths to installed dist
if (resolvedPackage !== resolvedTarget) {
  try {
    execSync('which grok', { stdio: 'ignore' });
    const govServer = path.join(packageRoot, 'dist/mcps/governance.server.js');
    const skillsServer = path.join(packageRoot, 'dist/mcps/knowledge-skills/skill-invocation.server.js');
    const strrayRoot = targetDir;

    execSync(
      `grok mcp add strray-governance --command node --args "${govServer}" --env "STRRAY_FORCE_MCP_GOVERNANCE=true" --env "STRRAY_ROOT=${strrayRoot}"`,
      { stdio: 'pipe' }
    );
    console.log('[postinstall] Registered strray-governance with Grok CLI');

    execSync(
      `grok mcp add strray-skills --command node --args "${skillsServer}" --env "STRRAY_ROOT=${strrayRoot}"`,
      { stdio: 'pipe' }
    );
    console.log('[postinstall] Registered strray-skills with Grok CLI');
  } catch (_e) {
    // grok not on PATH or registration failed — skip gracefully
  }
}

if (resolvedPackage !== resolvedTarget) {
  console.log("✅ 0xRay framework installed. Run `npx strray-ai setup` for full configuration (hooks, Hermes, symlinks).");
}
