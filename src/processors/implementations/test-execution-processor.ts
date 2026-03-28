/**
 * Test Execution Processor
 *
 * Post-processor that executes tests after operations.
 * Automatically runs relevant tests based on the operation context.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

import { PostProcessor } from "../processor-interfaces.js";
import { frameworkLogger } from "../../core/framework-logger.js";

export class TestExecutionProcessor extends PostProcessor {
  readonly name = "testExecution";
  readonly priority = 40;

  protected async run(context: unknown): Promise<unknown> {
    const ctx = context as Record<string, unknown>;
    const operation = (ctx.operation as string) || "unknown";
    const filePath = ctx.filePath as string | undefined;
    const data = ctx.data;

    await frameworkLogger.log(
      "test-execution-processor",
      "executing-tests",
      "info",
      { operation, filePath: filePath?.slice(0, 100) },
    );

    try {
      // Lazy load required modules
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const { detectProjectLanguage } = await import(
        "../../utils/language-detector.js"
      );

      const execAsync = promisify(exec);
      const cwd = process.cwd();

      // Detect project language
      const projectLanguage = detectProjectLanguage(cwd);

      if (!projectLanguage) {
        await frameworkLogger.log(
          "test-execution-processor",
          "language-detection-failed",
          "info",
          { message: "Could not detect project language" },
        );

        return {
          testsExecuted: 0,
          passed: 0,
          failed: 0,
          success: true,
          message: "Language detection failed - skipping test execution",
        };
      }

      await frameworkLogger.log(
        "test-execution-processor",
        "language-detected",
        "info",
        {
          language: projectLanguage.language,
          testFramework: projectLanguage.testFramework,
        },
      );

      // Build test command based on project language
      let testCommand: string;

      if (
        projectLanguage.language === "TypeScript" ||
        projectLanguage.language === "JavaScript"
      ) {
        testCommand = await this.buildTypeScriptTestCommand(filePath);
      } else {
        testCommand = this.buildGenericTestCommand(
          projectLanguage,
          filePath,
        );
      }

      await frameworkLogger.log(
        "test-execution-processor",
        "running-tests",
        "info",
        { command: testCommand },
      );

      // Execute tests
      let stdout = "";
      let stderr = "";
      let exitCode = 0;

      try {
        const result = await execAsync(testCommand, {
          cwd,
          timeout: 120000, // 2 minute timeout
        });
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (execError: any) {
        exitCode = execError.code || 1;
        stdout = execError.stdout || "";
        stderr = execError.stderr || "";
      }

      // Parse test results
      const passed = this.parseTestCount(stdout, "passed");
      const failed = this.parseTestCount(stdout, "failed");
      const total = passed + failed;

      const success = exitCode === 0;

      await frameworkLogger.log(
        "test-execution-processor",
        "tests-completed",
        success ? "success" : "error",
        {
          total,
          passed,
          failed,
          exitCode,
        },
      );

      return {
        testsExecuted: total,
        passed,
        failed,
        exitCode,
        success,
        output: stdout.substring(0, 1000), // Limit output size
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await frameworkLogger.log(
        "test-execution-processor",
        "execution-error",
        "error",
        { error: errorMessage },
      );

      return {
        testsExecuted: 0,
        passed: 0,
        failed: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  private async buildTypeScriptTestCommand(
    filePath: string | undefined,
  ): Promise<string> {
    if (filePath) {
      // Try to find corresponding test file
      const fs = await import("fs");
      const testFilePath = filePath
        .replace(/\/src\//, "/src/__tests__/")
        .replace(/\.ts$/, ".test.ts");

      if (fs.existsSync(testFilePath)) {
        return `npx vitest run "${testFilePath}"`;
      }
    }

    // Run all tests if no specific test file found
    return "npx vitest run";
  }

  private buildGenericTestCommand(
    projectLanguage: {
      language: string;
      testFramework: string;
      testCommand?: string;
    },
    filePath: string | undefined,
  ): string {
    const baseCommand = projectLanguage.testCommand || "npm test";

    if (filePath && projectLanguage.testFramework) {
      return `${baseCommand} -- "${filePath}"`;
    }

    return baseCommand;
  }

  private parseTestCount(output: string, type: "passed" | "failed"): number {
    // Try various output patterns
    const patterns = [
      new RegExp(`(\\d+)\\s+${type}`, "gi"),
      new RegExp(`Tests?:\\s+\\d+\\s+passed,\\s+(\\d+)\\s+failed`, "gi"),
      new RegExp(`(\\d+)\\s+passed,\\s+(\\d+)\\s+failed`, "gi"),
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        if (type === "passed") {
          if (match[0].includes("passed") && match[0].includes("failed")) {
            const passedMatch = match[0].match(/(\d+)\s+passed/);
            return passedMatch ? parseInt(passedMatch[1] || "0") : 0;
          }
          const count = match[0].match(/(\d+)/);
          return count ? parseInt(count[1] || "0") : 0;
        } else {
          if (match[0].includes("passed") && match[0].includes("failed")) {
            const failedMatch = match[0].match(/(\d+)\s+failed/);
            return failedMatch ? parseInt(failedMatch[1] || "0") : 0;
          }
        }
      }
    }

    return 0;
  }
}
