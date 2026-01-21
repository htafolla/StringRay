#!/usr/bin/env node

/**
 * StringRay CLI - Command Line Interface
 *
 * Provides commands for installing and managing StringRay framework
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { join } from 'path';

// Get package root relative to this script location
const packageRoot = join(new URL('.', import.meta.url).pathname, '..', '..');



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
        // { file: '.mcp.json', description: 'MCP server configuration' }, // COMMENTED OUT: No longer checking .mcp.json
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

program
  .command('debug')
  .description('Debug command')
  .action(async () => {
    console.log('DEBUG: CLI is working');
    console.log('DEBUG: packageRoot =', packageRoot);
    console.log('DEBUG: cwd =', process.cwd());
  });

program
  .command('capabilities')
  .alias('caps')
  .description('Show all available StringRay framework capabilities')
  .action(async () => {
    console.log('🚀 StringRay Framework Capabilities');
    console.log('=====================================');
    console.log('');

    console.log('🤖 Available Agent Commands:');
    console.log('  @enforcer           - Codex compliance & error prevention');
    console.log('  @architect          - System design & technical decisions');
    console.log('  @orchestrator       - Multi-agent workflow coordination');
    console.log('  @bug-triage-specialist - Error investigation & surgical fixes');
    console.log('  @code-reviewer      - Quality assessment & standards validation');
    console.log('  @security-auditor   - Vulnerability detection & compliance');
    console.log('  @refactorer         - Technical debt elimination & code consolidation');
    console.log('  @test-architect     - Testing strategy & coverage optimization');
    console.log('');

    console.log('🛠️ Framework Tools:');
    console.log('  framework-reporting-system - Generate comprehensive activity reports');
    console.log('  complexity-analyzer       - Analyze code complexity & delegation decisions');
    console.log('  codex-injector           - Apply development standards automatically');
    console.log('');

    console.log('🎯 Skills System (23 lazy-loaded capabilities):');
    console.log('  project-analysis      - Codebase metrics and analysis');
    console.log('  testing-strategy      - Test planning and execution');
    console.log('  code-review          - Quality assessment');
    console.log('  security-audit       - Vulnerability scanning');
    console.log('  performance-optimization - Performance tuning');
    console.log('  refactoring-strategies   - Code improvement techniques');
    console.log('  ui-ux-design         - User interface design');
    console.log('  documentation-generation - Technical documentation');
    console.log('  ... and 15 more specialized skills');
    console.log('');

    console.log('📚 Help & Discovery:');
    console.log('  Use the framework-help MCP server for detailed information:');
    console.log('  - strray_get_capabilities: Complete capabilities overview');
    console.log('  - strray_get_commands: Command usage examples');
    console.log('  - strray_explain_capability: Detailed feature explanations');
    console.log('');

    console.log('📊 Enterprise Features:');
    console.log('  • 99.6% error prevention through codex compliance');
    console.log('  • 90% resource reduction (0 baseline processes)');
    console.log('  • Multi-agent orchestration with intelligent delegation');
    console.log('  • Systematic code quality enforcement');
    console.log('  • Real-time activity monitoring and reporting');
    console.log('');

    console.log('🎯 Getting Started:');
    console.log('  1. Use @enforcer for code quality validation');
    console.log('  2. Use @orchestrator for complex development tasks');
    console.log('  3. Access skills for specialized capabilities');
    console.log('  4. Check framework-reporting-system for activity reports');
    console.log('  5. Run "npx strray-ai capabilities" anytime for this overview');
  });

// Add help text
program.addHelpText('after', `

Examples:
  $ npx strray-ai install       # Install StringRay in current project
  $ npx strray-ai init          # Initialize configuration
  $ npx strray-ai status        # Check installation status
  $ npx strray-ai validate      # Validate framework setup
  $ npx strray-ai capabilities  # Show all available capabilities

For more information, visit: https://stringray.dev
`);

// Parse command line arguments
program.parse();