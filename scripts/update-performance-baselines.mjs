#!/usr/bin/env node

/**
 * Update Performance Baselines
 * Forces update of performance baselines to current measurements
 */

import { performanceRegressionTester } from '../dist/performance/performance-regression-tester.js';

async function main() {
  try {
    console.log('🔄 Updating StringRay Performance Baselines...\n');

    // Create and run the default test suite to establish new baselines
    const suite = performanceRegressionTester.createDefaultTestSuite();
    console.log(`Running ${suite.tests.length} performance tests to establish baselines...`);

    const results = await performanceRegressionTester.runTestSuite(suite);

    // Force save baselines regardless of test results
    performanceRegressionTester.saveBaselines('./performance-baselines.json');

    console.log(`✅ Baselines updated with ${results.summary.totalTests} test measurements`);
    console.log(`📊 Average deviation from previous baseline: ${results.summary.averageDeviation.toFixed(2)}%`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update performance baselines:', error);
    process.exit(1);
  }
}

main();