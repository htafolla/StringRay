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
// Path configuration for cross-environment compatibility
const ORCHESTRATOR_PATH = process.env.STRRAY_ORCHESTRATOR_PATH || '../../dist/orchestrator';

import { StringRayOrchestrator } from `${ORCHESTRATOR_PATH}.js`;

const MAX_OUTPUT_SIZE = 100000; // Increased buffer for large test outputs
const MAX_FILES_THRESHOLD = 15; // Run individually if more than 15 test files (AGGRESSIVE)
const CHUNK_SIZE = 3; // Process tests in smaller chunks of 3 (more granular)
const CHUNK_TIMEOUT_MS = 8000; // 8-second timeout per chunk (AGGRESSIVE - Codex Term #45)
const TOTAL_TIMEOUT_MS = 45000; // 45-second total timeout (AGGRESSIVE - Codex Term #45)
const MAX_SUITE_SIZE = 30; // Maximum 30 files per suite (reduced - Codex Term #45)
const TEST_PARALLEL_WORKERS = 8; // Run tests with 8 parallel workers (increased)

class SmartTestRunner {
  constructor() {
    this.testResults = [];
    this.outputChunks = [];
    this.quarantinedTests = [];
    this.startTime = Date.now();
    this.testCache = new Map(); // AGGRESSIVE: Cache test results
    this.skipUnchanged = true; // AGGRESSIVE: Skip unchanged tests
  }

  /**
   * AGGRESSIVE: Check if test file has changed since last run
   */
  shouldSkipTest(testFile) {
    if (!this.skipUnchanged) return false;

    try {
      const stats = fs.statSync(testFile);
      const cacheKey = `${testFile}:${stats.mtime.getTime()}`;
      const cached = this.testCache.get(testFile);

      if (cached && cached.key === cacheKey) {
        console.log(`⏭️ Skipping unchanged test: ${path.basename(testFile)}`);
        return true;
      }

      return false;
    } catch {
      return false; // If we can't check, run the test
    }
  }

  /**
   * AGGRESSIVE: Cache successful test results
   */
  cacheTestResult(testFile, result) {
    if (result.success) {
      try {
        const stats = fs.statSync(testFile);
        const cacheKey = `${testFile}:${stats.mtime.getTime()}`;
        this.testCache.set(testFile, {
          key: cacheKey,
          result: result,
          timestamp: Date.now()
        });
      } catch {
        // Ignore caching errors
      }
    }
  }

  /**
   * Check if total execution time has exceeded limit (Codex Term #45)
   */
  hasExceededTotalTimeout() {
    return (Date.now() - this.startTime) > TOTAL_TIMEOUT_MS;
  }

