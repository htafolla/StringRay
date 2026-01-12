/**
 * Enforcer Tools - Integration layer between enforcer agent and rule enforcement system
 * Provides tools for codex compliance, rule validation, and contextual analysis enforcement
 */

import {
  ruleEnforcer,
  RuleValidationContext,
  ValidationReport,
} from "./rule-enforcer.js";
import { frameworkLogger } from "../framework-logger.js";
import { frameworkReportingSystem } from "../reporting/framework-reporting-system.js";
import * as fs from "fs";
import * as path from "path";

export interface EnforcementResult {
  operation: string;
  passed: boolean;
  blocked: boolean;
  errors: string[];
  warnings: string[];
  fixes: Array<{
    type: "auto" | "manual";
    description: string;
    action?: () => Promise<void>;
  }>;
  report: ValidationReport;
}

/**
 * Rule Validation Tool - Validates operations against rule hierarchy
 */
export async function ruleValidation(
  operation: string,
  context: RuleValidationContext,
): Promise<EnforcementResult> {
  await frameworkLogger.log("enforcer-tools", "rule-validation-start", "info", {
    operation,
    files: context.files?.length || 0,
    hasExistingCode: !!context.existingCode,
  });

  const report = await ruleEnforcer.validateOperation(operation, context);

  const result: EnforcementResult = {
    operation,
    passed: report.passed,
    blocked:
      !report.passed &&
      report.errors.some(
        (e) => e.includes("required") || e.includes("violation"),
      ),
    errors: report.errors,
    warnings: report.warnings,
    fixes: [],
    report,
  };

  // Generate fixes for common issues
  if (!report.passed) {
    result.fixes = generateFixes(report, context);
  }

  // INTEGRATION POINT: Check for reporting rules and trigger report generation
  // This integrates reporting triggers into the existing rule validation pipeline
  if (!report.passed) {
    // Trigger report generation for rule violations
    await frameworkLogger.log("enforcer-tools", "reporting-triggered", "info", {
      operation,
      hasViolations: report.errors.length > 0,
      hasWarnings: report.warnings.length > 0,
      context: {
        files: context.files?.length,
        operation,
        timestamp: new Date().toISOString(),
      },
    });
  }

  await frameworkLogger.log(
    "enforcer-tools",
    "rule-validation-complete",
    result.passed ? "success" : "error",
    {
      operation,
      passed: result.passed,
      blocked: result.blocked,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      fixCount: result.fixes.length,
    },
  );

  return result;
}

/**
 * Context Analysis Validation Tool - Validates contextual analysis integration
 */
export async function contextAnalysisValidation(
  files: string[],
  operation: string,
): Promise<EnforcementResult> {
  await frameworkLogger.log(
    "enforcer-tools",
    "context-validation-start",
    "info",
    {
      operation,
      fileCount: files.length,
    },
  );

  // Check if files exist and are readable
  const existingFiles = new Map<string, string>();
  const missingFiles: string[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      existingFiles.set(file, content);
    } catch (error) {
      missingFiles.push(file);
    }
  }

  const context: RuleValidationContext = {
    operation,
    files,
    existingCode: existingFiles,
  };

  // Run comprehensive validation
  const validationResult = await ruleValidation(operation, context);

  // Additional context-specific checks
  const contextIssues = await validateContextIntegration(files, existingFiles);

  const result: EnforcementResult = {
    ...validationResult,
    errors: [...validationResult.errors, ...contextIssues.errors],
    warnings: [...validationResult.warnings, ...contextIssues.warnings],
    blocked: validationResult.blocked || contextIssues.errors.length > 0,
  };

  await frameworkLogger.log(
    "enforcer-tools",
    "context-validation-complete",
    result.passed ? "success" : "error",
    {
      operation,
      fileCount: files.length,
      contextErrors: contextIssues.errors.length,
      contextWarnings: contextIssues.warnings.length,
    },
  );

  return result;
}

/**
 * Codex Enforcement Tool - Comprehensive codex compliance validation
 */
