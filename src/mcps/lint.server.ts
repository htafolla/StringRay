/**
 * StrRay Lint MCP Server
 *
 * Comprehensive ESLint validation and automated code quality checking
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFileSync } from "child_process";
import fs from "fs";
import { frameworkLogger } from "../core/framework-logger.js";

class StrRayLintServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "lint", version: "1.15.11",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    void frameworkLogger.log(
      "lint.server",
      "-strray-lint-mcp-server-initialized-",
      "info",
      { message: "StrRay Lint MCP Server initialized" },
    );
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "lint",
            description:
              "Comprehensive ESLint validation and automated code quality checking",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific files to lint (optional - lints all if empty)",
                },
                fix: {
                  type: "boolean",
                  default: false,
                  description:
                    "Automatically fix linting issues where possible",
                },
                strict: {
                  type: "boolean",
                  default: false,
                  description: "Use strict linting rules",
                },
              },
            },
          },
          {
            name: "lint-check",
            description: "Check code quality without making changes",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files to check",
                },
                rules: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific ESLint rules to check",
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "lint":
            return await this.handleLint(args);
          case "lint-check":
            return await this.handleLintCheck(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleLint(args: any) {
    const files = args.files || [];
    const fix = args.fix || false;
    const strict = args.strict || false;

    await frameworkLogger.log(
      "lint.server",
      "-mcp-running-lint-files-files-length-fix-strict-",
      "info",
      { message: "🔍 MCP: Running lint:", files: files.length, fix, strict },
    );

    const lintResults = {
      success: true,
      issues: {
        errors: 0,
        warnings: 0,
        fixed: 0,
      },
      files: [] as string[],
      summary: "",
      details: [] as string[],
    };

    try {
      const eslintResults = await this.runEslint(files, fix, strict);

      lintResults.issues = eslintResults.issues;
      lintResults.files = eslintResults.files;
      lintResults.details = eslintResults.details;
      lintResults.success = eslintResults.success;

      // Generate summary
      lintResults.summary = this.generateLintSummary(lintResults);
    } catch (error) {
      frameworkLogger.log("mcps/lint", "lint", "error", { error: String(error) });
      lintResults.success = false;
      lintResults.details.push(
        `Lint failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const response = `🔍 StrRay Lint Results

${lintResults.summary}

**Files Checked:** ${lintResults.files.length}
**Errors:** ${lintResults.issues.errors}
**Warnings:** ${lintResults.issues.warnings}
**Auto-fixed:** ${lintResults.issues.fixed}

**Issues Found:**
${lintResults.details.length > 0 ? lintResults.details.map((d) => `• ${d}`).join("\n") : "None"}

**Status:** ${lintResults.success ? "✅ LINTING PASSED" : "❌ LINTING ISSUES DETECTED"}`;

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handleLintCheck(args: any) {
    const files = args.files || [];
    const rules = args.rules || [];

    await frameworkLogger.log(
      "lint.server",
      "-mcp-checking-lint-for-files-files-length",
      "info",
      { message: "🔍 MCP: Checking lint for files:", fileCount: files.length },
    );

    try {
      const checkResults = await this.checkLintRules(files, rules);

      return {
        content: [
          {
            type: "text",
            text: `🔍 Lint Check Results

**Files Checked:** ${files.length}
**Rules Validated:** ${rules.length > 0 ? rules.length : "All"}
**Compliant:** ${checkResults.compliant}
**Violations:** ${checkResults.violations}

**Details:**
${checkResults.details.map((d) => `• ${d}`).join("\n")}

**Status:** ${checkResults.violations === 0 ? "✅ COMPLIANT" : "❌ VIOLATIONS DETECTED"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Lint check failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async runEslint(files: string[], fix: boolean, strict: boolean) {
    const results = {
      success: true,
      issues: { errors: 0, warnings: 0, fixed: 0 },
      files: [] as string[],
      details: [] as string[],
    };

    try {
      if (!fs.existsSync("package.json")) {
        results.success = false;
        results.details.push("No package.json found - cannot run ESLint");
        return results;
      }

      // Check for ESLint configuration (including ESLint 9+ flat config)
      const hasEslintConfig =
        fs.existsSync(".eslintrc.js") ||
        fs.existsSync(".eslintrc.json") ||
        fs.existsSync(".eslintrc.yml") ||
        fs.existsSync(".eslintrc.yaml") ||
        fs.existsSync("eslint.config.js") ||
        fs.existsSync("eslint.config.mjs") ||
        (fs.existsSync("package.json") &&
          JSON.parse(fs.readFileSync("package.json", "utf8")).eslintConfig);

      if (!hasEslintConfig) {
        results.success = false;
        results.details.push("No ESLint configuration found");
        return results;
      }

      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = packageJson.scripts || {};

      // Determine command and arguments (using args array to prevent command injection)
      let command: string;
      let args: string[];
      const fileArgs = files.length > 0 ? files : ["."];

      if (fix && scripts["lint:fix"]) {
        command = "npm";
        args = ["run", "lint:fix", "--", ...fileArgs];
      } else if (!fix && scripts.lint) {
        command = "npm";
        args = ["run", "lint", "--", ...fileArgs];
      } else {
        command = "npx";
        args = ["eslint", ...fileArgs, "--format", "json"];
      }

      if (strict) {
        args.push("--max-warnings", "0");
      }

      const execOptions = {
        encoding: "utf8" as const,
        cwd: process.cwd(),
        stdio: "pipe" as const,
        timeout: 30000,
      };

      try {
        const output = execFileSync(command, args, execOptions);

        // Parse ESLint output
        results.files = files.length > 0 ? files : ["All files"];

        // Parse ESLint JSON output for accurate counts
        let errorCount = 0;
        let warningCount = 0;

        try {
          const jsonResults = JSON.parse(output);
          if (Array.isArray(jsonResults)) {
            for (const fileResult of jsonResults) {
              errorCount += fileResult.errorCount || 0;
              warningCount += fileResult.warningCount || 0;
            }
          }
        } catch {
          // JSON parse failed — fall back to regex-based parsing
          const errorMatches = output.match(/(\d+)\s+errors?/);
          const warningMatches = output.match(/(\d+)\s+warnings?/);
          if (errorMatches?.[1]) errorCount = parseInt(errorMatches[1]);
          if (warningMatches?.[1]) warningCount = parseInt(warningMatches[1]);
        }

        results.issues.errors = errorCount;
        results.issues.warnings = warningCount;
        results.issues.fixed = fix ? Math.max(0, errorCount + warningCount) : 0;

        if (results.issues.errors > 0) {
          results.success = false;
          results.details.push(`${results.issues.errors} ESLint errors found`);
        }

        if (results.issues.warnings > 0 && strict) {
          results.success = false;
          results.details.push(
            `${results.issues.warnings} ESLint warnings found (strict mode)`,
          );
        }

        if (results.issues.errors === 0 && results.issues.warnings === 0) {
          results.details.push("No ESLint issues found");
        }
      } catch (error) {
        const errorOutput =
          error instanceof Error
            ? ((error as any).stdout?.toString() || (error as any).stderr?.toString() || error.message)
            : String(error);
        results.success = false;

        // Try JSON parsing of error output first for accurate counts
        let parsedJson = false;
        try {
          const jsonResults = JSON.parse(errorOutput);
          if (Array.isArray(jsonResults)) {
            for (const fileResult of jsonResults) {
              results.issues.errors += fileResult.errorCount || 0;
              results.issues.warnings += fileResult.warningCount || 0;
            }
            parsedJson = true;
          }
        } catch {
          // Fall back to regex
        }

        if (!parsedJson) {
          const errorMatches = errorOutput.match(/(\d+)\s+errors?/);
          const warningMatches = errorOutput.match(/(\d+)\s+warnings?/);
          if (errorMatches) results.issues.errors = parseInt(errorMatches[1]);
          if (warningMatches) results.issues.warnings = parseInt(warningMatches[1]);
        }

        results.details.push(
          `ESLint found ${results.issues.errors} errors, ${results.issues.warnings} warnings`,
        );
      }
    } catch (error) {
      results.success = false;
      results.details.push(
        `ESLint setup error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async checkLintRules(files: string[], rules: string[]) {
    const results = {
      compliant: 0,
      violations: 0,
      details: [] as string[],
    };

    try {
      if (rules.length === 0) {
        // General compliance check
        const generalResults = await this.runEslint(files, false, false);
        results.violations =
          generalResults.issues.errors + generalResults.issues.warnings;
        results.compliant = generalResults.success
          ? files.length
          : Math.max(0, files.length - results.violations);
        results.details.push(
          `General compliance: ${results.violations === 0 ? "PASS" : "FAIL"}`,
        );
      } else {
        // Check specific rules (using args array to prevent command injection)
        const fileArgs = files.length > 0 ? files : ["."];
        for (const rule of rules) {
          try {
            execFileSync(
              "npx",
              ["eslint", ...fileArgs, "--rule", `${rule}:error`, "--format", "json"],
              {
                encoding: "utf8",
                cwd: process.cwd(),
                stdio: "pipe",
                timeout: 30000,
              },
            );

            results.compliant++;
            results.details.push(`Rule ${rule}: PASS`);
          } catch (error) {
            results.violations++;
            const errorOutput =
              error instanceof Error
                ? ((error as any).stdout?.toString() || error.message)
                : String(error);
            results.details.push(
              `Rule ${rule}: FAIL - ${errorOutput.substring(0, 200)}`,
            );
          }
        }
      }
    } catch (error) {
      results.details.push(
        `Lint rule check error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private generateLintSummary(results: any): string {
    const totalIssues = results.issues.errors + results.issues.warnings;
    const status = results.success ? "PASSED" : "ISSUES DETECTED";

    return `**Linting Summary:** ${status}
- Files: ${results.files.length}
- Errors: ${results.issues.errors}
- Warnings: ${results.issues.warnings}
- Fixed: ${results.issues.fixed}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    await frameworkLogger.log(
      "lint.server",
      "-strray-lint-mcp-server-started-",
      "info",
      { message: "StrRay Lint MCP Server started" },
    );
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayLintServer();
  server.run().catch((error) => frameworkLogger.log("mcps/lint", "run", "error", { error: String(error) }));
}

export { StrRayLintServer };
