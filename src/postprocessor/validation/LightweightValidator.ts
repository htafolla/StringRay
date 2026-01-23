#!/usr/bin/env node

/**
 * Lightweight Post-Commit Validation
 * Fast validation for git commit hooks (<2 seconds)
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { frameworkLogger } from "../framework-logger";

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

class LightweightValidator {
  private startTime: number;
  private files: string[];

  constructor() {
    this.startTime = Date.now();
    this.files = this.getChangedFiles();
  }

  /**
   * Get files changed in this commit
   */
  private getChangedFiles(): string[] {
    try {
      const output = execSync(
        "git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached",
        {
          encoding: "utf8",
        },
      );
      return output
        .trim()
        .split("\n")
        .filter((f) => f.trim());
    } catch (error) {
      console.warn(
        "⚠️ Could not determine changed files:",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  /**
   * Basic file existence and accessibility checks
   */
  private validateFileExistence(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of this.files) {
      if (!fs.existsSync(file)) {
        errors.push(`File not found: ${file}`);
        continue;
      }

      try {
        // Check if file is readable
        fs.accessSync(file, fs.constants.R_OK);
      } catch (error) {
        errors.push(`File not readable: ${file}`);
      }

      // Check file size (warn on very large files)
      const stats = fs.statSync(file);
      if (stats.size > 10 * 1024 * 1024) {
        // 10MB
        warnings.push(
          `Large file detected: ${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`,
        );
      }
    }

    return { errors, warnings };
  }

  /**
   * Basic syntax validation for common file types
   */
  private validateSyntax(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of this.files) {
      if (!fs.existsSync(file)) continue;

      const ext = path.extname(file).toLowerCase();

      try {
        switch (ext) {
          case ".json":
            this.validateJsonFile(file, errors);
            break;
          case ".js":
          case ".ts":
          case ".jsx":
          case ".tsx":
            this.validateJsTsFile(file, errors, warnings);
            break;
          case ".py":
            this.validatePythonFile(file, errors, warnings);
            break;
          case ".md":
            this.validateMarkdownFile(file, warnings);
            break;
        }
      } catch (error) {
        warnings.push(
          `Could not validate ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { errors, warnings };
  }

  private validateJsonFile(file: string, errors: string[]): void {
    try {
      const content = fs.readFileSync(file, "utf8");
      JSON.parse(content);
    } catch (error) {
      errors.push(
        `Invalid JSON in ${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private validateJsTsFile(
    file: string,
    errors: string[],
    warnings: string[],
  ): void {
    const content = fs.readFileSync(file, "utf8");

    // Check for console.log statements (warning)
    if (content.includes("console.log")) {
      warnings.push(
        `console.log found in ${file} (consider removing for production)`,
      );
    }

    // Check for TODO comments
    if (content.includes("TODO") || content.includes("FIXME")) {
      warnings.push(`TODO/FIXME comments found in ${file}`);
    }

    // Check for debugger statements
    if (content.includes("debugger")) {
      errors.push(`debugger statement found in ${file}`);
    }

    // Basic syntax check for JavaScript/TypeScript
    try {
      // Simple heuristic: check for balanced braces
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Unbalanced braces in ${file}`);
      }
    } catch (error) {
      // Skip syntax checking if it fails
    }
  }

  private validatePythonFile(
    file: string,
    errors: string[],
    warnings: string[],
  ): void {
    const content = fs.readFileSync(file, "utf8");

    // Check for print statements (warning)
    if (content.includes("print(")) {
      warnings.push(
        `print statement found in ${file} (consider using logging)`,
      );
    }

    // Check for TODO comments
    if (content.includes("# TODO") || content.includes("# FIXME")) {
      warnings.push(`TODO/FIXME comments found in ${file}`);
    }
  }

  private validateMarkdownFile(file: string, warnings: string[]): void {
    const content = fs.readFileSync(file, "utf8");

    // Check for broken links (simple check)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      if (url && url.startsWith("http") && !url.includes(".")) {
        warnings.push(`Potentially broken link in ${file}: ${url}`);
      }
    }
  }

  /**
   * Check for basic security issues
   */
  private validateSecurity(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of this.files) {
      if (!fs.existsSync(file)) continue;

      const content = fs.readFileSync(file, "utf8");

      // Check for hardcoded secrets (simple patterns)
      const secretPatterns = [
        /password\s*[:=]\s*['"][^'"]*['"]/i,
        /secret\s*[:=]\s*['"][^'"]*['"]/i,
        /token\s*[:=]\s*['"][^'"]*['"]/i,
        /api_key\s*[:=]\s*['"][^'"]*['"]/i,
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          errors.push(`Potential hardcoded secret detected in ${file}`);
          break;
        }
      }

      // Check for eval usage
      if (content.includes("eval(")) {
        warnings.push(`eval() usage detected in ${file} (security risk)`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Run all validation checks
   */
  async validate(): Promise<ValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    try {
      // File existence checks
      const fileChecks = this.validateFileExistence();
      allErrors.push(...fileChecks.errors);
      allWarnings.push(...fileChecks.warnings);

      // Syntax validation
      const syntaxChecks = this.validateSyntax();
      allErrors.push(...syntaxChecks.errors);
      allWarnings.push(...syntaxChecks.warnings);

      // Security checks
      const securityChecks = this.validateSecurity();
      allErrors.push(...securityChecks.errors);
      allWarnings.push(...securityChecks.warnings);
    } catch (error) {
      allErrors.push(
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const duration = Date.now() - this.startTime;

    return {
      passed: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      duration,
    };
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  await frameworkLogger.log('-lightweight-validator', '-post-commit-quick-validation-initiated-', 'info', { message: "⚡ Post-commit: Quick validation initiated" });

  const validator = new LightweightValidator();
  const result = await validator.validate();

  // Report results
  if (result.warnings.length > 0) {
    await frameworkLogger.log('-lightweight-validator', '-result-warnings-length-warning-s-found-', 'info', { message: `⚠️ ${result.warnings.length} warning(s) found:` });
    for (const warning of result.warnings) {
      await frameworkLogger.log('-lightweight-validator', '-warning-', 'info', { message: `   ${warning}` });
    }
  }

  if (result.errors.length > 0) {
    await frameworkLogger.log('-lightweight-validator', '-result-errors-length-error-s-found-', 'error', { message: `❌ ${result.errors.length} error(s) found:` });
    for (const error of result.errors) {
      await frameworkLogger.log('-lightweight-validator', '-error-', 'error', { message: `   ${error}` });
    }
  }

  await frameworkLogger.log('-lightweight-validator', '-post-commit-validation-completed-in-result-durati', 'success', { message: `✅ Post-commit: Validation completed in ${result.duration}ms` });

  if (!result.passed) {
    await frameworkLogger.log('-lightweight-validator', '-fix-the-errors-above-or-use-no-verify-to-skip-val', 'error', { message: 
      "💡 Fix the errors above or use --no-verify to skip validation",
     });
    process.exit(1);
  }

  process.exit(0);
}

// Run validation
main().catch((error) => {
  console.error(
    "❌ Validation failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
