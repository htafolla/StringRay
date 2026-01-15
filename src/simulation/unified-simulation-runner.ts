/**
 * Unified Simulation Runner
 *
 * Central hub for running all StringRay simulations including:
 * - Complete end-to-end pipeline simulation
 * - Codex rule validation simulations
 * - Session management simulations (recovery, persistence, distributed)
 * - Self-evolution system simulations
 *
 * Provides comprehensive testing and validation coverage for the entire framework.
 */

import { executeCompleteE2ESimulation } from './complete-end-to-end-simulation';
import { codexSimulationRunner } from './codex-rule-simulations';
import { runSessionRecoverySimulation } from './session-recovery-simulation';
import { runSessionPersistenceSimulation } from './session-persistence-simulation';
import { runDistributedSessionSimulation } from './distributed-session-simulation';
import { runSelfEvolutionSimulation, runSelfEvolutionComponentTests } from './self-evolution-simulations';

export interface SimulationSuiteResult {
  suiteName: string;
  totalSimulations: number;
  successfulSimulations: number;
  failedSimulations: number;
  executionTime: number;
  results: SimulationResult[];
  overallSuccess: boolean;
  coverage: number; // percentage
}

export interface SimulationResult {
  name: string;
  type: 'e2e' | 'codex' | 'session' | 'self-evolution' | 'component-test';
  success: boolean;
  executionTime: number;
  details: any;
  error?: string;
}

export class UnifiedSimulationRunner {
  private results: SimulationSuiteResult[] = [];

  /**
   * Run all simulation suites
   */
  async runAllSimulations(): Promise<SimulationSuiteResult[]> {
    console.log('🎯 STARTING UNIFIED SIMULATION SUITE');
    console.log('======================================');

    const suites = [
      { name: 'End-to-End Pipeline', runner: this.runE2ESimulations.bind(this) },
      { name: 'Codex Rule Validation', runner: this.runCodexSimulations.bind(this) },
      { name: 'Session Management', runner: this.runSessionSimulations.bind(this) },
      { name: 'Self-Evolution System', runner: this.runSelfEvolutionSimulations.bind(this) },
      { name: 'Component Isolation', runner: this.runComponentTests.bind(this) }
    ];

    const results: SimulationSuiteResult[] = [];

    for (const suite of suites) {
      console.log(`\n🏃 Running ${suite.name} Simulations...`);
      try {
        const result = await suite.runner();
        results.push(result);
        console.log(`✅ ${suite.name}: ${result.successfulSimulations}/${result.totalSimulations} passed`);
      } catch (error) {
        console.error(`❌ ${suite.name}: Failed - ${error instanceof Error ? error.message : error}`);
        results.push({
          suiteName: suite.name,
          totalSimulations: 0,
          successfulSimulations: 0,
          failedSimulations: 1,
          executionTime: 0,
          results: [],
          overallSuccess: false,
          coverage: 0
        });
      }
    }

    this.results = results;
    this.printComprehensiveReport(results);

    return results;
  }

