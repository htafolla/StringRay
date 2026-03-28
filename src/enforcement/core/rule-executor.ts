/**
 * Rule Executor - Orchestrate validation execution
 *
 * This class orchestrates the execution of validation rules, handling
 * single rule execution, batch execution, parallel vs serial execution,
 * dependency ordering, timeouts, and error handling.
 *
 * Phase 5 refactoring: Extracted from RuleEnforcer.
 *
 * @module enforcement/core
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * const executor = new RuleExecutor(registry, hierarchy, validatorRegistry);
 *
 * // Execute all applicable rules for an operation
 * const report = await executor.execute('write', context);
 *
 * // Execute a specific rule
 * const result = await executor.executeSingle('no-duplicate-code', context);
 *
 * // Execute multiple rules in batch
 * const results = await executor.executeBatch(['rule1', 'rule2'], context);
 * ```
 */

import { frameworkLogger } from '../../core/framework-logger.js';
import {
  IRuleExecutor,
  IRuleRegistry,
  IRuleHierarchy,
  IValidatorRegistry,
  RuleDefinition,
  RuleValidationContext,
  RuleValidationResult,
  ValidationReport,
  ExecutionOptions,
  BatchExecutionOptions,
  isRuleValidationResult,
  RuleSeverity,
} from '../types.js';

/**
 * RuleExecutor orchestrates the execution of validation rules.
 *
 * Key responsibilities:
 * - Execute single rules
 * - Execute rules in batch (parallel or serial)
 * - Sort rules by dependency order
 * - Handle timeouts and errors
 * - Generate validation reports
 */
export class RuleExecutor implements IRuleExecutor {
  /** Default timeout for rule validation in milliseconds */
  private readonly DEFAULT_TIMEOUT_MS = 30000;

  constructor(
    private registry: IRuleRegistry,
    private hierarchy: IRuleHierarchy,
    private validatorRegistry: IValidatorRegistry,
  ) {}

