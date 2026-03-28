/**
 * Base Validator Abstract Class
 *
 * Abstract base class that all validators extend. Provides common utility methods
 * and enforces the IValidator interface contract.
 *
 * @module validators/base-validator
 * @version 1.0.0
 */

import {
  IValidator,
  RuleCategory,
  RuleSeverity,
  RuleValidationContext,
  RuleValidationResult,
} from "../types.js";

/**
 * Abstract base class for all validators.
 * Subclasses must implement the abstract properties and validate method.
 *
 * @example
 * ```typescript
 * export class MyValidator extends BaseValidator {
 *   readonly id = 'my-validator';
 *   readonly ruleId = 'my-rule';
 *   readonly category = 'code-quality';
 *   readonly severity = 'error';
 *
 *   async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
 *     // Implementation here
 *   }
 * }
 * ```
 */
export abstract class BaseValidator implements IValidator {
  /** Unique identifier for this validator instance */
  abstract readonly id: string;

  /** The rule ID this validator validates */
  abstract readonly ruleId: string;

  /** Category for organizing validators */
  abstract readonly category: RuleCategory;

  /** Severity level of violations */
  abstract readonly severity: RuleSeverity;

  /**
   * Perform validation on the given context.
   * Must be implemented by subclasses.
   *
   * @param context - The validation context containing code and operation info
   * @returns Promise resolving to validation result
   */
  abstract validate(
    context: RuleValidationContext,
  ): Promise<RuleValidationResult>;

  /**
   * Extract function body for validation analysis.
   * Searches for a function by name and extracts its body.
   *
   * @param code - The source code to search
   * @param functionName - Name of the function to extract
   * @returns The function body or null if not found
   */
  protected extractFunctionBody(
    code: string,
    functionName: string,
  ): string | null {
    const funcRegex = new RegExp(
      `(?:function\\s+${functionName}|const\\s+${functionName}\\s*=\\s*)[^}]*({[\\s\\S]*?})`,
      "g",
    );
    const match = funcRegex.exec(code);
    return match ? match[1] || null : null;
  }

  /**
   * Calculate maximum nesting depth in code.
   * Counts opening and closing braces/brackets to determine depth.
   *
   * @param code - The source code to analyze
   * @returns Maximum nesting depth (0 for flat code)
   */
  protected calculateMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    const lines = code.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Count opening braces/brackets
      const opens = (trimmed.match(/[{[(]/g) || []).length;
      const closes = (trimmed.match(/[}\])]/g) || []).length;

      currentDepth += opens - closes;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Check if code contains a specific pattern.
   *
   * @param code - The source code to check
   * @param pattern - RegExp pattern to search for
   * @returns True if pattern found, false otherwise
   */
  protected hasPattern(code: string, pattern: RegExp): boolean {
    return pattern.test(code);
  }

  /**
   * Create a successful validation result.
   *
   * @param message - Success message
   * @returns RuleValidationResult with passed: true
   */
  protected createSuccessResult(message: string): RuleValidationResult {
    return {
      passed: true,
      message,
    };
  }

  /**
   * Create a failed validation result.
   *
   * @param message - Failure message
   * @param suggestions - Optional list of suggestions
   * @param fixes - Optional list of automated fixes
   * @returns RuleValidationResult with passed: false
   */
  protected createFailureResult(
    message: string,
    suggestions?: string[],
    fixes?: RuleValidationResult["fixes"],
  ): RuleValidationResult {
    const result: RuleValidationResult = {
      passed: false,
      message,
    };

    if (suggestions !== undefined && suggestions.length > 0) {
      result.suggestions = suggestions;
    }

    if (fixes !== undefined && fixes.length > 0) {
      result.fixes = fixes;
    }

    return result;
  }
}
