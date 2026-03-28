/**
 * RuleEnforcer - Facade for the enforcement system
 * 
 * Orchestrates rule validation and fixing through specialized components:
 * - RuleRegistry: Rule storage and lifecycle
 * - RuleHierarchy: Dependency management  
 * - RuleExecutor: Validation orchestration
 * - ViolationFixer: Fix delegation to agents
 * - LoaderOrchestrator: Async rule loading
 * - ValidatorRegistry: Individual rule validators
 * 
 * Phase 6 refactoring: Final facade cleanup - RuleEnforcer is now a pure facade
 * with all business logic delegated to specialized components.
 * 
 * @example
 * const enforcer = new RuleEnforcer();
 * const report = await enforcer.validateOperation('write', context);
 * const fixes = await enforcer.attemptRuleViolationFixes(report.violations, context);
 */

import { frameworkLogger } from "../core/framework-logger.js";
import {
  RuleDefinition,
  RuleValidationContext,
  RuleValidationResult,
  ValidationReport,
  Violation,
  ViolationFix,
  RuleCategory,
  RuleSeverity,
  IRuleRegistry,
  IValidatorRegistry,
  IRuleHierarchy,
  IRuleExecutor,
  IViolationFixer,
} from "./types.js";
import {
  RuleRegistry,
  RuleHierarchy,
  RuleExecutor,
  ViolationFixer,
} from "./core/index.js";
import { ValidatorRegistry } from "./validators/index.js";
import { LoaderOrchestrator } from "./loaders/loader-orchestrator.js";

// Re-export types for backward compatibility
export {
  RuleDefinition,
  RuleValidationContext,
  RuleValidationResult,
  ValidationReport,
  Violation,
  ViolationFix,
  RuleFix,
  RuleFixType,
  isRuleValidationResult,
} from "./types.js";

// Re-export core components
export {
  RuleRegistry,
  RuleHierarchy,
  RuleExecutor,
  ViolationFixer,
} from "./core/index.js";

/**
 * Options for RuleEnforcer constructor.
 * Supports dependency injection for testability.
 */
export interface RuleEnforcerOptions {
  /** Custom rule registry (optional) */
  registry?: IRuleRegistry;
  /** Custom rule hierarchy (optional) */
  hierarchy?: IRuleHierarchy;
  /** Custom rule executor (optional) */
  executor?: IRuleExecutor;
  /** Custom violation fixer (optional) */
  fixer?: IViolationFixer;
  /** Custom validator registry (optional) */
  validatorRegistry?: IValidatorRegistry;
}

/**
 * RuleEnforcer - Facade for the rule enforcement system
 * 
 * This class acts as a unified interface to the enforcement system,
 * delegating all operations to specialized components:
 * 
 * - RuleRegistry: Stores and manages rule definitions
 * - RuleHierarchy: Manages rule dependencies and execution order
 * - RuleExecutor: Orchestrates validation execution
 * - ViolationFixer: Delegates fixes to appropriate agents/skills
 * - ValidatorRegistry: Registers and retrieves individual rule validators
 * 
 * All validation logic has been extracted to individual validator classes
 * in the validators/ directory. This facade only coordinates between components.
 */
export class RuleEnforcer {
  private registry: IRuleRegistry;
  private hierarchy: IRuleHierarchy;
  private executor: IRuleExecutor;
  private fixer: IViolationFixer;
  private validatorRegistry: IValidatorRegistry;
  private initialized = false;

  constructor(options?: RuleEnforcerOptions) {
    // Initialize core components with dependency injection for testability
    this.registry = options?.registry ?? new RuleRegistry();
    this.hierarchy = options?.hierarchy ?? new RuleHierarchy();
    this.fixer = options?.fixer ?? new ViolationFixer();
    this.validatorRegistry = options?.validatorRegistry ?? new ValidatorRegistry();

    // Initialize rule executor
    this.executor = options?.executor ?? new RuleExecutor(
      this.registry,
      this.hierarchy,
      this.validatorRegistry,
    );

    // Initialize synchronously first
    this.initializeRules();
    this.initializeRuleHierarchy();
    // Load async rules in background
    this.loadAsyncRules();
  }

