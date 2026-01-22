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
    console.log('  @librarian          - Codebase exploration & documentation');
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

    console.log('📊 Core Features:');
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

program
  .command('health')
  .alias('check')
  .description('Check framework health and system status')
  .action(async () => {
    console.log('🏥 StringRay Framework Health Check');
    console.log('====================================');
    console.log('');

    try {
      const fs = await import('fs');
      const path = await import('path');

      // Check core components
      const checks = [
        {
          name: 'Package Installation',
          check: () => fs.existsSync(path.join(packageRoot, 'package.json')),
          success: '✅ Framework package found',
          error: '❌ Framework package missing'
        },
        {
          name: 'Configuration Files',
          check: () => fs.existsSync(path.join(process.cwd(), '.opencode', 'oh-my-opencode.json')),
          success: '✅ oh-my-opencode configuration found',
          error: '⚠️ oh-my-opencode config missing (run install first)'
        },
        {
          name: 'Agent System',
          check: () => fs.existsSync(path.join(packageRoot, 'dist', 'agents')),
          success: '✅ Agent system available',
          error: '❌ Agent system not built'
        },
        {
          name: 'MCP Servers',
          check: () => fs.existsSync(path.join(packageRoot, 'dist', 'mcps')),
          success: '✅ MCP servers available',
          error: '❌ MCP servers not built'
        }
      ];

      let allHealthy = true;

      for (const check of checks) {
        try {
          if (check.check()) {
            console.log(check.success);
          } else {
            console.log(check.error);
            allHealthy = false;
          }
        } catch (error) {
          console.log(`${check.name}: ❌ Error during check`);
          allHealthy = false;
        }
      }

      console.log('');

      if (allHealthy) {
        console.log('🎉 Framework is healthy and ready to use!');
        console.log('');
        console.log('💡 Quick commands:');
        console.log('  • @enforcer analyze this code');
        console.log('  • @orchestrator coordinate task');
        console.log('  • framework-reporting-system');
      } else {
        console.log('⚠️ Some components need attention. Run "npx strray-ai install" to fix.');
      }

    } catch (error) {
      console.error('❌ Health check failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate framework activity and health reports')
  .option('-t, --type <type>', 'Report type (full-analysis, agent-usage, performance)', 'full-analysis')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    console.log(`📊 StringRay Framework Report: ${options.type}`);
    console.log('==========================================');
    console.log('');

    try {
      // Check if framework-reporting-system is available
      const reportCommand = 'framework-reporting-system';
      const reportArgs = [`generate-report`, `--type=${options.type}`];

      if (options.output && typeof options.output === 'string') {
        reportArgs.push(`--output=${options.output}`);
      }

      console.log(`Running: ${reportCommand} ${reportArgs.join(' ')}`);

      execSync(`${reportCommand} ${reportArgs.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('');
      console.log('✅ Report generated successfully!');

      if (options.output && typeof options.output === 'string') {
        console.log(`📁 Report saved to: ${options.output}`);
      }

    } catch (error) {
      console.error('❌ Report generation failed:', error instanceof Error ? error.message : String(error));
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('  • Make sure oh-my-opencode is running');
      console.log('  • Check framework installation: npx strray-ai status');
      console.log('  • Try manual report: framework-reporting-system generate-report');
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Automatically fix common framework issues by running the postinstall setup')
  .action(async () => {
    console.log('🔧 StringRay Framework Fix');
    console.log('===========================');
    console.log('');

    try {
      console.log('Running postinstall setup to restore configuration...');

      // Run the postinstaller script (same as install command)
      const postinstallScript = join(packageRoot, 'scripts', 'postinstall.cjs');
      execSync(`node "${postinstallScript}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('');
      console.log('🎉 Framework configuration restored successfully!');
      console.log('');
      console.log('💡 Next steps:');
      console.log('  • Restart oh-my-opencode to load the restored configuration');
      console.log('  • Run: npx strray-ai health (to verify everything works)');
      console.log('  • Try: @enforcer analyze this code');

    } catch (error) {
      console.error('❌ Fix command failed:', error instanceof Error ? error.message : String(error));
      console.log('');
      console.log('💡 Manual fix options:');
      console.log('  • Delete .opencode/ and .stringray/ directories');
      console.log('  • Run: npx strray-ai install');
      console.log('  • Or manually restore missing configuration files');
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Diagnose framework issues (does not fix them)')
  .action(async () => {
    console.log('🩺 StringRay Framework Doctor');
    console.log('===============================');
    console.log('');

    try {
      const fs = await import('fs');
      const path = await import('path');

      const issues = [];
      const fixes = [];

      // Check Node.js version
      const nodeVersion = process.version;
      const versionParts = nodeVersion.slice(1).split('.');
      const majorVersion = parseInt(versionParts[0] || '0');
      if (majorVersion < 18) {
        issues.push('Node.js version too old');
        fixes.push('Upgrade to Node.js 18+');
      } else {
        console.log('✅ Node.js version:', nodeVersion);
      }

      // Check package installation
      const packageExists = fs.existsSync(path.join(process.cwd(), 'node_modules', 'strray-ai'));
      if (!packageExists) {
        issues.push('StringRay package not installed');
        fixes.push('Run: npm install strray-ai');
      } else {
        console.log('✅ StringRay package installed');
      }

      // Check configuration
      const configExists = fs.existsSync(path.join(process.cwd(), '.opencode', 'oh-my-opencode.json'));
      if (!configExists) {
        issues.push('oh-my-opencode configuration missing');
        fixes.push('Run: npx strray-ai fix');
      } else {
        console.log('✅ oh-my-opencode configuration found');
      }

      // Check for common issues
      const mcpConfigExists = fs.existsSync(path.join(process.cwd(), '.mcp.json'));
      if (mcpConfigExists) {
        console.log('ℹ️ Found .mcp.json - may conflict with framework');
        fixes.push('Consider removing .mcp.json or excluding framework servers');
      }

      console.log('');

      if (issues.length === 0) {
        console.log('🎉 No issues found! Framework is healthy.');
        console.log('');
        console.log('💡 Pro tips:');
        console.log('  • Use @enforcer for code quality checks');
        console.log('  • Run reports regularly: npx strray-ai report');
        console.log('  • Check health anytime: npx strray-ai health');
      } else {
        console.log('⚠️ Issues found:');
        issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });

        console.log('');
        console.log('🔧 Run "npx strray-ai fix" to automatically fix these issues');
      }

    } catch (error) {
      console.error('❌ Doctor check failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add help text
program.addHelpText('after', `

Examples:
   $ npx strray-ai install       # Install StringRay in current project
   $ npx strray-ai init          # Initialize configuration
   $ npx strray-ai status        # Check installation status
   $ npx strray-ai validate      # Validate framework setup
   $ npx strray-ai capabilities  # Show all available capabilities
   $ npx strray-ai health        # Check framework health and status
   $ npx strray-ai report        # Generate activity and health reports
   $ npx strray-ai fix           # Automatically restore missing config files
   $ npx strray-ai doctor        # Diagnose issues (does not fix them)

Quick Start:
   1. Install: npx strray-ai install
   2. Check health: npx strray-ai health
   3. Use agents: @enforcer analyze this code
   4. Generate reports: npx strray-ai report
   5. Fix issues: npx strray-ai fix

For more information, visit: https://github.com/htafolla/stringray
`);

// Parse command line arguments
program.parse();