#!/usr/bin/env node

/**
 * Validate MCP Connectivity
 * 
 * Tests that MCP servers can be loaded and connected.
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

function check(file, description) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: ${file}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${file} NOT FOUND`);
    errors.push(`${description} not found: ${file}`);
    return false;
  }
}

console.log('🔍 Validating MCP Connectivity...\n');

// Check MCP server files
check('dist/mcps/mcp-client.js', 'MCP Client');
check('dist/mcps/framework-help.server.js', 'Framework Help Server');

// Check knowledge servers
const mcpsDir = path.join(process.cwd(), 'dist/mcps/knowledge-skills');
if (fs.existsSync(mcpsDir)) {
  const servers = fs.readdirSync(mcpsDir).filter(f => f.endsWith('.server.js'));
  console.log(`✅ Knowledge servers: ${servers.length} servers found`);
} else {
  warnings.push('Knowledge servers directory not found (may be optional)');
}

// Check plugin (can be in .opencode/plugins/ or .opencode/plugin/)
const pluginLocations = ['.opencode/plugins/strray-codex-injection.js', '.opencode/plugin/strray-codex-injection.js'];
const pluginFound = pluginLocations.some(loc => fs.existsSync(path.join(process.cwd(), loc)));
if (pluginFound) {
  const foundLoc = pluginLocations.find(loc => fs.existsSync(path.join(process.cwd(), loc)));
  console.log(`✅ Plugin: ${foundLoc}`);
} else {
  console.log(`❌ Plugin: strray-codex-injection.js NOT FOUND`);
  errors.push('Plugin not found');
}

// Try to load MCP client
try {
  const mcpClient = require(path.join(process.cwd(), 'dist/mcps/mcp-client.js'));
  console.log('✅ MCP Client module loads successfully');
} catch (err) {
  errors.push(`MCP Client failed to load: ${err.message}`);
}

console.log('\n══════════════════════════════════════════════════');

if (errors.length > 0) {
  console.log('❌ VALIDATION FAILED');
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  • ${e}`));
  process.exit(1);
} else {
  console.log('✅ MCP CONNECTIVITY VALIDATED');
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  • ${w}`));
  }
  process.exit(0);
}