  /**
   * Execute validation for an operation against all applicable rules.
   *
   * This method:
   * 1. Gets all applicable rules for the operation
   * 2. Sorts them by dependency order
   * 3. Executes each rule
   * 4. Collects results and generates a validation report
   *
   * @param operation - The operation being performed (e.g., 'write', 'create')
   * @param context - Validation context with code and operation info
   * @param options - Optional execution options
   * @returns Promise resolving to validation report
   *
   * @example
   * ```typescript
   * const report = await executor.execute('write', {
   *   operation: 'write',
   *   files: ['src/index.ts'],
   *   newCode: 'console.log("hello");'
   * });
   *
   * console.log(report.passed); // false if any rule failed
   * console.log(report.errors); // Array of error messages
   * ```
   */
  async execute(
    operation: string,
    context: RuleValidationContext,
    options?: ExecutionOptions,
  ): Promise<ValidationReport> {
    const applicableRules = this.getApplicableRules(operation, context);

    await frameworkLogger.log(
      'rule-executor',
      'execute-start',
      'info',
      {
        operation,
        ruleCount: applicableRules.length,
        rules: applicableRules.map(r => r.id),
      },
    );

    const results: RuleValidationResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Always sort rules by dependency order for execute()
    const sortedRules = this.sortByDependencyOrder(applicableRules);

    // Execute rules
    if (options?.parallel) {
      // Execute in parallel
      const batchResults = await this.executeParallel(
        sortedRules,
        context,
        options,
      );
      this.processResults(batchResults, sortedRules, results, errors, warnings);
    } else {
      // Execute serially
      const executedRules = new Set<string>();
      for (const rule of sortedRules) {
        // Check if dependencies are satisfied
        if (!this.hierarchy.isDependencySatisfied(rule.id, executedRules)) {
          const deps = this.hierarchy.getDependencies(rule.id);
          errors.push(
            `Rule ${rule.name} dependencies not satisfied: ${deps.join(', ')}`,
          );
          continue;
        }

        try {
          const result = await this.executeRuleWithTimeout(
            rule,
            context,
            options?.timeoutMs || this.DEFAULT_TIMEOUT_MS,
          );

          this.processResult(result, rule, results, errors, warnings);
          executedRules.add(rule.id);

          // Stop on first error if requested
          if (options?.stopOnError && errors.length > 0) {
            break;
          }
        } catch (error) {
          const errorMessage = `Rule ${rule.name} failed: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMessage);
          executedRules.add(rule.id);

          await frameworkLogger.log(
            'rule-executor',
            'rule-execution-error',
            'error',
            {
              ruleId: rule.id,
              operation,
              error: errorMessage,
            },
          );

          // Stop on first error if requested
          if (options?.stopOnError) {
            break;
          }
        }
      }
    }

    const report: ValidationReport = {
      operation,
      passed: errors.length === 0,
      errors,
      warnings,
      results,
      timestamp: new Date(),
    };

    await frameworkLogger.log(
      'rule-executor',
      'execute-complete',
      report.passed ? 'success' : 'error',
      {
        operation,
        passed: report.passed,
        errorCount: errors.length,
        warningCount: warnings.length,
      },
    );

    return report;
  }

  /**
   * Execute a single rule by ID.
   *
   * @param ruleId - The ID of the rule to execute
   * @param context - Validation context
   * @returns Promise resolving to validation result
   * @throws Error if rule not found or not enabled
   *
   * @example
   * ```typescript
   * const result = await executor.executeSingle('no-duplicate-code', context);
   * console.log(result.passed); // true or false
   * ```
   */
  async executeSingle(
    ruleId: string,
    context: RuleValidationContext,
  ): Promise<RuleValidationResult> {
    const rule = this.registry.getRule(ruleId);

    if (!rule) {
      throw new Error(`Rule with ID "${ruleId}" not found`);
    }

    if (!rule.enabled) {
      throw new Error(`Rule "${ruleId}" is disabled`);
    }

    return this.executeRuleWithTimeout(rule, context, this.DEFAULT_TIMEOUT_MS);
  }

  /**
   * Execute multiple rules in batch.
   *
   * Supports parallel or serial execution based on options.
   * Optionally sorts rules by dependency order before execution.
   *
   * @param ruleIds - Array of rule IDs to execute
   * @param context - Validation context
   * @param options - Optional batch execution options
   * @returns Promise resolving to array of validation results
   *
   * @example
   * ```typescript
   * const results = await executor.executeBatch(
   *   ['no-duplicate-code', 'tests-required'],
   *   context,
   *   { parallel: true, sortByDependencies: true }
   * );
   * ```
   */
  async executeBatch(
    ruleIds: string[],
    context: RuleValidationContext,
    options?: BatchExecutionOptions,
  ): Promise<RuleValidationResult[]> {
    // Get rule definitions
    const rules: RuleDefinition[] = [];
    for (const id of ruleIds) {
      const rule = this.registry.getRule(id);
      if (rule && rule.enabled) {
        rules.push(rule);
      }
    }

    // Sort by dependencies if requested
    const sortedRules = options?.sortByDependencies !== false
      ? this.sortByDependencyOrder(rules)
      : rules;

    if (options?.parallel) {
      return this.executeParallel(sortedRules, context, options);
    } else {
      const results: RuleValidationResult[] = [];
      for (const rule of sortedRules) {
        const result = await this.executeRuleWithTimeout(
          rule,
          context,
          options?.timeoutMs || this.DEFAULT_TIMEOUT_MS,
        );
        results.push(result);

        if (options?.stopOnError && !result.passed) {
          break;
        }
      }
      return results;
    }
  }

  /**
   * Execute a rule with timeout protection.
   *
   * @param rule - The rule definition to execute
   * @param context - Validation context
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise resolving to validation result
   */
  private async executeRuleWithTimeout(
    rule: RuleDefinition,
    context: RuleValidationContext,
    timeoutMs: number,
  ): Promise<RuleValidationResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Rule ${rule.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      rule.validator(context)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Execute rules in parallel.
   *
   * @param rules - Array of rules to execute
   * @param context - Validation context
   * @param options - Execution options
   * @returns Promise resolving to array of results
   */
  private async executeParallel(
    rules: RuleDefinition[],
    context: RuleValidationContext,
    options?: ExecutionOptions,
  ): Promise<RuleValidationResult[]> {
    const concurrency = options?.concurrency || rules.length;
    const results: RuleValidationResult[] = [];

    // Process in chunks based on concurrency limit
    for (let i = 0; i < rules.length; i += concurrency) {
      const chunk = rules.slice(i, i + concurrency);
      const chunkPromises = chunk.map(rule =>
        this.executeRuleWithTimeout(
          rule,
          context,
          options?.timeoutMs || this.DEFAULT_TIMEOUT_MS,
        ).catch(error => ({
          passed: false,
          message: `Rule ${rule.id} failed: ${error instanceof Error ? error.message : String(error)}`,
        })),
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Stop on first error if requested
      if (options?.stopOnError && chunkResults.some(r => !r.passed)) {
        break;
      }
    }

    return results;
  }

  /**
   * Sort rules by dependency order using the hierarchy.
   *
   * @param rules - Array of rules to sort
   * @returns Sorted array of rules
   */
  private sortByDependencyOrder(rules: RuleDefinition[]): RuleDefinition[] {
    const ruleIds = rules.map(r => r.id);
    const orderedIds = this.hierarchy.getExecutionOrder(ruleIds);

    // Map ordered IDs back to rule definitions
    const ruleMap = new Map(rules.map(r => [r.id, r]));
    return orderedIds
      .map(id => ruleMap.get(id))
      .filter((r): r is RuleDefinition => r !== undefined);
  }

  /**
   * Process a single result and categorize errors/warnings.
   */
  private processResult(
    result: RuleValidationResult,
    rule: RuleDefinition,
    results: RuleValidationResult[],
    errors: string[],
    warnings: string[],
  ): void {
    if (isRuleValidationResult(result) && result.passed === false) {
      results.push(result);

      if (rule.severity === 'error' || rule.severity === 'blocking' || rule.severity === 'high') {
        errors.push(`${rule.name}: ${result.message}`);
      } else if (rule.severity === 'warning') {
        warnings.push(`${rule.name}: ${result.message}`);
      }
    }
  }

  /**
   * Process multiple results and categorize errors/warnings.
   */
  private processResults(
    batchResults: RuleValidationResult[],
    rules: RuleDefinition[],
    results: RuleValidationResult[],
    errors: string[],
    warnings: string[],
  ): void {
    batchResults.forEach((result, index) => {
      const rule = rules[index];
      if (rule && isRuleValidationResult(result) && result.passed === false) {
        results.push(result);

        if (rule.severity === 'error' || rule.severity === 'blocking' || rule.severity === 'high') {
          errors.push(`${rule.name}: ${result.message}`);
        } else if (rule.severity === 'warning') {
          warnings.push(`${rule.name}: ${result.message}`);
        }
      }
    });
  }

  /**
   * Get applicable rules for an operation and context.
   *
   * @param operation - The operation being performed
   * @param context - Validation context
   * @returns Array of applicable rule definitions
   */
  private getApplicableRules(
    operation: string,
    context: RuleValidationContext,
  ): RuleDefinition[] {
    return this.registry.getRules().filter(rule =>
      this.isRuleApplicable(rule, operation, context),
    );
  }

  /**
   * Check if a rule is applicable to the current operation.
   *
   * @param rule - The rule definition
   * @param operation - The operation being performed
   * @param context - Validation context
   * @returns true if the rule is applicable
   */
  private isRuleApplicable(
    rule: RuleDefinition,
    operation: string,
    context: RuleValidationContext,
  ): boolean {
    if (!rule.enabled) return false;

    // Check operation type for specific rules
    switch (rule.id) {
      case 'tests-required':
        return operation === 'write' || operation === 'create';
      case 'no-duplicate-code':
        return operation === 'write' && !!context.newCode;
      case 'no-over-engineering':
        return operation === 'write' && !!context.newCode;
      case 'resolve-all-errors':
        return operation === 'write' && !!context.newCode;
      case 'prevent-infinite-loops':
        return operation === 'write' && !!context.newCode;
      case 'state-management-patterns':
        return operation === 'write' && !!context.newCode;
      case 'import-consistency':
        return operation === 'write' && !!context.newCode;
      case 'documentation-required':
        return operation === 'write' || operation === 'modify';
      case 'clean-debug-logs':
        return operation === 'write' && !!context.newCode;
      case 'console-log-usage':
        return operation === 'write' && !!context.newCode;
      case 'src-dist-integrity':
        return (
          (operation === 'write' || operation === 'copy' || operation === 'modify') &&
          !!context.files
        );
      default:
        return true;
    }
  }
}
