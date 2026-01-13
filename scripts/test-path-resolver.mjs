#!/usr/bin/env node

/**
 * Test script to verify path resolver functionality
 * This script demonstrates the path resolution problem and solution
 */

// Use the import resolver for cross-environment compatibility
import { importResolver } from '../dist/plugin/utils/import-resolver.js';

const { pathResolver } = await importResolver.importModule('utils/path-resolver');

// Alternative: For development, we could use a conditional import
// const { pathResolver } = process.env.NODE_ENV === 'development'
//   ? await import('../src/utils/path-resolver.ts')
//   : await import('../dist/plugin/utils/path-resolver.js');

console.log('🔍 StrRay Path Resolver Test\n');

console.log('📊 Environment Information:');
const envInfo = pathResolver.getEnvironmentInfo();
console.log(JSON.stringify(envInfo, null, 2));

console.log('\n🔗 Agent Path Resolution Tests:');
const agents = ['enforcer', 'architect', 'refactorer'];

agents.forEach(agentName => {
  const resolvedPath = pathResolver.resolveAgentPath(agentName);
  console.log(`  ${agentName}: ${resolvedPath}`);
});

console.log('\n✅ Path resolver test completed!');