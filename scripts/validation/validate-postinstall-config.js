#!/usr/bin/env node

/**
 * Postinstall Configuration Validator
 *
 * Tests that all critical configuration files and folders are properly copied
 * during npm install, including .claude/, .opencode/, and related files
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

class PostinstallConfigValidator {
  constructor() {
    this.results = { passed: [], failed: [] };
  }

  async validateConfiguration() {
    console.log('📁 POSTINSTALL CONFIGURATION VALIDATOR');
    console.log('=====================================');

    const tests = [
      this.validateProjectFiles.bind(this),
      this.validateOpencodeConfig.bind(this),
      this.validateClaudeConfig.bind(this),
      this.validateMCPConfig.bind(this)
    ];

    for (const test of tests) {
      await test();
    }

    this.printSummary();
    return this.results.failed.length === 0;
  }

  async validateProjectFiles() {
    console.log('\n📄 Testing Project Configuration Files...');

    const requiredFiles = [
      { path: '.mcp.json', description: 'MCP server configuration' },
      { path: 'opencode.json', description: 'OpenCode base configuration' },
      { path: '.opencode/oh-my-opencode.json', description: 'oh-my-opencode main config' },
      { path: '.opencode/package.json', description: 'oh-my-opencode package config' },
      { path: '.opencode/README.md', description: 'oh-my-opencode documentation' }
    ];

    let allPresent = true;
    for (const file of requiredFiles) {
      try {
        if (fs.existsSync(file.path)) {
          console.log(`  ✅ ${file.path} - ${file.description}`);
        } else {
          console.log(`  ❌ ${file.path} - ${file.description} (MISSING)`);
          allPresent = false;
        }
      } catch (error) {
        console.log(`  ❌ ${file.path} - Error checking file: ${error.message}`);
        allPresent = false;
      }
    }

    if (allPresent) {
      this.results.passed.push('Project Configuration Files');
    } else {
      this.results.failed.push({
        test: 'Project Configuration Files',
        error: 'Some required configuration files are missing'
      });
    }
  }

  async validateOpencodeConfig() {
    console.log('\n🛠️  Testing OpenCode Configuration...');

    try {
      const configPath = '.opencode/oh-my-opencode.json';
      if (!fs.existsSync(configPath)) {
        console.log(`  ❌ ${configPath} not found`);
        this.results.failed.push({
          test: 'OpenCode Configuration',
          error: 'oh-my-opencode.json not found'
        });
        return;
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Check for disabled_agents
      if (config.disabled_agents && Array.isArray(config.disabled_agents) && config.disabled_agents.includes('sisyphus')) {
        console.log('  ✅ sisyphus agent properly disabled');
      } else {
        console.log('  ❌ sisyphus not disabled in configuration');
        this.results.failed.push({
          test: 'OpenCode Configuration',
          error: 'sisyphus agent not disabled'
        });
        return;
      }

      // Check for plugin registration
      if (config.plugin && Array.isArray(config.plugin)) {
        const hasStringRayPlugin = config.plugin.some(p => p.includes('stringray'));
        if (hasStringRayPlugin) {
          console.log('  ✅ StringRay plugin registered');
        } else {
          console.log('  ❌ StringRay plugin not registered');
          this.results.failed.push({
            test: 'OpenCode Configuration',
            error: 'StringRay plugin not registered'
          });
          return;
        }
      }

      // Check for MCP server disabling
      if (config.disabled_mcps && Array.isArray(config.disabled_mcps)) {
        const requiredDisabled = ['global-everything', 'global-git', 'global-sqlite'];
        const allDisabled = requiredDisabled.every(mcp => config.disabled_mcps.includes(mcp));
        if (allDisabled) {
          console.log('  ✅ Problematic MCP servers disabled');
        } else {
          console.log('  ❌ Some problematic MCP servers not disabled');
          this.results.failed.push({
            test: 'OpenCode Configuration',
            error: 'Problematic MCP servers not properly disabled'
          });
          return;
        }
      }

      this.results.passed.push('OpenCode Configuration');

    } catch (error) {
      console.log(`  ❌ Error validating OpenCode config: ${error.message}`);
      this.results.failed.push({
        test: 'OpenCode Configuration',
        error: error.message
      });
    }
  }

  async validateClaudeConfig() {
    console.log('\n🤖 Testing Claude Desktop Integration...');

    try {
      const claudeDir = path.join(os.homedir(), '.claude');
      const claudeMcpPath = path.join(claudeDir, '.mcp.json');

      if (!fs.existsSync(claudeDir)) {
        console.log(`  ❌ ${claudeDir} directory not found`);
        this.results.failed.push({
          test: 'Claude Desktop Integration',
          error: '.claude directory not created'
        });
        return;
      }

      if (!fs.existsSync(claudeMcpPath)) {
        console.log(`  ❌ ${claudeMcpPath} not found`);
        this.results.failed.push({
          test: 'Claude Desktop Integration',
          error: '.claude/.mcp.json not created'
        });
        return;
      }

      console.log('  ✅ .claude directory created');
      console.log('  ✅ .claude/.mcp.json created');

      // Validate MCP config content
      const mcpConfig = JSON.parse(fs.readFileSync(claudeMcpPath, 'utf8'));
      if (mcpConfig.mcpServers) {
        const serverCount = Object.keys(mcpConfig.mcpServers).length;
        console.log(`  ✅ MCP config valid (${serverCount} servers configured)`);

        // Check for disabled problematic servers
        const disabledServers = ['global-everything', 'global-git', 'global-sqlite'];
        let allDisabled = true;
        for (const server of disabledServers) {
          if (mcpConfig.mcpServers[server]) {
            console.log(`  ❌ ${server} should be disabled but is still active`);
            allDisabled = false;
          }
        }

        if (allDisabled) {
          console.log('  ✅ Problematic MCP servers properly disabled');
        } else {
          this.results.failed.push({
            test: 'Claude Desktop Integration',
            error: 'Some problematic MCP servers not disabled'
          });
          return;
        }

      } else {
        console.log('  ❌ Invalid MCP configuration structure');
        this.results.failed.push({
          test: 'Claude Desktop Integration',
          error: 'Invalid MCP configuration structure'
        });
        return;
      }

      this.results.passed.push('Claude Desktop Integration');

    } catch (error) {
      console.log(`  ❌ Error validating Claude config: ${error.message}`);
      this.results.failed.push({
        test: 'Claude Desktop Integration',
        error: error.message
      });
    }
  }

  async validateMCPConfig() {
    console.log('\n🔧 Testing MCP Server Configuration...');

    try {
      const mcpConfig = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));

      if (mcpConfig.mcpServers) {
        const serverCount = Object.keys(mcpConfig.mcpServers).length;
        console.log(`  ✅ MCP config valid (${serverCount} servers configured)`);

        // Check for required StringRay servers
        const requiredServers = [
          'librarian', 'session-management', 'orchestrator', 'enhanced-orchestrator',
          'enforcer', 'api-design', 'architecture-patterns', 'git-workflow',
          'performance-optimization', 'project-analysis', 'testing-strategy',
          'code-review', 'security-audit', 'ui-ux-design', 'refactoring-strategies',
          'testing-best-practices'
        ];

        let missingServers = [];
        for (const server of requiredServers) {
          if (!mcpConfig.mcpServers[server]) {
            missingServers.push(server);
          }
        }

        if (missingServers.length === 0) {
          console.log('  ✅ All required StringRay MCP servers configured');
          this.results.passed.push('MCP Server Configuration');
        } else {
          console.log(`  ❌ Missing MCP servers: ${missingServers.join(', ')}`);
          this.results.failed.push({
            test: 'MCP Server Configuration',
            error: `Missing MCP servers: ${missingServers.join(', ')}`
          });
        }

      } else {
        console.log('  ❌ Invalid MCP configuration structure');
        this.results.failed.push({
          test: 'MCP Server Configuration',
          error: 'Invalid MCP configuration structure'
        });
      }

    } catch (error) {
      console.log(`  ❌ Error validating MCP config: ${error.message}`);
      this.results.failed.push({
        test: 'MCP Server Configuration',
        error: error.message
      });
    }
  }

  printSummary() {
    console.log('\n📊 POSTINSTALL CONFIGURATION SUMMARY');
    console.log('=====================================');

    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach(failure => {
        console.log(`  • ${failure.test}: ${failure.error}`);
      });
    }

    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      this.results.passed.forEach(test => {
        console.log(`  • ${test}`);
      });
    }
  }
}

// Run postinstall configuration validation
const validator = new PostinstallConfigValidator();
validator.validateConfiguration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Postinstall configuration validation failed:', error);
  process.exit(1);
});