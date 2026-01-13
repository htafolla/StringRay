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
import { execSync } from "child_process";
import fs from "fs";
class StrRayLintServer {
  server;
  constructor() {
    this.server = new Server({
      name: "strray-lint",
      version: "1.0.0",
    });
    this.setupToolHandlers();
    console.log("StrRay Lint MCP Server initialized");
  }
  setupToolHandlers() {
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
      switch (name) {
        case "lint":
          return await this.handleLint(args);
        case "lint-check":
          return await this.handleLintCheck(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }
  async handleLint(args) {
    const files = args.files || [];
    const fix = args.fix || false;
    const strict = args.strict || false;
    console.log("🔍 MCP: Running lint:", { files: files.length, fix, strict });
    const lintResults = {
      success: true,
      issues: {
        errors: 0,
        warnings: 0,
        fixed: 0,
      },
      files: [],
      summary: "",
      details: [],
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
      console.error("Lint error:", error);
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
  async handleLintCheck(args) {
    const files = args.files || [];
    const rules = args.rules || [];
    console.log("🔍 MCP: Checking lint for files:", files.length);
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
  async runEslint(files, fix, strict) {
    const results = {
      success: true,
      issues: { errors: 0, warnings: 0, fixed: 0 },
      files: [],
      details: [],
    };
    try {
      if (!fs.existsSync("package.json")) {
        results.success = false;
        results.details.push("No package.json found - cannot run ESLint");
        return results;
      }
      // Check for ESLint configuration
      const hasEslintConfig =
        fs.existsSync(".eslintrc.js") ||
        fs.existsSync(".eslintrc.json") ||
        fs.existsSync(".eslintrc.yml") ||
        fs.existsSync(".eslintrc.yaml") ||
        (fs.existsSync("package.json") &&
          JSON.parse(fs.readFileSync("package.json", "utf8")).eslintConfig);
      if (!hasEslintConfig) {
        results.success = false;
        results.details.push("No ESLint configuration found");
        return results;
      }
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = packageJson.scripts || {};
      // Determine which script to run
      let scriptCommand = "npx eslint";
      if (fix && scripts["lint:fix"]) {
        scriptCommand = "npm run lint:fix";
      } else if (!fix && scripts.lint) {
        scriptCommand = "npm run lint";
      }
      // Add file arguments if specified
      if (files.length > 0) {
        scriptCommand += ` ${files.join(" ")}`;
      } else {
        scriptCommand += " .";
      }
      // Add strict flag if requested
      if (strict) {
        scriptCommand += " --max-warnings 0";
      }
      try {
        const output = execSync(scriptCommand, {
          encoding: "utf8",
          cwd: process.cwd(),
          stdio: "pipe",
        });
        // Parse ESLint output
        const lines = output.split("\n").filter((line) => line.trim());
        results.files = files.length > 0 ? files : ["All files"];
        // Count issues from output
        let errorCount = 0;
        let warningCount = 0;
        for (const line of lines) {
          if (line.includes("error")) errorCount++;
          if (line.includes("warning")) warningCount++;
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
            ? error.stdout?.toString() || error.message
            : String(error);
        results.success = false;
        // Parse error output for issue counts
        const errorMatches = errorOutput.match(/(\d+) errors?/);
        const warningMatches = errorOutput.match(/(\d+) warnings?/);
        if (errorMatches) results.issues.errors = parseInt(errorMatches[1]);
        if (warningMatches)
          results.issues.warnings = parseInt(warningMatches[1]);
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
  async checkLintRules(files, rules) {
    const results = {
      compliant: 0,
      violations: 0,
      details: [],
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
        // Check specific rules
        for (const rule of rules) {
          try {
            const ruleOutput = execSync(
              `npx eslint --rule "${rule}:error" ${files.join(" ")}`,
              {
                encoding: "utf8",
                cwd: process.cwd(),
                stdio: "pipe",
              },
            );
            results.compliant++;
            results.details.push(`Rule ${rule}: PASS`);
          } catch (error) {
            results.violations++;
            results.details.push(
              `Rule ${rule}: FAIL - ${error instanceof Error ? error.message : String(error)}`,
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
  generateLintSummary(results) {
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
    console.log("StrRay Lint MCP Server started");
  }
}
// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayLintServer();
  server.run().catch(console.error);
}
export { StrRayLintServer };
//# sourceMappingURL=lint.server.js.map
