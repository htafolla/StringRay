/**
 * Codex Compliance Processor
 *
 * Validates code against the Universal Development Codex.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

import { PreProcessor } from "../processor-interfaces.js";
import { frameworkLogger } from "../../core/framework-logger.js";

export class CodexComplianceProcessor extends PreProcessor {
  readonly name = "codexCompliance";
  readonly priority = 20;

  protected async run(context: unknown): Promise<unknown> {
    const ctx = context as Record<string, unknown>;
    
    // Lazy load RuleEnforcer to avoid circular dependencies
    const { RuleEnforcer } = await import("../../enforcement/rule-enforcer.js");
    const ruleEnforcer = new RuleEnforcer();

    const operation = (ctx.operation as string) || "modify";
    const filePath = ctx.filePath as string | undefined;
    const content = ctx.content as string | undefined;

    await frameworkLogger.log(
      "codex-compliance-processor",
      "validating",
      "info",
      { operation, filePath: filePath?.slice(0, 100) },
    );

    // Build validation context
    const validationContext: import("../../enforcement/types.js").RuleValidationContext = {
      operation,
    };
    
    if (filePath) {
      validationContext.files = [filePath];
    }
    
    if (content) {
      validationContext.newCode = content;
    }

    // Validate against codex rules
    const validationResult = await ruleEnforcer.validateOperation(
      operation,
      validationContext,
    );

    if (!validationResult.passed) {
      const errors = validationResult.errors.join("; ");
      throw new Error(`Codex compliance failed: ${errors}`);
    }

    return {
      passed: true,
      rulesChecked: validationResult.results.length,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
    };
  }
}
