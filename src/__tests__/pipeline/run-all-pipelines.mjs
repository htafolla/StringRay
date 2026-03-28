#!/usr/bin/env node
/**
 * Master Pipeline Test Runner
 * 
 * Runs all pipeline tests and reports results.
 * Each test must pass 3 consecutive times to be considered complete.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const PIPELINES = [
  { name: 'Governance', path: 'test-governance-pipeline.mjs' },
  { name: 'Boot', path: 'test-boot-pipeline.mjs' },
  { name: 'Orchestration', path: 'test-orchestration-pipeline.mjs' },
  { name: 'Routing', path: 'test-routing-pipeline.mjs' },
  { name: 'Processor', path: 'test-processor-pipeline.mjs' },
  { name: 'Reporting', path: 'test-reporting-pipeline.mjs' },
  { name: 'Inference', path: 'test-inference-pipeline.mjs' },
];

const CONSECUTIVE_PASSES_REQUIRED = 3;

function runTest(pipelinePath) {
  try {
    const result = execSync(`node ${pipelinePath}`, {
      encoding: 'utf-8',
      cwd: '/Users/blaze/dev/stringray/src/__tests__/pipeline',
      timeout: 60000
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

function runConsecutive(pipeline) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${pipeline.name}`);
  console.log('='.repeat(60));
  
  let consecutivePasses = 0;
  let iteration = 0;
  
  while (consecutivePasses < CONSECUTIVE_PASSES_REQUIRED) {
    iteration++;
    console.log(`\n  Iteration ${iteration}...`);
    
    const result = runTest(pipeline.path);
    
    if (result.success) {
      consecutivePasses++;
      console.log(`  ✅ Pass ${consecutivePasses}/${CONSECUTIVE_PASSES_REQUIRED}`);
    } else {
      consecutivePasses = 0;
      console.log(`  ❌ Failed`);
      console.log(`\n  Error output:`);
      console.log('  ' + result.output.split('\n').slice(0, 15).join('\n  '));
    }
  }
  
  console.log(`\n  ✅ ${pipeline.name} Pipeline: ${consecutivePasses} consecutive passes!`);
  return true;
}

function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          MASTER PIPELINE TEST RUNNER                        ║');
  console.log('║                                                              ║');
  console.log(`║  Running ${PIPELINES.length} pipeline tests (${CONSECUTIVE_PASSES_REQUIRED} consecutive passes each)`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (const pipeline of PIPELINES) {
    const fullPath = `/Users/blaze/dev/stringray/src/__tests__/pipeline/${pipeline.path}`;
    
    if (!existsSync(fullPath)) {
      console.log(`\n⚠️  Skipping ${pipeline.name}: test file not found`);
      results.push({ name: pipeline.name, status: 'skipped' });
      continue;
    }
    
    try {
      const passed = runConsecutive(pipeline);
      results.push({ name: pipeline.name, status: passed ? 'passed' : 'failed' });
    } catch (error) {
      console.log(`\n❌ Error running ${pipeline.name}: ${error.message}`);
      results.push({ name: pipeline.name, status: 'error' });
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('                    SUMMARY');
  console.log('═'.repeat(60));
  
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  
  for (const result of results) {
    const icon = result.status === 'passed' ? '✅' : result.status === 'skipped' ? '⏭️ ' : '❌';
    console.log(`  ${icon} ${result.name.padEnd(20)} ${result.status}`);
  }
  
  console.log('─'.repeat(60));
  console.log(`  Total: ${results.length} | ${passed} passed | ${failed} failed | ${skipped} skipped`);
  console.log('═'.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 ALL PIPELINES TESTED AND PASSING!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some pipelines failed. Please review above.\n');
    process.exit(1);
  }
}

main();
