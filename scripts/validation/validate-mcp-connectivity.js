#!/usr/bin/env node

/**
 * MCP Server Connectivity Validator
 *
 * Tests all StringRay MCP servers for proper startup and protocol compliance
 * Validates external integration points that internal tests miss
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const MCP_SERVERS = [
  { name: 'orchestrator', path: 'dist/mcps/orchestrator.server.js' },
  { name: 'enhanced-orchestrator', path: 'dist/mcps/enhanced-orchestrator.server.js' },
  { name: 'enforcer', path: 'dist/mcps/enforcer-tools.server.js' },
  { name: 'api-design', path: 'dist/mcps/knowledge-skills/api-design.server.js' },
  { name: 'architecture-patterns', path: 'dist/mcps/knowledge-skills/architecture-patterns.server.js' },
  { name: 'git-workflow', path: 'dist/mcps/knowledge-skills/git-workflow.server.js' },
  { name: 'performance-optimization', path: 'dist/mcps/knowledge-skills/performance-optimization.server.js' },
  { name: 'project-analysis', path: 'dist/mcps/knowledge-skills/project-analysis.server.js' },
  { name: 'testing-strategy', path: 'dist/mcps/knowledge-skills/testing-strategy.server.js' },
  { name: 'code-review', path: 'dist/mcps/knowledge-skills/code-review.server.js' },
  { name: 'security-audit', path: 'dist/mcps/knowledge-skills/security-audit.server.js' },
  { name: 'ui-ux-design', path: 'dist/mcps/knowledge-skills/ui-ux-design.server.js' },
  { name: 'refactoring-strategies', path: 'dist/mcps/knowledge-skills/refactoring-strategies.server.js' },
  { name: 'testing-best-practices', path: 'dist/mcps/knowledge-skills/testing-best-practices.server.js' },
  { name: 'lint', path: 'dist/mcps/lint.server.js' }
];

class MCPServerValidator {
  constructor() {
    this.results = { passed: [], failed: [] };
  }

  async validateAllServers() {
    console.log('🔍 MCP SERVER CONNECTIVITY VALIDATOR');
    console.log('=====================================');
    console.log(`Testing ${MCP_SERVERS.length} StringRay MCP servers...\n`);

    for (const server of MCP_SERVERS) {
      await this.validateServer(server);
    }

    this.printSummary();
    return this.results.failed.length === 0;
  }

  async validateServer(server) {
    const serverPath = path.join(process.cwd(), server.path);

    return new Promise((resolve) => {
      console.log(`🔧 Testing: ${server.name}`);

      // Check if file exists
      if (!fs.existsSync(serverPath)) {
        console.log(`  ❌ File not found: ${server.path}`);
        this.results.failed.push({ server: server.name, error: 'File not found' });
        resolve();
        return;
      }

      // Test server startup
      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });

      let stdout = '';
      let stderr = '';
      let started = false;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.includes('MCP Server') && !started) {
          started = true;
          console.log(`  ✅ Server started successfully`);
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && started && !stderr.includes('Server does not support tools')) {
          console.log(`  ✅ Protocol compliance: OK`);
          this.results.passed.push(server.name);
        } else if (stderr.includes('Server does not support tools')) {
          console.log(`  ❌ Missing tool capabilities declaration`);
          this.results.failed.push({
            server: server.name,
            error: 'Missing tool capabilities'
          });
        } else {
          console.log(`  ❌ Startup failed (code: ${code})`);
          this.results.failed.push({
            server: server.name,
            error: `Exit code ${code}: ${stderr.slice(0, 100)}...`
          });
        }
        resolve();
      });

      child.on('error', (error) => {
        console.log(`  ❌ Process error: ${error.message}`);
        this.results.failed.push({
          server: server.name,
          error: error.message
        });
        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!started) {
          child.kill();
          console.log(`  ❌ Timeout: Server failed to start within 5s`);
          this.results.failed.push({
            server: server.name,
            error: 'Startup timeout'
          });
          resolve();
        }
      }, 5000);
    });
  }

  printSummary() {
    console.log('\n📊 MCP SERVER VALIDATION SUMMARY');
    console.log('==================================');

    console.log(`✅ Passed: ${this.results.passed.length}/${MCP_SERVERS.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}/${MCP_SERVERS.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED SERVERS:');
      this.results.failed.forEach(failure => {
        console.log(`  • ${failure.server}: ${failure.error}`);
      });
    }

    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED SERVERS:');
      this.results.passed.forEach(server => {
        console.log(`  • ${server}`);
      });
    }
  }
}

// Run validation
const validator = new MCPServerValidator();
validator.validateAllServers().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Validation failed with error:', error);
  process.exit(1);
});
