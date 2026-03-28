#!/usr/bin/env node

/**
 * Validate Postinstall Configuration
 * 
 * Verifies that postinstall correctly set up all required files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

console.log('🔍 Validating Postinstall Configuration...\n');

// Check opencode.json (main config)
check('opencode.json', 'OpenCode configuration');

// Check plugin (can be in .opencode/plugins/ or .opencode/plugin/)
const pluginLocations = ['.opencode/plugins/strray-codex-injection.js', '.opencode/plugin/strray-codex-injection.js'];
const pluginFound = pluginLocations.some(loc => fs.existsSync(path.join(process.cwd(), loc)));
if (pluginFound) {
  const foundLoc = pluginLocations.find(loc => fs.existsSync(path.join(process.cwd(), loc)));
  console.log(`✅ Plugin file: ${foundLoc}`);
} else {
  console.log(`❌ Plugin file: strray-codex-injection.js NOT FOUND`);
  errors.push('Plugin file not found');
}

// Check agents
if (fs.existsSync(path.join(process.cwd(), '.opencode/agents'))) {
  const agents = fs.readdirSync(path.join(process.cwd(), '.opencode/agents'));
  console.log(`✅ Agents directory: ${agents.length} agents found`);
} else {
  errors.push('Agents directory not found');
}

// Check hooks
check('.opencode/hooks/post-commit', 'Post-commit hook');
check('.opencode/hooks/post-push', 'Post-push hook');

// Check strray config
check('.opencode/strray/config.json', 'StrRay config');
check('.opencode/strray/features.json', 'StrRay features');

console.log('\n══════════════════════════════════════════════════');

if (errors.length > 0) {
  console.log('❌ VALIDATION FAILED');
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  • ${e}`));
  process.exit(1);
} else {
  console.log('✅ VALIDATION PASSED');
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  • ${w}`));
  }
  process.exit(0);
}
