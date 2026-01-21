#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration - focus on core skills that actually have MCP servers
const SKILLS_TO_TEST = [
  'project-analysis',
  'testing-strategy',
  'code-review',
  'security-audit',
  'performance-optimization'
];

// Simplified test prompts - just for validation
const TEST_PROMPTS = {
  'project-analysis': 'Analyze project structure',
  'testing-strategy': 'Design testing strategy',
  'code-review': 'Review code quality',
  'security-audit': 'Audit security',
  'performance-optimization': 'Optimize performance'
};

// Test results
const results = {
  baselineProcesses: 0,
  tests: [],
  errors: [],
  summary: {}
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function checkProcesses() {
  try {
    const output = execSync('ps aux | grep "node ./dist/plugin/mcps/" | grep -v grep | wc -l', { encoding: 'utf8' });
    return parseInt(output.trim());
  } catch (error) {
    return 0;
  }
}

function getProcessDetails() {
  try {
    const output = execSync('ps aux | grep "node ./dist/plugin/mcps/" | grep -v grep', { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    return '';
  }
}

function waitForCleanup(timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkCleanup = () => {
      const processCount = checkProcesses();
      if (processCount === 0 || Date.now() - startTime > timeout) {
        resolve(processCount);
      } else {
        setTimeout(checkCleanup, 1000);
      }
    };
    checkCleanup();
  });
}

async function testSkill(skillName) {
  log(`Starting validation for skill: ${skillName}`);

  const testStart = {
    skill: skillName,
    startTime: new Date().toISOString(),
    initialProcesses: checkProcesses(),
    prompt: TEST_PROMPTS[skillName] || `Test prompt for ${skillName}`
  };

  try {
    // Check that no MCP servers are running at baseline (lazy loading)
    const baselineProcesses = checkProcesses();
    log(`Baseline MCP processes: ${baselineProcesses}`);

    // Validate skill configuration exists and is properly formatted
    const skillPath = path.join(__dirname, '..', '.opencode', 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill file not found: ${skillPath}`);
    }

    const skillContent = fs.readFileSync(skillPath, 'utf8');

    // Check that skill has MCP configuration
    const hasMcp = skillContent.includes('mcp:') && skillContent.includes('command: node');
    if (!hasMcp) {
      throw new Error(`Skill ${skillName} missing MCP configuration`);
    }

    // Quick validation that MCP server path exists
    const lines = skillContent.split('\n');
    let mcpArgs = '';
    for (const line of lines) {
      if (line.includes('args:')) {
        // Extract the args array
        const argsMatch = line.match(/args:\s*\[(.*)\]/);
        if (argsMatch) {
          mcpArgs = argsMatch[1].replace(/['"]/g, '').trim();
          break;
        }
      }
    }

    if (!mcpArgs) {
      throw new Error(`Skill ${skillName} missing MCP args configuration`);
    }

    // Validate MCP server file exists - handle both development and consumer paths
    let mcpServerPath = path.join(__dirname, '..', mcpArgs);

    // If consumer path doesn't exist, try development path
    if (!fs.existsSync(mcpServerPath)) {
      // Convert consumer path to development path
      const devPath = mcpArgs.replace('node_modules/strray-ai/dist/plugin/mcps/', 'dist/plugin/mcps/');
      mcpServerPath = path.join(__dirname, '..', devPath);

      if (!fs.existsSync(mcpServerPath)) {
        throw new Error(`MCP server file not found in either consumer path (${path.join(__dirname, '..', mcpArgs)}) or development path (${mcpServerPath})`);
      }
    }

    const testResult = {
      ...testStart,
      endTime: new Date().toISOString(),
      baselineProcesses,
      configValid: true,
      mcpServerExists: true,
      duration: Date.now() - new Date(testStart.startTime).getTime()
    };

    results.tests.push(testResult);

    log(`✅ Skill ${skillName} validation completed successfully`);
    log(`Duration: ${testResult.duration}ms`);

  } catch (error) {
    log(`❌ Skill ${skillName} validation failed: ${error.message}`, 'ERROR');
    results.errors.push({
      skill: skillName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function runComprehensiveTests() {
  log('=== STARTING SKILLS CONFIGURATION VALIDATION ===');

  // Record baseline
  results.baselineProcesses = checkProcesses();
  log(`Baseline MCP processes: ${results.baselineProcesses}`);

  // Validate each skill configuration
  for (const skill of SKILLS_TO_TEST) {
    await testSkill(skill);

    // Brief pause between validations
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Generate summary
  generateSummary();

  log('=== VALIDATION COMPLETE ===');

  // Exit with appropriate code
  process.exit(results.summary.allConfigsValid ? 0 : 1);
}

function generateSummary() {
  const totalTests = results.tests.length;
  const successfulTests = results.tests.filter(t => t.configValid && t.mcpServerExists).length;
  const failedTests = totalTests - successfulTests;

  results.summary = {
    totalTests,
    successfulTests,
    failedTests,
    successRate: (successfulTests / totalTests * 100).toFixed(1) + '%',
    totalErrors: results.errors.length,
    averageDuration: results.tests.reduce((sum, t) => sum + t.duration, 0) / totalTests,
    baselineProcesses: results.baselineProcesses,
    allConfigsValid: successfulTests === totalTests && results.errors.length === 0
  };

  log('=== SKILLS CONFIGURATION VALIDATION SUMMARY ===');
  log(`Skills Tested: ${totalTests}`);
  log(`Valid Configurations: ${successfulTests}`);
  log(`Invalid Configurations: ${failedTests}`);
  log(`Success Rate: ${results.summary.successRate}`);
  log(`Configuration Errors: ${results.summary.totalErrors}`);
  log(`Average Validation Time: ${results.summary.averageDuration.toFixed(0)}ms`);
  log(`Baseline MCP Processes: ${results.summary.baselineProcesses}`);
  log(`All Skills Valid: ${results.summary.allConfigsValid ? '✅ YES' : '❌ NO'}`);

  // Save detailed results
  const reportPath = path.join(process.cwd(), 'skills-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`Detailed report saved to: ${reportPath}`);
}

// Run the tests
runComprehensiveTests().catch(error => {
  log(`Critical error during testing: ${error.message}`, 'ERROR');
  process.exit(1);
});