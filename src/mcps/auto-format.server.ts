/**
 * StrRay Auto Format MCP Server
 *
 * Automated code formatting hook with Prettier and framework-specific formatters
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { frameworkLogger } from "../core/framework-logger.js";

class StrRayAutoFormatServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "auto-format", version: "1.15.11",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    frameworkLogger.log("mcps/auto-format", "initialize", "info");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "auto-format",
            description:
              "Automated code formatting hook with Prettier and framework-specific formatters",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific files to format (optional - formats all if empty)",
                },
                formatters: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["prettier", "eslint", "typescript", "all"],
                  },
                  default: ["all"],
                  description: "Formatters to apply",
                },
                checkOnly: {
                  type: "boolean",
                  default: false,
                  description: "Only check formatting without applying changes",
                },
              },
            },
          },
          {
            name: "format-check",
            description:
              "Check if code is properly formatted without making changes",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files to check formatting for",
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case "auto-format":
              return await this.handleAutoFormat(args);
            case "format-check":
              return await this.handleFormatCheck(args);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          frameworkLogger.log("mcps/auto-format", "tool-call", "error", {
            tool: name,
            error: String(error),
          });
          return {
            content: [
              {
                type: "text",
                text: `Error executing tool '${name}': ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  private async handleAutoFormat(args: any) {
    const files = args.files || [];
    const formatters = args.formatters || ["all"];
    const checkOnly = args.checkOnly || false;

    frameworkLogger.log("mcps/auto-format", "format", "info", {
      files: files.length,
      formatters,
      checkOnly,
    });

    const formatResults = {
      success: true,
      formattedFiles: [] as string[],
      errors: [] as string[],
      summary: "",
      changes: {} as Record<string, string[]>,
    };

    try {
      // Determine which formatters to run
      const runPrettier =
        formatters.includes("all") || formatters.includes("prettier");
      const runEslint =
        formatters.includes("all") || formatters.includes("eslint");
      const runTypescript =
        formatters.includes("all") || formatters.includes("typescript");

      // Run Prettier formatting
      if (runPrettier) {
        const prettierResults = await this.runPrettier(files, checkOnly);
        formatResults.formattedFiles.push(...prettierResults.formatted);
        if (prettierResults.errors.length > 0) {
          formatResults.errors.push(...prettierResults.errors);
        }
        formatResults.changes.prettier = prettierResults.formatted;
      }

      // Run ESLint auto-fix
      if (runEslint && !checkOnly) {
        const eslintResults = await this.runEslintFix(files);
        formatResults.formattedFiles.push(...eslintResults.formatted);
        if (eslintResults.errors.length > 0) {
          formatResults.errors.push(...eslintResults.errors);
        }
        formatResults.changes.eslint = eslintResults.formatted;
      }

      // Run TypeScript formatting/check
      if (runTypescript) {
        const tsResults = await this.runTypeScriptFormat(files, checkOnly);
        if (tsResults.errors.length > 0) {
          formatResults.errors.push(...tsResults.errors);
        }
        formatResults.changes.typescript =
          tsResults.errors.length === 0
            ? ["TypeScript compilation successful"]
            : tsResults.errors;
      }

      // Check for overall success
      formatResults.success = formatResults.errors.length === 0;

      // Generate summary
      formatResults.summary = this.generateFormatSummary(formatResults);
    } catch (error) {
      frameworkLogger.log("mcps/auto-format", "format", "error", { error: String(error) });
      formatResults.success = false;
      formatResults.errors.push(
        `Auto-format failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const response = `🎨 StrRay Auto Format Results

${formatResults.summary}

**Files Formatted:** ${formatResults.formattedFiles.length}
${formatResults.formattedFiles.length > 0 ? formatResults.formattedFiles.map((f) => `• ${f}`).join("\n") : "None"}

**Errors:** ${formatResults.errors.length}
${formatResults.errors.length > 0 ? formatResults.errors.map((e) => `• ❌ ${e}`).join("\n") : "None"}

**Formatter Results:**
${Object.entries(formatResults.changes)
  .map(
    ([formatter, results]) =>
      `• ${formatter}: ${results.length} files processed`,
  )
  .join("\n")}

**Status:** ${formatResults.success ? "✅ FORMATTING COMPLETED" : "❌ FORMATTING ISSUES DETECTED"}`;

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handleFormatCheck(args: any) {
    const files = args.files || [];

    frameworkLogger.log("mcps/auto-format", "check", "info", { files: files.length });

    try {
      const checkResults = await this.checkFormatting(files);

      return {
        content: [
          {
            type: "text",
            text: `🔍 Format Check Results

**Files Checked:** ${files.length}
**Properly Formatted:** ${checkResults.formatted}
**Needs Formatting:** ${checkResults.needsFormatting}

**Details:**
${checkResults.details.map((d) => `• ${d}`).join("\n")}

**Status:** ${checkResults.needsFormatting === 0 ? "✅ ALL FILES FORMATTED" : "⚠️ FORMATTING ISSUES DETECTED"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Format check failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async runPrettier(files: string[], checkOnly: boolean) {
    const results = {
      formatted: [] as string[],
      errors: [] as string[],
    };

    try {
      // Determine file patterns
      const patterns =
        files.length > 0 ? files : ["**/*.{js,jsx,ts,tsx,json,css,scss,md}"];

      // Run prettier
      const prettierArgs = checkOnly
        ? ["prettier", "--check", ...patterns, "--ignore-path", ".gitignore"]
        : ["prettier", "--write", ...patterns, "--ignore-path", ".gitignore"];

      try {
        const output = execFileSync("npx", prettierArgs, {
          encoding: "utf8",
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 30000,
        }) as string;

        if (checkOnly) {
          // Parse check output to see what needs formatting
          const lines = output
            .split("\n")
            .filter((line: string) => line.trim());
          results.formatted = lines.filter(
            (line) => !line.includes("error") && !line.includes("Error"),
          );
        } else {
          // Parse write output to get actual file names
          const lines = output
            .split("\n")
            .filter((line: string) => line.trim());
          results.formatted = lines;
        }
      } catch (error) {
        const errorOutput =
          error instanceof Error
            ? (error as any).stdout?.toString() || error.message
            : String(error);
        if (checkOnly && errorOutput.includes("error")) {
          // Some files need formatting
          results.errors.push("Some files need formatting");
        } else {
          results.errors.push(`Prettier error: ${errorOutput}`);
        }
      }
    } catch (error) {
      results.errors.push(
        `Prettier setup error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async runEslintFix(files: string[]) {
    const results = {
      formatted: [] as string[],
      errors: [] as string[],
    };

    try {
      if (!fs.existsSync("package.json")) {
        results.errors.push("No package.json found - cannot run ESLint");
        return results;
      }

      // Check if ESLint script exists
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = packageJson.scripts || {};

      if (!scripts["lint:fix"] && !scripts.lint) {
        results.errors.push("No ESLint scripts found in package.json");
        return results;
      }

      const scriptName = scripts["lint:fix"] ? "lint:fix" : "lint";

      try {
        execFileSync("npm", ["run", scriptName], {
          encoding: "utf8",
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 30000,
        });

        results.formatted.push("ESLint auto-fix applied to applicable files");
      } catch (error) {
        const errorOutput =
          error instanceof Error
            ? (error as any).stdout?.toString() || error.message
            : String(error);
        results.errors.push(`ESLint error: ${errorOutput}`);
      }
    } catch (error) {
      results.errors.push(
        `ESLint setup error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async runTypeScriptFormat(files: string[], checkOnly: boolean) {
    const results = {
      formatted: [] as string[],
      errors: [] as string[],
    };

    try {
      if (!fs.existsSync("package.json")) {
        results.errors.push("No package.json found - cannot check TypeScript");
        return results;
      }

      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = packageJson.scripts || {};

      if (!scripts.typecheck && !scripts["type-check"]) {
        results.errors.push("No TypeScript check scripts found");
        return results;
      }

      const scriptName = scripts.typecheck ? "typecheck" : "type-check";

      try {
        execFileSync("npm", ["run", scriptName], {
          encoding: "utf8",
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 30000,
        });

        results.formatted.push("TypeScript compilation successful");
      } catch (error) {
        const errorOutput =
          error instanceof Error
            ? (error as any).stdout?.toString() || error.message
            : String(error);
        results.errors.push(
          `TypeScript compilation errors: ${errorOutput.split("\n").slice(0, 3).join("; ")}`,
        );
      }
    } catch (error) {
      results.errors.push(
        `TypeScript check error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async checkFormatting(files: string[]) {
    const results = {
      formatted: 0,
      needsFormatting: 0,
      details: [] as string[],
    };

    try {
      // Use prettier check
      const patterns =
        files.length > 0 ? files : ["**/*.{js,jsx,ts,tsx,json,css,scss,md}"];

      try {
        execFileSync(
          "npx",
          ["prettier", "--check", ...patterns, "--ignore-path", ".gitignore"],
          {
            encoding: "utf8",
            cwd: process.cwd(),
            stdio: "pipe",
            timeout: 30000,
          },
        );

        results.formatted = files.length > 0 ? files.length : patterns.length;
        results.details.push("All checked files are properly formatted");
      } catch (error) {
        const errorOutput =
          error instanceof Error
            ? (error as any).stdout?.toString() || error.message
            : String(error);

        // Parse which files need formatting
        const lines = errorOutput
          .split("\n")
          .filter((line: string) => line.trim());
        const filesNeedingFormat = lines.filter(
          (line: string) =>
            !line.includes("error") &&
            !line.includes("Error") &&
            !line.includes("[") &&
            line.includes("."),
        );

        results.needsFormatting = filesNeedingFormat.length;
        results.formatted = Math.max(
          0,
          (files.length > 0 ? files.length : patterns.length) -
            results.needsFormatting,
        );

        results.details.push(
          `${results.needsFormatting} files need formatting`,
        );
        if (filesNeedingFormat.length > 0) {
          results.details.push(
            `Files: ${filesNeedingFormat.slice(0, 5).join(", ")}${filesNeedingFormat.length > 5 ? "..." : ""}`,
          );
        }
      }
    } catch (error) {
      results.details.push(
        `Format check error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private generateFormatSummary(results: any): string {
    const totalFiles = results.formattedFiles.length;
    const errorCount = results.errors.length;
    const status = results.success ? "COMPLETED" : "ISSUES DETECTED";

    return `**Formatting Summary:** ${status}
- Files Processed: ${totalFiles}
- Errors: ${errorCount}
- Formatters Applied: ${Object.keys(results.changes).length}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    frameworkLogger.log("mcps/auto-format", "start", "info");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayAutoFormatServer();
  server.run().catch((error) => frameworkLogger.log("mcps/auto-format", "run", "error", { error: String(error) }));
}

export { StrRayAutoFormatServer };
