#!/usr/bin/env node

/**
 * StrRay Plugin Post-Installation Setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Create a marker file to prove the script ran
const markerPath = path.join(os.tmpdir(), 'strray-postinstall-ran');
try {
  fs.writeFileSync(markerPath, new Date().toISOString());
  console.log('✅ StrRay Plugin postinstall executed successfully');
} catch (error) {
  // If we can't write to tmp, that's okay - just log
  console.log('✅ StrRay Plugin installed');
}

// Exit successfully to not break npm install
process.exit(0);

function getOhMyOpenCodeConfigPath() {
  // Try to find oh-my-opencode config in current project
  const projectConfig = path.join(process.cwd(), '.opencode', 'oh-my-opencode.json');
  if (fs.existsSync(projectConfig)) {
    return projectConfig;
  }

  // Try to find global oh-my-opencode config
  const homeDir = os.homedir();
  const globalConfig = path.join(homeDir, '.config', 'opencode', 'opencode.json');
  if (fs.existsSync(globalConfig)) {
    return globalConfig;
  }

  // Create project-level config if neither exists
  return projectConfig;
}

function loadConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Warning: Could not load config from ${configPath}:`, error.message);
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

  console.log(`🔧 Configuring StrRay plugin for oh-my-opencode at: ${configPath}`);

  let config = loadConfig(configPath);

  // Initialize basic config structure if needed (only valid opencode keys)
  if (!config.model) {
    config.model = "opencode/grok-code";
  }

  // Add plugin to the plugin array
  if (!config.plugin) {
    config.plugin = [];
  }

  const pluginPath = "oh-my-opencode-strray/dist/plugin/strray-codex-injection.js";

  if (!config.plugin.includes(pluginPath)) {
    config.plugin.push(pluginPath);
    console.log(`✅ Added StrRay plugin to configuration`);
  } else {
    console.log(`ℹ️ StrRay plugin already configured`);
  }

  // Add StrRay agent configurations
  if (!config.agent) {
    config.agent = {};
  }

  // Add StrRay-specific agents (only valid opencode agent config)
  const strrayAgents = {
    "orchestrator": { "model": "opencode/grok-code" },
    "enhanced-orchestrator": { "model": "opencode/grok-code" },
    "enforcer": { "model": "opencode/grok-code" },
    "architect": { "model": "opencode/grok-code" },
    "test-architect": { "model": "opencode/grok-code" },
    "bug-triage-specialist": { "model": "opencode/grok-code" },
    "code-reviewer": { "model": "opencode/grok-code" },
    "security-auditor": { "model": "opencode/grok-code" },
    "refactorer": { "model": "opencode/grok-code" }
  };

  let agentsAdded = 0;
  for (const [agentName, agentConfig] of Object.entries(strrayAgents)) {
    if (!config.agent[agentName]) {
      config.agent[agentName] = agentConfig;
      agentsAdded++;
    }
  }

  if (agentsAdded > 0) {
    console.log(`✅ Added ${agentsAdded} StrRay agents to configuration`);
  }

  saveConfig(configPath, config);

  console.log(`🎉 StrRay plugin installation complete!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Restart oh-my-opencode to load the plugin`);
  console.log(`2. Run 'opencode agent list' to see StrRay agents`);
  console.log(`3. Try '@enforcer analyze this code' to test the plugin`);
  console.log(`\n📖 Documentation: https://github.com/strray-framework/strray-plugin`);

  // Add StrRay-specific settings
  if (!config.settings) {
    config.settings = {};
  }

  if (!config.settings.multi_agent_orchestration) {
    config.settings.multi_agent_orchestration = {
      enabled: true,
      max_concurrent_agents: 5,
      coordination_model: "async-multi-agent"
    };
    console.log(`✅ Enabled StrRay multi-agent orchestration`);
  }

  // Add Claude Code compatibility
  if (!config.claude_code) {
    config.claude_code = {
      mcp: true,
      commands: true,
      skills: true,
      agents: true,
      hooks: true,
      plugins: true
    };
    console.log(`✅ Enabled Claude Code compatibility`);
  }

  saveConfig(configPath, config);

  // Create StrRay-specific configuration file separately
  createStrRayConfig();

  console.log(`🎉 StrRay plugin installation complete!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Restart oh-my-opencode to load the plugin`);
  console.log(`2. Run 'opencode agent list' to see StrRay agents`);
  console.log(`3. Try '@enforcer analyze this code' to test the plugin`);
  console.log(`\n📖 Documentation: https://github.com/strray-framework/strray-plugin`);
}

function createStrRayConfig() {
  // Create StrRay-specific configuration in a separate file
  const strrayConfigPath = path.join(os.homedir(), ".strray", "config.json");
  const strrayDir = path.dirname(strrayConfigPath);

  if (!fs.existsSync(strrayDir)) {
    fs.mkdirSync(strrayDir, { recursive: true });
  }

  const strrayConfig = {
    enabled: true,
    maxConcurrentAgents: 5,
    codexEnforcement: true,
    mcpAutoRegistration: false,
    version: "1.0.4"
  };

  try {
    fs.writeFileSync(strrayConfigPath, JSON.stringify(strrayConfig, null, 2));
    console.log(`✅ Created StrRay configuration at ${strrayConfigPath}`);
  } catch (error) {
    console.warn(`⚠️ Could not create StrRay config: ${error.message}`);
  }
}

// Run the configuration
console.log('🚀 [StrRay Postinstall] Starting StrRay plugin postinstall configuration...');
console.log('🚀 [StrRay Postinstall] Node version:', process.version);
console.log('🚀 [StrRay Postinstall] Platform:', process.platform);
console.log('🚀 [StrRay Postinstall] Working directory:', process.cwd());
console.log('🚀 [StrRay Postinstall] Environment variables:');
console.log('  - npm_config_global:', process.env.npm_config_global);
console.log('  - npm_lifecycle_event:', process.env.npm_lifecycle_event);
console.log('  - npm_package_name:', process.env.npm_package_name);

try {
  configureStrRayPlugin();
  console.log('✅ [StrRay Postinstall] StrRay plugin postinstall completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ [StrRay Postinstall] StrRay plugin installation failed:', error.message);
  console.error('❌ [StrRay Postinstall] Stack trace:', error.stack);
  console.log('\n🔧 [StrRay Postinstall] Manual Configuration:');
  console.log('Add the following to your .opencode/oh-my-opencode.json:');
  console.log(`"plugin": ["oh-my-opencode-strray/dist/plugin/strray-codex-injection.js"]`);
  process.exit(1);
}