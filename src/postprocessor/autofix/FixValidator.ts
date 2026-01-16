/**
 * Fix Validation and Rollback for Post-Processor
 */

import { FixResult, FailureAnalysis, PostProcessorContext } from "../types.js";
import { execSync } from "child_process";

export class FixValidator {
  /**
   * Validate that applied fixes resolve the original issue
   */
  async validateFixes(
    fixes: any[],
    originalFailure: FailureAnalysis,
    context: PostProcessorContext,
  ): Promise<boolean> {
    console.log("✅ Validating applied fixes...");

    if (fixes.length === 0) {
      console.log("⚠️  No fixes to validate");
      return false;
    }

    try {
      // Run validation tests based on the original failure type
      const validationPassed = await this.runValidationTests(
        originalFailure.category,
      );

      if (validationPassed) {
        console.log(
          "✅ Fix validation passed - original issue appears resolved",
        );
        return true;
      } else {
        await frameworkLogger.log("fix-validator", "validation-failed", "error", { issue: "still-exists" });
        return false;
      }
    } catch (error) {
      console.error("❌ Fix validation error:", error);
      return false;
    }
  }

  /**
   * Run appropriate validation tests based on failure category
   */
  private async runValidationTests(category: string): Promise<boolean> {
    try {
      switch (category) {
        case "test-failure":
          console.log("🧪 Running test validation...");
          execSync("npm test", {
            stdio: "pipe",
            timeout: 120000, // 2 minutes
          });
          return true;

        case "build-failure":
          console.log("🔨 Running build validation...");
          execSync("npm run build", {
            stdio: "pipe",
            timeout: 120000, // 2 minutes
          });
          return true;

        case "code-quality-failure":
          console.log("🎨 Running code quality validation...");
          execSync("npm run lint", {
            stdio: "pipe",
            timeout: 60000, // 1 minute
          });
          return true;

        case "security-failure":
          console.log("🛡️ Running security validation...");
          execSync("npm run security-audit", {
            stdio: "pipe",
            timeout: 60000, // 1 minute
          });
          return true;

        case "performance-regression":
          console.log("⚡ Running performance validation...");
          execSync("npm run test:performance", {
            stdio: "pipe",
            timeout: 120000, // 2 minutes
          });
          return true;

        case "ci-pipeline-failure":
        default:
          console.log("🔍 Running general validation...");
          // Run type checking as basic validation
          execSync("npm run typecheck", {
            stdio: "pipe",
            timeout: 60000, // 1 minute
          });
          return true;
      }
    } catch (error) {
      console.log(
        `❌ Validation failed for ${category}:`,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  /**
   * Rollback applied fixes if validation fails
   */
  async rollbackFixes(fixes: any[]): Promise<void> {
    console.log("🔄 Rolling back applied fixes...");

    if (fixes.length === 0) {
      console.log("⚠️  No fixes to rollback");
      return;
    }

    try {
      // Create a backup branch before rollback
      const backupBranch = `backup-fix-${Date.now()}`;
      execSync(`git branch ${backupBranch}`, { stdio: "pipe" });
      console.log(`💾 Created backup branch: ${backupBranch}`);

      // Reset to the commit before fixes were applied
      execSync("git reset --hard HEAD~1", { stdio: "inherit" });
      console.log("✅ Fixes rolled back to previous commit");

      // Restore working directory state if needed
      // This is a simplified rollback - in production, we'd track exact changes
      console.log("🔄 Rollback completed successfully");
    } catch (error) {
      console.error("❌ Rollback failed:", error);
      throw new Error(
        `Rollback failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create a detailed validation report
   */
  async generateValidationReport(
    fixes: any[],
    validationResult: boolean,
    originalFailure: FailureAnalysis,
  ): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      originalFailure: {
        category: originalFailure.category,
        severity: originalFailure.severity,
        confidence: originalFailure.confidence,
      },
      appliedFixes: fixes.map((fix) => ({
        type: fix.type,
        description: fix.description,
        files: fix.files,
      })),
      validationResult,
      summary: validationResult
        ? "Fixes validated successfully - issue resolved"
        : "Fixes did not resolve the issue - manual intervention required",
    };
  }

  /**
   * Check if rollback is safe and recommended
   */
  isRollbackRecommended(
    fixes: any[],
    validationResult: boolean,
    originalFailure: FailureAnalysis,
  ): boolean {
    // Don't rollback if fixes were applied and validation passed
    if (validationResult) {
      return false;
    }

    // Rollback if high-severity failures couldn't be fixed
    if (
      originalFailure.severity === "critical" ||
      originalFailure.severity === "high"
    ) {
      return true;
    }

    // Rollback if multiple fixes were applied but still failed
    if (fixes.length > 1) {
      return true;
    }

    // For low-risk changes, rollback is safer
    return fixes.some(
      (fix) => fix.type === "dependency-update" || fix.type === "code-fix",
    );
  }
}
