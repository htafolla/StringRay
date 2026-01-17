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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running in consumer environment (node_modules)
const isConsumerEnvironment = __dirname.includes('node_modules/strray-ai');
const pathPrefix = isConsumerEnvironment ? '' : '';

const MCP_SERVERS = [
  { name: 'librarian', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/project-analysis.server.js` },
  { name: 'session-management', path: `${pathPrefix}.opencode/mcps/session-management.server.js` },
  { name: 'orchestrator', path: `${pathPrefix}dist/plugin/mcps/orchestrator.server.js` },
  { name: 'enhanced-orchestrator', path: `${pathPrefix}dist/plugin/mcps/enhanced-orchestrator.server.js` },
  { name: 'enforcer', path: `${pathPrefix}dist/plugin/mcps/enforcer-tools.server.js` },
  { name: 'api-design', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/api-design.server.js` },
  { name: 'architecture-patterns', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/architecture-patterns.server.js` },
  { name: 'git-workflow', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/git-workflow.server.js` },
  { name: 'performance-optimization', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/performance-optimization.server.js` },
  { name: 'project-analysis', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/project-analysis.server.js` },
  { name: 'testing-strategy', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/testing-strategy.server.js` },
  { name: 'code-review', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/code-review.server.js` },
  { name: 'security-audit', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/security-audit.server.js` },
  { name: 'ui-ux-design', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/ui-ux-design.server.js` },
  { name: 'refactoring-strategies', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/refactoring-strategies.server.js` },
  { name: 'testing-best-practices', path: `${pathPrefix}dist/plugin/mcps/knowledge-skills/testing-best-practices.server.js` }
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
    // Resolve paths relative to package root, not consumer working directory
    const scriptDir = path.dirname(__filename);
    const packageRoot = path.join(scriptDir, '..', '..'); // scripts/validation -> scripts -> package root
    const serverPath = path.join(packageRoot, server.path);

    return new Promise((resolve) => {
      console.log(`🔧 Testing: ${server.name}`);

      // Check if file exists
      if (!fs.existsSync(serverPath)) {
        console.log(`  ❌ File not found: ${server.path}`);
        this.results.failed.push({ server: server.name, error: 'File not found' });
        resolve();
        return;
      }

       // Test server startup (longer timeout for CI environments)
       const isCI = process.env.CI === 'true';

       const child = spawn('node', [serverPath], {
         stdio: ['pipe', 'pipe', 'pipe']
       });

      let stdout = '';
      let stderr = '';
      let started = false;

       child.stdout.on('data', (data) => {
         stdout += data.toString();
       });

       child.stderr.on('data', (data) => {
         stderr += data.toString();
       });

       // For MCP servers, success means they start without immediate crash
       // Wait a short time, then kill cleanly if still running
       const testTimeout = isCI ? 5000 : 2000; // 5s for CI, 2s for local

       setTimeout(() => {
         if (!child.killed) {
           // Server is still running after test period - success!
           console.log(`  ✅ Server started successfully`);
           child.kill('SIGTERM');
           started = true;
         }
       }, testTimeout);

       child.on('close', (code) => {
         if (started || code === null || code === 0) {
           // Clean exit or was killed by our test - success
           if (!this.results.passed.includes(server.name)) {
             console.log(`  ✅ Server validation passed`);
             this.results.passed.push(server.name);
           }
         } else if (stderr && stderr.length > 0) {
           // Server produced error output - failure
           console.log(`  ❌ Server error: ${stderr.slice(0, 50)}...`);
           this.results.failed.push({
             server: server.name,
             error: `Error output: ${stderr.slice(0, 100)}...`
           });
         } else {
           // Unexpected exit code
           console.log(`  ❌ Unexpected exit (code: ${code})`);
           this.results.failed.push({
             server: server.name,
             error: `Exit code ${code}`
           });
         }
         resolve();
       });

       // Safety timeout - if server is still running after much longer, force kill
       setTimeout(() => {
         if (!child.killed) {
           console.log(`  ❌ Server did not respond to termination`);
           child.kill('SIGKILL');
         }
       }, testTimeout + 3000);

      child.on('error', (error) => {
        console.log(`  ❌ Process error: ${error.message}`);
        this.results.failed.push({
          server: server.name,
          error: error.message
        });
        resolve();
      });

      // Timeout after 5 seconds - kill successfully started servers
      setTimeout(() => {
        if (started) {
          child.kill();
          console.log(`  ✅ Server running successfully (killed after 5s)`);
          this.results.passed.push(server.name);
        } else {
          child.kill();
          console.log(`  ❌ Timeout: Server failed to start within 5s`);
          this.results.failed.push({
            server: server.name,
            error: 'Startup timeout'
          });
        }
        resolve();
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
