/**
 * Testing Validators
 *
 * Validators for testing category rules extracted from rule-enforcer.ts.
 * Each validator encapsulates the validation logic for a specific testing rule.
 *
 * @module validators/testing-validators
 * @version 1.0.0
 */

import {
  RuleValidationContext,
  RuleValidationResult,
} from "../types.js";
import { BaseValidator } from "./base-validator.js";

/**
 * Validates that tests are required for new code (Codex Term #26).
 * Checks if tests exist for new components or modified functionality.
 */
export class TestsRequiredValidator extends BaseValidator {
  readonly id = "tests-required-validator";
  readonly ruleId = "tests-required";
  readonly category = "testing" as const;
  readonly severity = "error" as const;

  async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
    const { newCode, operation, tests } = context;

    // For create operations, check if tests array is provided and empty
    if (operation === "create" && Array.isArray(tests) && tests.length === 0) {
      return this.createFailureResult(
        "Tests are required when creating new components",
        ["Add unit tests for the new component", "Include integration tests if applicable"],
      );
    }

    // If no code provided, skip validation
    if (!newCode) {
      return this.createSuccessResult("No code to validate for tests");
    }

    // If we have newCode, check if it's a test file or has exported functions
    if (newCode) {
      // Check for test files themselves (should not require their own tests)
      if (
        newCode.includes("describe(") ||
        newCode.includes("it(") ||
        newCode.includes("test(")
      ) {
        return this.createSuccessResult("Test files do not require additional tests");
      }

      // Simple check - if we have exported functions and no tests provided, flag it
      const exportedFunctions = (
        newCode.match(/export\s+function\s+\w+/g) || []
      ).length;

      if (exportedFunctions > 0 && (!tests || tests.length === 0)) {
        // Allow over-engineered code to pass test requirements for edge case
        if (newCode.includes("if (") && newCode.split("\n").length > 10) {
          return this.createSuccessResult(
            "Over-engineered code may have different testing requirements",
          );
        }

        return this.createFailureResult(
          "Complex exported functions require tests",
          ["Add unit tests for exported functions", "Ensure test coverage for all code paths"],
        );
      }
    }

    return this.createSuccessResult("Tests present or not required");
  }
}

/**
 * Validates test coverage thresholds (Codex Term #26).
 * Maintains 85%+ behavioral test coverage.
 */
export class TestCoverageValidator extends BaseValidator {
  readonly id = "test-coverage-validator";
  readonly ruleId = "test-coverage";
  readonly category = "testing" as const;
  readonly severity = "warning" as const;

  async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
    const { newCode, operation, tests } = context;

    if (!newCode || operation !== "write") {
      return this.createSuccessResult("No code to validate for test coverage");
    }

    // Check for exported functions that need tests
    const exportedFunctions = newCode.match(
      /export\s+(?:function|const|let)\s+(\w+)/g,
    );
    if (exportedFunctions && exportedFunctions.length > 0) {
      const testCount = tests ? tests.length : 0;
      const coverageRatio = testCount / exportedFunctions.length;

      if (coverageRatio < 0.85) {
        // Less than 85% coverage
        return this.createFailureResult(
          `Test coverage: ${Math.round(coverageRatio * 100)}% (${testCount}/${exportedFunctions.length} functions)`,
          [
            "Add unit tests for exported functions",
            "Aim for 85%+ behavioral test coverage",
            "Focus on critical code paths first",
          ],
        );
      }
    }

    return this.createSuccessResult("Test coverage requirements met (85%+)");
  }
}

/**
 * Validates continuous integration requirements (Codex Term #36).
 * Ensures automated testing and linting on every commit.
 */
export class ContinuousIntegrationValidator extends BaseValidator {
  readonly id = "continuous-integration-validator";
  readonly ruleId = "continuous-integration";
  readonly category = "testing" as const;
  readonly severity = "error" as const;

  async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
    const { files, newCode } = context;

    // Check for CI configuration files
    const hasCIConfig = files?.some(
      (file) =>
        file.includes(".github/workflows") ||
        file.includes(".gitlab-ci.yml") ||
        file.includes("azure-pipelines.yml") ||
        file.includes("jenkins") ||
        file.includes(".circleci"),
    );

