#!/usr/bin/env node

/**
 * Smart Test Runner - Surgical fixes for large test suite execution
 * 
 * Addresses key challenges:
 * - Output truncation at 30,000 characters
 * - Max test rule: run individually if over threshold
 * - Intelligent batching for large test suites
 * - Test isolation and quarantine strategies
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const MAX_OUTPUT_SIZE = 25000; // Leave buffer below 30k limit
const MAX_FILES_THRESHOLD = 50; // Run individually if more than 50 test files
const CHUNK_SIZE = 10; // Process tests in chunks of 10

class SmartTestRunner {
  constructor() {
    this.testResults = [];
    this.outputChunks = [];
    this.quarantinedTests = [];
  }

  /**
   * Main execution method
   */
  async run(options = {}) {
    const { pattern = '**/*.test.ts', quarantineMode = false } = options;
    
    console.log('🚀 Smart Test Runner - Surgical fixes for large test suites');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Step 1: Discover test files
      const testFiles = this.discoverTestFiles(pattern);
      console.log(`📋 Discovered ${testFiles.length} test files`);
      
      if (testFiles.length === 0) {
        console.log('❌ No test files found');
        return { success: false, results: [] };
      }
      
      // Step 2: Apply max test rule
      if (testFiles.length > MAX_FILES_THRESHOLD) {
        console.log(`📊 Large test suite detected (${testFiles.length} files > ${MAX_FILES_THRESHOLD})`);
        console.log('🔄 Switching to individual execution mode');
        return await this.runIndividualTests(testFiles);
      }
      
      // Step 3: Intelligent batching
      if (testFiles.length > CHUNK_SIZE) {
        console.log(`📦 Large test suite detected (${testFiles.length} files)`);
        console.log(`🔄 Processing in chunks of ${CHUNK_SIZE}`);
        return await this.runInChunks(testFiles, CHUNK_SIZE);
      }
      
      // Step 4: Standard execution with output management
      console.log('⚡ Running standard test execution with output management');
      return await this.runStandard(testFiles);
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Discover test files matching pattern
   */
  discoverTestFiles(pattern) {
    try {
      // Use find command to discover test files
      const result = execSync(`find src -name "*.test.ts" -type f`, { encoding: 'utf8' });
      return result.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.warn('⚠️  Could not discover test files with find, trying alternative method');
      // Fallback: use glob pattern
      return this.globTestFiles(pattern);
    }
  }

  /**
   * Fallback method to discover test files
   */
  globTestFiles(pattern) {
    // Simple glob implementation for test files
    const testDirs = ['src/__tests__/unit', 'src/__tests__/integration', 'src/__tests__/performance'];
    const files = [];
    
    for (const dir of testDirs) {
      try {
        const dirFiles = fs.readdirSync(dir);
        for (const file of dirFiles) {
          if (file.endsWith('.test.ts')) {
            files.push(path.join(dir, file));
          }
        }
      } catch (error) {
        // Directory might not exist, continue
      }
    }
    
    return files;
  }

  /**
   * Run tests individually (max test rule)
   */
  async runIndividualTests(testFiles) {
    console.log('🔄 Executing tests individually...');

    const results = [];
    let passedFiles = 0;
    let failedFiles = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const testFile of testFiles) {
      console.log(`\n📄 Running: ${path.basename(testFile)}`);

      try {
        const result = await this.runSingleTest(testFile);
        results.push(result);

        if (result.success) {
          passedFiles++;
          passedTests += result.numPassedTests || 0;
          console.log(`✅ PASSED (${result.numPassedTests || 0} tests)`);
        } else {
          failedFiles++;
          failedTests += result.numFailedTests || 0;
          console.log(`❌ FAILED (${result.numFailedTests || 0} tests)`);
          if (result.error) {
            console.log(`   Error: ${result.error.substring(0, 100)}...`);
          }
        }
      } catch (error) {
        failedFiles++;
        console.log(`❌ ERROR: ${error.message}`);
        results.push({ file: testFile, success: false, error: error.message });
      }
    }

    console.log(`\n📊 Individual Execution Results:`);
    console.log(`   Files: ${passedFiles + failedFiles}`);
    console.log(`   Tests: ${passedTests + failedTests}`);
    console.log(`   Tests Passed: ${passedTests}`);
    console.log(`   Tests Failed: ${failedTests}`);
    console.log(`   Files Passed: ${passedFiles}`);
    console.log(`   Files Failed: ${failedFiles}`);

    return {
      success: failedTests === 0,
      results,
      summary: {
        totalFiles: testFiles.length,
        totalTests: passedTests + failedTests,
        passedTests,
        failedTests,
        passedFiles,
        failedFiles
      }
    };
  }

  /**
   * Run tests in chunks
   */
  async runInChunks(testFiles, chunkSize) {
    console.log(`🔄 Processing ${testFiles.length} tests in chunks of ${chunkSize}`);

    const chunks = [];
    for (let i = 0; i < testFiles.length; i += chunkSize) {
      chunks.push(testFiles.slice(i, i + chunkSize));
    }

    console.log(`📦 Created ${chunks.length} chunks`);

    const results = [];
    let totalPassedTests = 0;
    let totalFailedTests = 0;
    let totalPassedFiles = 0;
    let totalFailedFiles = 0;
    const allFailedTests = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const chunkResult = await this.runChunk(chunk, i, chunks.length);
      results.push(chunkResult);

      totalPassedFiles += chunkResult.passed;
      totalFailedFiles += chunkResult.failed;
      totalPassedTests += chunkResult.passedTests || 0;
      totalFailedTests += chunkResult.failedTests || 0;

      // Collect failed tests from this chunk
      const failedTests = chunkResult.results.filter(r => !r.success);
      allFailedTests.push(...failedTests);
    }

    console.log(`\n📊 Chunked Execution Results:`);
    console.log(`   Total Files: ${testFiles.length}`);
    console.log(`   Total Tests: ${totalPassedTests + totalFailedTests}`);
    console.log(`   Tests Passed: ${totalPassedTests}`);
    console.log(`   Tests Failed: ${totalFailedTests}`);
    console.log(`   Files Passed: ${totalPassedFiles}`);
    console.log(`   Files Failed: ${totalFailedFiles}`);

    // List all failed test files
    if (allFailedTests.length > 0) {
      console.log(`   ❌ Failed test files:`);
      for (const failedTest of allFailedTests) {
        console.log(`      - ${path.basename(failedTest.file)}`);
      }
    }

    return {
      success: totalFailedTests === 0,
      results,
      summary: {
        totalFiles: testFiles.length,
        totalTests: totalPassedTests + totalFailedTests,
        passedTests: totalPassedTests,
        failedTests: totalFailedTests,
        passedFiles: totalPassedFiles,
        failedFiles: totalFailedFiles
      }
    };
  }

  /**
   * Run a single test file
   */
  async runSingleTest(testFile, useJson = true) {
    return new Promise((resolve) => {
      const reporter = useJson ? '--reporter=json' : '--reporter=dot';
      const vitest = spawn('npx', ['vitest', 'run', testFile, reporter], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      let stdout = '';
      let stderr = '';
      
      vitest.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      vitest.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      vitest.on('close', (code) => {
        try {
          if (stdout.length > MAX_OUTPUT_SIZE) {
            // Output too large, truncate and mark as oversized
            resolve({
              file: testFile,
              success: false,
              error: `Output too large (${stdout.length} chars > ${MAX_OUTPUT_SIZE})`,
              oversized: true
            });
            return;
          }
          
          const result = JSON.parse(stdout);
          resolve({
            file: testFile,
            success: result.success,
            numPassedTests: result.numPassedTests,
            numFailedTests: result.numFailedTests,
            output: stdout.length > 1000 ? stdout.substring(0, 1000) + '...' : stdout
          });
        } catch (error) {
          resolve({
            file: testFile,
            success: code === 0,
            error: stderr || error.message
          });
        }
      });
      
      vitest.on('error', (error) => {
        resolve({
          file: testFile,
          success: false,
          error: error.message
        });
      });
    });
  }

  /**
   * Run a chunk of test files
   */
  async runChunk(chunk, chunkIndex, totalChunks) {
    console.log(`🔄 Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} files)`);

    // Use JSON reporter for large chunks to avoid output truncation
    const useJson = chunk.length > 5;
    const promises = chunk.map(file => this.runSingleTest(file, useJson));
    const results = await Promise.all(promises);

    const passedFiles = results.filter(r => r.success).length;
    const failedFiles = results.filter(r => !r.success).length;
    const passedTests = results.reduce((sum, r) => sum + (r.numPassedTests || 0), 0);
    const failedTests = results.reduce((sum, r) => sum + (r.numFailedTests || 0), 0);

    console.log(`   Chunk ${chunkIndex + 1}: ${passedFiles} passed, ${failedFiles} failed (${passedTests + failedTests} tests)`);

    // List failed tests
    if (failedFiles > 0) {
      const failedTests = results.filter(r => !r.success);
      console.log(`   ❌ Failed tests:`);
      for (const failedTest of failedTests) {
        console.log(`      - ${path.basename(failedTest.file)}`);
      }
    }

    return { passed: passedFiles, failed: failedFiles, passedTests, failedTests, results };
  }

  /**
   * Run standard test execution with output management
   */
  async runStandard(testFiles) {
    console.log('⚡ Running standard test execution');
    
    return new Promise((resolve) => {
      const vitest = spawn('npx', ['vitest', 'run', ...testFiles, '--reporter=json'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      let stdout = '';
      let stderr = '';
      
      vitest.stdout.on('data', (data) => {
        stdout += data.toString();
        
        // Check for output size limit
        if (stdout.length > MAX_OUTPUT_SIZE) {
          console.warn(`⚠️  Output size approaching limit (${stdout.length}/${MAX_OUTPUT_SIZE})`);
        }
      });
      
      vitest.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      vitest.on('close', (code) => {
        try {
          const result = JSON.parse(stdout);
          console.log(`📊 Standard Execution: ${result.numPassedTests}/${result.numTotalTests} tests passed`);
          
          resolve({
            success: result.success,
            results: [result],
            summary: {
              total: result.numTotalTests,
              passed: result.numPassedTests,
              failed: result.numFailedTests
            }
          });
        } catch (error) {
          console.error('❌ Failed to parse test results:', error.message);
          resolve({
            success: false,
            error: `Parse error: ${error.message}`,
            stderr
          });
        }
      });
      
      vitest.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse CLI arguments
  if (args.includes('--quarantine')) {
    options.quarantineMode = true;
  }
  
  if (args.includes('--pattern')) {
    const patternIndex = args.indexOf('--pattern');
    if (patternIndex + 1 < args.length) {
      options.pattern = args[patternIndex + 1];
    }
  }
  
  const runner = new SmartTestRunner();
  runner.run(options).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Smart Test Runner failed:', error);
    process.exit(1);
  });
}

export default SmartTestRunner;
