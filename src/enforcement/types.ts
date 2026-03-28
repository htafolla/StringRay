/**
 * Rule Enforcement System Types
 * 
 * This module contains all TypeScript type definitions for the rule enforcement system.
 * Extracted from rule-enforcer.ts as part of Phase 1 refactoring.
 * 
 * @module types
 * @version 1.0.0
 */

/**
 * Rule severity levels
 */
export type RuleSeverity = "error" | "warning" | "info" | "blocking" | "high";

/**
 * Rule categories for organizing and filtering rules
 */
export type RuleCategory =
  | "code-quality"
  | "architecture"
  | "performance"
  | "security"
  | "testing"
  | "reporting"
  | "codex";

/**
 * Rule fix action types
 */
export type RuleFixType = "create-file" | "modify-file" | "add-dependency" | "run-command";

/**
 * Defines a validation rule with its metadata and validator function.
 * 
 * @example
 * ```typescript
 * const rule: RuleDefinition = {
 *   id: "no-console",
 *   name: "No Console Logs",
 *   description: "Prevents console.log usage in production code",
 *   category: "code-quality",
 *   severity: "warning",
 *   validator: async (context) => ({ passed: true, message: "OK" }),
 *   enabled: true
 * };
 * ```
 */
export interface RuleDefinition {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name of the rule */
  name: string;
  /** Detailed description of what the rule validates */
  description: string;
  /** Category for organizing rules */
  category: RuleCategory;
  /** Severity level of violations */
  severity: RuleSeverity;
  /** Async validator function that performs the validation */
  validator: (context: RuleValidationContext) => Promise<RuleValidationResult>;
  /** Whether the rule is currently active */
  enabled: boolean;
}

/**
 * Context object passed to rule validators containing operation details.
 * 
 * @example
 * ```typescript
 * const context: RuleValidationContext = {
 *   operation: "write",
 *   files: ["src/index.ts"],
 *   newCode: "console.log('hello');"
 * };
 * ```
 */
export interface RuleValidationContext {
  /** The operation being performed (write, create, modify, etc.) */
  operation: string;
  /** List of files involved in the operation */
  files?: string[];
  /** Name of the component being created/modified */
  component?: string;
  /** Map of existing file paths to their content */
  existingCode?: Map<string, string>;
  /** New code being written */
  newCode?: string;
  /** List of declared dependencies */
  dependencies?: string[];
  /** List of test files */
  tests?: string[];
}

/**
 * Result of a rule validation operation.
 * 
 * @example
 * ```typescript
 * const result: RuleValidationResult = {
 *   passed: false,
 *   message: "Console.log detected",
 *   suggestions: ["Use frameworkLogger instead"],
 *   fixes: [{ type: "modify-file", description: "Replace console.log" }]
 * };
 * ```
 */
export interface RuleValidationResult {
  /** Whether validation passed */
  passed: boolean;
  /** Human-readable message describing the result */
  message: string;
  /** Optional list of improvement suggestions */
  suggestions?: string[];
  /** Optional list of automated fixes that can be applied */
  fixes?: RuleFix[];
}

/**
 * Complete validation report for an operation.
 * 
 * @example
 * ```typescript
 * const report: ValidationReport = {
 *   operation: "write",
 *   passed: false,
 *   errors: ["Rule 1 failed"],
 *   warnings: ["Rule 2 warning"],
 *   results: [...],
 *   timestamp: new Date()
 * };
 * ```
 */
export interface ValidationReport {
  /** The operation that was validated */
  operation: string;
  /** Whether all rules passed */
  passed: boolean;
  /** List of error messages */
  errors: string[];
  /** List of warning messages */
  warnings: string[];
  /** Detailed results from each rule */
  results: RuleValidationResult[];
  /** When the validation was performed */
  timestamp: Date;
}

/**
 * Represents a detected rule violation.
 * 
 * @example
 * ```typescript
 * const violation: Violation = {
 *   rule: "no-console",
 *   message: "Console.log detected",
 *   severity: "error"
 * };
 * ```
 */
export interface Violation {
  /** ID of the violated rule */
  rule: string;
  /** Human-readable message describing the violation */
  message: string;
  /** Severity of the violation */
  severity?: RuleSeverity;
  /** Optional suggestions for fixing */
  suggestions?: string[];
}

/**
 * Tracks an attempt to fix a rule violation.
 * 
 * @example
 * ```typescript
 * const fix: ViolationFix = {
 *   ruleId: "no-console",
 *   agent: "refactorer",
 *   skill: "code-review",
 *   context: {...},
 *   attempted: true,
 *   success: true
 * };
 * ```
 */
export interface ViolationFix {
  /** ID of the rule that was violated */
  ruleId: string;
  /** Agent that attempted the fix */
  agent: string;
  /** Skill that was invoked */
  skill: string;
  /** Context at the time of the fix attempt */
  context: unknown;
  /** Whether a fix was attempted */
  attempted: boolean;
  /** Whether the fix succeeded (if attempted) */
  success?: boolean;
  /** Error message if fix failed */
  error?: string;
}