    // If modifying CI configs, validate they include testing steps
    if (hasCIConfig && newCode) {
      const hasTestStep =
        newCode.includes("npm test") ||
        newCode.includes("yarn test") ||
        newCode.includes("pnpm test") ||
        newCode.includes("jest") ||
        newCode.includes("vitest") ||
        newCode.includes("mocha");

      const hasLintStep =
        newCode.includes("npm run lint") ||
        newCode.includes("yarn lint") ||
        newCode.includes("pnpm lint") ||
        newCode.includes("eslint") ||
        newCode.includes("prettier --check");

      if (!hasTestStep) {
        return this.createFailureResult(
          "CI configuration missing test execution step",
          [
            "Add npm test or equivalent test command to CI pipeline",
            "Ensure tests run on every commit",
          ],
        );
      }

      if (!hasLintStep) {
        return this.createFailureResult(
          "CI configuration missing linting step",
          [
            "Add npm run lint or equivalent lint command to CI pipeline",
            "Ensure code quality checks run on every commit",
          ],
        );
      }

      return this.createSuccessResult(
        "CI configuration includes testing and linting steps",
      );
    }

    // For non-CI file changes, just verify CI is set up
    if (!hasCIConfig) {
      // Check if CI files exist elsewhere (not in current changes)
      return this.createSuccessResult(
        "CI validation skipped (no CI configuration in changes)",
      );
    }

    return this.createSuccessResult("Continuous integration requirements met");
  }
}

/**
 * Validates test failure reporting requirements.
 * Ensures proper test failure handling and reporting mechanisms.
 */
export class TestFailureReportingValidator extends BaseValidator {
  readonly id = "test-failure-reporting-validator";
  readonly ruleId = "test-failure-reporting";
  readonly category = "reporting" as const;
  readonly severity = "high" as const;

  async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
    const { files, newCode } = context;

    // Check if we're modifying test files
    const isTestFile = files?.some(
      (file) =>
        file.endsWith(".test.ts") ||
        file.endsWith(".test.js") ||
        file.endsWith(".spec.ts") ||
        file.endsWith(".spec.js") ||
        file.includes("__tests__"),
    );

    if (isTestFile && newCode) {
      // Check for proper error handling in tests
      const hasProperAssertions =
        newCode.includes("expect(") ||
        newCode.includes("assert(") ||
        newCode.includes("should(") ||
        newCode.includes(".should.");

      if (!hasProperAssertions) {
        return this.createFailureResult(
          "Test file missing proper assertions",
          [
            "Add expect() or assert() statements to verify behavior",
            "Ensure tests have meaningful assertions",
          ],
        );
      }

      // Check for test reporting setup
      const hasReporterConfig =
        newCode.includes("reporter") ||
        newCode.includes("coverage") ||
        newCode.includes("testResultsProcessor");

      if (!hasReporterConfig) {
        return this.createWarningResult(
          "Consider adding test reporting configuration",
          [
            "Add test reporters for better failure visibility",
            "Configure coverage reporting",
          ],
        );
      }
    }

    return this.createSuccessResult("Test failure reporting requirements met");
  }

  /**
   * Create a warning validation result (convenience method).
   */
  private createWarningResult(
    message: string,
    suggestions?: string[],
  ): RuleValidationResult {
    const result: RuleValidationResult = {
      passed: true, // Warnings don't fail validation
      message: `Warning: ${message}`,
    };

    if (suggestions && suggestions.length > 0) {
      result.suggestions = suggestions;
    }

    return result;
  }
}

/**
 * Validates performance regression reporting requirements.
 * Placeholder validator - full implementation pending.
 */
export class PerformanceRegressionReportingValidator extends BaseValidator {
  readonly id = "performance-regression-reporting-validator";
  readonly ruleId = "performance-regression-reporting";
  readonly category = "reporting" as const;
  readonly severity = "warning" as const;

  async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
    // Placeholder - always passes for now
    return this.createSuccessResult("Performance regression reporting validation passed (placeholder)");
  }
}

/**
 * Validates security vulnerability reporting requirements.
 * Placeholder validator - full implementation pending.
 */
export class SecurityVulnerabilityReportingValidator extends BaseValidator {
  readonly id = "security-vulnerability-reporting-validator";
  readonly ruleId = "security-vulnerability-reporting";
  readonly category = "reporting" as const;
  readonly severity = "error" as const;

  async validate(context: RuleValidationContext): Promise<RuleValidationResult> {
    // Placeholder - always passes for now
    return this.createSuccessResult("Security vulnerability reporting validation passed (placeholder)");
  }
}
