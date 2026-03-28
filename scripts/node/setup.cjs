#!/usr/bin/env node

/**
 * StrRay Plugin Setup Script
 *
 * Configures OpenCode to use the StrRay plugin.
 * Run this after installing the plugin.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

function getOhMyOpenCodeConfigPath() {
  // Try to find OpenCode config in current project
  const projectConfig = path.join(
    process.cwd(),
    ".opencode",
    "OpenCode.json",
  );
  if (fs.existsSync(projectConfig)) {
    return projectConfig;
  }

  // Try to find global OpenCode config
  const homeDir = os.homedir();
  const globalConfig = path.join(
    homeDir,
    ".config",
    "opencode",
    "opencode.json",
  );
  if (fs.existsSync(globalConfig)) {
    return globalConfig;
  }

  // Create project-level config if neither exists
  return projectConfig;
}

function loadConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(
      `Warning: Could not load config from ${configPath}:`,
      error.message,
    );
  }
  return {};
}

function saveConfig(configPath, config) {
  // Ensure directory exists
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function configureStrRayPlugin() {
  const configPath = getOhMyOpenCodeConfigPath();

  console.log(
    `🔧 Configuring StrRay plugin for OpenCode at: ${configPath}`,
  );

  let config = loadConfig(configPath);

  // Use default model from opencode
  // Don't override - let opencode use its default

  // Add StrRay agent configurations
  if (!config.agent) {
    config.agent = {};
  }

  // Agent configs - don't specify model, use opencode default
  const strrayAgents = [
    "orchestrator", "enforcer", "architect", "testing-lead",
    "bug-triage-specialist", "code-reviewer", "security-auditor",
    "refactorer", "researcher", "log-monitor", "strategist",
    "tech-writer", "code-analyzer", "frontend-ui-ux-engineer",
    "seo-consultant", "content-creator", "growth-strategist",
    "multimodal-looker"
  ];

  let agentsAdded = 0;
  for (const agentName of strrayAgents) {
    if (!config.agent[agentName]) {
      config.agent[agentName] = { mode: "subagent" };
      agentsAdded++;
    }
  }

  if (agentsAdded > 0) {
    console.log(`✅ Added ${agentsAdded} StrRay agents to configuration`);
  }

  saveConfig(configPath, config);

  console.log(`🎉 StrRay plugin setup complete!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Restart OpenCode to load the plugin`);
  console.log(`2. Run 'opencode agent list' to see StrRay agents`);
  console.log(`3. Try '@enforcer analyze this code' to test the plugin`);
  console.log(
    `\n📖 Documentation: https://github.com/strray-framework/strray-plugin`,
  );
}

// Run the configuration
try {
  configureStrRayPlugin();
} catch (error) {
  console.error("❌ StrRay plugin setup failed:", error.message);
  console.log("\n🔧 Manual Configuration:");
  console.log("Add the following to your opencode.json (root directory):");
  console.log(`"plugin": "./node_modules/strray-ai/dist/plugin/strray-codex-injection.js"`);
  process.exit(1);
}
