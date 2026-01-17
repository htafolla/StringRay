#!/usr/bin/env node

/**
 * Comprehensive Post-Push Validation
 * Full CI/CD validation for git push hooks (<5 minutes)
 */

import * as fs from "fs";
import { frameworkLogger } from "../../framework-logger.js";
import * as path from "path";
import { execSync } from "child_process";

interface ComprehensiveValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  testResults?: {
    passed: number;
    failed: number;
    total: number;
  };
  coverage?: number;
}

class ComprehensiveValidator {
  private startTime: number;
  private files: string[];
  private projectRoot: string;

  constructor() {
    this.startTime = Date.now();
    this.files = this.getChangedFiles();
    this.projectRoot = path.resolve(process.cwd());
  }

  /**
   * Get files changed in this push
   */
  private getChangedFiles(): string[] {
    try {
      const output = execSync(
        "git log --name-only --oneline -1 HEAD | tail -n +2",
        {
          encoding: "utf8",
        },
      );
      return output
        .trim()
        .split("\n")
        .filter((f) => f.trim());
    } catch (error) {
      console.warn("⚠️ Could not determine changed files");
      return [];
    }
  }

  /**
   * Run linting checks
   */
  private async runLinting(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if ESLint is available
      const hasEslint = fs.existsSync(
        path.join(this.projectRoot, "node_modules", ".bin", "eslint"),
      );
      if (hasEslint) {
        // ESLint start - kept as console.log for user visibility
        try {
          execSync("npx eslint . --ext .js,.ts,.jsx,.tsx --max-warnings 0", {
            cwd: this.projectRoot,
            stdio: "pipe",
            timeout: 30000,
          });
          await frameworkLogger.log(
            "comprehensive-validator",
            "eslint-passed",
            "success",
          );
        } catch (error: any) {
          const output =
            error.stdout?.toString() || error.stderr?.toString() || "";
          const errorCount = (output.match(/error/g) || []).length;
          const warningCount = (output.match(/warning/g) || []).length;

          if (errorCount > 0) {
            errors.push(`ESLint found ${errorCount} error(s)`);
          }
          if (warningCount > 0) {
            warnings.push(`ESLint found ${warningCount} warning(s)`);
          }
        }
      }

      // Check TypeScript compilation
      const hasTypescript = fs.existsSync(
        path.join(this.projectRoot, "node_modules", ".bin", "tsc"),
      );
      if (
        hasTypescript &&
        fs.existsSync(path.join(this.projectRoot, "tsconfig.json"))
      ) {
        // TypeScript compilation start - kept as console.log for user visibility
        try {
          execSync("npx tsc --noEmit", {
            cwd: this.projectRoot,
            stdio: "pipe",
            timeout: 30000,
          });
          await frameworkLogger.log(
            "comprehensive-validator",
            "typescript-compilation-passed",
            "success",
          );
        } catch (error) {
          errors.push("TypeScript compilation failed");
        }
      }
    } catch (error) {
      warnings.push("Linting checks could not be completed");
    }

