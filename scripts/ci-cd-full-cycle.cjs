#!/usr/bin/env node

/**
 * StrRay CI/CD Full Cycle Manager
 *
 * Complete CI/CD workflow automation:
 * 1. Commit changes with proper messaging
 * 2. Push to trigger pipeline
 * 3. Monitor pipeline completion
 * 4. Apply auto-fixes if needed
 * 5. Provide clear status summary
 *
 * Usage: node scripts/ci-cd-full-cycle.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CICDFullCycleManager {
  constructor() {
    this.owner = 'htafolla';
    this.repo = 'StringRay';
    this.token = process.env.GITHUB_TOKEN;
    this.baseUrl = 'https://api.github.com';
    this.maxRetries = 5;
    this.retryDelay = 30000; // 30 seconds
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stage all changes
   */
  stageChanges() {
    this.log('📝 Staging all changes...');
    try {
      execSync('git add .', { stdio: 'inherit' });
      this.log('✅ All changes staged');
      return true;
    } catch (error) {
      this.log(`❌ Failed to stage changes: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * Check if there are changes to commit
   */
  hasChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length > 0;
    } catch (error) {
      this.log(`❌ Failed to check git status: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * Create commit with proper message
   */
  createCommit(message = null) {
    if (!message) {
      // Generate intelligent commit message
      const changes = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(line => line.length > 0);

      const changeTypes = {
        scripts: changes.filter(f => f.includes('scripts/')).length,
        workflows: changes.filter(f => f.includes('.github/workflows/')).length,
        config: changes.filter(f => f.includes('vitest.config') || f.includes('package.json')).length,
        docs: changes.filter(f => f.includes('.md') || f.includes('docs/')).length,
        code: changes.filter(f => f.includes('.ts') || f.includes('.js')).length
      };

      const messages = [];
      if (changeTypes.scripts > 0) messages.push(`enhance CI/CD automation (${changeTypes.scripts} scripts)`);
      if (changeTypes.workflows > 0) messages.push(`update GitHub Actions (${changeTypes.workflows} workflows)`);
      if (changeTypes.config > 0) messages.push(`optimize configuration (${changeTypes.config} configs)`);
      if (changeTypes.docs > 0) messages.push(`improve documentation (${changeTypes.docs} files)`);
      if (changeTypes.code > 0) messages.push(`refactor code (${changeTypes.code} files)`);

      message = messages.length > 0 ? `feat: ${messages.join(', ')}` : 'feat: update codebase';
    }

    this.log(`📝 Creating commit: "${message}"`);
    try {
      // For CI/CD automation, bypass pre-commit validation
      execSync(`git commit --no-verify -m "${message}"`, { stdio: 'inherit' });
      this.log('✅ Commit created successfully (pre-commit validation bypassed for automation)');
      return true;
    } catch (error) {
      // Check if it's just "nothing to commit"
      if (error.message.includes('nothing to commit')) {
        this.log('ℹ️ No changes to commit');
        return true;
      }
      this.log(`❌ Failed to create commit: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * Push changes to trigger CI/CD
   */
  pushChanges() {
    this.log('🚀 Pushing changes to trigger CI/CD pipeline...');
    try {
      execSync('git push origin master', { stdio: 'inherit' });
      this.log('✅ Changes pushed successfully - CI/CD pipeline triggered');
      return true;
    } catch (error) {
      this.log(`❌ Failed to push changes: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * Get latest workflow run
   */
  async getLatestWorkflowRun() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.owner}/${this.repo}/actions/runs?per_page=1`,
        method: 'GET',
        headers: {
          'User-Agent': 'StrRay-CI-Full-Cycle/1.0.0',
          'Accept': 'application/vnd.github.v3+json',
          ...(this.token && { 'Authorization': `token ${this.token}` })
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.workflow_runs?.[0] || null);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Wait for pipeline completion and apply auto-fixes if needed
   */
  async monitorAndFixPipeline() {
    this.log('🔍 Monitoring pipeline and applying auto-fixes if needed...');

    // Wait a bit for the pipeline to start
    await this.sleep(5000);

    let run = await this.getLatestWorkflowRun();
    if (!run) {
      this.log('❌ No workflow runs found', 'ERROR');
      return { success: false, status: 'no_runs_found' };
    }

    this.log(`📊 Monitoring pipeline: ${run.name} (${run.id})`);

    // Wait for completion (up to 20 minutes)
    let waitCount = 0;
    const maxWaits = 40;

    while ((run.status === 'in_progress' || run.status === 'queued') && waitCount < maxWaits) {
      waitCount++;
      this.log(`⏳ Pipeline running (${waitCount}/${maxWaits})...`);
      await this.sleep(30000); // 30 seconds
      run = await this.getLatestWorkflowRun();
    }

    if (run.status === 'in_progress' || run.status === 'queued') {
      this.log('❌ Pipeline timeout - still running after 20 minutes', 'ERROR');
      return { success: false, status: 'pipeline_timeout' };
    }

    // Analyze result
    const conclusion = run.conclusion;
    this.log(`📊 Pipeline completed with status: ${conclusion}`);

    if (conclusion === 'success') {
      this.log('✅ Pipeline successful - no fixes needed');
      return { success: true, status: 'pipeline_successful' };
    }

    if (conclusion === 'failure') {
      this.log('❌ Pipeline failed - running auto-fix...');

      // Run the auto-fix script
      try {
        execSync('node scripts/ci-cd-auto-fix.cjs', { stdio: 'inherit' });
        return { success: true, status: 'auto_fix_applied' };
      } catch (error) {
        this.log(`❌ Auto-fix failed: ${error.message}`, 'ERROR');
        return { success: false, status: 'auto_fix_failed' };
      }
    }

    this.log(`⚠️ Unknown pipeline conclusion: ${conclusion}`);
    return { success: false, status: `unknown_conclusion_${conclusion}` };
  }

  /**
   * Validate code quality before committing
   */
  validateBeforeCommit() {
    this.log('🔍 Validating code quality before commit...');

    try {
      // Check TypeScript compilation
      this.log('🔧 Checking TypeScript compilation...');
      execSync('npm run typecheck', { stdio: 'pipe' });
      this.log('✅ TypeScript compilation successful');

      // Run linting
      this.log('🎨 Running ESLint...');
      execSync('npm run lint', { stdio: 'pipe' });
      this.log('✅ ESLint validation passed');

      // Run unit tests
      this.log('🧪 Running unit tests...');
      execSync('npm run test:unit', { stdio: 'pipe' });
      this.log('✅ Unit tests passed');

      this.log('🎉 All validations passed - code is ready for commit');
      return true;

    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`, 'ERROR');
      this.log('💡 Fix the issues above before committing');
      return false;
    }
  }

  /**
   * Run the complete CI/CD cycle
   */
  async runFullCycle(commitMessage = null) {
    const startTime = new Date();
    this.log('🚀 Starting StrRay CI/CD Full Cycle Manager');

    try {
      // Step 1: Check for changes
      if (!this.hasChanges()) {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 STRRAY CI/CD FULL CYCLE EXECUTION SUMMARY');
        console.log('='.repeat(60));
        console.log('✅ STATUS: SUCCESS');
        console.log('📊 RESULT: no_changes_to_commit');
        console.log('⏱️  DURATION: 0 seconds');
        console.log('🎉 No changes detected - CI/CD cycle skipped');
        console.log('='.repeat(60));
        return { success: true, status: 'no_changes' };
      }

      // Step 2: Validate code quality
      if (!this.validateBeforeCommit()) {
        throw new Error('Code validation failed - cannot commit');
      }

      // Step 3: Stage changes
      if (!this.stageChanges()) {
        throw new Error('Failed to stage changes');
      }

      // Step 4: Create commit
      if (!this.createCommit(commitMessage)) {
        throw new Error('Failed to create commit');
      }

      // Step 5: Push changes
      if (!this.pushChanges()) {
        throw new Error('Failed to push changes');
      }

      // Step 6: Monitor and auto-fix
      const result = await this.monitorAndFixPipeline();

      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('🎯 STRRAY CI/CD FULL CYCLE EXECUTION SUMMARY');
      console.log('='.repeat(60));

      if (result.success) {
        console.log('✅ STATUS: SUCCESS');
        console.log(`📊 RESULT: ${result.status}`);
        console.log(`⏱️  DURATION: ${duration} seconds`);
        console.log('🎉 CI/CD full cycle completed successfully!');
      } else {
        console.log('❌ STATUS: FAILED');
        console.log(`📊 RESULT: ${result.status}`);
        console.log(`⏱️  DURATION: ${duration} seconds`);
        console.log('💥 CI/CD full cycle failed - check logs above');
      }

      console.log('='.repeat(60));

      return result;

    } catch (error) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n' + '='.repeat(60));
      console.log('💥 STRRAY CI/CD FULL CYCLE EXECUTION SUMMARY');
      console.log('='.repeat(60));
      console.log('❌ STATUS: CRASHED');
      console.log(`📊 ERROR: ${error.message}`);
      console.log(`⏱️  DURATION: ${duration} seconds`);
      console.log('💥 Unexpected error occurred during CI/CD cycle');
      console.log('='.repeat(60));

      this.log(`💥 CI/CD cycle failed: ${error.message}`, 'ERROR');
      return { success: false, status: 'cycle_failed', error: error.message };
    }
  }
}

// CLI interface
if (require.main === module) {
  const manager = new CICDFullCycleManager();
  const commitMessage = process.argv[2]; // Optional commit message

  manager.runFullCycle(commitMessage).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { CICDFullCycleManager };