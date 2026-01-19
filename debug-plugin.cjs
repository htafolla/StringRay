#!/usr/bin/env node

/**
 * Debug script for StringRay plugin loading in oh-my-opencode
 * Tests if the plugin loads correctly and exports expected interface
 */

const path = require('path');

console.log('🔍 Debugging StringRay Plugin Loading...\n');

// Path to the plugin
const pluginPath = path.join(__dirname, 'dist', 'plugin', 'plugins', 'stringray-codex-injection.cjs');

console.log(`📂 Plugin path: ${pluginPath}`);
console.log(`📂 Plugin exists: ${require('fs').existsSync(pluginPath)}\n`);

(async () => {
  try {
    console.log('🚀 Loading plugin...');
    const pluginModule = await import(pluginPath);
    const plugin = pluginModule.default || pluginModule;

    console.log('✅ Plugin loaded successfully\n');

    console.log('🔧 Checking plugin exports:');

    // Check if it's a function (plugin factory)
    if (typeof plugin !== 'function') {
      console.log('❌ Plugin is not a function');
      process.exit(1);
    }

    console.log('✅ Plugin is a function (factory)\n');

    // Try to call the plugin factory
    console.log('🏭 Calling plugin factory...');
    const pluginInstance = plugin();

    console.log('✅ Plugin factory executed\n');

    console.log('📋 Plugin instance exports:');
    console.log(`   - agents: ${pluginInstance.agents ? '✅ present' : '❌ missing'}`);
    console.log(`   - hooks: ${Object.keys(pluginInstance).filter(k => k.includes('.')).length > 0 ? '✅ present' : '❌ missing'}`);
    console.log(`   - config: ${pluginInstance.config ? '✅ present' : '❌ missing'}\n`);

    // Check agents
    if (pluginInstance.agents) {
      if (Array.isArray(pluginInstance.agents)) {
        console.log(`📊 Agents (array): ${pluginInstance.agents.length} agents`);
        pluginInstance.agents.forEach((agent, i) => {
          console.log(`   ${i+1}. ${agent.name} (${agent.mode || 'unknown mode'})`);
        });
      } else if (typeof pluginInstance.agents === 'object') {
        console.log(`📊 Agents (object): ${Object.keys(pluginInstance.agents).length} agents`);
        Object.entries(pluginInstance.agents).forEach(([name, agent], i) => {
          console.log(`   ${i+1}. ${name} -> ${agent.name} (${agent.mode || 'unknown mode'})`);
        });
      } else {
        console.log(`❌ Agents type: ${typeof pluginInstance.agents}`);
      }
      console.log('');
    }

    // Check hooks
    const hooks = Object.keys(pluginInstance).filter(k => k.includes('.'));
    console.log(`🔗 Hooks: ${hooks.length} hooks`);
    hooks.forEach(hook => {
      console.log(`   - ${hook}`);
    });
    console.log('');

    // Check config
    if (pluginInstance.config) {
      console.log('⚙️  Config: present');
    }

    console.log('🎉 Plugin debug complete - all checks passed!');

  } catch (error) {
    console.log('❌ Plugin loading failed:');
    console.log(error.message);
    console.log('\nStack trace:');
    console.log(error.stack);
    process.exit(1);
  }
})();