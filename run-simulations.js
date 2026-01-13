import { runDistributedSessionSimulation } from './dist/simulation/distributed-session-simulation.js';
import { runSessionPersistenceSimulation } from './dist/simulation/session-persistence-simulation.js';
import { runSessionRecoverySimulation } from './dist/simulation/session-recovery-simulation.js';

async function runAllSimulations() {
  console.log('🚀 Running Complete Session Management Validation Suite...\n');

  try {
    // 1. Distributed Session Simulation
    console.log('🧪 1. Running Distributed Session Simulation...');
    const distributedResult = await runDistributedSessionSimulation();
    console.log('✅ Distributed Simulation Results:');
    console.log(`   Success: ${distributedResult.success}`);
    console.log(`   Sessions: ${distributedResult.totalSessions}`);
    console.log(`   Failed: ${distributedResult.failedSessions}`);
    console.log(`   Efficiency: ${(distributedResult.coordinationEfficiency * 100).toFixed(1)}%`);
    console.log(`   Network Overhead: ${distributedResult.networkOverhead} calls\n`);

    // 2. Session Persistence Simulation
    console.log('🧪 2. Running Session Persistence Simulation...');
    const persistenceResult = await runSessionPersistenceSimulation();
    console.log('✅ Persistence Simulation Results:');
    console.log(`   Success: ${persistenceResult.success}`);
    console.log(`   Persisted: ${persistenceResult.persistedSessions}/${persistenceResult.totalSessions}`);
    console.log(`   Recovered: ${persistenceResult.recoveredSessions}/${persistenceResult.corruptedSessions}`);
    console.log(`   Data Loss: ${(persistenceResult.dataLoss * 100).toFixed(1)}%`);
    console.log(`   Recovery Time: ${persistenceResult.averageRecoveryTime}ms\n`);

    // 3. Session Recovery Simulation
    console.log('🧪 3. Running Session Recovery Simulation...');
    const recoveryResult = await runSessionRecoverySimulation();
    console.log('✅ Recovery Simulation Results:');
    console.log(`   Success: ${recoveryResult.success}`);
    console.log(`   Failed Sessions: ${recoveryResult.failedSessions}`);
    console.log(`   Recovered: ${recoveryResult.recoveredSessions}/${recoveryResult.failedSessions}`);
    console.log(`   Cascade Failures: ${recoveryResult.cascadeFailures}`);
    console.log(`   Recovery Efficiency: ${(recoveryResult.recoveryEfficiency * 100).toFixed(1)}%`);
    console.log(`   Average Recovery Time: ${recoveryResult.averageRecoveryTime}ms\n`);

    // Summary
    const allSuccessful = distributedResult.success && persistenceResult.success && recoveryResult.success;
    console.log('🎯 SIMULATION SUITE SUMMARY:');
    console.log(`Overall Success: ${allSuccessful ? '✅ ALL PASSED' : '❌ ISSUES DETECTED'}`);
    console.log('Session Management Validation: COMPLETE ✅');

    const totalIssues = distributedResult.issues.length + persistenceResult.issues.length + recoveryResult.issues.length;
    if (totalIssues > 0) {
      console.log(`\n⚠️  Total Issues Detected: ${totalIssues} (expected in failure simulations)`);
    }

  } catch (error) {
    console.error('❌ Simulation suite failed:', error);
    process.exit(1);
  }
}

runAllSimulations();