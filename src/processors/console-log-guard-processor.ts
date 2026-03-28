/**
 * Console Log Guard Processor
 *
 * Enforces codex term #33: Console Log Guard.
 * Scans code for forbidden console.log/warn/error/info/debug usage,
 * ensuring all logging goes through frameworkLogger instead.
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { frameworkLogger } from "../core/framework-logger.js";
import type { PreValidateContext, ProcessorExecutionResult } from "./processor-types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsoleLogViolation {
  line: number;
  type: "log" | "warn" | "error" | "info" | "debug";
  matched: string;
}

// ---------------------------------------------------------------------------
// Processor
// ---------------------------------------------------------------------------

const CONSOLE_METHODS = ["log", "warn", "error", "info", "debug"] as const;
const TEST_FILE_PATTERN = /\.(test|spec)\.ts$/;

export class ConsoleLogGuardProcessor {
  /**
   * Scan code content for forbidden console method calls.
   * Returns violations with line numbers.
   */
  checkCode(content: string, filePath?: string): ConsoleLogViolation[] {
    if (!content || !content.trim()) {
      return [];
    }

    // Skip test files entirely
    if (filePath && this.isTestFile(filePath)) {
      return [];
    }

    const stripped = this.stripComments(content);
    const lines = stripped.split("\n");
    const violations: ConsoleLogViolation[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      if (!line) continue;

      for (const method of CONSOLE_METHODS) {
        const pattern = new RegExp(`\\bconsole\\.${method}\\s*\\(`, "g");
        if (pattern.test(line)) {
          violations.push({
            line: lineNum,
            type: method,
            matched: line.trim(),
          });
        }
      }
    }

    return violations;
  }

  /**
   * Determine if a file path points to a test file.
   */
  isTestFile(filePath: string): boolean {
    return TEST_FILE_PATTERN.test(filePath);
  }

  /**
   * Remove single-line (//) and multi-line comments from source code.
   * Preserves line structure so line numbers remain valid.
   */
  stripComments(content: string): string {
    let result = "";
    let i = 0;
    const len = content.length;

    while (i < len) {
      // Single-line comment: // ... newline
      if (content[i] === "/" && i + 1 < len && content[i + 1] === "/") {
        // Skip until end of line
        while (i < len && content[i] !== "\n") {
          i++;
        }
        // Keep the newline character to preserve line numbers
        if (i < len && content[i] === "\n") {
          result += "\n";
          i++;
        }
      }
      // Multi-line comment: /* ... */
      else if (content[i] === "/" && i + 1 < len && content[i + 1] === "*") {
        i += 2; // skip /*
        while (i < len) {
          if (content[i] === "*" && i + 1 < len && content[i + 1] === "/") {
            i += 2; // skip */
            break;
          }
          if (content[i] === "\n") {
            result += "\n"; // preserve line numbers
          }
          i++;
        }
      }
      // String literal — skip over to avoid matching // inside strings
      else if (content[i] === '"' || content[i] === "'" || content[i] === "`") {
        const quote = content[i];
        result += content[i];
        i++;
        while (i < len && content[i] !== quote) {
          if (content[i] === "\\" && i + 1 < len) {
            result += content[i];
            i++;
            result += content[i];
            i++;
          } else {
            if (content[i] === "\n") {
              result += "\n";
            } else {
              result += content[i];
            }
            i++;
          }
        }
        if (i < len) {
          result += content[i]; // closing quote
          i++;
        }
      }
      // Regular character
      else {
        if (content[i] === "\n") {
          result += "\n";
        } else {
          result += content[i];
        }
        i++;
      }
    }

    return result;
  }
}

// ---------------------------------------------------------------------------
// Standalone runner for processor-manager integration
// ---------------------------------------------------------------------------

export async function runConsoleLogGuard(
  context: PreValidateContext,
): Promise<ProcessorExecutionResult> {
  const start = performance.now();

  try {
    const content = (context.data as string) ?? "";
    const filePath = (context.filesChanged as string[] | undefined)?.[0];

    const processor = new ConsoleLogGuardProcessor();
    const violations = processor.checkCode(content, filePath);

    const hasViolations = violations.length > 0;

    if (hasViolations) {
      frameworkLogger.log(
        "console-log-guard-processor",
        "violations_found",
        "warning",
        { violations, filePath },
      );
    }

    return {
      success: !hasViolations,
      processorName: "console-log-guard-processor",
      duration: performance.now() - start,
      result: { violations },
    };
  } catch (error) {
    frameworkLogger.log(
      "console-log-guard-processor",
      "check_failed",
      "error",
      { error: (error as Error).message },
    );
    return {
      success: false,
      processorName: "console-log-guard-processor",
      duration: performance.now() - start,
      error: (error as Error).message,
    };
  }
}
