#!/usr/bin/env node

/**
 * StringRay CI/CD Pipeline Integration Tests
 *
 * Validates that the framework works correctly in CI/CD environments
 * and that all deployment processes function as expected.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const CI_TEST_DIR = 'ci-test-env';

function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function runCommand(command, description) {
  try {
    log(`Running: ${description}`);
    const result = execSync(command, {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8'
    });
    log(`${description} completed successfully`, 'success');
    return result;
  } catch (error) {
    log(`${description} failed: ${error.message}`, 'error');
    throw error;
  }
}

async function main() {
  log('🧪 StringRay CI/CD Pipeline Integration Tests');
  console.log('==============================================\n');

  try {
    // Test 1: Clean environment setup
    log('Setting up clean CI test environment');
    if (existsSync(CI_TEST_DIR)) {
      execSync(`rm -rf ${CI_TEST_DIR}`);
    }

    execSync(`mkdir -p ${CI_TEST_DIR}`);
    execSync(`cd ${CI_TEST_DIR} && npm init -y`, { stdio: 'pipe' });

    // Test 2: Build framework in CI environment
    runCommand('npm run build:all', 'Build framework');

    // Test 3: Package framework
    runCommand('npm pack', 'Package framework');

    // Test 4: Install in test environment
    const packageFile = execSync('ls strray-ai-*.tgz', { encoding: 'utf8' }).trim();
    runCommand(`cd ${CI_TEST_DIR} && npm install ../${packageFile}`, 'Install package in test environment');

    // Test 5: Run postinstall script
    runCommand(`cd ${CI_TEST_DIR} && node node_modules/strray-ai/scripts/postinstall.cjs`, 'Run postinstall script');

    // Test 6: Validate configuration
    const configPath = join(CI_TEST_DIR, '.opencode', 'oh-my-opencode.json');
    if (!existsSync(configPath)) {
      throw new Error('oh-my-opencode configuration not created');
    }

    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (!config.model_routing || !config.model_routing.orchestrator) {
      throw new Error('Agent configuration missing');
    }

    log('Configuration validation passed', 'success');

    // Test 7: Test CLI commands
    runCommand(`cd ${CI_TEST_DIR} && npx strray-ai status`, 'Test CLI status command');
    runCommand(`cd ${CI_TEST_DIR} && npx strray-ai capabilities`, 'Test CLI capabilities command');

    // Test 8: Validate MCP connectivity
    runCommand(`cd ${CI_TEST_DIR} && node node_modules/strray-ai/scripts/test:mcp-connectivity.js`, 'Test MCP connectivity');

    // Test 9: Test framework health
    runCommand(`cd ${CI_TEST_DIR} && npx strray-ai health`, 'Test framework health check');

    // Test 10: Generate reports
    runCommand(`cd ${CI_TEST_DIR} && npx strray-ai report --type agent-usage`, 'Generate framework report');

    log('\n🎉 All CI/CD integration tests passed!', 'success');
    log(`Test environment: ${CI_TEST_DIR}`, 'info');

    console.log('\n📋 CI/CD Validation Summary:');
    console.log('• ✅ Framework builds successfully');
    console.log('• ✅ Package creates correctly');
    console.log('• ✅ Installation works in clean environment');
    console.log('• ✅ Postinstall configuration applies');
    console.log('• ✅ CLI commands function properly');
    console.log('• ✅ MCP servers connect correctly');
    console.log('• ✅ Framework health checks pass');
    console.log('• ✅ Report generation works');
    console.log('• ✅ All deployment processes validated');

  } catch (error) {
    log(`CI/CD integration test failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

main().catch(error => {
  log(`Unexpected error: ${error.message}`, 'error');
  process.exit(1);
});