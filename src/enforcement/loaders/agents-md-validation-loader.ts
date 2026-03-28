/**
 * AGENTS.md Validation Rule Loader
 * 
 * Loads validation rules for AGENTS.md file existence and currency.
 * Ensures that AGENTS.md exists and is properly maintained.
 * 
 * Phase 4 refactoring: Extracted from RuleEnforcer.loadAgentsMdValidationRule()
 * 
 * @module loaders/agents-md-validation-loader
 * @version 1.0.0
 */

import { frameworkLogger } from "../../core/framework-logger.js";
import { BaseLoader } from "./base-loader.js";
import {
  RuleDefinition,
  RuleValidationContext,
  RuleValidationResult,
  RuleFix,
} from "../types.js";

/**
 * Loader for AGENTS.md validation rules.
 * Creates rules that validate AGENTS.md existence and currency.
 * 
 * @example
 * ```typescript
 * const loader = new AgentsMdValidationLoader();
 * if (await loader.isAvailable()) {
 *   const rules = await loader.load();
 *   console.log(`Loaded ${rules.length} AGENTS.md validation rules`);
 * }
 * ```
 */
export class AgentsMdValidationLoader extends BaseLoader {
  readonly name = "agents-md-validation";

  /**
   * Path to the AGENTS.md file.
   */
  private get agentsPath(): string {
    return this.resolvePath("AGENTS.md");
  }

  /**
   * Check if AGENTS.md exists.
   * @returns Promise resolving to true if AGENTS.md is available
   */
  async isAvailable(): Promise<boolean> {
    return this.fileExists(this.agentsPath);
  }