    return { errors, warnings };
  }

  /**
   * Run unit tests
   */
  private async runTests(): Promise<{
    errors: string[];
    warnings: string[];
    testResults?: any;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for test runners
      const hasVitest = fs.existsSync(
        path.join(this.projectRoot, "node_modules", ".bin", "vitest"),
      );
      const hasJest = fs.existsSync(
        path.join(this.projectRoot, "node_modules", ".bin", "jest"),
      );

      if (hasVitest) {
        console.log("🧪 Running Vitest...");
        try {
          const result = execSync("npx vitest run --coverage --reporter=json", {
            cwd: this.projectRoot,
            stdio: "pipe",
            timeout: 120000, // 2 minutes
            encoding: "utf8",
          });

          // Parse test results (simplified)
          const passed = (result.match(/"passed":\s*true/g) || []).length;
          const failed = (result.match(/"passed":\s*false/g) || []).length;

          if (failed > 0) {
            errors.push(
              `Tests failed: ${failed} out of ${passed + failed} tests failed`,
            );
          } else {
            await frameworkLogger.log(
              "comprehensive-validator",
              "tests-passed",
              "success",
              { testCount: passed },
            );
          }

          return {
            errors,
            warnings,
            testResults: { passed, failed, total: passed + failed },
          };
        } catch (error) {
          errors.push("Vitest execution failed");
        }
      } else if (hasJest) {
        console.log("🧪 Running Jest...");
        try {
          execSync("npx jest --coverage --passWithNoTests", {
            cwd: this.projectRoot,
            stdio: "pipe",
            timeout: 120000,
          });
          await frameworkLogger.log(
            "comprehensive-validator",
            "jest-tests-completed",
            "success",
          );
        } catch (error) {
          errors.push("Jest tests failed");
        }
      }
    } catch (error) {
      warnings.push("Test execution could not be completed");
    }

    return { errors, warnings };
  }

  /**
   * Run security checks
   */
  private async runSecurityChecks(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for package vulnerabilities
      if (fs.existsSync(path.join(this.projectRoot, "package.json"))) {
        // NPM audit start - kept as console.log for user visibility
        try {
          execSync("npm audit --audit-level high", {
            cwd: this.projectRoot,
            stdio: "pipe",
            timeout: 30000,
          });
          await frameworkLogger.log(
            "comprehensive-validator",
            "security-audit-passed",
            "success",
          );
        } catch (error: any) {
          const output = error.stdout?.toString() || "";
          const vulnCount = (output.match(/vulnerabilities/g) || []).length;
          if (vulnCount > 0) {
            errors.push(
              `Security vulnerabilities found: ${vulnCount} high/critical issues`,
            );
          }
        }
      }

      // Check for secrets in code
      // Secret scanning start - kept as console.log for user visibility
      const secretPatterns = [
        /password\s*[:=]\s*['"][^'"]*['"]/i,
        /secret\s*[:=]\s*['"][^'"]*['"]/i,
        /token\s*[:=]\s*['"][^'"]*['"]/i,
        /api_key\s*[:=]\s*['"][^'"]*['"]/i,
        /private_key/i,
        /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/i,
      ];

      let secretFound = false;
      for (const file of this.files) {
        if (!fs.existsSync(file)) continue;

        try {
          const content = fs.readFileSync(file, "utf8");
          for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
              errors.push(`Potential secret detected in ${file}`);
              secretFound = true;
              break;
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      if (!secretFound) {
        await frameworkLogger.log(
          "comprehensive-validator",
          "no-secrets-detected",
          "success",
        );
      }
    } catch (error) {
      warnings.push("Security checks could not be completed");
    }

    return { errors, warnings };
  }

  /**
   * Check build process
   */
  private async runBuildCheck(): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (fs.existsSync(path.join(this.projectRoot, "package.json"))) {
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(this.projectRoot, "package.json"), "utf8"),
        );

        // Try to run build script
        if (packageJson.scripts?.build) {
          // Build process start - kept as console.log for user visibility
          try {
            execSync("npm run build", {
              cwd: this.projectRoot,
              stdio: "pipe",
              timeout: 120000, // 2 minutes
              env: { ...process.env, NODE_ENV: "production" },
            });
            await frameworkLogger.log(
              "comprehensive-validator",
              "build-completed",
              "success",
            );
          } catch (error) {
            errors.push("Build process failed");
          }
        }
      }
    } catch (error) {
      warnings.push("Build check could not be completed");
    }

    return { errors, warnings };
  }

  /**
   * Run all comprehensive validation checks
   */
  async validate(): Promise<ComprehensiveValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let testResults;

    try {
      await frameworkLogger.log(
        "comprehensive-validator",
        "post-push-validation-started",
        "info",
      );

      // Linting checks
      const lintResults = await this.runLinting();
      allErrors.push(...lintResults.errors);
      allWarnings.push(...lintResults.warnings);

      // Test execution
      const testResults_ = await this.runTests();
      allErrors.push(...testResults_.errors);
      allWarnings.push(...testResults_.warnings);
      testResults = testResults_.testResults;

      // Security checks
      const securityResults = await this.runSecurityChecks();
      allErrors.push(...securityResults.errors);
      allWarnings.push(...securityResults.warnings);

      // Build check
      const buildResults = await this.runBuildCheck();
      allErrors.push(...buildResults.errors);
      allWarnings.push(...buildResults.warnings);

      await frameworkLogger.log(
        "comprehensive-validator",
        "post-push-validation-completed",
        "info",
      );
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
      testResults,
    };
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  const validator = new ComprehensiveValidator();
  const result = await validator.validate();

  // Report results
  if (result.warnings.length > 0) {
    console.log(`⚠️ ${result.warnings.length} warning(s) found:`);
    result.warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log(`❌ ${result.errors.length} error(s) found:`);
    result.errors.forEach((error) => console.log(`   ${error}`));
  }

  if (result.testResults) {
    console.log(
      `🧪 Test Results: ${result.testResults.passed}/${result.testResults.total} passed`,
    );
  }

  console.log(
    `✅ Post-push: Comprehensive validation completed in ${result.duration}ms`,
  );

  if (!result.passed) {
    console.log("💡 Fix the errors above before pushing");
    process.exit(1);
  }

  process.exit(0);
}

// Run validation
main().catch((error) => {
  console.error(
    "❌ Comprehensive validation failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
