/**
 * PostProcessor Chain Validator
 *
 * Validates postprocessor execution chain integrity.
 * Checks that all registered postprocessors executed without errors,
 * validates priority ordering, and detects skipped or crashed processors.
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { frameworkLogger } from "../core/framework-logger.js";
import type { PostValidateContext, ProcessorExecutionResult } from "./processor-types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChainValidationResult {
  valid: boolean;
  issues: ChainIssue[];
}

export interface ChainIssue {
  severity: "error" | "warning";
  processorName: string;
  message: string;
}

export interface ChainReport {
  totalProcessors: number;
  successful: number;
  failed: number;
  skipped: number;
  issues: ChainIssue[];
  averageDuration: number;
  executedInPriorityOrder: boolean;
}

interface ChainEntry {
  name: string;
  success: boolean;
  duration: number;
  priority?: number;
}

// ---------------------------------------------------------------------------
// Processor
// ---------------------------------------------------------------------------

export class PostProcessorChainValidator {
  private chainReport: ChainReport | null = null;

  /**
   * Validate the postprocessor execution chain.
   */
  validateChain(
    results: Array<{ name: string; success: boolean; duration: number; priority?: number }>,
  ): ChainValidationResult {
    const issues: ChainIssue[] = [];

    if (results.length === 0) {
      const emptyReport: ChainReport = {
        totalProcessors: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        issues: [],
        averageDuration: 0,
        executedInPriorityOrder: true,
      };
      this.chainReport = emptyReport;
      return { valid: true, issues: [] };
    }

    // Check for failed processors
    for (const result of results) {
      if (!result.success) {
        issues.push({
          severity: "error",
          processorName: result.name,
          message: `Processor "${result.name}" failed during execution`,
        });
      }
    }

    // Validate priority ordering if priorities are provided
    const withPriority = results.filter((r) => r.priority !== undefined);
    if (withPriority.length > 1) {
      for (let i = 1; i < withPriority.length; i++) {
        const prev = withPriority[i - 1];
        const curr = withPriority[i];
        if (!prev || !curr) continue;
        if (
          prev.priority !== undefined &&
          curr.priority !== undefined &&
          prev.priority > curr.priority
        ) {
          issues.push({
            severity: "warning",
            processorName: curr.name,
            message: `Processor "${curr.name}" (priority ${curr.priority}) ran after "${prev.name}" (priority ${prev.priority}) — expected ascending priority order`,
          });
        }
      }
    }

    // Detect processors with zero or negative duration (potential skips)
    for (const result of results) {
      if (result.success && result.duration <= 0) {
        issues.push({
          severity: "warning",
          processorName: result.name,
          message: `Processor "${result.name}" reports zero/negative duration (${result.duration}ms) — may have been skipped`,
        });
      }
    }

    // Build chain report
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const skipped = results.filter((r) => r.success && r.duration <= 0).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const executedInPriorityOrder = !issues.some(
      (issue) => issue.message.includes("expected ascending priority order"),
    );

    this.chainReport = {
      totalProcessors: results.length,
      successful,
      failed,
      skipped,
      issues,
      averageDuration: results.length > 0 ? totalDuration / results.length : 0,
      executedInPriorityOrder,
    };

    return {
      valid: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    };
  }

  /**
   * Get the chain report from the most recent validation.
   */
  getChainReport(): ChainReport {
    if (!this.chainReport) {
      return {
        totalProcessors: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        issues: [],
        averageDuration: 0,
        executedInPriorityOrder: true,
      };
    }
    return this.chainReport;
  }
}

// ---------------------------------------------------------------------------
// Standalone runner for processor-manager integration
// ---------------------------------------------------------------------------

export async function runPostProcessorChainValidation(
  context: PostValidateContext,
): Promise<ProcessorExecutionResult> {
  const start = performance.now();

  try {
    const preResults = context.preResults ?? [];

    const validator = new PostProcessorChainValidator();

    const chainEntries = preResults.map((r) => ({
      name: r.processorName,
      success: r.success,
      duration: r.duration,
    }));

    const validationResult = validator.validateChain(chainEntries);
    const report = validator.getChainReport();

    if (!validationResult.valid) {
      frameworkLogger.log(
        "postprocessor-chain-validator",
        "chain_invalid",
        "warning",
        { issues: validationResult.issues },
      );
    }

    return {
      success: validationResult.valid,
      processorName: "postprocessor-chain-validator",
      duration: performance.now() - start,
      result: {
        validation: validationResult,
        report,
      },
    };
  } catch (error) {
    frameworkLogger.log(
      "postprocessor-chain-validator",
      "validation_failed",
      "error",
      { error: (error as Error).message },
    );
    return {
      success: false,
      processorName: "postprocessor-chain-validator",
      duration: performance.now() - start,
      error: (error as Error).message,
    };
  }
}
