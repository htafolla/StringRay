#!/usr/bin/env node
/**
 * Version Compliance Enforcement Script
 *
 * Thin CLI wrapper around VersionComplianceProcessor.
 * Called by CI/CD, pre-commit hooks, and manual runs.
 *
 * This script should NOT contain enforcement logic - 
 * all logic lives in src/processors/version-compliance-processor.ts
 *
 * @version 1.0.0
 * @deprecated Use VersionComplianceProcessor directly in new code
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m';

async function main() {
  console.log(`${BLUE}🔍 ENFORCER AGENT: Version Compliance Check${NC}`);
  console.log(`${BLUE}==============================================${NC}`);
  console.log('');

  try {
    // Import and run the processor - use file URL for ESM compatibility
    // __dirname is the script's directory (scripts/node/), go up 2 levels to project root
    const scriptDir = path.join(__dirname);
    const projectRoot = path.join(scriptDir, '..', '..');
    const processorPath = path.join(projectRoot, 'dist', 'processors', 'version-compliance-processor.js');
    const { VersionComplianceProcessor } = await import(`file://${processorPath}`);
    const processor = new VersionComplianceProcessor(projectRoot);
    
    const result = await processor.validateVersionCompliance();

    // Display results
    console.log(`${BLUE}📊 Version Audit:${NC}`);
    console.log(`   NPM Published:    ${BLUE}${result.npmVersion}${NC}`);
    console.log(`   package.json:     ${BLUE}${result.pkgVersion}${NC}`);
    console.log(`   Version Manager:  ${BLUE}${result.uvmVersion}${NC}`);
    console.log('');

    // Rule 1: UVM 1 ahead of NPM
    console.log('1️⃣  Checking: Version Manager 1 Ahead Rule');
    if (result.npmVersion !== 'NOT_PUBLISHED' && result.npmVersion !== 'ERROR') {
      const expectedUvm = incrementPatch(result.npmVersion);
      if (result.uvmVersion === expectedUvm) {
        console.log(`   ${GREEN}✅ PASS:${NC} Version manager is 1 ahead (${result.uvmVersion} > ${result.npmVersion})`);
      } else {
        console.log(`   ${RED}❌ VIOLATION:${NC} Version manager not 1 ahead of npm`);
        console.log(`      NPM:      ${result.npmVersion}`);
        console.log(`      UVM:      ${result.uvmVersion}`);
        console.log(`      Expected: ${expectedUvm}`);
      }
    } else {
      console.log(`   ${YELLOW}⚠️  NPM version not available (first publish)${NC}`);
    }
    console.log('');

    // Rule 2: package.json sync
    console.log('2️⃣  Checking: package.json Synchronization');
    if (result.pkgVersion === result.uvmVersion) {
      console.log(`   ${GREEN}✅ PASS:${NC} package.json matches UVM (${result.pkgVersion})`);
    } else {
      console.log(`   ${YELLOW}⚠️  WARNING:${NC} package.json version mismatch`);
      console.log(`      package.json: ${result.pkgVersion}`);
      console.log(`      UVM:          ${result.uvmVersion}`);
      console.log(`      ℹ️  Run: npm version [patch|minor|major] to sync`);
    }
    console.log('');

    // Display errors and warnings summary
    console.log(`${BLUE}==============================================${NC}`);
    
    if (result.errors.length > 0) {
      console.log(`${RED}❌ COMPLIANCE CHECK FAILED${NC}`);
      console.log(`   Errors:   ${result.errors.length}`);
      console.log(`   Warnings: ${result.warnings.length}`);
      console.log('');
      console.log(`${RED}🚫 BLOCKED: Cannot proceed with commit/publish${NC}`);
      console.log('   Violations:');
      result.errors.forEach(e => console.log(`     ${RED}•${NC} ${e}`));
      
      if (result.fixes && result.fixes.length > 0) {
        console.log('');
        console.log(`${YELLOW}🔧 FIXES:${NC}`);
        result.fixes.forEach(f => {
          console.log(`     ${YELLOW}•${NC} ${f.description}`);
          console.log(`       Command: ${f.command}`);
        });
      }
      
      process.exit(1);
    } else {
      console.log(`${GREEN}✅ COMPLIANCE CHECK PASSED${NC}`);
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.length} (non-blocking)`);
        result.warnings.forEach(w => console.log(`     ${YELLOW}⚠️${NC} ${w}`));
      }
      console.log('');
      console.log(`${GREEN}🚀 APPROVED: Ready for commit/publish${NC}`);
      process.exit(0);
    }

  } catch (error) {
    console.error(`${RED}❌ Fatal error running version compliance:${NC}`, error);
    process.exit(1);
  }
}

// Helper to increment patch version
function incrementPatch(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = parts[2] + 1;
  return parts.join('.');
}

main();
