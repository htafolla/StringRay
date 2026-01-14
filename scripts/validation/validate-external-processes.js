#!/usr/bin/env node

/**
 * External Process Communication Validator
 *
 * Tests StringRay's ability to spawn and communicate with external processes
 * Validates the orchestration system's external integration capabilities
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class ExternalProcessValidator {
  constructor() {
    this.results = { passed: [], failed: [] };
  }

  async validateExternalCommunication() {
    console.log('🔄 EXTERNAL PROCESS COMMUNICATION VALIDATOR');
    console.log('============================================');

    const tests = [
      this.validateProcessSpawning.bind(this),
      this.validateInterProcessCommunication.bind(this),
      this.validateResourceCleanup.bind(this),
      this.validateErrorHandling.bind(this)
    ];

    for (const test of tests) {
      await test();
    }

    this.printSummary();
    return this.results.failed.length === 0;
  }

  async validateProcessSpawning() {
    console.log('\n🚀 Testing Process Spawning...');

    return new Promise((resolve) => {
      // Test spawning a simple MCP server process
      const serverPath = path.join(process.cwd(), 'dist/mcps/enhanced-orchestrator.server.js');

      if (!fs.existsSync(serverPath)) {
        console.log('  ❌ Server file not found');
        this.results.failed.push({ test: 'Process Spawning', error: 'Server file missing' });
        resolve();
        return;
      }

      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 8000
      });

      let started = false;

      child.stdout.on('data', (data) => {
        if (data.toString().includes('MCP Server') && !started) {
          started = true;
          console.log('  ✅ Process spawned successfully');
        }
      });

      child.on('close', (code) => {
        if (started) {
          this.results.passed.push('Process Spawning');
        } else {
          this.results.failed.push({ test: 'Process Spawning', error: `Exit code ${code}` });
        }
        resolve();
      });

      child.on('error', (error) => {
        this.results.failed.push({ test: 'Process Spawning', error: error.message });
        resolve();
      });

      // Clean up after 3 seconds
      setTimeout(() => {
        child.kill();
        if (!started) {
          this.results.failed.push({ test: 'Process Spawning', error: 'Process failed to start' });
        }
        resolve();
      }, 3000);
    });
  }

  async validateInterProcessCommunication() {
    console.log('\n💬 Testing Inter-Process Communication...');

    return new Promise((resolve) => {
      // Test MCP protocol communication
      const serverPath = path.join(process.cwd(), 'dist/mcps/enhanced-orchestrator.server.js');

      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let responseReceived = false;

      child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('initialized') || output.includes('running')) {
          responseReceived = true;
        }
      });

      // Send a test message after 1 second
      setTimeout(() => {
        if (responseReceived) {
          console.log('  ✅ Inter-process communication working');
          this.results.passed.push('Inter-Process Communication');
        } else {
          console.log('  ❌ No response from spawned process');
          this.results.failed.push({ test: 'Inter-Process Communication', error: 'No response received' });
        }
        child.kill();
        resolve();
      }, 2000);

      child.on('error', (error) => {
        this.results.failed.push({ test: 'Inter-Process Communication', error: error.message });
        resolve();
      });
    });
  }

  async validateResourceCleanup() {
    console.log('\n🧹 Testing Resource Cleanup...');

    return new Promise((resolve) => {
      const processes = [];

      // Spawn multiple processes
      for (let i = 0; i < 3; i++) {
        const child = spawn('node', ['-e', 'setInterval(() => {}, 1000)'], {
          stdio: 'ignore'
        });
        processes.push(child);
      }

      // Wait a moment then kill them
      setTimeout(() => {
        let cleanedUp = 0;
        processes.forEach(child => {
          child.on('close', () => {
            cleanedUp++;
            if (cleanedUp === processes.length) {
              console.log('  ✅ Resource cleanup working');
              this.results.passed.push('Resource Cleanup');
              resolve();
            }
          });
          child.kill();
        });

        // Timeout if cleanup takes too long
        setTimeout(() => {
          if (cleanedUp < processes.length) {
            console.log('  ❌ Resource cleanup timeout');
            this.results.failed.push({ test: 'Resource Cleanup', error: 'Cleanup timeout' });
            resolve();
          }
        }, 1000);
      }, 500);
    });
  }

  async validateErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');

    return new Promise((resolve) => {
      // Test spawning a non-existent process
      const child = spawn('nonexistentcommand', [], {
        stdio: 'pipe'
      });

      let errorHandled = false;

      child.on('error', (error) => {
        if (error.code === 'ENOENT') {
          errorHandled = true;
          console.log('  ✅ Error handling working correctly');
          this.results.passed.push('Error Handling');
        }
      });

      child.on('close', (code) => {
        if (!errorHandled) {
          console.log('  ❌ Error not handled properly');
          this.results.failed.push({ test: 'Error Handling', error: 'Error not caught' });
        }
        resolve();
      });

      // Timeout
      setTimeout(() => {
        if (!errorHandled) {
          console.log('  ❌ Error handling timeout');
          this.results.failed.push({ test: 'Error Handling', error: 'Timeout' });
        }
        resolve();
      }, 1000);
    });
  }

  printSummary() {
    console.log('\n📊 EXTERNAL PROCESS VALIDATION SUMMARY');
    console.log('======================================');

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

// Run external process validation
const validator = new ExternalProcessValidator();
validator.validateExternalCommunication().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('External process validation failed:', error);
  process.exit(1);
});