  /**
   * Run end-to-end pipeline simulations
   */
  private async runE2ESimulations(): Promise<SimulationSuiteResult> {
    const startTime = Date.now();
    const results: SimulationResult[] = [];

    try {
      // Test with different prompt types
      const testPrompts = [
        'Implement a user authentication system',
        'Create a REST API for task management',
        'Build a real-time chat application',
        'Design a database schema for e-commerce'
      ];

      for (const prompt of testPrompts) {
        const promptStartTime = Date.now();
        try {
          const result = await executeCompleteE2ESimulation(prompt);
          results.push({
            name: `E2E: ${prompt.substring(0, 30)}...`,
            type: 'e2e',
            success: result.success,
            executionTime: Date.now() - promptStartTime,
            details: {
              phases: result.phases.length,
              metrics: result.metrics,
              performanceImprovement: result.results?.performanceImprovement || 0
            }
          });
        } catch (error) {
          results.push({
            name: `E2E: ${prompt.substring(0, 30)}...`,
            type: 'e2e',
            success: false,
            executionTime: Date.now() - promptStartTime,
            details: {},
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('E2E simulation suite failed:', error);
    }

    const executionTime = Date.now() - startTime;
    const successfulSimulations = results.filter(r => r.success).length;
    const totalSimulations = results.length;

    return {
      suiteName: 'End-to-End Pipeline',
      totalSimulations,
      successfulSimulations,
      failedSimulations: totalSimulations - successfulSimulations,
      executionTime,
      results,
      overallSuccess: successfulSimulations === totalSimulations,
      coverage: totalSimulations > 0 ? (successfulSimulations / totalSimulations) * 100 : 0
    };
  }

  /**
   * Run codex rule validation simulations
   */
  private async runCodexSimulations(): Promise<SimulationSuiteResult> {
    const startTime = Date.now();

    try {
      const results = await codexSimulationRunner.runAllSimulations();

      const simulationResults: SimulationResult[] = results.map(result => ({
        name: result.ruleId,
        type: 'codex',
        success: result.results.filter(r => r.success).length === result.results.length,
        executionTime: 0, // Codex simulations don't track individual execution time
        details: {
          totalTests: result.results.length,
          passedTests: result.results.filter(r => r.success).length,
          failedTests: result.results.filter(r => !r.success).length
        }
      }));

      const executionTime = Date.now() - startTime;
      const successfulSimulations = simulationResults.filter(r => r.success).length;
      const totalSimulations = simulationResults.length;

      return {
        suiteName: 'Codex Rule Validation',
        totalSimulations,
        successfulSimulations,
        failedSimulations: totalSimulations - successfulSimulations,
        executionTime,
        results: simulationResults,
        overallSuccess: successfulSimulations === totalSimulations,
        coverage: totalSimulations > 0 ? (successfulSimulations / totalSimulations) * 100 : 0
      };
    } catch (error) {
      console.error('Codex simulation suite failed:', error);
      return {
        suiteName: 'Codex Rule Validation',
        totalSimulations: 0,
        successfulSimulations: 0,
        failedSimulations: 1,
        executionTime: Date.now() - startTime,
        results: [],
        overallSuccess: false,
        coverage: 0
      };
    }
  }

  /**
   * Run session management simulations
   */
  private async runSessionSimulations(): Promise<SimulationSuiteResult> {
    const startTime = Date.now();
    const results: SimulationResult[] = [];

    const sessionTests = [
      { name: 'Session Recovery', runner: runSessionRecoverySimulation },
      { name: 'Session Persistence', runner: runSessionPersistenceSimulation },
      { name: 'Distributed Sessions', runner: runDistributedSessionSimulation }
    ];

    for (const test of sessionTests) {
      const testStartTime = Date.now();
      try {
        const result = await test.runner();
        results.push({
          name: test.name,
          type: 'session',
          success: result.success || (result as any).successfulRecoveries > 0 || (result as any).successfulPersistence > 0,
          executionTime: Date.now() - testStartTime,
          details: result
        });
      } catch (error) {
        results.push({
          name: test.name,
          type: 'session',
          success: false,
          executionTime: Date.now() - testStartTime,
          details: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const successfulSimulations = results.filter(r => r.success).length;
    const totalSimulations = results.length;

    return {
      suiteName: 'Session Management',
      totalSimulations,
      successfulSimulations,
      failedSimulations: totalSimulations - successfulSimulations,
      executionTime,
      results,
      overallSuccess: successfulSimulations === totalSimulations,
      coverage: totalSimulations > 0 ? (successfulSimulations / totalSimulations) * 100 : 0
    };
  }

  /**
   * Run self-evolution system simulations
   */
  private async runSelfEvolutionSimulations(): Promise<SimulationSuiteResult> {
    const startTime = Date.now();

    try {
      const result = await runSelfEvolutionSimulation();

      const simulationResults: SimulationResult[] = [{
        name: 'Complete Self-Evolution',
        type: 'self-evolution',
        success: result.success,
        executionTime: result.executionTime,
        details: {
          componentsTested: result.componentsTested,
          autonomousActions: result.autonomousActions,
          safetyIncidents: result.safetyIncidents,
          finalReadinessScore: result.finalReadinessScore
        }
      }];

      const executionTime = Date.now() - startTime;
      const successfulSimulations = result.success ? 1 : 0;

      return {
        suiteName: 'Self-Evolution System',
        totalSimulations: 1,
        successfulSimulations,
        failedSimulations: 1 - successfulSimulations,
        executionTime,
        results: simulationResults,
        overallSuccess: result.success,
        coverage: result.success ? 100 : 0
      };
    } catch (error) {
      console.error('Self-evolution simulation suite failed:', error);
      return {
        suiteName: 'Self-Evolution System',
        totalSimulations: 1,
        successfulSimulations: 0,
        failedSimulations: 1,
        executionTime: Date.now() - startTime,
        results: [],
        overallSuccess: false,
        coverage: 0
      };
    }
  }

  /**
   * Run component isolation tests
   */
  private async runComponentTests(): Promise<SimulationSuiteResult> {
    const startTime = Date.now();

    try {
      const results = await runSelfEvolutionComponentTests();

      const simulationResults: SimulationResult[] = results.map(result => ({
        name: result.simulationName,
        type: 'component-test',
        success: result.success,
        executionTime: result.executionTime,
        details: {
          componentsTested: result.componentsTested,
          safetyIncidents: result.safetyIncidents
        }
      }));

      const executionTime = Date.now() - startTime;
      const successfulSimulations = results.filter(r => r.success).length;
      const totalSimulations = results.length;

      return {
        suiteName: 'Component Isolation',
        totalSimulations,
        successfulSimulations,
        failedSimulations: totalSimulations - successfulSimulations,
        executionTime,
        results: simulationResults,
        overallSuccess: successfulSimulations === totalSimulations,
        coverage: totalSimulations > 0 ? (successfulSimulations / totalSimulations) * 100 : 0
      };
    } catch (error) {
      console.error('Component test suite failed:', error);
      return {
        suiteName: 'Component Isolation',
        totalSimulations: 0,
        successfulSimulations: 0,
        failedSimulations: 1,
        executionTime: Date.now() - startTime,
        results: [],
        overallSuccess: false,
        coverage: 0
      };
    }
  }

  /**
   * Print comprehensive test report
   */
  private printComprehensiveReport(results: SimulationSuiteResult[]): void {
    console.log('\n🎯 COMPREHENSIVE SIMULATION REPORT');
    console.log('===================================');

    let totalSimulations = 0;
    let totalSuccessful = 0;
    let totalExecutionTime = 0;

    for (const suite of results) {
      console.log(`\n📊 ${suite.suiteName}`);
      console.log(`   Simulations: ${suite.successfulSimulations}/${suite.totalSimulations}`);
      console.log(`   Success Rate: ${suite.coverage.toFixed(1)}%`);
      console.log(`   Execution Time: ${suite.executionTime}ms`);

      totalSimulations += suite.totalSimulations;
      totalSuccessful += suite.successfulSimulations;
      totalExecutionTime += suite.executionTime;
    }

    const overallSuccessRate = totalSimulations > 0 ? (totalSuccessful / totalSimulations) * 100 : 0;

    console.log('\n🎉 OVERALL RESULTS');
    console.log('==================');
    console.log(`Total Simulations: ${totalSuccessful}/${totalSimulations}`);
    console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`Total Execution Time: ${totalExecutionTime}ms`);
    console.log(`Average Time per Simulation: ${totalSimulations > 0 ? (totalExecutionTime / totalSimulations).toFixed(0) : 0}ms`);

    if (overallSuccessRate >= 90) {
      console.log('🏆 STATUS: EXCELLENT - Framework fully validated');
    } else if (overallSuccessRate >= 75) {
      console.log('✅ STATUS: GOOD - Framework mostly validated');
    } else if (overallSuccessRate >= 50) {
      console.log('⚠️ STATUS: FAIR - Framework needs attention');
    } else {
      console.log('❌ STATUS: POOR - Framework requires significant fixes');
    }
  }

  /**
   * Get simulation history
   */
  getSimulationHistory(): SimulationSuiteResult[] {
    return this.results;
  }

  /**
   * Run specific simulation suite
   */
  async runSimulationSuite(suiteName: string): Promise<SimulationSuiteResult | null> {
    const suiteMap: Record<string, () => Promise<SimulationSuiteResult>> = {
      'e2e': this.runE2ESimulations.bind(this),
      'codex': this.runCodexSimulations.bind(this),
      'session': this.runSessionSimulations.bind(this),
      'self-evolution': this.runSelfEvolutionSimulations.bind(this),
      'component': this.runComponentTests.bind(this)
    };

    const runner = suiteMap[suiteName.toLowerCase()];
    if (!runner) {
      console.error(`Unknown simulation suite: ${suiteName}`);
      return null;
    }

    return await runner();
  }
}

// Export singleton instance
export const unifiedSimulationRunner = new UnifiedSimulationRunner();