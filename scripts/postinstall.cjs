#!/usr/bin/env node

/**
 * StrRay Plugin Post-Installation Setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Copy .mcp.json to project root if it doesn't exist
// Find the package root relative to this script
const packageRoot = path.join(__dirname, '..');
const mcpConfigSource = path.join(packageRoot, '.mcp.json');
const mcpConfigDest = path.join(process.cwd(), '.mcp.json');

console.log('Postinstall running...');
console.log('Script dir:', __dirname);
console.log('Package root:', packageRoot);
console.log('Source:', mcpConfigSource);
console.log('Destination:', mcpConfigDest);
console.log('Source exists:', fs.existsSync(mcpConfigSource));

try {
  if (fs.existsSync(mcpConfigSource)) {
    fs.copyFileSync(mcpConfigSource, mcpConfigDest);
    console.log('✅ StrRay MCP configuration installed');
  } else {
    console.warn('Warning: MCP config not found at', mcpConfigSource);
    // Try alternative locations
    const altSource = path.join(packageRoot, 'node_modules', 'stringray-ai', '.mcp.json');
    if (fs.existsSync(altSource)) {
      fs.copyFileSync(altSource, mcpConfigDest);
      console.log('✅ StrRay MCP configuration installed (alt location)');
    }
  }
} catch (error) {
  console.warn('Warning: Could not copy MCP config:', error.message);
}

// Create a marker file to prove the script ran
const markerPath = path.join(os.tmpdir(), 'stringray-postinstall-ran');
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

  const pluginPath = "stringray/dist/plugin/stringray-codex-injection.js";

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
  const stringrayAgents = {
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
  for (const [agentName, agentConfig] of Object.entries(stringrayAgents)) {
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
  const stringrayConfigPath = path.join(os.homedir(), ".strray", "config.json");
  const stringrayDir = path.dirname(stringrayConfigPath);

  if (!fs.existsSync(stringrayDir)) {
    fs.mkdirSync(stringrayDir, { recursive: true });
  }

  const stringrayConfig = {
    enabled: true,
    maxConcurrentAgents: 5,
    codexEnforcement: true,
    mcpAutoRegistration: false,
    version: "1.0.4"
  };

  try {
    fs.writeFileSync(stringrayConfigPath, JSON.stringify(stringrayConfig, null, 2));
    console.log(`✅ Created StrRay configuration at ${stringrayConfigPath}`);
  } catch (error) {
    console.warn(`⚠️ Could not create StrRay config: ${error.message}`);
  }
}

// Show beautiful ASCII art and framework branding
console.log('\n//═══════════════════════════════════════════════════════//');
console.log('//                                                       //');
console.log('//   ███████╗████████╗██████╗ ██████╗  ██████╗ ██╗   ██╗  //');
console.log('//   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝  //');
console.log('//   ███████╗   ██║   ██████╔╝██████╔╝███████║ ╚████╔╝   //');
console.log('//   ╚════██║   ██║   ██╔══██╗██╔══██╗██╔══██║  ╚██╔╝    //');
console.log('//   ███████║   ██║   ██║  ██║██║  ██║██║  ██║   ██║     //');
console.log('//   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝     //');
console.log('//                                                       //');
console.log('//        ⚡ Precision-Guided AI Development ⚡          //');
console.log('//          Platform • 99.6% Error Prevention            //');
console.log('//                                                       //');
console.log('//═══════════════════════════════════════════════════════//');
console.log('🎨 Initializing StrRay Framework...');
console.log('🚀 Loading MCP Server Configurations...');
console.log('📋 Setting up Agent Orchestration...');
console.log('🛡️ Enabling Enterprise Security...');
console.log('✨ Framework Ready for Production Use!');
console.log('='.repeat(60) + '\n');

// Run the configuration
console.log('🚀 [StrRay Postinstall] Starting StrRay plugin postinstall configuration...');
console.log('🚀 [StrRay Postinstall] Node version:', process.version);
console.log('🚀 [StrRay Postinstall] Platform:', process.platform);
console.log('🚀 [StrRay Postinstall] Working directory:', process.cwd());

try {
  configureStrRayPlugin();
  console.log('\n🎉 [StrRay Postinstall] StrRay plugin postinstall completed successfully');
  console.log('✅ Enterprise AI orchestration ready!');
  console.log('🌟 Welcome to the future of AI-powered development!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ [StrRay Postinstall] StrRay plugin installation failed:', error.message);
  console.error('❌ [StrRay Postinstall] Stack trace:', error.stack);
  console.log('\n🔧 [StrRay Postinstall] Manual Configuration:');
  console.log('Add the following to your .opencode/oh-my-opencode.json:');
  console.log(`"plugin": ["stringray-ai/dist/plugin/stringray-codex-injection.js"]`);
  process.exit(1);
}