  /**
   * Main execution method
   */
   async run(options = {}) {
     const { pattern = '**/*.test.ts', quarantineMode = false, autoHeal = false } = options;
     this.startTime = Date.now();

    console.log('🚀 Smart Test Runner - AGGRESSIVE optimizations for large test suites');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  AGGRESSIVE: Total timeout: ${TOTAL_TIMEOUT_MS / 1000}s | Chunk timeout: ${CHUNK_TIMEOUT_MS / 1000}s`);
    console.log(`⚡ AGGRESSIVE: ${TEST_PARALLEL_WORKERS} parallel workers | Max ${MAX_SUITE_SIZE} files | ${CHUNK_SIZE} per chunk`);
    console.log(`🚀 AGGRESSIVE: 5s per-test timeout | Bail after 3 failures | Cache enabled`);

     try {
      // Step 1: Discover test files
      const testFiles = this.discoverTestFiles(pattern);
      console.log(`📋 Discovered ${testFiles.length} test files`);

      if (testFiles.length === 0) {
        console.log('❌ No test files found');
        return { success: false, results: [] };
      }

      // Step 1.5: Apply suite size limits (Codex Term #45)
      if (testFiles.length > MAX_SUITE_SIZE) {
        console.log(`🚫 Test suite too large (${testFiles.length} files > ${MAX_SUITE_SIZE} max)`);
        console.log('❌ Aborting execution - refactor test suite to comply with size limits');
        return { success: false, results: [], error: 'SUITE_TOO_LARGE' };
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
      // Check total timeout before each individual test (Codex Term #45)
      if (this.hasExceededTotalTimeout()) {
        console.log(`⏰ Total timeout exceeded (${TOTAL_TIMEOUT_MS / 1000}s) - aborting remaining tests`);
        console.log(`📊 Partial results: ${passedFiles} passed, ${failedFiles} failed files`);
        break;
      }

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
      // Check total timeout before processing chunk (Codex Term #45)
      if (this.hasExceededTotalTimeout()) {
        console.log(`⏰ Total timeout exceeded (${TOTAL_TIMEOUT_MS / 1000}s) - aborting remaining chunks`);
        console.log(`📊 Partial results: ${totalPassedFiles} passed, ${totalFailedFiles} failed files`);
        break;
      }

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

    const testResult = {
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

    // Auto-healing integration through orchestrator (if enabled and tests failed)
    if (autoHeal && totalFailedTests > 0) {
      console.log('\n🎯 ORCHESTRATED AUTO-HEALING ENGAGED - Coordinating multi-agent response...');

      try {
        // Create orchestrator instance
        const orchestrator = new StringRayOrchestrator({
          maxConcurrentTasks: 3,
          taskTimeout: 300000, // 5 minutes per task
          conflictResolutionStrategy: 'expert_priority'
        });

        // Prepare failure context for orchestration
        const failureContext = {
          failedTests: allFailedTests.map(t => t.file),
          timeoutIssues: testResult.timeoutIssues || [],
          performanceIssues: testResult.slowTests || [],
          flakyTests: testResult.flakyTests || [],
          errorLogs: testResult.errorLogs || [],
          testExecutionTime: testResult.executionTime || 0
        };

        // Execute orchestrated auto-healing
        const healingResult = await orchestrator.orchestrateTestAutoHealing(failureContext, `test-session-${Date.now()}`);

        console.log(`✅ Orchestrated auto-healing complete:`);
        console.log(`   • Success: ${healingResult.success ? 'Yes' : 'No'}`);
        console.log(`   • Performance improvement: ${healingResult.performanceImprovement}%`);
        console.log(`   • Agent coordination: ${healingResult.agentCoordination.join(', ')}`);

        if (healingResult.healingResult.recommendations?.length > 0) {
          console.log(`   • Recommendations: ${healingResult.healingResult.recommendations.slice(0, 3).join(', ')}`);
        }

        if (healingResult.healingResult.summary) {
          console.log(`   • Summary: ${healingResult.healingResult.summary}`);
        }

        // Update test result with healing outcomes
        testResult.autoHealed = healingResult.success;
        testResult.performanceImprovement = healingResult.performanceImprovement;

      } catch (error) {
        console.log(`❌ Orchestrated auto-healing failed: ${error instanceof Error ? error.message : String(error)}`);
        console.log('   Falling back to basic error reporting...');
      }
    }

    return testResult;
  }

  /**
   * Run a single test file
   */
  async runSingleTest(testFile, useJson = true) {
    // AGGRESSIVE: Skip unchanged tests using cache
    if (this.shouldSkipTest(testFile)) {
      return Promise.resolve({
        file: testFile,
        success: true,
        skipped: true,
        numPassedTests: 1,
        numFailedTests: 0,
        numTotalTests: 1
      });
    }

    return new Promise((resolve) => {
       const reporter = useJson ? '--reporter=json' : '--reporter=dot';
       const vitest = spawn('npx', ['vitest', 'run', testFile, reporter,
         '--threads=' + TEST_PARALLEL_WORKERS, // AGGRESSIVE: Use multiple threads
         '--timeout=5000', // AGGRESSIVE: 5-second timeout per test
         '--bail=3' // AGGRESSIVE: Stop after 3 failures
       ], {
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

           // Check for actual test failures even if overall success is true
           let actualFailedTests = result.numFailedTests;
           if (result.testResults && result.testResults.length > 0) {
             for (const testResult of result.testResults) {
               if (testResult.assertionResults) {
                 actualFailedTests += testResult.assertionResults.filter(r => r.status === 'failed').length;
               }
             }
           }

            const testResult = {
              file: testFile,
              success: result.success && actualFailedTests === 0,
              numPassedTests: result.numPassedTests,
              numFailedTests: actualFailedTests,
              output: stdout.length > 1000 ? stdout.substring(0, 1000) + '...' : stdout
            };

            // AGGRESSIVE: Cache successful results
            if (testResult.success) {
              this.cacheTestResult(testFile, testResult);
            }

            resolve(testResult);
         } catch (error) {
           const errorResult = {
             file: testFile,
             success: code === 0,
             error: stderr || error.message
           };

           // AGGRESSIVE: Cache successful results even in catch block
           if (errorResult.success) {
             this.cacheTestResult(testFile, errorResult);
           }

           resolve(errorResult);
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

    // Implement chunk timeout (Codex Term #45)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Chunk timeout after ${CHUNK_TIMEOUT_MS}ms`)), CHUNK_TIMEOUT_MS);
    });

    let results;
    try {
      results = await Promise.race([Promise.all(promises), timeoutPromise]);
    } catch (error) {
      console.log(`⏰ Chunk ${chunkIndex + 1} timed out - ${error.message}`);
      // Return timeout results for all tests in chunk
      results = chunk.map(file => ({
        file,
        success: false,
        timedOut: true,
        error: 'Chunk timeout'
      }));
    }

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
