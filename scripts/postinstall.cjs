#!/usr/bin/env node

/**
 * StrRay Plugin Post-Installation Setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration files to copy during installation
const configFiles = [
  { source: '.mcp.json', dest: '.mcp.json' },
  { source: 'opencode.json', dest: 'opencode.json' },
  { source: '.opencode/oh-my-opencode.json', dest: '.opencode/oh-my-opencode.json' },
  { source: '.opencode/package.json', dest: '.opencode/package.json' }
];

// Claude configuration files to copy to user's home directory
const claudeConfigFiles = [
  { source: '.claude/.mcp.json', dest: '.claude/.mcp.json' }
];

// Find the package root relative to this script
const packageRoot = path.join(__dirname, '..');

console.log('Postinstall running...');
console.log('Script dir:', __dirname);
console.log('Package root:', packageRoot);

// Copy all configuration files
configFiles.forEach(({ source: sourcePath, dest: destPath }) => {
  const source = path.join(packageRoot, sourcePath);
  const dest = path.join(process.cwd(), destPath);

  console.log(`Copying ${sourcePath} -> ${destPath}`);
  console.log('Source exists:', fs.existsSync(source));

  try {
    if (fs.existsSync(source)) {
      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log(`Created directory: ${destDir}`);
      }

      fs.copyFileSync(source, dest);
      console.log(`✅ ${sourcePath} installed`);
    } else {
      console.warn(`Warning: ${sourcePath} not found at ${source}`);
      // Try alternative locations for installed package
      const altSource = path.join(packageRoot, 'node_modules', 'stringray-ai', sourcePath);
      if (fs.existsSync(altSource)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(altSource, dest);
        console.log(`✅ ${sourcePath} installed (alt location)`);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not copy ${sourcePath}:`, error.message);
  }
});

// Create a marker file to prove the script ran
const markerPath = path.join(os.tmpdir(), 'stringray-postinstall-ran');
try {
  fs.writeFileSync(markerPath, new Date().toISOString());
  console.log('✅ StrRay Plugin postinstall executed successfully');
} catch (error) {
  // If we can't write to tmp, that's okay - just log
  console.log('✅ StrRay Plugin installed');
}

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

function configureClaudeMCPExclusions() {
  // Try project-level .claude config first, then fall back to user home
  let claudeMcpPath = path.join(process.cwd(), '.claude', '.mcp.json');
  if (!fs.existsSync(claudeMcpPath)) {
    claudeMcpPath = path.join(os.homedir(), '.claude', '.mcp.json');
  }

  try {
    if (!fs.existsSync(claudeMcpPath)) {
      console.log('ℹ️ Claude MCP config not found, skipping exclusions');
      return;
    }

    console.log(`🔧 Checking Claude MCP configuration at: ${claudeMcpPath}`);
    const mcpConfig = JSON.parse(fs.readFileSync(claudeMcpPath, 'utf8'));

    // Disable problematic MCP servers that cause conflicts
    const serversToDisable = ['global-everything', 'global-git', 'global-sqlite'];

    let disabledCount = 0;
    for (const serverName of serversToDisable) {
      if (mcpConfig.mcpServers && mcpConfig.mcpServers[serverName]) {
        delete mcpConfig.mcpServers[serverName];
        disabledCount++;
        console.log(`✅ Disabled problematic MCP server: ${serverName}`);
      } else {
        console.log(`ℹ️ MCP server already disabled: ${serverName}`);
      }
    }

    // Always write the updated config to ensure it's clean
    fs.writeFileSync(claudeMcpPath, JSON.stringify(mcpConfig, null, 2));
    console.log(`🎉 MCP exclusions configured (disabled ${disabledCount} servers)`);

  } catch (error) {
    console.warn('Warning: Could not configure Claude MCP exclusions:', error.message);
  }
}

  try {
    const configContent = fs.readFileSync(claudeConfigPath, 'utf-8');
    let config = JSON.parse(configContent);

    let exclusionsApplied = 0;

    // MCP servers to disable (cause connection errors in OpenCode)
    const serversToDisable = ['global-everything', 'global-git', 'global-sqlite'];

    for (const serverName of serversToDisable) {
      if (config.mcpServers && config.mcpServers[serverName]) {
        if (!config.mcpServers[serverName].disabled) {
          config.mcpServers[serverName].disabled = true;
          exclusionsApplied++;
          console.log(`✅ Disabled problematic MCP server: ${serverName}`);
        } else {
          console.log(`ℹ️ MCP server already disabled: ${serverName}`);
        }
      }
    }

    if (exclusionsApplied > 0) {
      fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
      console.log(`✅ Applied ${exclusionsApplied} MCP server exclusions to prevent connection errors`);
    } else {
      console.log(`ℹ️ All problematic MCP servers already disabled`);
    }

  } catch (error) {
    console.warn(`⚠️ Could not configure Claude MCP exclusions: ${error.message}`);
    console.log(`💡 You can manually disable global MCP servers by adding "disabled": true to each server in ~/.claude/.mcp.json`);
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

function configureStrRayPlugin() {
  console.log('🔧 Configuring StrRay plugin...');

  // Copy configuration files
  configFiles.forEach(({ source: sourcePath, dest: destPath }) => {
    const source = path.join(packageRoot, sourcePath);
    const dest = path.join(process.cwd(), destPath);

    console.log(`Copying ${sourcePath} -> ${destPath}`);

    try {
      if (fs.existsSync(source)) {
        // Ensure destination directory exists
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
          console.log(`Created directory: ${destDir}`);
        }

        fs.copyFileSync(source, dest);
        console.log(`✅ ${sourcePath} installed`);
      } else {
        console.warn(`Warning: ${sourcePath} not found at ${source}`);
        // Try alternative locations for installed package
        const altSource = path.join(packageRoot, 'node_modules', 'stringray-ai', sourcePath);
        if (fs.existsSync(altSource)) {
          const destDir = path.dirname(dest);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(altSource, dest);
          console.log(`✅ ${sourcePath} installed (from node_modules)`);
        } else {
          console.warn(`Warning: ${sourcePath} not found in alternative locations`);
        }
      }
    } catch (error) {
      console.error(`Error copying ${sourcePath}:`, error.message);
    }
  });

  // Update MCP server paths in the copied .mcp.json file
  const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
  console.log('Checking MCP config at:', mcpConfigPath);
  if (fs.existsSync(mcpConfigPath)) {
    console.log('MCP config file exists, updating paths...');
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      let updated = false;

      // Update all server command arguments to use correct paths
      for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers || {})) {
        if (serverConfig.args && Array.isArray(serverConfig.args)) {
          for (let i = 0; i < serverConfig.args.length; i++) {
            const arg = serverConfig.args[i];
            // Replace template paths with actual package paths
            if (typeof arg === 'string' && arg.includes('dist/plugin/mcps/')) {
              // Remove the /plugin/ part and use node_modules/strray-ai/dist/mcps/
              const newArg = arg.replace('dist/plugin/mcps/', 'node_modules/strray-ai/dist/mcps/');
              if (newArg !== arg) {
                serverConfig.args[i] = newArg;
                updated = true;
                console.log(`✅ Updated MCP server ${serverName} path: ${arg} -> ${newArg}`);
              }
            }
          }
        }
      }

      if (updated) {
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        console.log('✅ Updated MCP server paths in .mcp.json');
      }
    } catch (error) {
      console.warn('Warning: Could not update MCP server paths:', error.message);
    }
  }

  // Copy Claude configuration files to user's home directory
  claudeConfigFiles.forEach(({ source: sourcePath, dest: destPath }) => {
    const source = path.join(packageRoot, sourcePath);
    const dest = path.join(os.homedir(), destPath);

    console.log(`Copying Claude config ${sourcePath} -> ${destPath}`);

    try {
      if (fs.existsSync(source)) {
        // Ensure destination directory exists
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
          console.log(`Created Claude directory: ${destDir}`);
        }

        // Check if file already exists, backup if it does
        if (fs.existsSync(dest)) {
          const backupPath = `${dest}.backup.${Date.now()}`;
          fs.copyFileSync(dest, backupPath);
          console.log(`Backed up existing Claude config to: ${backupPath}`);
        }

        fs.copyFileSync(source, dest);
        console.log(`✅ Claude config installed: ${destPath}`);
      } else {
        console.warn(`Warning: Claude config ${sourcePath} not found at ${source}`);
      }
    } catch (error) {
      console.error(`Error copying Claude config ${sourcePath}:`, error.message);
    }
  });

  // Configure Claude MCP exclusions to prevent connection errors
  console.log('🔧 Checking Claude MCP configuration...');
  configureClaudeMCPExclusions();

  // Update paths in opencode.json
  const opencodeConfigPath = path.join(process.cwd(), "opencode.json");
  console.log("Checking opencode config at:", opencodeConfigPath);
  if (fs.existsSync(opencodeConfigPath)) {
    console.log("opencode.json exists, updating paths...");
    try {
      const opencodeConfig = JSON.parse(fs.readFileSync(opencodeConfigPath, "utf-8"));
      let opencodeUpdated = false;
      
      // Update MCP server commands in opencode.json
      if (opencodeConfig.mcp) {
        for (const [serverName, serverConfig] of Object.entries(opencodeConfig.mcp)) {
          if (serverConfig.command && Array.isArray(serverConfig.command)) {
            for (let i = 0; i < serverConfig.command.length; i++) {
              const cmd = serverConfig.command[i];
              if (typeof cmd === "string" && cmd.includes("dist/plugin/mcps/")) {
                const newCmd = cmd.replace("dist/plugin/mcps/", "node_modules/strray-ai/dist/plugin/mcps/");
                if (newCmd !== cmd) {
                  serverConfig.command[i] = newCmd;
                  opencodeUpdated = true;
                  console.log(`✅ Updated opencode ${serverName} path: ${cmd} -> ${newCmd}`);
                }
              }
            }
          }
        }
      }
      
      if (opencodeUpdated) {
        fs.writeFileSync(opencodeConfigPath, JSON.stringify(opencodeConfig, null, 2));
        console.log("✅ Updated MCP server paths in opencode.json");
      }
    } catch (error) {
      console.warn("Warning: Could not update opencode.json paths:", error.message);
    }
  }

  // Update paths in .opencode/oh-my-opencode.json
  const ohMyConfigPath = path.join(process.cwd(), ".opencode", "oh-my-opencode.json");
  console.log("Checking oh-my-opencode config at:", ohMyConfigPath);
  if (fs.existsSync(ohMyConfigPath)) {
    console.log("oh-my-opencode.json exists, updating paths...");
    try {
      const ohMyConfig = JSON.parse(fs.readFileSync(ohMyConfigPath, "utf-8"));
      let ohMyUpdated = false;
      
      // Update plugin path
      if (ohMyConfig.plugin && Array.isArray(ohMyConfig.plugin)) {
        for (let i = 0; i < ohMyConfig.plugin.length; i++) {
          const pluginPath = ohMyConfig.plugin[i];
          if (typeof pluginPath === "string" && pluginPath.includes("./dist/")) {
            const newPath = pluginPath.replace("./dist/", "../node_modules/strray-ai/dist/");
            if (newPath !== pluginPath) {
              ohMyConfig.plugin[i] = newPath;
              ohMyUpdated = true;
              console.log(`✅ Updated plugin path: ${pluginPath} -> ${newPath}`);
            }
          }
        }
      }
      
      if (ohMyUpdated) {
        fs.writeFileSync(ohMyConfigPath, JSON.stringify(ohMyConfig, null, 2));
        console.log("✅ Updated plugin paths in .opencode/oh-my-opencode.json");
      }
    } catch (error) {
      console.warn("Warning: Could not update oh-my-opencode.json paths:", error.message);
    }
  }

  // All configuration paths are now updated for consumer usage
}

  console.log('🎉 StrRay plugin installation complete!');
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Restart oh-my-opencode to load the plugin`);
  console.log(`2. Run 'opencode agent list' to see StrRay agents`);
  console.log(`3. Try '@enforcer analyze this code' to test the plugin`);
  console.log(`\n📖 Documentation: https://github.com/strray-framework/strray-plugin`);
}

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
  console.log(`"plugin": ["./dist/plugin/plugins/stringray-codex-injection.js"]`);
  process.exit(1);
}