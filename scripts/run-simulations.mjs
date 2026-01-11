#!/usr/bin/env node

/**
 * Run Codex Rule Simulations
 * Validates all rule enforcements through comprehensive test cases
 */

import { codexSimulationRunner } from '../dist/simulation/codex-rule-simulations.js';

async function main() {
  console.log('🚀 Starting Codex Rule Simulations...\n');

  try {
    const results = await codexSimulationRunner.runAllSimulations();
    codexSimulationRunner.generateReport(results);

    // Exit with failure if any simulations failed
    const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
    process.exit(totalFailed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Simulation runner failed:', error);
    process.exit(1);
  }
}

main();