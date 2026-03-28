/**
 * Async Pattern Processor
 *
 * Enforces codex term #31: Async Pattern Detection.
 * Detects anti-patterns in async code: callback patterns, long promise chains,
 * missing await inside async functions, and mixed callback/promise styles.
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { frameworkLogger } from "../core/framework-logger.js";
import type { PreValidateContext, ProcessorExecutionResult } from "./processor-types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AsyncViolationType =
  | "callbackPattern"
  | "longPromiseChain"
  | "missingAwait"
  | "mixedCallbackAsync";

export interface AsyncViolation {
  type: AsyncViolationType;
  line?: number;
  message: string;
  snippet?: string;
}

// ---------------------------------------------------------------------------
// Processor
// ---------------------------------------------------------------------------

export class AsyncPatternProcessor {
  /**
   * Run all async-pattern checks against `content`.
   */
  checkCode(content: string): AsyncViolation[] {
    const violations: AsyncViolation[] = [];

    if (this.hasCallbackPattern(content)) {
      violations.push({
        type: "callbackPattern",
        message: "Callback pattern detected (node-style err-first callback or inline function callbacks)",
      });
    }

    if (this.hasLongPromiseChain(content)) {
      const count = this.countPromiseChains(content);
      violations.push({
        type: "longPromiseChain",
        message: `Promise chain has ${count} .then() calls (max 3)`,
      });
    }

    if (this.hasMissingAwait(content)) {
      violations.push({
        type: "missingAwait",
        message: "Async function contains un-awaited promise-returning calls (.then() or new Promise without await)",
      });
    }

    if (this.hasMixedCallbackAsync(content)) {
      violations.push({
        type: "mixedCallbackAsync",
        message: "Async function mixes callback patterns with async/await",
      });
    }

    return violations;
  }

  /**
   * Detect node-style callbacks: `function(err, ` or inline function callbacks.
   */
  hasCallbackPattern(content: string): boolean {
    const errFirstCallback = /function\s*\(\s*err\s*,/g.test(content);
    const inlineCallback = /\(\s*function\s*\(/g.test(content);
    return errFirstCallback || inlineCallback;
  }

  /**
   * Detect promise chains with more than 3 .then() calls.
   */
  hasLongPromiseChain(content: string): boolean {
    return this.countPromiseChains(content) > 3;
  }

  /**
   * Detect async functions that contain .then() or `new Promise` without an
   * accompanying await in the same scope.
   */
  hasMissingAwait(content: string): boolean {
    // Find async function bodies
    const asyncFnRegex = /async\s+function\s*\w*[^{]*\{[\s\S]*?\n\}/g;
    const asyncArrowRegex = /async\s+(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>\s*\{[\s\S]*?\n\}/g;

    const combined = content.replace(asyncFnRegex, (match) => {
      return this._checkAsyncBodyForMissingAwait(match);
    });
    const combined2 = combined.replace(asyncArrowRegex, (match) => {
      return this._checkAsyncBodyForMissingAwait(match);
    });

    // If any replacement introduced a marker, violation found
    return combined2.includes("__MISSING_AWAIT_DETECTED__");
  }

  /**
   * Detect callbacks used inside async functions.
   */
  hasMixedCallbackAsync(content: string): boolean {
    const asyncFnRegex = /async\s+function\s*\w*[^{]*\{([\s\S]*?)\n\}/g;
    const asyncArrowRegex = /async\s+(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>\s*\{([\s\S]*?)\n\}/g;

    const checkBody = (body: string): boolean => {
      return (
        /function\s*\(\s*err\s*,/g.test(body) ||
        /\(\s*function\s*\(/g.test(body)
      );
    };

    let match: RegExpExecArray | null;

    asyncFnRegex.lastIndex = 0;
    while ((match = asyncFnRegex.exec(content)) !== null) {
      if (checkBody(match[0])) return true;
    }

    asyncArrowRegex.lastIndex = 0;
    while ((match = asyncArrowRegex.exec(content)) !== null) {
      if (checkBody(match[0])) return true;
    }

    return false;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private countPromiseChains(content: string): number {
    const matches = content.match(/\.then\s*\(/g);
    return matches ? matches.length : 0;
  }

  /**
   * Within an async function body, check if .then() or new Promise is used
   * without await. If so, return a marker string; otherwise return original.
   */
  private _checkAsyncBodyForMissingAwait(asyncBody: string): string {
    // Check for .then( that is not on the same line as an await
    const lines = asyncBody.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (/\.then\s*\(/.test(trimmed) && !/\bawait\b/.test(trimmed)) {
        return "__MISSING_AWAIT_DETECTED__";
      }
      // new Promise without await on the same line or preceding
      if (/new\s+Promise\b/.test(trimmed) && !/\bawait\b/.test(trimmed)) {
        return "__MISSING_AWAIT_DETECTED__";
      }
    }
    return asyncBody;
  }
}

// ---------------------------------------------------------------------------
// Standalone runner for processor-manager integration
// ---------------------------------------------------------------------------

export async function runAsyncPatternCheck(
  context: PreValidateContext,
): Promise<ProcessorExecutionResult> {
  const start = performance.now();

  try {
    const content = (context.data as string) ?? "";

    const processor = new AsyncPatternProcessor();
    const violations = processor.checkCode(content);

    const hasViolations = violations.length > 0;

    if (hasViolations) {
      frameworkLogger.log(
        "async-pattern-processor",
        "violations_found",
        "warning",
        { violations },
      );
    }

    return {
      success: !hasViolations,
      processorName: "async-pattern-processor",
      duration: performance.now() - start,
      result: { violations },
    };
  } catch (error) {
    frameworkLogger.log(
      "async-pattern-processor",
      "check_failed",
      "error",
      { error: (error as Error).message },
    );
    return {
      success: false,
      processorName: "async-pattern-processor",
      duration: performance.now() - start,
      error: (error as Error).message,
    };
  }
}
