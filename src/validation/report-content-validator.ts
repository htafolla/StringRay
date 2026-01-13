/**
 * Report Content Validator
 * Reads and analyzes full report content to detect hidden errors and inconsistencies
 */
export class ReportContentValidator {
  private reportPatterns = {
    // Error patterns that indicate real issues (excluding legitimate contexts)
    criticalErrors: [
      /\bERROR\b(?!\s*(handling|prevention|conditions?|messages?|logs?|recovery))/gi, // ERROR not followed by legitimate terms
      /\bFAILED\b(?!\s*(to|attempts?|tests?|validation))/gi, // FAILED not in expected contexts
      /\bCRASHED\b/gi,
      /\bEXCEPTION\b(?!\s*(handling|thrown))/gi,
      /\bFATAL\b(?!\s*(error|errors))/gi,
      /❌/g,
      /\[ERROR\]/g,
      /\bBROKEN\b/gi,
      /\bUNAVAILABLE\b/gi,
      /\bDISABLED\b/gi,
    ],

    // Warning patterns that need attention
    warnings: [
      /\bWARNING\b/gi,
      /\bWARN\b/gi,
      /\bDEPRECATED\b/gi,
      /\bUNSTABLE\b/gi,
      /⚠️/g,
      /\[WARN\]/g,
    ],

    // Success claims that might be false
    falsePositives: [
      /\bSUCCESS\b.*\bFAILED\b/gi, // Success mentioned but failed occurred
      /\bPASSED\b.*\bERROR\b/gi, // Passed but errors present
      /\bCOMPLETED\b.*\bCRASHED\b/gi, // Completed but crashed
    ],

    // Inconsistency patterns
    inconsistencies: [
      /\b(\d+)\s+total.*\b(\d+)\s+failed/i, // Mismatched counts
      /\b(\d+)\s+passed.*\b(\d+)\s+failed/i, // Success/failure count mismatch
      /health.*score.*(\d+).*issues.*(\d+)/i, // Health score vs issue count mismatch
    ],
  };

  /**
   * Validate full report content for hidden errors
   */
  async validateReportContent(
    reportPath: string,
    reportType: "session" | "framework" | "validation" | "simulation",
  ): Promise<{
    valid: boolean;
    issues: string[];
    summary: {
      errorCount: number;
      warningCount: number;
      falsePositiveCount: number;
      inconsistencyCount: number;
      riskLevel: "low" | "medium" | "high" | "critical";
    };
    details: {
      criticalErrors: string[];
      warnings: string[];
      falsePositives: string[];
      inconsistencies: string[];
    };
  }> {
    const issues: string[] = [];
    const criticalErrors: string[] = [];
    const warnings: string[] = [];
    const falsePositives: string[] = [];
    const inconsistencies: string[] = [];

    try {
      // Read full report content
      const fs = await import("fs");
      if (!fs.existsSync(reportPath)) {
        issues.push(`Report file not found: ${reportPath}`);
        return this.createValidationResult(
          false,
          issues,
          0,
          0,
          0,
          0,
          [],
          [],
          [],
          [],
        );
      }

      const content = fs.readFileSync(reportPath, "utf8");

      // Analyze for critical errors
      for (const pattern of this.reportPatterns.criticalErrors) {
        const matches = content.match(pattern);
        if (matches) {
          criticalErrors.push(
            ...matches.map((match) => `Critical error pattern: "${match}"`),
          );
        }
      }

      // Analyze for warnings
      for (const pattern of this.reportPatterns.warnings) {
        const matches = content.match(pattern);
        if (matches) {
          warnings.push(
            ...matches.map((match) => `Warning pattern: "${match}"`),
          );
        }
      }

      // Analyze for false positives
      for (const pattern of this.reportPatterns.falsePositives) {
        const matches = content.match(pattern);
        if (matches) {
          falsePositives.push(
            ...matches.map((match) => `False positive detected: "${match}"`),
          );
        }
      }

      // Analyze for inconsistencies
      for (const pattern of this.reportPatterns.inconsistencies) {
        const matches = content.match(pattern);
        if (matches) {
          // Check if numbers don't add up
          const match = pattern.exec(content);
          if (match && match.length >= 3) {
            const num1 = parseInt(match[1] || "0");
            const num2 = parseInt(match[2] || "0");
            if (num1 > 0 && num2 > 0 && Math.abs(num1 - num2) > num1 * 0.1) {
              inconsistencies.push(`Number inconsistency: ${match[0]}`);
            }
          }
        }
      }

      // Additional report-type specific validations
      const typeSpecificIssues = await this.validateReportTypeSpecific(
        content,
        reportType,
      );
      issues.push(...typeSpecificIssues);

      // Calculate risk level
      const totalIssues =
        criticalErrors.length +
        warnings.length +
        falsePositives.length +
        inconsistencies.length;
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";

      if (criticalErrors.length > 0) riskLevel = "critical";
      else if (falsePositives.length > 0 || inconsistencies.length > 2)
        riskLevel = "high";
      else if (warnings.length > 5 || inconsistencies.length > 0)
        riskLevel = "medium";

      return {
        valid: criticalErrors.length === 0 && falsePositives.length === 0,
        issues,
        summary: {
          errorCount: criticalErrors.length,
          warningCount: warnings.length,
          falsePositiveCount: falsePositives.length,
          inconsistencyCount: inconsistencies.length,
          riskLevel,
        },
        details: {
          criticalErrors,
          warnings,
          falsePositives,
          inconsistencies,
        },
      };
    } catch (error) {
      issues.push(`Failed to validate report content: ${error}`);
      return this.createValidationResult(
        false,
        issues,
        0,
        0,
        0,
        0,
        [],
        [],
        [],
        [],
      );
    }
  }

