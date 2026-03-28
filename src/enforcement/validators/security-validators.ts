/**
 * Security Validators
 *
 * Security-related validators extracted from rule-enforcer.ts during Phase 3 refactoring.
 * These validators enforce security best practices and input validation requirements.
 *
 * @module validators/security-validators
 * @version 1.0.0
 */

import { BaseValidator } from "./base-validator.js";
import { RuleValidationContext, RuleValidationResult } from "../types.js";

/**
 * Validates input validation patterns in code.
 * Checks for proper input validation, sanitization, and parameter validation.
 *
 * @example
 * ```typescript
 * const validator = new InputValidationValidator();
 * const result = await validator.validate({
 *   newCode: 'function processUser(req) { return req.body.name; }',
 *   operation: 'write'
 * });
 * // result.passed === false (missing validation)
 * ```
 */
export class InputValidationValidator extends BaseValidator {
  readonly id = "input-validation-validator";
  readonly ruleId = "input-validation";
  readonly category = "security" as const;
  readonly severity = "blocking" as const;

  async validate(
    context: RuleValidationContext,
  ): Promise<RuleValidationResult> {
    const { newCode, operation } = context;

    if (!newCode || operation !== "write") {
      return {
        passed: true,
        message: "No code to validate for input validation",
      };
    }

    // Allow internal utility functions to skip validation
    if (
      newCode.includes("internal") ||
      newCode.includes("utility") ||
      newCode.includes("helper")
    ) {
      return {
        passed: true,
        message: "Internal utility functions may skip validation",
      };
    }

    // For input validation in general functions, be more lenient
    // Only flag obvious user input patterns without validation
    // Note: "input" alone (as function param) shouldn't trigger this - only HTTP request inputs
    const hasUserInput =
      newCode.includes("req.body") ||
      newCode.includes("req.query") ||
      newCode.includes("req.params");
    const hasValidation =
      newCode.includes("validate") ||
      newCode.includes("sanitize") ||
      newCode.includes("zod") ||
      newCode.includes("joi");

    if (
      hasUserInput &&
      !hasValidation &&
      !newCode.includes("internal") &&
      !newCode.includes("utility")
    ) {
      return {
        passed: false,
        message: "User input handling requires validation",
        suggestions: ["Add input validation", "Sanitize user inputs"],
      };
    }

    // Look for functions with parameters that don't validate inputs
    const functionsWithParams = newCode.match(
      /function\s+\w+\s*\([^)]*\)|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
    );
    if (!functionsWithParams) {
      return {
        passed: true,
        message: "No functions with parameters to validate",
      };
    }

    for (const func of functionsWithParams) {
      // Check if function has basic validation
      const funcName = func.match(/(?:function|const)\s+(\w+)/)?.[1];
      if (funcName) {
        const funcBody = this.extractFunctionBody(newCode, funcName);
        if (
          funcBody &&
          !funcBody.includes("if") &&
          !funcBody.includes("throw") &&
          (func.includes("string") || func.includes("any"))
        ) {
          return {
            passed: false,
            message: `Function ${funcName} lacks input validation for parameters`,
            suggestions: [
              "Add parameter validation",
              "Use type guards",
              "Add null/undefined checks",
            ],
          };
        }
      }
    }

    return {
      passed: true,
      message: "Input validation implemented where needed",
    };
  }
}

/**
 * Validates security by design principles.
 * Checks for security architecture patterns, input sanitization, and vulnerability prevention.
 *
 * @example
 * ```typescript
 * const validator = new SecurityByDesignValidator();
 * const result = await validator.validate({
 *   newCode: 'app.post("/api", (req, res) => { db.query(req.body.sql); })',
 *   operation: 'write'
 * });
 * // result.passed === false (SQL injection risk)
 * ```
 */
export class SecurityByDesignValidator extends BaseValidator {
  readonly id = "security-by-design-validator";
  readonly ruleId = "security-by-design";
  readonly category = "security" as const;
  readonly severity = "blocking" as const;

