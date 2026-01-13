#!/usr/bin/env node

/**
 * Run Codex Rule Simulations
 * Validates all rule enforcements through comprehensive test cases
 */

// Path configuration for cross-environment compatibility
const SIMULATION_PATH = process.env.STRRAY_SIMULATION_PATH || '../dist/simulation';

async function main() {
  console.log('🚀 Starting Codex Rule Simulations...\n');

  try {
    const { codexSimulationRunner } = await import(`${SIMULATION_PATH}/codex-rule-simulations.js`);
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