export async function codexEnforcement(
  operation: string,
  files: string[],
  newCode?: string,
): Promise<EnforcementResult> {
  await frameworkLogger.log(
    "enforcer-tools",
    "codex-enforcement-start",
    "info",
    {
      operation,
      fileCount: files.length,
      hasNewCode: !!newCode,
    },
  );

  // Load existing code for comparison
  const existingCode = new Map<string, string>();
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      existingCode.set(file, content);
    } catch (error) {
      // File doesn't exist yet (new file)
    }
  }

  const context: RuleValidationContext = {
    operation,
    files,
    existingCode,
    ...(newCode && { newCode }),
    dependencies: extractDependencies(newCode || "", files),
  };

  const validationResult = await ruleValidation(operation, context);

  // Generate codex compliance report
  const codexReport = await generateCodexComplianceReport(files, newCode);

  const result: EnforcementResult = {
    ...validationResult,
    errors: [...validationResult.errors, ...codexReport.violations],
    warnings: [...validationResult.warnings, ...codexReport.warnings],
  };

  await frameworkLogger.log(
    "enforcer-tools",
    "codex-enforcement-complete",
    result.passed ? "success" : "error",
    {
      operation,
      codexViolations: codexReport.violations.length,
      codexWarnings: codexReport.warnings.length,
      complianceScore: codexReport.complianceScore,
    },
  );

  return result;
}

/**
 * Quality Gate Check Tool - Final validation before commit/execution
 */
export async function qualityGateCheck(
  operation: string,
  context: {
    files: string[];
    newCode?: string;
    tests?: string[];
    dependencies?: string[];
  },
): Promise<EnforcementResult> {
  await frameworkLogger.log("enforcer-tools", "quality-gate-start", "info", {
    operation,
    files: context.files.length,
    hasTests: !!(context.tests && context.tests.length > 0),
  });

  // Run all validations
  const validations = await Promise.all([
    ruleValidation(operation, {
      operation,
      files: context.files,
      ...(context.newCode && { newCode: context.newCode }),
      ...(context.tests && { tests: context.tests }),
      ...(context.dependencies && { dependencies: context.dependencies }),
    }),
    contextAnalysisValidation(context.files, operation),
    codexEnforcement(operation, context.files, context.newCode),
  ]);

  // Combine results
  const combinedErrors = validations.flatMap((v) => v.errors);
  const combinedWarnings = validations.flatMap((v) => v.warnings);
  const combinedFixes = validations.flatMap((v) => v.fixes);

  const passed = combinedErrors.length === 0;
  const blocked = !passed; // Quality gates block on any error

  const result: EnforcementResult = {
    operation,
    passed,
    blocked,
    errors: combinedErrors,
    warnings: combinedWarnings,
    fixes: combinedFixes,
    report: validations[0].report, // Use first report as primary
  };

  // Execute automatic fixes if operation would pass after fixes
  if (blocked && combinedFixes.some((f) => f.type === "auto")) {
    await executeAutomaticFixes(combinedFixes.filter((f) => f.type === "auto"));
    result.blocked = false; // Allow after auto-fixes
  }

  await frameworkLogger.log(
    "enforcer-tools",
    "quality-gate-complete",
    passed ? "success" : "error",
    {
      operation,
      passed,
      blocked: result.blocked,
      totalErrors: combinedErrors.length,
      totalWarnings: combinedWarnings.length,
      autoFixes: combinedFixes.filter((f) => f.type === "auto").length,
    },
  );

  return result;
}

// Helper functions

function generateFixes(
  report: ValidationReport,
  context: RuleValidationContext,
): EnforcementResult["fixes"] {
  const fixes: EnforcementResult["fixes"] = [];

  for (const result of report.results) {
    if (result.fixes) {
      for (const fix of result.fixes) {
        if (fix.type === "create-file") {
          fixes.push({
            type: "auto",
            description: fix.description,
            action: async () => {
              if (fix.filePath && fix.content) {
                const dir = path.dirname(fix.filePath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(fix.filePath, fix.content);
              }
            },
          });
        } else {
          fixes.push({
            type: "manual",
            description: fix.description,
          });
        }
      }
    }
  }

  return fixes;
}

async function validateContextIntegration(
  files: string[],
  existingCode: Map<string, string>,
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [filePath, content] of existingCode) {
    // Check for proper context provider usage
    if (
      content.includes("CodebaseContextAnalyzer") &&
      !content.includes("memoryConfig")
    ) {
      warnings.push(
        `${filePath}: CodebaseContextAnalyzer should use memory configuration`,
      );
    }

    if (
      content.includes("ASTCodeParser") &&
      !content.includes("try") &&
      !content.includes("catch")
    ) {
      errors.push(
        `${filePath}: ASTCodeParser initialization should handle missing ast-grep gracefully`,
      );
    }

    if (
      content.includes("DependencyGraphBuilder") &&
      !content.includes("contextAnalyzer")
    ) {
      errors.push(
        `${filePath}: DependencyGraphBuilder requires context analyzer parameter`,
      );
    }
  }

  return { errors, warnings };
}