  async validate(
    context: RuleValidationContext,
  ): Promise<RuleValidationResult> {
    const { newCode, operation } = context;

    if (!newCode || operation !== "write") {
      return { passed: true, message: "No code to validate for security" };
    }

    const violations: string[] = [];
    const suggestions: string[] = [];

    // Check for user input handling without validation (skip for safe contexts)
    const userInputs = newCode.match(
      /(?:req\.body|req\.query|req\.params)/g,
    );
    const hasInputKeyword =
      newCode.includes("input") &&
      (newCode.includes("function") || newCode.includes("validate"));

    if (
      (userInputs || hasInputKeyword) &&
      !newCode.includes("useContext") &&
      !newCode.includes("Context.") &&
      !newCode.includes("performance") &&
      !newCode.includes("optimized") &&
      !newCode.includes("internal") &&
      !newCode.includes("utility")
    ) {
      // Look for validation patterns
      const hasValidation =
        newCode.includes("validate") ||
        newCode.includes("sanitize") ||
        newCode.includes("zod") ||
        newCode.includes("joi") ||
        newCode.includes("yup") ||
        newCode.includes("express-validator");

      if (!hasValidation) {
        violations.push("User input handling detected without validation");
        suggestions.push("Add input validation and sanitization");
      }
    }

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /query\s*\(\s*[`"'].*\$\{/,
      /exec\s*\(\s*[`"'].*\$\{/,
      /execute\s*\(\s*[`"'].*\$\{/,
      /query\s*\(\s*.*\+\s*/,
      /exec\s*\(\s*.*\+\s*/,
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(newCode)) {
        violations.push("Potential SQL injection vulnerability detected");
        suggestions.push(
          "Use parameterized queries or prepared statements",
          "Avoid string concatenation in SQL queries",
        );
        break;
      }
    }

    // Check for XSS vulnerabilities
    const xssPatterns = [
      /innerHTML\s*=/,
      /outerHTML\s*=/,
      /document\.write\s*\(/,
      /eval\s*\(/,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(newCode)) {
        violations.push("Potential XSS vulnerability detected");
        suggestions.push(
          "Avoid using innerHTML with user input",
          "Use textContent instead of innerHTML",
          "Sanitize user input before rendering",
        );
        break;
      }
    }

    // Check for insecure authentication patterns
    if (
      newCode.includes("password") ||
      newCode.includes("token") ||
      newCode.includes("secret")
    ) {
      const insecurePatterns = [
        /password\s*[=:]\s*["'][^"']{1,7}["']/,
        /token\s*[=:]\s*["'][^"']{1,15}["']/,
        /secret\s*[=:]\s*["'][^"']{1,15}["']/,
      ];

      for (const pattern of insecurePatterns) {
        if (pattern.test(newCode)) {
          violations.push(
            "Short or hardcoded credential detected - potential security risk",
          );
          suggestions.push(
            "Use environment variables for credentials",
            "Use a secrets management service",
            "Ensure credentials are sufficiently long and complex",
          );
          break;
        }
      }
    }

    // Check for insecure randomness
    // Math.random() should not be used for security-sensitive operations
    const hasMathRandom = newCode.includes("Math.random()");
    const securityContext =
      newCode.match(/function\s+\w*(?:token|password|secret|crypto)\w*\s*\(/i) ||
      newCode.includes("generateToken") ||
      newCode.includes("generatePassword") ||
      newCode.includes("createSecret");

    if (hasMathRandom && securityContext) {
      violations.push(
        "Math.random() used for security-sensitive operations",
      );
      suggestions.push(
        "Use crypto.randomBytes() or crypto.randomUUID() for security tokens",
        "Use a cryptographically secure random number generator",
      );
    }

    if (violations.length > 0) {
      return {
        passed: false,
        message: `Security violations: ${violations.join(", ")}`,
        suggestions,
      };
    }

    return {
      passed: true,
      message: "Security by design principles followed",
    };
  }
}
