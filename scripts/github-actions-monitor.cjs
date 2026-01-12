#!/usr/bin/env node

/**
 * GitHub Actions CI/CD Monitor
 *
 * Monitors GitHub Actions workflow status and integrates with StrRay monitoring
 * Provides real-time feedback on CI/CD pipeline health and failures
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class GitHubActionsMonitor {
  constructor() {
    this.owner = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'strray-framework';
    this.repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'stringray';
    this.token = process.env.GITHUB_TOKEN;
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * Get recent workflow runs
   */
  async getWorkflowRuns(workflowName = null, limit = 10) {
    const endpoint = `/repos/${this.owner}/${this.repo}/actions/runs`;
    const params = new URLSearchParams({
      per_page: limit.toString(),
      ...(workflowName && { event: workflowName })
    });

    const data = await this.makeRequest(`${endpoint}?${params}`);
    return data.workflow_runs || [];
  }

  /**
   * Get workflow run details
   */
  async getWorkflowRun(runId) {
    const endpoint = `/repos/${this.owner}/${this.repo}/actions/runs/${runId}`;
    return await this.makeRequest(endpoint);
  }

  /**
   * Check workflow status and report issues
   */
  async checkWorkflowStatus() {
    console.log('🔍 Checking GitHub Actions workflow status...');

    // Check if we have required environment variables
    if (!this.token) {
      console.log('⚠️ No GITHUB_TOKEN provided - running in local mode');
      return this.getLocalStatus();
    }

    try {
      const runs = await this.getWorkflowRuns(null, 20);

      if (runs.length === 0) {
        console.log('⚠️ No workflow runs found');
        return { status: 'no_runs', issues: [] };
      }

      const issues = [];
      const status = { total: runs.length, success: 0, failure: 0, in_progress: 0 };

      for (const run of runs.slice(0, 5)) { // Check last 5 runs
        const runStatus = run.conclusion || run.status;

        switch (runStatus) {
          case 'success':
            status.success++;
            break;
          case 'failure':
          case 'timed_out':
          case 'action_required':
            status.failure++;
            issues.push({
              workflow: run.name,
              run_id: run.id,
              status: runStatus,
              created_at: run.created_at,
              html_url: run.html_url,
              conclusion: run.conclusion
            });
            break;
          case 'in_progress':
          case 'queued':
            status.in_progress++;
            break;
        }
      }

      const healthScore = status.total > 0 ?
        Math.round((status.success / (status.total - status.in_progress)) * 100) : 0;

      console.log(`📊 CI/CD Status: ${status.success}/${status.total - status.in_progress} successful (${healthScore}% health)`);

      if (issues.length > 0) {
        console.log('❌ Failed workflows:');
        issues.forEach(issue => {
          console.log(`  • ${issue.workflow}: ${issue.status} (${issue.html_url})`);
        });
      }

      return {
        status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'warning' : 'critical',
        health_score: healthScore,
        issues: issues,
        summary: {
          total_runs: status.total,
          successful: status.success,
          failed: status.failure,
          in_progress: status.in_progress
        }
      };

    } catch (error) {
      console.error('❌ Failed to check GitHub Actions status:', error.message);
      return {
        status: 'error',
        error: error.message,
        issues: []
      };
    }
  }

  /**
   * Get local status when GitHub API is unavailable
   */
  getLocalStatus() {
    console.log('🏠 Running local CI/CD status check...');

    // Check for local workflow files
    const workflowDir = path.join(process.cwd(), '.github', 'workflows');
    const workflowsExist = fs.existsSync(workflowDir);
    let workflowFiles = [];

    if (workflowsExist) {
      workflowFiles = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      console.log(`✅ Found ${workflowFiles.length} workflow files locally`);
      console.log(`📁 Workflows: ${workflowFiles.join(', ')}`);
    } else {
      console.log('⚠️ No local workflow files found');
    }

    // Check for recent build artifacts
    const distExists = fs.existsSync(path.join(process.cwd(), 'dist'));
    const lastBuild = distExists ?
      fs.statSync(path.join(process.cwd(), 'dist')).mtime.toISOString() :
      'Never';

    console.log(`📦 Build status: ${distExists ? '✅ Available' : '❌ Missing'} (Last: ${lastBuild})`);

    return {
      status: workflowsExist ? 'configured' : 'no_workflows',
      health_score: workflowsExist ? 100 : 0,
      issues: [],
      summary: {
        local_workflows: workflowFiles.length,
        build_available: distExists,
        last_build: lastBuild
      }
    };
  }

  /**
   * Make HTTP request to GitHub API
   */
  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        headers: {
          'User-Agent': 'StrRay-CI-Monitor/1.0.0',
          'Accept': 'application/vnd.github.v3+json',
          ...(this.token && { 'Authorization': `token ${this.token}` })
        }
      };

      https.get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate monitoring report
   */
  async generateReport() {
    const status = await this.checkWorkflowStatus();

    const report = {
      timestamp: new Date().toISOString(),
      repository: `${this.owner}/${this.repo}`,
      ci_status: status.status,
      health_score: status.health_score || 0,
      summary: status.summary || {},
      issues: status.issues || [],
      recommendations: this.generateRecommendations(status)
    };

    // Save report
    const reportPath = path.join(process.cwd(), '.opencode', 'logs', 'ci-cd-monitor-report.json');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Generate recommendations based on status
   */
  generateRecommendations(status) {
    const recommendations = [];

    if (status.status === 'critical') {
      recommendations.push('🚨 CRITICAL: CI/CD pipelines are failing - immediate attention required');
      recommendations.push('🔍 Check failed workflow logs for error details');
      recommendations.push('🛠️ Fix pipeline configuration or test failures');
    } else if (status.status === 'warning') {
      recommendations.push('⚠️ WARNING: CI/CD health degraded - monitor closely');
      recommendations.push('🔧 Review recent workflow failures');
      recommendations.push('📈 Consider optimizing slow jobs');
    }

    if ((status.issues || []).length > 0) {
      recommendations.push('📋 Review failed workflow runs for patterns');
    }

    if (status.health_score < 80) {
      recommendations.push('🎯 Aim for >90% CI/CD success rate');
      recommendations.push('🔄 Consider adding retry logic for flaky tests');
    }

    return recommendations;
  }
}

// CLI interface
async function main() {
  const monitor = new GitHubActionsMonitor();

  if (process.argv.includes('--report')) {
    const report = await monitor.generateReport();
    console.log('\n📊 CI/CD Monitoring Report:');
    console.log(`Status: ${report.ci_status.toUpperCase()}`);
    console.log(`Health Score: ${report.health_score}%`);
    console.log(`Issues: ${report.issues.length}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
  } else {
    await monitor.checkWorkflowStatus();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GitHubActionsMonitor };