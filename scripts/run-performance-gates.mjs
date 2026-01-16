#!/usr/bin/env node

/**
 * Performance Gates Runner
 * Executes performance gates for CI/CD pipelines
 */

import { performanceCIGates } from '../dist/performance/performance-ci-gates.js';

async function main() {
  try {
    console.log('🚀 Running StringRay Performance Gates...\n');

    const result = await performanceCIGates.runPerformanceGates();

    if (!result.success) {
      console.error('❌ Performance gates failed');
      process.exit(1);
    }

    console.log('✅ Performance gates passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Performance gates execution failed:', error);
    process.exit(1);
  }
}

main();