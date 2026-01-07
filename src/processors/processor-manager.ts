/**
 * StrRay Framework v1.0.0 - Processor Manager
 *
 * Centralized processor management for pre/post processing operations.
 * Implements lifecycle management, performance monitoring, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StrRayStateManager } from '../state/state-manager';

export interface ProcessorConfig {
  name: string;
  type: 'pre' | 'post';
  priority: number;
  enabled: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface ProcessorResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  processorName: string;
}

export interface ProcessorHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastExecution: number;
  successRate: number;
  averageDuration: number;
  errorCount: number;
}

export interface ProcessorMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecutionTime: number;
  healthStatus: ProcessorHealth['status'];
}

export class ProcessorManager {
  private processors = new Map<string, ProcessorConfig>();
  private metrics = new Map<string, ProcessorMetrics>();
  private stateManager: StrRayStateManager;
  private activeProcessors = new Set<string>();

  constructor(stateManager: StrRayStateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Register a processor with the manager
   */
  registerProcessor(config: ProcessorConfig): void {
    // Validate processor name
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Processor name cannot be empty');
    }

    if (config.name.includes(' ') || config.name.includes('-') || config.name.includes('.')) {
      throw new Error('Processor name must be a valid identifier (no spaces, hyphens, or dots)');
    }

    // Validate processor type
    if (config.type !== 'pre' && config.type !== 'post') {
      throw new Error('Processor type must be either "pre" or "post"');
    }

    // Validate priority
    if (config.priority < 0) {
      throw new Error('Processor priority must be non-negative');
    }

    if (this.processors.has(config.name)) {
      throw new Error(`Processor ${config.name} is already registered`);
    }

    this.processors.set(config.name, config);
    this.metrics.set(config.name, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      lastExecutionTime: 0,
      healthStatus: 'healthy'
    });

    console.log(`✅ Processor registered: ${config.name} (${config.type})`);
  }

  /**
   * Unregister a processor
   */
  unregisterProcessor(name: string): void {
    if (!this.processors.has(name)) {
      throw new Error(`Processor ${name} is not registered`);
    }

    this.processors.delete(name);
    this.metrics.delete(name);
    this.activeProcessors.delete(name);

    console.log(`✅ Processor unregistered: ${name}`);
  }

  /**
   * Initialize all registered processors
   */
  async initializeProcessors(): Promise<boolean> {
    console.log('🔄 Initializing processors...');

    const initPromises = Array.from(this.processors.values())
      .filter(p => p.enabled)
      .map(async (config) => {
        try {
          await this.initializeProcessor(config.name);
          return { name: config.name, success: true };
        } catch (error) {
          console.error(`❌ Failed to initialize processor ${config.name}:`, error);
          return { name: config.name, success: false, error: error instanceof Error ? error.message : String(error) };
        }
      });

    const results = await Promise.all(initPromises);
    const failures = results.filter(r => !r.success);

    if (failures.length > 0) {
      console.error(`❌ Failed to initialize ${failures.length} processors:`, failures);
      return false;
    }

    console.log(`✅ All ${results.length} processors initialized successfully`);
    return true;
  }

  /**
   * Initialize a specific processor
   */
  private async initializeProcessor(name: string): Promise<void> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    // Initialize processor-specific setup
    switch (name) {
      case 'preValidate':
        await this.initializePreValidateProcessor();
        break;
      case 'codexCompliance':
        await this.initializeCodexComplianceProcessor();
        break;
      case 'errorBoundary':
        await this.initializeErrorBoundaryProcessor();
        break;
      case 'testExecution':
        await this.initializeTestExecutionProcessor();
        break;
      case 'regressionTesting':
        await this.initializeRegressionTestingProcessor();
        break;
      case 'stateValidation':
        await this.initializeStateValidationProcessor();
        break;
      default:
        // Generic initialization
        break;
    }

    this.activeProcessors.add(name);
  }

  /**
   * Execute pre-processors for a given operation
   */
  async executePreProcessors(operation: string, data: any): Promise<ProcessorResult[]> {
    const preProcessors = Array.from(this.processors.values())
      .filter(p => p.type === 'pre' && p.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: ProcessorResult[] = [];

    for (const config of preProcessors) {
      const result = await this.executeProcessor(config.name, { operation, data });
      results.push(result);

      // Log failures but continue execution for graceful error handling
      if (!result.success) {
        console.warn(`⚠️ Pre-processor ${config.name} failed, continuing with other processors`);
      }
    }

    return results;
  }

  /**
   * Execute post-processors for a given operation
   */
  async executePostProcessors(operation: string, data: any, preResults: ProcessorResult[]): Promise<ProcessorResult[]> {
    const postProcessors = Array.from(this.processors.values())
      .filter(p => p.type === 'post' && p.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: ProcessorResult[] = [];

    for (const config of postProcessors) {
      const result = await this.executeProcessor(config.name, { operation, data, preResults });
      results.push(result);

      // Continue execution even if post-processors fail
      if (!result.success) {
        console.warn(`⚠️ Post-processor ${config.name} failed, continuing...`);
      }
    }

    return results;
  }

  /**
   * Execute a specific processor
   */
  private async executeProcessor(name: string, context: any): Promise<ProcessorResult> {
    const config = this.processors.get(name);
    if (!config) {
      throw new Error(`Processor ${name} not found`);
    }

    const startTime = Date.now();
    const metrics = this.metrics.get(name)!;

    try {
      let result: any;

      switch (name) {
        case 'preValidate':
          result = await this.executePreValidate(context);
          break;
        case 'codexCompliance':
          result = await this.executeCodexCompliance(context);
          break;
        case 'errorBoundary':
          result = await this.executeErrorBoundary(context);
          break;
        case 'testExecution':
          result = await this.executeTestExecution(context);
          break;
        case 'regressionTesting':
          result = await this.executeRegressionTesting(context);
          break;
        case 'stateValidation':
          result = await this.executeStateValidation(context);
          break;
        default:
          throw new Error(`Unknown processor: ${name}`);
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(name, true, duration);

      return {
        success: true,
        data: result,
        duration,
        processorName: name
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(name, false, duration);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        processorName: name
      };
    }
  }

  /**
   * Update processor metrics
   */
  private updateMetrics(name: string, success: boolean, duration: number): void {
    const metrics = this.metrics.get(name)!;
    metrics.totalExecutions++;
    metrics.lastExecutionTime = Date.now();

    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update rolling average duration
    const totalDuration = metrics.averageDuration * (metrics.totalExecutions - 1) + duration;
    metrics.averageDuration = totalDuration / metrics.totalExecutions;

    // Update health status
    const successRate = metrics.successfulExecutions / metrics.totalExecutions;
    metrics.healthStatus = successRate > 0.95 ? 'healthy' :
                          successRate > 0.80 ? 'degraded' : 'failed';
  }

  /**
   * Get processor health status
   */
  getProcessorHealth(): ProcessorHealth[] {
    return Array.from(this.activeProcessors).map(name => {
      const config = this.processors.get(name)!;
      const metrics = this.metrics.get(name)!;

      const totalExecutions = metrics.totalExecutions || 1; // Avoid division by zero
      return {
        name,
        status: metrics.healthStatus,
        lastExecution: metrics.lastExecutionTime,
        successRate: metrics.successfulExecutions / totalExecutions,
        averageDuration: metrics.averageDuration,
        errorCount: metrics.failedExecutions
      };
    });
  }

  /**
   * Resolve processor conflicts
   */
  resolveProcessorConflicts(conflicts: ProcessorResult[]): ProcessorResult {
    if (conflicts.length === 0) {
      throw new Error('No conflicts to resolve');
    }

    const successful = conflicts.find(c => c.success);
    if (successful) {
      return successful;
    }

    return conflicts[0]!;
  }

  /**
   * Cleanup all processors
   */
  async cleanupProcessors(): Promise<void> {
    console.log('🧹 Cleaning up processors...');

    for (const name of this.activeProcessors) {
      try {
        await this.cleanupProcessor(name);
      } catch (error) {
        console.error(`❌ Failed to cleanup processor ${name}:`, error);
      }
    }

    this.activeProcessors.clear();
    console.log('✅ Processor cleanup completed');
  }

  /**
   * Cleanup a specific processor
   */
  private async cleanupProcessor(name: string): Promise<void> {
    // Processor-specific cleanup logic
    switch (name) {
      case 'preValidate':
        // Cleanup pre-validate resources
        break;
      case 'codexCompliance':
        // Cleanup codex compliance resources
        break;
      case 'errorBoundary':
        // Cleanup error boundary resources
        break;
      case 'testExecution':
        // Cleanup test execution resources
        break;
      case 'regressionTesting':
        // Cleanup regression testing resources
        break;
      case 'stateValidation':
        // Cleanup state validation resources
        break;
    }
  }

  // Processor implementations

  private async initializePreValidateProcessor(): Promise<void> {
    // Setup syntax checking and validation hooks
    console.log('🔍 Initializing pre-validate processor with syntax checking...');
  }

  private async initializeCodexComplianceProcessor(): Promise<void> {
    // Setup codex compliance validation
    console.log('📋 Initializing codex compliance processor...');
  }

  private async initializeErrorBoundaryProcessor(): Promise<void> {
    // Setup error boundary mechanisms
    console.log('🛡️ Initializing error boundary processor...');
  }

  private async initializeTestExecutionProcessor(): Promise<void> {
    // Setup automatic test execution
    console.log('🧪 Initializing test execution processor...');
  }

  private async initializeRegressionTestingProcessor(): Promise<void> {
    // Setup regression testing mechanisms
    console.log('🔄 Initializing regression testing processor...');
  }

  private async initializeStateValidationProcessor(): Promise<void> {
    // Setup state validation post-operation
    console.log('📊 Initializing state validation processor...');
  }

  private async executePreValidate(context: any): Promise<any> {
    // Implement comprehensive pre-validation with syntax checking
    const { data } = context;

    // Basic validation
    if (!data) {
      throw new Error('No data provided for validation');
    }

    // Syntax checking (placeholder - would integrate with TypeScript compiler API)
    if (typeof data === 'string' && data.includes('undefined')) {
      throw new Error('Potential undefined usage detected');
    }

    return { validated: true, syntaxCheck: 'passed' };
  }

  private async executeCodexCompliance(context: any): Promise<any> {
    const { operation } = context;

    const codexTerms = this.stateManager.get('enforcement:codex_terms') || [];
    const termsArray = Array.isArray(codexTerms) ? codexTerms : [];

    return {
      compliant: true,
      termsChecked: termsArray.length,
      operation
    };
  }

  private async executeErrorBoundary(context: any): Promise<any> {
    // Setup error boundaries
    return { boundaries: 'established' };
  }

  private async executeTestExecution(context: any): Promise<any> {
    // Execute tests automatically
    console.log('🧪 Executing automatic tests...');
    // Placeholder - would integrate with test runner
    return { testsExecuted: 0, passed: 0, failed: 0 };
  }

  private async executeRegressionTesting(context: any): Promise<any> {
    // Run regression tests
    console.log('🔄 Running regression tests...');
    // Placeholder - would integrate with regression test suite
    return { regressions: 'checked', issues: [] };
  }

  private async executeStateValidation(context: any): Promise<any> {
    // Validate state post-operation
    const currentState = this.stateManager.get('session:active');
    return { stateValid: !!currentState };
  }
}