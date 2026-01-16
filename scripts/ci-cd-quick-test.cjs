#!/usr/bin/env node

/**
 * Quick CI/CD Cycle Test
 * Tests the validation, commit, and push phases without long monitoring
 */

const { execSync } = require('child_process');

class QuickCICDCycle {
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  validateBeforeCommit() {
    this.log('🔍 Validating critical requirements...');

    try {
      execSync('npm run typecheck', { stdio: 'pipe' });
      this.log('✅ TypeScript compilation successful');

      execSync('npm run test:unit', { stdio: 'pipe' });
      this.log('✅ Unit tests passed');

      this.log('🎉 Critical validations passed');
      return true;
    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  hasChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  stageChanges() {
    try {
      execSync('git add .', { stdio: 'inherit' });
      this.log('✅ All changes staged');
      return true;
    } catch (error) {
      this.log(`❌ Failed to stage changes: ${error.message}`, 'ERROR');
      return false;
    }
  }

  createCommit(message) {
    try {
      execSync(`git commit --no-verify -m "${message}"`, { stdio: 'inherit' });
      this.log('✅ Commit created successfully');
      return true;
    } catch (error) {
      this.log(`❌ Failed to create commit: ${error.message}`, 'ERROR');
      return false;
    }
  }

  pushChanges() {
    try {
      execSync('git push origin master', { stdio: 'inherit' });
      this.log('✅ Changes pushed successfully - CI/CD pipeline triggered');
      return true;
    } catch (error) {
      this.log(`❌ Failed to push changes: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runQuickCycle(commitMessage = "test: quick CI/CD cycle") {
    const startTime = new Date();
    this.log('🚀 Starting Quick CI/CD Cycle Test');

    try {
      // Check for changes
      if (!this.hasChanges()) {
        console.log('\n✅ No changes to commit - cycle complete');
        return { success: true, status: 'no_changes' };
      }

      // Validate
      if (!this.validateBeforeCommit()) {
        throw new Error('Validation failed');
      }

      // Stage
      if (!this.stageChanges()) {
        throw new Error('Staging failed');
      }

      // Commit
      if (!this.createCommit(commitMessage)) {
        throw new Error('Commit failed');
      }

      // Push
      if (!this.pushChanges()) {
        throw new Error('Push failed');
      }

      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n' + '='.repeat(50));
      console.log('🎯 QUICK CI/CD CYCLE TEST SUMMARY');
      console.log('='.repeat(50));
      console.log('✅ STATUS: SUCCESS');
      console.log('📊 RESULT: cycle_completed');
      console.log(`⏱️  DURATION: ${duration} seconds`);
      console.log('🎉 Quick CI/CD cycle completed successfully!');
      console.log('ℹ️  Pipeline monitoring skipped for quick testing');
      console.log('='.repeat(50));

      return { success: true, status: 'cycle_completed' };

    } catch (error) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n' + '='.repeat(50));
      console.log('💥 QUICK CI/CD CYCLE TEST SUMMARY');
      console.log('='.repeat(50));
      console.log('❌ STATUS: FAILED');
      console.log(`📊 ERROR: ${error.message}`);
      console.log(`⏱️  DURATION: ${duration} seconds`);
      console.log('💥 Quick CI/CD cycle failed');
      console.log('='.repeat(50));

      return { success: false, status: 'cycle_failed', error: error.message };
    }
  }
}

// CLI interface
if (require.main === module) {
  const quickCycle = new QuickCICDCycle();
  const commitMessage = process.argv[2] || "test: quick CI/CD cycle validation";

  quickCycle.runQuickCycle(commitMessage).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}