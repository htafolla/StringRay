#!/usr/bin/env node

/**
 * StringRay CLI - Command Line Interface
 *
 * Provides commands for installing and managing StringRay framework
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the package root (where this script is located)
const packageRoot = join(__dirname, '..', '..');

const program = new Command();

program
  .name('strray-ai')
  .description('⚡ StringRay ⚡: Bulletproof AI orchestration with systematic error prevention')
  .version('1.1.0');

program
  .command('install')
  .description('Install StringRay framework in the current project')
  .action(async () => {
    console.log('🔧 StringRay CLI: Installing framework...');

    try {
      // Run the postinstaller script
      const postinstallScript = join(packageRoot, 'scripts', 'postinstall.cjs');
      execSync(`node "${postinstallScript}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('✅ StringRay framework installed successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Restart oh-my-opencode to load the plugin');
      console.log('2. Run "opencode agent list" to see StrRay agents');
      console.log('3. Try "@enforcer analyze this code" to test the plugin');

    } catch (error) {
      console.error('❌ Installation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize StringRay configuration in the current project')
  .action(async () => {
    console.log('🚀 StringRay CLI: Initializing configuration...');

    try {
      // Run the postinstaller script (same as install)
      const postinstallScript = join(packageRoot, 'scripts', 'postinstall.cjs');
      execSync(`node "${postinstallScript}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('✅ StringRay configuration initialized!');
    } catch (error) {
      console.error('❌ Initialization failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check StringRay framework status')
  .action(async () => {
    console.log('🔍 StringRay CLI: Checking framework status...');

    try {
      // Check if required files exist
      const fs = await import('fs');
      const path = await import('path');

      const checks = [
        { file: 'opencode.json', description: 'OpenCode configuration' },
        { file: '.opencode/enforcer-config.json', description: 'Framework configuration' },
        { file: '.mcp.json', description: 'MCP server configuration' },
      ];

      let allGood = true;

      for (const check of checks) {
        const exists = fs.existsSync(path.join(process.cwd(), check.file));
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${check.description}: ${check.file}`);
        if (!exists) allGood = false;
      }

      if (allGood) {
        console.log('');
        console.log('🎉 StringRay framework is properly configured!');
      } else {
        console.log('');
        console.log('⚠️ Some components are missing. Run "strray-ai install" to fix.');
      }

    } catch (error) {
      console.error('❌ Status check failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate StringRay framework installation')
  .action(async () => {
    console.log('🔬 StringRay CLI: Validating installation...');

    try {
      // Run the init.sh script to validate
      const initScript = join(packageRoot, '.opencode', 'init.sh');
      execSync(`bash "${initScript}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add help text
program.addHelpText('after', `

Examples:
  $ npx strray-ai install    # Install StringRay in current project
  $ npx strray-ai init       # Initialize configuration
  $ npx strray-ai status     # Check installation status
  $ npx strray-ai validate   # Validate framework setup

For more information, visit: https://stringray.dev
`);

// Parse command line arguments
program.parse();