  /**
   * Initialize default framework rules using compact metadata.
   * All validators are delegated to the ValidatorRegistry via createValidatorDelegate.
   */
  private initializeRules(): void {
    // Rule metadata: [id, name, description, category, severity]
    const ruleMetadata: [string, string, string, RuleCategory, RuleSeverity][] = [
      // Code Quality Rules
      ["no-duplicate-code", "No Duplicate Code Creation", "Prevents creation of code that already exists", "code-quality", "error"],
      ["context-analysis-integration", "Context Analysis Integration", "Ensures new code integrates properly with context analysis", "architecture", "warning"],
      ["memory-optimization", "Memory Optimization Compliance", "Ensures code follows memory optimization patterns", "performance", "warning"],
      ["dependency-management", "Proper Dependency Management", "Validates dependency declarations and imports", "architecture", "error"],
      
      // Build Process Rules
      ["src-dist-integrity", "Source-Dist Integrity", "Prevents direct file copying between src/ and dist/. All changes must be made in src/ and compiled via npm run build", "architecture", "error"],
      
      // Security Rules
      ["input-validation", "Input Validation Required", "Requires input validation for user-facing functions", "security", "warning"],
      
      // Testing Rules
      ["tests-required", "Tests Required for New Code", "Requires tests when creating new components or modifying functionality", "testing", "error"],
      
      // Documentation Rules - Codex Term #46
      ["documentation-required", "Documentation Required (Codex Term #46)", "Requires comprehensive documentation for all new code, APIs, and architectural changes", "code-quality", "error"],
      
      // Codex Term #3: No Over-Engineering
      ["no-over-engineering", "No Over-Engineering (Codex Term #3)", "Prevents over-engineering by enforcing simple, direct solutions without unnecessary abstractions", "architecture", "error"],
      
      // Codex Term #7: Resolve All Errors
      ["error-resolution", "Resolve All Errors (Codex Term #7)", "Ensures all runtime errors are properly handled and prevented", "architecture", "blocking"],
      
      // Codex Term #8: Prevent Infinite Loops
      ["loop-safety", "Prevent Infinite Loops (Codex Term #8)", "Ensures all loops have clear termination conditions", "architecture", "blocking"],
      
      // Codex Term #41: State Management Patterns
      ["state-management-patterns", "State Management Patterns (Codex Term #41)", "Ensures proper state management patterns are used throughout the application", "architecture", "high"],
      
      // Codex Term #46: Import Consistency
      ["import-consistency", "Import Consistency (Codex Term #46)", "Ensures consistent import patterns that work in both development and production environments", "architecture", "error"],
      
      // Codex Term #24: Single Responsibility Principle
      ["single-responsibility", "Single Responsibility Principle (Codex Term #24)", "Ensures each class/module has one reason to change", "architecture", "warning"],
      
      // Codex Term #26: Test Coverage >85%
      ["test-coverage", "Test Coverage >85% (Codex Term #26)", "Maintains 85%+ behavioral test coverage", "testing", "error"],
      
      // Codex Term #29: Security by Design
      ["security-by-design", "Security by Design (Codex Term #29)", "Validates all inputs (client and server) and sanitizes data", "security", "error"],
      
      // Codex Term #36: Continuous Integration
      ["continuous-integration", "Continuous Integration (Codex Term #36)", "Ensures automated testing and linting on every commit", "testing", "error"],
      
      // Codex Term #43: Deployment Safety
      ["deployment-safety", "Deployment Safety (Codex Term #43)", "Ensures zero-downtime deployments and rollback capability", "architecture", "blocking"],
      
      // Development Triage Rule: Clean Debug Logs
      ["clean-debug-logs", "Clean Debug Logs (Development Triage)", "Ensures debug logs are removed before production deployment", "code-quality", "error"],
      
      // Reporting Rules
      ["test-failure-reporting", "Test Failure Report Generation", "Automatically generates reports when tests fail", "reporting", "warning"],
      ["performance-regression-reporting", "Performance Regression Report Generation", "Generates reports when performance regressions are detected", "reporting", "warning"],
      ["security-vulnerability-reporting", "Security Vulnerability Report Generation", "Automatically reports security vulnerabilities found", "reporting", "error"],
      
      // Phase 3: Multi-Agent Ensemble Rule
      ["multi-agent-ensemble", "Multi-Agent Ensemble (Phase 3)", "Validates that multiple AI perspectives are considered in complex decisions", "architecture", "warning"],
      
      // Phase 3: Substrate Pattern Externalization
      ["substrate-externalization", "Substrate Externalization", "Validates that framework patterns mirror observed AI orchestration behaviors", "architecture", "info"],
      
      // Phase 4: Self-Bootstrapping & Emergence Rules
      ["framework-self-validation", "Framework Self-Validation", "Validates that the framework can validate and improve its own code", "architecture", "info"],
      ["emergent-improvement", "Emergent Framework Improvement", "Validates that the framework can identify and suggest its own improvements", "architecture", "info"],
      
      // Phase 4.1: Module System Consistency
      ["module-system-consistency", "Module System Consistency", "Enforces consistent use of ES modules, preventing CommonJS/ES module mixing", "architecture", "error"],
      
      // Console Log Usage Rule
      ["console-log-usage", "Console Log Usage Restrictions", "Console.log must be used only for debugging in dev mode - retained logs must use framework logger", "code-quality", "error"],
    ];

    // Register all rules with validator delegates
    for (const [id, name, description, category, severity] of ruleMetadata) {
      this.addRule({
        id,
        name,
        description,
        category,
        severity,
        enabled: true,
        validator: this.createValidatorDelegate(id),
      });
    }
  }