/**
 * Describes an automated fix that can be applied to resolve a violation.
 * 
 * @example
 * ```typescript
 * const fix: RuleFix = {
 *   type: "modify-file",
 *   description: "Remove console.log statements",
 *   filePath: "src/index.ts",
 *   content: "// cleaned code"
 * };
 * ```
 */
export interface RuleFix {
  /** Type of fix to apply */
  type: RuleFixType;
  /** Human-readable description of the fix */
  description: string;
  /** Target file path (for file operations) */
  filePath?: string;
  /** Content to write (for file operations) */
  content?: string;
  /** Command to execute (for command operations) */
  command?: string;
}

/**
 * Type guard to check if an object is a valid RuleValidationResult.
 *
 * @param obj - The object to check
 * @returns True if the object is a valid RuleValidationResult
 *
 * @example
 * ```typescript
 * if (isRuleValidationResult(value)) {
 *   console.log(value.passed);
 * }
 * ```
 */
export function isRuleValidationResult(obj: unknown): obj is RuleValidationResult {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "passed" in obj &&
    typeof (obj as RuleValidationResult).passed === "boolean" &&
    "message" in obj &&
    typeof (obj as RuleValidationResult).message === "string"
  );
}

/**
 * Interface for individual validators extracted from RuleEnforcer.
 * Validators encapsulate specific validation logic and can be tested independently.
 *
 * @example
 * ```typescript
 * class MyValidator implements IValidator {
 *   readonly id = 'my-validator';
 *   readonly ruleId = 'my-rule';
 *   readonly category = 'code-quality';
 *   readonly severity = 'error';
 *
 *   async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
 *     // validation logic
 *   }
 * }
 * ```
 */
export interface IValidator {
  /** Unique identifier for this validator instance */
  readonly id: string;
  /** The rule ID this validator validates */
  readonly ruleId: string;
  /** Category for organizing validators */
  readonly category: RuleCategory;
  /** Severity level of violations */
  readonly severity: RuleSeverity;

  /**
   * Perform validation on the given context.
   * @param context - The validation context containing code and operation info
   * @returns Promise resolving to validation result
   */
  validate(context: RuleValidationContext): Promise<RuleValidationResult>;
}

/**
 * Interface for validator registry implementations.
 * Manages validator instances and provides lookup capabilities.
 *
 * @example
 * ```typescript
 * const registry = new ValidatorRegistry();
 * registry.register(new NoDuplicateCodeValidator());
 * const validator = registry.getValidator('no-duplicate-code');
 * ```
 */
export interface IValidatorRegistry {
  /** Register a validator instance */
  register(validator: IValidator): void;

  /** Get a validator by rule ID */
  getValidator(ruleId: string): IValidator | undefined;

  /** Get all validators for a specific category */
  getValidatorsByCategory(category: RuleCategory): IValidator[];

  /** Get all registered validators */
  getAllValidators(): IValidator[];

  /** Check if a validator exists for a rule ID */
  hasValidator(ruleId: string): boolean;

  /** Remove a validator from the registry */
  unregister(ruleId: string): boolean;

  /** Clear all validators from the registry */
  clear(): void;

  /** Get count of registered validators */
  getCount(): number;
}

/**
 * Interface for rule registry implementations.
 * Provides storage and management of validation rules separate from execution.
 *
 * @example
 * ```typescript
 * const registry: IRuleRegistry = new RuleRegistry();
 * registry.addRule({ id: "no-console", name: "No Console", ... });
 * const rules = registry.getRules();
 * ```
 */
export interface IRuleRegistry {
  /** Add a rule to the registry */
  addRule(rule: RuleDefinition): void;

  /** Get all loaded rules */
  getRules(): RuleDefinition[];

  /** Get a specific rule by ID */
  getRule(ruleId: string): RuleDefinition | undefined;

  /** Enable a rule by ID */
  enableRule(ruleId: string): boolean;

  /** Disable a rule by ID */
  disableRule(ruleId: string): boolean;

  /** Check if a rule is enabled */
  isRuleEnabled(ruleId: string): boolean;

  /** Get total rule count */
  getRuleCount(): number;

  /** Get rule statistics by category and status */
  getRuleStats(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    ruleCategories: Record<string, number>;
  };

  /** Check if a rule exists in the registry */
  hasRule(ruleId: string): boolean;

  /** Remove a rule from the registry */
  removeRule(ruleId: string): boolean;

  /** Clear all rules from the registry */
  clearRules(): void;
}

/**
 * Interface for rule loader implementations.
 * Loaders encapsulate the logic for loading rules from various sources
 * such as files, APIs, or databases.
 *
 * Phase 4 refactoring: Extracted async rule loading logic from RuleEnforcer
 * into separate loader classes for better separation of concerns.
 *
 * @example
 * ```typescript
 * class MyLoader extends BaseLoader {
 *   readonly name = 'my-loader';
 *   
 *   async load(): Promise<RuleDefinition[]> {
 *     // Load rules from custom source
 *     return [...];
 *   }
 *   
 *   async isAvailable(): Promise<boolean> {
 *     return fs.existsSync('my-rules.json');
 *   }
 * }
 * ```
 */