  private async validateReportTypeSpecific(
    content: string,
    reportType: "session" | "framework" | "validation" | "simulation",
  ): Promise<string[]> {
    const issues: string[] = [];

    switch (reportType) {
      case "session":
        // Check for session-specific issues
        const hasSessionContent =
          content.includes("session") ||
          content.includes("Session") ||
          content.includes("coordinator") ||
          content.includes("agent") ||
          content.includes("delegation") ||
          content.includes("migration");

        if (!hasSessionContent) {
          issues.push("Session report missing session-related content");
        }

        // Check for session management terminology
        const sessionTerms = [
          "coordinator",
          "agent",
          "delegation",
          "migration",
          "persistence",
        ];
        const missingTerms = sessionTerms.filter(
          (term) => content.includes(term) && !content.includes(term + " "), // Don't count if it's part of another word
        );

        if (missingTerms.length > 0) {
          issues.push(
            `Session report mentions sessions but lacks key terminology: ${missingTerms.join(", ")}`,
          );
        }
        break;

      case "framework":
        // Check for framework health indicators
        if (!content.includes("health") && !content.includes("Health")) {
          issues.push("Framework report missing health assessment");
        }
        if (content.includes("error") && !content.includes("resolution")) {
          issues.push(
            "Framework report mentions errors but no resolution steps",
          );
        }
        break;

      case "validation":
        // Check for validation completeness
        if (!content.includes("validator") && !content.includes("validation")) {
          issues.push("Validation report missing validation terminology");
        }
        break;

      case "simulation":
        // Check for simulation metrics
        if (!content.includes("simulation") && !content.includes("scenario")) {
          issues.push("Simulation report missing simulation context");
        }
        if (content.includes("success") && !content.includes("metrics")) {
          issues.push(
            "Simulation report claims success but lacks performance metrics",
          );
        }
        break;
    }

    return issues;
  }

  private createValidationResult(
    valid: boolean,
    issues: string[],
    errorCount: number,
    warningCount: number,
    falsePositiveCount: number,
    inconsistencyCount: number,
    criticalErrors: string[],
    warnings: string[],
    falsePositives: string[],
    inconsistencies: string[],
  ) {
    return {
      valid,
      issues,
      summary: {
        errorCount,
        warningCount,
        falsePositiveCount,
        inconsistencyCount,
        riskLevel: "critical" as const,
      },
      details: {
        criticalErrors,
        warnings,
        falsePositives,
        inconsistencies,
      },
    };
  }

  /**
   * Get validation patterns for debugging
   */
  getValidationPatterns() {
    return { ...this.reportPatterns };
  }

  /**
   * Add custom validation pattern
   */
  addValidationPattern(
    category: keyof typeof this.reportPatterns,
    pattern: RegExp,
  ) {
    this.reportPatterns[category].push(pattern);
  }
}