  /**
   * Initialize rule hierarchy (prerequisites)
   * Delegates to RuleHierarchy for dependency management
   */
  private initializeRuleHierarchy(): void {
    this.hierarchy.addDependency("tests-required", ["no-duplicate-code"]);
    this.hierarchy.addDependency("context-analysis-integration", [
      "tests-required",
      "no-duplicate-code",
    ]);
    this.hierarchy.addDependency("memory-optimization", [
      "context-analysis-integration",
    ]);
    this.hierarchy.addDependency("dependency-management", ["no-duplicate-code"]);
    this.hierarchy.addDependency("input-validation", ["tests-required"]);
    this.hierarchy.addDependency("documentation-required", ["tests-required"]);
    this.hierarchy.addDependency("no-over-engineering", ["tests-required"]);
  }

  /**
   * Load async rules in background using LoaderOrchestrator.
   * Delegates to LoaderOrchestrator for rule loading.
   */
  private async loadAsyncRules(): Promise<void> {
    try {
      const orchestrator = new LoaderOrchestrator({
        continueOnError: true,
        enableLogging: true,
      });

      const result = await orchestrator.loadAllRules();

      // Register all loaded rules
      for (const rule of result.rules) {
        this.addRule(rule);
      }

      this.initialized = true;

      await frameworkLogger.log(
        "rule-enforcer",
        "async-rules-loaded",
        "success",
        {
          message: `Loaded ${result.rules.length} async rules from ${result.successfulLoaders} loaders`,
          ruleCount: result.rules.length,
          successfulLoaders: result.successfulLoaders,
          failedLoaders: result.failedLoaders,
        }
      );
    } catch (error) {
      // Silent failure - async rules may not load in all environments
      await frameworkLogger.log(
        "rule-enforcer",
        "async-rules-load-failed",
        "error",
        {
          message: `Failed to load async rules: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  // ==================== PUBLIC API ====================

  /**
   * Add a rule to the enforcer
   * Delegates to RuleRegistry for storage
   */
  addRule(rule: RuleDefinition): void {
    this.registry.addRule(rule);
  }

  /**
   * Get all loaded rules
   * Delegates to RuleRegistry for retrieval
   */
  getRules(): RuleDefinition[] {
    return this.registry.getRules();
  }

  /**
   * Get rule count
   * Delegates to RuleRegistry for count
   */
  getRuleCount(): number {
    return this.registry.getRuleCount();
  }

  /**
   * Get rule by ID
   * Delegates to RuleRegistry for retrieval
   */
  getRule(id: string): RuleDefinition | undefined {
    return this.registry.getRule(id);
  }

  /**
   * Enable a rule by ID
   * Delegates to RuleRegistry for state management
   */
  enableRule(ruleId: string): boolean {
    return this.registry.enableRule(ruleId);
  }

  /**
   * Disable a rule by ID
   * Delegates to RuleRegistry for state management
   */
  disableRule(ruleId: string): boolean {
    return this.registry.disableRule(ruleId);
  }

  /**
   * Check if a rule is enabled
   * Delegates to RuleRegistry for state check
   */
  isRuleEnabled(ruleId: string): boolean {
    return this.registry.isRuleEnabled(ruleId);
  }

  /**
   * Get rule statistics
   * Delegates to RuleRegistry for statistics
   */
  getRuleStats(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    ruleCategories: Record<string, number>;
  } {
    return this.registry.getRuleStats();
  }

  /**
   * Check if rule enforcer is fully initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Validate operation against all applicable rules
   * Delegates to RuleExecutor for validation orchestration
   */
  async validateOperation(
    operation: string,
    context: RuleValidationContext,
  ): Promise<ValidationReport> {
    // Ensure async rules are loaded
    if (!this.initialized) {
      await this.loadAsyncRules();
    }

    // Delegate to executor
    return this.executor.execute(operation, context);
  }

  /**
   * Attempt to fix rule violations by delegating to appropriate agents/skills
   * Delegates to ViolationFixer for fix orchestration
   */
  async attemptRuleViolationFixes(
    violations: Violation[],
    context: RuleValidationContext,
  ): Promise<ViolationFix[]> {
    // Delegate to fixer
    return this.fixer.fixViolations(violations, context);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Creates a validator delegate function that looks up and calls the appropriate validator.
   * Eliminates the need for 30+ individual wrapper methods.
   */
  private createValidatorDelegate(
    ruleId: string,
  ): (context: RuleValidationContext) => Promise<RuleValidationResult> {
    return async (context: RuleValidationContext): Promise<RuleValidationResult> => {
      const validator = this.validatorRegistry.getValidator(ruleId);
      if (!validator) {
        return {
          passed: false,
          message: `Validator not found for rule: ${ruleId}`,
        };
      }
      return validator.validate(context);
    };
  }
}

// Export singleton instance
export const ruleEnforcer = new RuleEnforcer();