export interface IRuleLoader {
  /** Unique name identifier for this loader */
  readonly name: string;

  /**
   * Load rules from the source.
   * @returns Promise resolving to array of rule definitions
   */
  load(): Promise<RuleDefinition[]>;

  /**
   * Check if this loader's source is available.
   * @returns Promise resolving to true if source exists and is accessible
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Options for rule execution.
 */
export interface ExecutionOptions {
  /** Whether to execute rules in parallel (default: false for predictable ordering) */
  parallel?: boolean;
  /** Maximum number of parallel executions if parallel is true */
  concurrency?: number;
  /** Timeout in milliseconds for each rule validation (default: 30000) */
  timeoutMs?: number;
  /** Whether to stop execution on first error (default: false) */
  stopOnError?: boolean;
}

/**
 * Options for batch rule execution.
 */
export interface BatchExecutionOptions extends ExecutionOptions {
  /** Whether to sort by dependency order before execution (default: true) */
  sortByDependencies?: boolean;
}

/**
 * Strategy for fixing a specific rule violation.
 */
export interface FixStrategy {
  /** Agent name to delegate the fix to */
  agent: string;
  /** Skill to invoke on the agent */
  skill: string;
  /** Tool to use for the skill */
  tool: string;
  /** Priority for fix execution (higher = earlier) */
  priority: number;
}

/**
 * Interface for rule hierarchy management.
 * Manages rule dependencies and execution ordering.
 *
 * Phase 5 refactoring: Extracted dependency management from RuleEnforcer.
 *
 * @example
 * ```typescript
 * const hierarchy = new RuleHierarchy();
 * hierarchy.addDependency('tests-required', ['no-duplicate-code']);
 * const order = hierarchy.getExecutionOrder(['tests-required', 'no-duplicate-code']);
 * ```
 */
export interface IRuleHierarchy {
  /** Add a dependency relationship */
  addDependency(ruleId: string, dependsOn: string[]): void;
  /** Get dependencies for a rule */
  getDependencies(ruleId: string): string[];
  /** Get rules that depend on this rule */
  getDependents(ruleId: string): string[];
  /** Get execution order for rules based on dependencies */
  getExecutionOrder(ruleIds: string[]): string[];
  /** Check if circular dependencies exist */
  hasCircularDependencies(): boolean;
  /** Find all circular dependency cycles */
  findCircularDependencies(): string[][];
  /** Check if a rule's dependencies are satisfied */
  isDependencySatisfied(ruleId: string, executedRules: Set<string>): boolean;
}

/**
 * Interface for rule execution orchestration.
 * Manages the execution of validation rules.
 *
 * Phase 5 refactoring: Extracted validation execution from RuleEnforcer.
 *
 * @example
 * ```typescript
 * const executor = new RuleExecutor(registry, hierarchy, validatorRegistry);
 * const report = await executor.execute('write', context);
 * ```
 */
export interface IRuleExecutor {
  /** Execute validation for an operation */
  execute(operation: string, context: RuleValidationContext, options?: ExecutionOptions): Promise<ValidationReport>;
  /** Execute a single rule by ID */
  executeSingle(ruleId: string, context: RuleValidationContext): Promise<RuleValidationResult>;
  /** Execute multiple rules in batch */
  executeBatch(ruleIds: string[], context: RuleValidationContext, options?: BatchExecutionOptions): Promise<RuleValidationResult[]>;
}

/**
 * Interface for violation fix delegation.
 * Maps violations to appropriate agents/skills and attempts fixes.
 *
 * Phase 5 refactoring: Extracted fix delegation from RuleEnforcer.
 *
 * @example
 * ```typescript
 * const fixer = new ViolationFixer();
 * const fixes = await fixer.fixViolations(violations, context);
 * ```
 */
export interface IViolationFixer {
  /** Attempt to fix violations by delegating to agents/skills */
  fixViolations(violations: Violation[], context: RuleValidationContext): Promise<ViolationFix[]>;
  /** Register a custom fix strategy for a rule */
  registerFixStrategy(ruleId: string, strategy: FixStrategy): void;
  /** Get fix strategy for a rule */
  getFixStrategy(ruleId: string): FixStrategy | undefined;
}

/**
 * Codex term structure from codex.json
 * Used by CodexLoader to convert terms to rules.
 */
export interface CodexTerm {
  /** Term number */
  number: number;
  /** Term title */
  title: string;
  /** Term description */
  description: string;
  /** Term category */
  category: string;
  /** Whether this is a zero-tolerance term */
  zeroTolerance: boolean;
  /** Enforcement level (blocking, high, medium, low) */
  enforcementLevel: string;
}

/**
 * Codex data structure from codex.json
 */
export interface CodexData {
  /** Version of the codex */
  version: string;
  /** Last updated date */
  lastUpdated: string;
  /** Error prevention target percentage */
  errorPreventionTarget: number;
  /** Map of term numbers to term definitions */
  terms: Record<string, CodexTerm>;
}
