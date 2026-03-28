/**
 * TypeScript Compilation Processor
 *
 * Runs `tsc --noEmit` to catch type errors before writes land.
 * Parses TypeScript error lines from stderr and returns structured results.
 * Gracefully skips when no tsconfig.json exists.
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { frameworkLogger } from "../core/framework-logger.js";

export interface TypeScriptCompilationResult {
  success: boolean;
  errors: string[];
  duration: number;
  fileCount: number;
  errorCount?: number;
  skipped?: boolean;
  reason?: string;
}

/**
 * Parse TypeScript error lines from stderr output.
 * Filters for lines containing "error TS" which is the standard TypeScript error format.
 */
export function parseTypeScriptErrors(stderr: string): string[] {
  return stderr
    .split("\n")
    .filter((line: string) => line.includes("error TS"))
    .map((line: string) => line.trim());
}

/**
 * Run TypeScript compilation check (tsc --noEmit).
 *
 * @param cwd - Working directory for the command (defaults to process.cwd())
 * @param timeout - Maximum execution time in milliseconds (default 30000)
 * @returns Structured result with success status, errors, and timing
 */
export function runTypeScriptCompilation(
  cwd?: string,
  timeout: number = 30000,
): TypeScriptCompilationResult {
  const startTime = Date.now();
  const workingDir = cwd || process.cwd();

  frameworkLogger.log(
    "typescript-compilation-processor",
    "starting tsc --noEmit check",
    "info",
    { cwd: workingDir, timeout },
  );

  // Check if tsconfig.json exists in the working directory
  if (!existsSync(`${workingDir}/tsconfig.json`)) {
    frameworkLogger.log(
      "typescript-compilation-processor",
      "skipped - no tsconfig.json found",
      "info",
      { cwd: workingDir },
    );

    return {
      success: true,
      errors: [],
      duration: Date.now() - startTime,
      fileCount: 0,
      skipped: true,
      reason: "no tsconfig.json found",
    };
  }

  try {
    execSync("npx tsc --noEmit", {
      cwd: workingDir,
      stdio: "pipe",
      timeout,
    });

    frameworkLogger.log(
      "typescript-compilation-processor",
      "tsc --noEmit passed with no errors",
      "success",
      { duration: Date.now() - startTime },
    );

    return {
      success: true,
      errors: [],
      duration: Date.now() - startTime,
      fileCount: 0,
    };
  } catch (error: unknown) {
    const err = error as { stderr?: Buffer | string; message?: string };
    const stderr = err.stderr?.toString() || err.message || "";
    const errorLines = parseTypeScriptErrors(stderr);

    frameworkLogger.log(
      "typescript-compilation-processor",
      "tsc --noEmit found type errors",
      "error",
      {
        errorCount: errorLines.length,
        duration: Date.now() - startTime,
        errors: errorLines.slice(0, 10), // Log first 10 errors for debugging
      },
    );

    return {
      success: false,
      errors: errorLines.length > 0 ? errorLines : [stderr],
      duration: Date.now() - startTime,
      fileCount: 0,
      errorCount: errorLines.length,
    };
  }
}

export const typescriptCompilationProcessor = {
  name: "typescriptCompilation",
  priority: 15,
  enabled: true,

  async execute(
    context: Record<string, unknown>,
  ): Promise<TypeScriptCompilationResult> {
    const cwd = (context.directory as string) || process.cwd();
    return runTypeScriptCompilation(cwd);
  },
};