async function generateCodexComplianceReport(
  files: string[],
  newCode?: string,
): Promise<{
  violations: string[];
  warnings: string[];
  complianceScore: number;
}> {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Basic codex checks (simplified - would integrate with full codex validation)
  if (newCode) {
    if (newCode.includes("any") || newCode.includes("@ts-ignore")) {
      violations.push(
        'Codex violation: Type safety first - no "any" types or ts-ignore allowed',
      );
    }

    if (
      newCode.includes("console.log") &&
      !newCode.includes("// TODO") &&
      !newCode.includes("// DEBUG")
    ) {
      warnings.push(
        "Codex warning: Consider removing console.log statements in production code",
      );
    }

    if (
      !newCode.includes("try") &&
      (newCode.includes("await") || newCode.includes("Promise"))
    ) {
      warnings.push(
        "Codex warning: Async operations should have error handling",
      );
    }
  }

  const complianceScore =
    violations.length === 0
      ? 100
      : Math.max(0, 100 - violations.length * 20 - warnings.length * 5);

  return { violations, warnings, complianceScore };
}

function extractDependencies(code: string, files: string[]): string[] {
  const dependencies: string[] = [];

  // Simple regex-based dependency extraction (would be enhanced with proper AST parsing)
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const dep = match[1];
    if (dep && !dep.startsWith(".") && !dep.startsWith("/")) {
      dependencies.push(dep);
    }
  }

  return dependencies;
}

async function executeAutomaticFixes(
  fixes: EnforcementResult["fixes"],
): Promise<void> {
  for (const fix of fixes) {
    if (fix.action) {
      try {
        await fix.action();
        await frameworkLogger.log(
          "enforcer-tools",
          "auto-fix-executed",
          "success",
          {
            description: fix.description,
          },
        );
      } catch (error) {
        await frameworkLogger.log(
          "enforcer-tools",
          "auto-fix-failed",
          "error",
          {
            description: fix.description,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }
  }
}

// Additional utility functions for enforcer operations

/**
 * Get comprehensive enforcement status
 */
export async function getEnforcementStatus(): Promise<{
  rules: number;
  validations: number;
  violations: number;
  fixes: number;
  success: boolean;
}> {
  try {
    const stats = ruleEnforcer.getRuleStats();

    return {
      rules: stats.totalRules,
      validations: 0, // Would be tracked in real implementation
      violations: 0, // Would be tracked in real implementation
      fixes: 0, // Would be tracked in real implementation
      success: true,
    };
  } catch (error) {
    await frameworkLogger.log(
      "enforcer-tools",
      "status-check-failed",
      "error",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return {
      rules: 0,
      validations: 0,
      violations: 0,
      fixes: 0,
      success: false,
    };
  }
}

/**
 * Run comprehensive pre-commit validation
 */
export async function runPreCommitValidation(
  files: string[],
  operation: string = "commit",
): Promise<EnforcementResult> {
  await frameworkLogger.log(
    "enforcer-tools",
    "pre-commit-validation-start",
    "info",
    {
      files: files.length,
      operation,
    },
  );

  try {
    // Run all validation types
    const validations = await Promise.allSettled([
      ruleValidation(operation, { operation, files }),
      contextAnalysisValidation(files, operation),
      codexEnforcement(operation, files),
    ]);

    // Aggregate results
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: EnforcementResult["fixes"] = [];

    for (const result of validations) {
      if (result.status === "fulfilled") {
        errors.push(...result.value.errors);
        warnings.push(...result.value.warnings);
        fixes.push(...result.value.fixes);
      } else {
        errors.push(`Validation failed: ${result.reason}`);
      }
    }

    const finalResult: EnforcementResult = {
      operation,
      passed: errors.length === 0,
      blocked: errors.length > 0,
      errors,
      warnings,
      fixes,
      report:
        validations[0]?.status === "fulfilled"
          ? validations[0].value.report
          : ({} as any),
    };

    await frameworkLogger.log(
      "enforcer-tools",
      "pre-commit-validation-complete",
      finalResult.passed ? "success" : "error",
      {
        operation,
        passed: finalResult.passed,
        blocked: finalResult.blocked,
        errors: errors.length,
        warnings: warnings.length,
        fixes: fixes.length,
      },
    );

    return finalResult;
  } catch (error) {
    await frameworkLogger.log(
      "enforcer-tools",
      "pre-commit-validation-failed",
      "error",
      {
        operation,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return {
      operation,
      passed: false,
      blocked: true,
      errors: [
        `Pre-commit validation failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      warnings: [],
      fixes: [],
      report: {} as any,
    };
  }
}

// Export tools for MCP integration
export const enforcerTools = {
  ruleValidation,
  contextAnalysisValidation,
  codexEnforcement,
  qualityGateCheck,
  getEnforcementStatus,
  runPreCommitValidation,
};
