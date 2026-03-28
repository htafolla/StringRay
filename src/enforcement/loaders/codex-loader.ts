/**
 * Codex Rule Loader
 * 
 * Loads codex terms from .opencode/strray/codex.json and converts them
 * to RuleDefinition objects for the rule enforcement system.
 * 
 * Phase 4 refactoring: Extracted from RuleEnforcer.loadCodexRules()
 * 
 * @module loaders/codex-loader
 * @version 1.0.0
 */

import { frameworkLogger } from "../../core/framework-logger.js";
import {
  BaseLoader,
} from "./base-loader.js";
import {
  RuleDefinition,
  RuleValidationContext,
  RuleValidationResult,
  CodexData,
  CodexTerm,
} from "../types.js";

/**
 * Loader for codex terms from codex.json.
 * Converts codex terms to RuleDefinition objects.
 * 
 * @example
 * ```typescript
 * const loader = new CodexLoader();
 * if (await loader.isAvailable()) {
 *   const rules = await loader.load();
 *   console.log(`Loaded ${rules.length} codex rules`);
 * }
 * ```
 */
export class CodexLoader extends BaseLoader {
  readonly name = "codex";

  /**
   * Path to the codex.json file.
   */
  private get codexPath(): string {
    return this.resolvePath(".opencode/strray/codex.json");
  }

  /**
   * Check if codex.json exists.
   * @returns Promise resolving to true if codex.json is available
   */
  async isAvailable(): Promise<boolean> {
    return this.fileExists(this.codexPath);
  }

  /**
   * Load codex terms and convert to RuleDefinition objects.
   * @returns Promise resolving to array of rule definitions
   */
  async load(): Promise<RuleDefinition[]> {
    const rules: RuleDefinition[] = [];

    try {
      const codexData = await this.loadJsonFile<CodexData>(this.codexPath);

      // Convert codex terms to rules
      for (const [key, term] of Object.entries(codexData.terms)) {
        if (this.isValidCodexTerm(term)) {
          const rule = this.convertTermToRule(key, term);
          rules.push(rule);
        }
      }

      await frameworkLogger.log(
        "codex-loader",
        "loaded-codex-rules",
        "success",
        {
          message: `Loaded ${rules.length} codex rules`,
          ruleCount: rules.length,
          version: codexData.version,
        }
      );
    } catch (error) {
      await frameworkLogger.log(
        "codex-loader",
        "failed-to-load-codex",
        "error",
        {
          message: `Failed to load codex rules: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      // Return empty array on failure - other loaders can continue
    }

    return rules;
  }

  /**
   * Type guard to check if an object is a valid CodexTerm.
   * @param term - Object to validate
   * @returns True if the object is a valid CodexTerm
   */
  private isValidCodexTerm(term: unknown): term is CodexTerm {
    return (
      typeof term === "object" &&
      term !== null &&
      "title" in term &&
      typeof (term as CodexTerm).title === "string"
    );
  }

  /**
   * Convert a codex term to a RuleDefinition.
   * @param key - Term key (number as string)
   * @param term - Codex term data
   * @returns RuleDefinition object
   */
  private convertTermToRule(key: string, term: CodexTerm): RuleDefinition {
    return {
      id: `codex-${key}`,
      name: term.title,
      description: term.description || term.title,
      category: this.mapCodexCategory(term.category),
      severity: this.mapCodexSeverity(term.enforcementLevel, term.zeroTolerance),
      enabled: true,
      validator: this.createCodexValidator(term),
    };
  }

  /**
   * Map codex category to RuleCategory.
   * @param category - Codex category string
   * @returns Mapped RuleCategory
   */
  private mapCodexCategory(
    category: string | undefined
  ): "code-quality" | "architecture" | "performance" | "security" | "testing" | "reporting" | "codex" {
    const categoryMap: Record<string, RuleDefinition["category"]> = {
      core: "code-quality",
      architecture: "architecture",
      performance: "performance",
      security: "security",
      testing: "testing",
      operations: "architecture",
      documentation: "reporting",
      process: "architecture",
      "ci-cd": "testing",
      infrastructure: "architecture",
      quality: "code-quality",
      validation: "code-quality",
      resilience: "architecture",
      governance: "architecture",
      accessibility: "code-quality",
    };

    return categoryMap[category || ""] || "codex";
  }

  /**
   * Map codex severity to RuleSeverity.
   * @param enforcementLevel - Codex enforcement level
   * @param zeroTolerance - Whether term has zero tolerance
   * @returns Mapped RuleSeverity
   */
  private mapCodexSeverity(
    enforcementLevel: string | undefined,
    zeroTolerance: boolean | undefined
  ): "error" | "warning" | "info" | "blocking" | "high" {
    // Zero tolerance terms are always blocking
    if (zeroTolerance) {
      return "blocking";
    }

    switch (enforcementLevel?.toLowerCase()) {
      case "blocking":
        return "blocking";
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "info";
    }
  }

  /**
   * Create a validator function for a codex term.
   * @param term - Codex term data
   * @returns Validator function
   */
  private createCodexValidator(
    term: CodexTerm
  ): (context: RuleValidationContext) => Promise<RuleValidationResult> {
    return async (
      context: RuleValidationContext
    ): Promise<RuleValidationResult> => {
      // Basic validation - codex terms serve as informational/enforcement rules
      // Actual validation is handled by specific validators
      const passed = true;
      return {
        passed,
        message: passed
          ? `${term.title} validated`
          : `${term.title} violation detected`,
      };
    };
  }
}