  /**
   * Load AGENTS.md validation rules.
   * @returns Promise resolving to array of rule definitions
   */
  async load(): Promise<RuleDefinition[]> {
    const rules: RuleDefinition[] = [];

    try {
      // Rule: AGENTS.md must exist
      rules.push(this.createAgentsMdExistsRule());

      // Rule: AGENTS.md must be current
      rules.push(this.createAgentsMdCurrentRule());

      // Rule: AGENTS.md must have valid structure
      rules.push(this.createAgentsMdStructureRule());

      await frameworkLogger.log(
        "agents-md-validation-loader",
        "loaded-agents-md-rules",
        "success",
        {
          message: `Loaded ${rules.length} AGENTS.md validation rules`,
          ruleCount: rules.length,
        }
      );
    } catch (error) {
      await frameworkLogger.log(
        "agents-md-validation-loader",
        "failed-to-load-agents-md-rules",
        "error",
        {
          message: `Failed to load AGENTS.md validation rules: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }

    return rules;
  }

  /**
   * Create AGENTS.md existence rule.
   * @returns RuleDefinition for AGENTS.md existence
   */
  private createAgentsMdExistsRule(): RuleDefinition {
    return {
      id: "agents-md-exists",
      name: "AGENTS.md Must Exist",
      description:
        "AGENTS.md is required for agent triage rules, codex compliance, and session management. Projects must maintain an up-to-date AGENTS.md file.",
      category: "architecture",
      severity: "blocking",
      enabled: true,
      validator: this.validateAgentsMdExists.bind(this),
    };
  }

  /**
   * Create AGENTS.md currency rule.
   * @returns RuleDefinition for AGENTS.md currency
   */
  private createAgentsMdCurrentRule(): RuleDefinition {
    return {
      id: "agents-md-current",
      name: "AGENTS.md Must Be Current",
      description:
        "AGENTS.md should be reviewed and updated regularly (within 30 days) to ensure agent capabilities and rules are accurate.",
      category: "reporting",
      severity: "warning",
      enabled: true,
      validator: this.validateAgentsMdCurrent.bind(this),
    };
  }

  /**
   * Create AGENTS.md structure rule.
   * @returns RuleDefinition for AGENTS.md structure
   */
  private createAgentsMdStructureRule(): RuleDefinition {
    return {
      id: "agents-md-structure",
      name: "AGENTS.md Must Have Valid Structure",
      description:
        "AGENTS.md must contain required sections including agent list, triage guidelines, and reflection paths.",
      category: "architecture",
      severity: "warning",
      enabled: true,
      validator: this.validateAgentsMdStructure.bind(this),
    };
  }

  /**
   * Validate that AGENTS.md exists.
   * @param context - Validation context
   * @returns Validation result
   */
  private async validateAgentsMdExists(
    context: RuleValidationContext
  ): Promise<RuleValidationResult> {
    try {
      const exists = await this.fileExists(this.agentsPath);

      if (!exists) {
        const fixes: RuleFix[] = [
          {
            type: "run-command",
            description: "Auto-generate AGENTS.md from template",
            command: "node scripts/node/enforce-agents-md.js --generate",
          },
        ];

        return {
          passed: false,
          message: "AGENTS.md not found in project root",
          suggestions: [
            "Create AGENTS.md using template from docs/AGENTS_TEMPLATE.md",
            "Run: node scripts/node/enforce-agents-md.js --generate",
            "See AGENTS.md for agent triage rules and codex compliance",
          ],
          fixes,
        };
      }

      return {
        passed: true,
        message: "AGENTS.md exists",
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking AGENTS.md: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate that AGENTS.md is current (updated within 30 days).
   * @param context - Validation context
   * @returns Validation result
   */
  private async validateAgentsMdCurrent(
    context: RuleValidationContext
  ): Promise<RuleValidationResult> {
    try {
      const exists = await this.fileExists(this.agentsPath);

      if (!exists) {
        return {
          passed: true,
          message: "AGENTS.md check skipped (file does not exist)",
        };
      }

      const content = await this.readFile(this.agentsPath);
      const dateMatch = content.match(/\*\*Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/);

      if (!dateMatch || !dateMatch[1]) {
        return {
          passed: false,
          message: "AGENTS.md missing date stamp",
          suggestions: ["Add '**Updated**: YYYY-MM-DD' to AGENTS.md header"],
        };
      }

      const updateDate = new Date(dateMatch[1]);
      const daysSinceUpdate = Math.floor(
        (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > 30) {
        return {
          passed: false,
          message: `AGENTS.md is ${daysSinceUpdate} days old (recommended: review every 30 days)`,
          suggestions: [
            "Review and update AGENTS.md to reflect current agent capabilities",
            "Update the date stamp to today's date",
          ],
        };
      }

      return {
        passed: true,
        message: `AGENTS.md is current (${daysSinceUpdate} days old)`,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking AGENTS.md date: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate AGENTS.md structure.
   * @param context - Validation context
   * @returns Validation result
   */
  private async validateAgentsMdStructure(
    context: RuleValidationContext
  ): Promise<RuleValidationResult> {
    try {
      const exists = await this.fileExists(this.agentsPath);

      if (!exists) {
        return {
          passed: true,
          message: "AGENTS.md structure check skipped (file does not exist)",
        };
      }

      const content = await this.readFile(this.agentsPath);
      const missingSections: string[] = [];

      // Check for required sections
      if (!content.includes("# StringRay Agents")) {
        missingSections.push("Main title (StringRay Agents)");
      }

      if (!content.includes("Available Agents")) {
        missingSections.push("Available Agents section");
      }

      if (!content.includes("Triage") && !content.includes("triage")) {
        missingSections.push("Triage guidelines section");
      }

      if (
        !content.includes("reflection") &&
        !content.includes("Reflection")
      ) {
        missingSections.push("Reflection guidelines section");
      }

      if (missingSections.length > 0) {
        return {
          passed: false,
          message: `AGENTS.md missing required sections: ${missingSections.join(", ")}`,
          suggestions: [
            "Add missing sections to AGENTS.md",
            "Reference docs/AGENTS_TEMPLATE.md for structure",
          ],
        };
      }

      return {
        passed: true,
        message: "AGENTS.md has valid structure",
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking AGENTS.md structure: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
