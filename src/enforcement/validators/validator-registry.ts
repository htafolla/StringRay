/**
 * Validator Registry
 *
 * Central registry for all validator instances. Provides lookup by rule ID
 * and category filtering capabilities.
 *
 * @module validators/validator-registry
 * @version 1.0.0
 */

import {
  IValidator,
  IValidatorRegistry,
  RuleCategory,
} from "../types.js";
import {
  NoDuplicateCodeValidator,
  ContextAnalysisIntegrationValidator,
  MemoryOptimizationValidator,
  DocumentationRequiredValidator,
  NoOverEngineeringValidator,
  CleanDebugLogsValidator,
  ConsoleLogUsageValidator,
} from "./code-quality-validators.js";
import {
  InputValidationValidator,
  SecurityByDesignValidator,
} from "./security-validators.js";
import {
  TestsRequiredValidator,
  TestCoverageValidator,
  ContinuousIntegrationValidator,
  TestFailureReportingValidator,
  PerformanceRegressionReportingValidator,
  SecurityVulnerabilityReportingValidator,
} from "./testing-validators.js";
import {
  DependencyManagementValidator,
  SrcDistIntegrityValidator,
  ImportConsistencyValidator,
  ModuleSystemConsistencyValidator,
  ErrorResolutionValidator,
  LoopSafetyValidator,
  StateManagementPatternsValidator,
  SingleResponsibilityValidator,
  DeploymentSafetyValidator,
  MultiAgentEnsembleValidator,
  SubstrateExternalizationValidator,
  FrameworkSelfValidationValidator,
  EmergentImprovementValidator,
} from "./architecture-validators.js";

/**
 * Implementation of the validator registry.
 * Manages validator instances in a Map for O(1) lookup by rule ID.
 * Auto-registers all validators on construction for facade simplicity.
 *
 * @example
 * ```typescript
 * const registry = new ValidatorRegistry();
 * const validator = registry.getValidator('no-duplicate-code')!;
 * const result = await validator.validate(context);
 * ```
 */
export class ValidatorRegistry implements IValidatorRegistry {
  /** Internal map storing validators by rule ID */
  private validators: Map<string, IValidator> = new Map();

  /**
   * Creates a new ValidatorRegistry and auto-registers all validators.
   */
  constructor() {
    this.registerAllValidators();
  }

  /**
   * Auto-register all validators.
   * Called automatically on construction.
   */
  private registerAllValidators(): void {
    // Code Quality Validators
    this.register(new NoDuplicateCodeValidator());
    this.register(new ContextAnalysisIntegrationValidator());
    this.register(new MemoryOptimizationValidator());
    this.register(new DocumentationRequiredValidator());
    this.register(new NoOverEngineeringValidator());
    this.register(new CleanDebugLogsValidator());
    this.register(new ConsoleLogUsageValidator());

    // Security Validators
    this.register(new InputValidationValidator());
    this.register(new SecurityByDesignValidator());

    // Testing Validators
    this.register(new TestsRequiredValidator());
    this.register(new TestCoverageValidator());
    this.register(new ContinuousIntegrationValidator());
    this.register(new TestFailureReportingValidator());

    // Architecture Validators
    this.register(new DependencyManagementValidator());
    this.register(new SrcDistIntegrityValidator());
    this.register(new ImportConsistencyValidator());
    this.register(new ModuleSystemConsistencyValidator());
    this.register(new ErrorResolutionValidator());
    this.register(new LoopSafetyValidator());
    this.register(new StateManagementPatternsValidator());
    this.register(new SingleResponsibilityValidator());
    this.register(new DeploymentSafetyValidator());
    this.register(new MultiAgentEnsembleValidator());
    this.register(new SubstrateExternalizationValidator());
    this.register(new FrameworkSelfValidationValidator());
    this.register(new EmergentImprovementValidator());

    // Reporting Validators
    this.register(new PerformanceRegressionReportingValidator());
    this.register(new SecurityVulnerabilityReportingValidator());
  }

  /**
   * Register a validator instance.
   * The validator is keyed by its ruleId property.
   *
   * @param validator - The validator instance to register
   * @throws Error if a validator for this ruleId already exists
   */
  register(validator: IValidator): void {
    if (this.validators.has(validator.ruleId)) {
      throw new Error(
        `Validator for rule '${validator.ruleId}' is already registered`,
      );
    }
    this.validators.set(validator.ruleId, validator);
  }

  /**
   * Get a validator by rule ID.
   *
   * @param ruleId - The rule ID to look up
   * @returns The validator instance or undefined if not found
   */
  getValidator(ruleId: string): IValidator | undefined {
    return this.validators.get(ruleId);
  }

  /**
   * Get all validators for a specific category.
   *
   * @param category - The category to filter by
   * @returns Array of validators in that category
   */
  getValidatorsByCategory(category: RuleCategory): IValidator[] {
    return Array.from(this.validators.values()).filter(
      (validator) => validator.category === category,
    );
  }

  /**
   * Get all registered validators.
   *
   * @returns Array of all registered validators
   */
  getAllValidators(): IValidator[] {
    return Array.from(this.validators.values());
  }

  /**
   * Check if a validator exists for a rule ID.
   *
   * @param ruleId - The rule ID to check
   * @returns True if a validator exists, false otherwise
   */
  hasValidator(ruleId: string): boolean {
    return this.validators.has(ruleId);
  }

  /**
   * Remove a validator from the registry.
   *
   * @param ruleId - The rule ID of the validator to remove
   * @returns True if a validator was removed, false if not found
   */
  unregister(ruleId: string): boolean {
    return this.validators.delete(ruleId);
  }

  /**
   * Clear all validators from the registry.
   */
  clear(): void {
    this.validators.clear();
  }

  /**
   * Get the count of registered validators.
   *
   * @returns Number of registered validators
   */
  getCount(): number {
    return this.validators.size;
  }
}

/**
 * Singleton instance of the validator registry.
 * Use this for global validator management.
 */
export const globalValidatorRegistry = new ValidatorRegistry();
