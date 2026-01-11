/**
 * StrRay Security Scan MCP Server
 *
 * Automated security vulnerability scanning with dependency and code analysis
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

class StrRaySecurityScanServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: "strray-security-scan",
      version: "1.0.0",
    });

    this.setupToolHandlers();
    console.log("StrRay Security Scan MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "security-scan",
            description:
              "Comprehensive security vulnerability scanning with dependency and code analysis",
            inputSchema: {
              type: "object",
              properties: {
                scope: {
                  type: "string",
                  enum: ["dependencies", "code", "full"],
                  default: "full",
                  description: "Scope of security scan",
                },
                auditLevel: {
                  type: "string",
                  enum: ["info", "low", "moderate", "high", "critical"],
                  default: "moderate",
                  description: "Audit level for vulnerability detection",
                },
                includeOutdated: {
                  type: "boolean",
                  default: true,
                  description: "Include outdated package analysis",
                },
              },
            },
          },
          {
            name: "dependency-audit",
            description:
              "Audit third-party dependencies for security vulnerabilities",
            inputSchema: {
              type: "object",
              properties: {
                packageManager: {
                  type: "string",
                  enum: ["npm", "yarn", "pnpm", "auto"],
                  default: "auto",
                  description: "Package manager to use",
                },
                auditLevel: {
                  type: "string",
                  enum: ["info", "low", "moderate", "high", "critical"],
                  default: "moderate",
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
        case "security-scan":
          return await this.handleSecurityScan(args);
        case "dependency-audit":
          return await this.handleDependencyAudit(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleSecurityScan(args: any) {
    const scope = args.scope || "full";
    const auditLevel = args.auditLevel || "moderate";
    const includeOutdated = args.includeOutdated !== false;

    console.log("🔒 MCP: Performing security scan:", {
      scope,
      auditLevel,
      includeOutdated,
    });

    const results = {
      secure: true,
      vulnerabilities: [] as string[],
      threats: [] as string[],
      recommendations: [] as string[],
      summary: "",
    };

    try {
      // 1. Dependency Vulnerability Scanning
      if (scope === "dependencies" || scope === "full") {
        const depResults = await this.scanDependencies(
          auditLevel,
          includeOutdated,
        );
        results.vulnerabilities.push(...depResults.vulnerabilities);
        results.recommendations.push(...depResults.recommendations);
        if (!depResults.secure) results.secure = false;
      }

      // 2. Code Security Analysis
      if (scope === "code" || scope === "full") {
        const codeResults = await this.scanCodeSecurity();
        results.vulnerabilities.push(...codeResults.vulnerabilities);
        results.threats.push(...codeResults.threats);
        results.recommendations.push(...codeResults.recommendations);
        if (!codeResults.secure) results.secure = false;
      }

      // Generate summary
      results.summary = this.generateSecuritySummary(results);
    } catch (error) {
      console.error("Security scan error:", error);
      results.secure = false;
      results.vulnerabilities.push(
        `Scan error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `🔒 StrRay Security Scan Results

${results.summary}

**Vulnerabilities Found:** ${results.vulnerabilities.length}
${results.vulnerabilities.map((v) => `• ${v}`).join("\n")}

**Threats Detected:** ${results.threats.length}
${results.threats.map((t) => `• ${t}`).join("\n")}

**Recommendations:**
${results.recommendations.map((r) => `• ${r}`).join("\n")}

**Overall Status:** ${results.secure ? "✅ SECURE" : "❌ VULNERABILITIES DETECTED"}`,
        },
      ],
    };
  }

  private async handleDependencyAudit(args: any) {
    const packageManager = args.packageManager || "auto";
    const auditLevel = args.auditLevel || "moderate";

    console.log("📦 MCP: Performing dependency audit:", {
      packageManager,
      auditLevel,
    });

    try {
      const results = await this.scanDependencies(auditLevel, true);

      return {
        content: [
          {
            type: "text",
            text: `📦 Dependency Audit Results

**Status:** ${results.secure ? "✅ SECURE" : "❌ ISSUES FOUND"}

**Vulnerabilities:** ${results.vulnerabilities.length}
${results.vulnerabilities.map((v) => `• ${v}`).join("\n") || "None detected"}

**Recommendations:**
${results.recommendations.map((r) => `• ${r}`).join("\n") || "No recommendations"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Dependency audit failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async scanDependencies(auditLevel: string, includeOutdated: boolean) {
    const results = {
      secure: true,
      vulnerabilities: [] as string[],
      recommendations: [] as string[],
    };

    try {
      // Check for npm
      if (fs.existsSync("package.json")) {
        // Run npm audit
        try {
          const auditOutput = execSync(
            `npm audit --audit-level=${auditLevel} --json`,
            { encoding: "utf8" },
          );
          const auditData = JSON.parse(auditOutput);

          if (
            auditData.vulnerabilities &&
            Object.keys(auditData.vulnerabilities).length > 0
          ) {
            results.secure = false;
            results.vulnerabilities.push(
              `${Object.keys(auditData.vulnerabilities).length} npm vulnerabilities found`,
            );
            results.recommendations.push(
              'Run "npm audit fix" to address vulnerabilities',
            );
          }
        } catch (error) {
          // npm audit returns non-zero exit code when vulnerabilities found
          const errorOutput =
            error instanceof Error ? error.message : String(error);
          if (errorOutput.includes("vulnerabilities")) {
            results.secure = false;
            results.vulnerabilities.push("NPM audit detected vulnerabilities");
            results.recommendations.push(
              'Run "npm audit" for details and "npm audit fix" to resolve',
            );
          }
        }

        // Check for outdated packages
        if (includeOutdated) {
          try {
            const outdatedOutput = execSync("npm outdated --json", {
              encoding: "utf8",
            });
            const outdatedData = JSON.parse(outdatedOutput);

            const outdatedCount = Object.keys(outdatedData).length;
            if (outdatedCount > 0) {
              results.recommendations.push(
                `${outdatedCount} packages are outdated - consider updating`,
              );
              if (outdatedCount > 5) {
                results.vulnerabilities.push(
                  "Many packages significantly outdated",
                );
              }
            }
          } catch (error) {
            // npm outdated might fail if no outdated packages
          }
        }
      } else {
        results.recommendations.push(
          "No package.json found - not a Node.js project",
        );
      }
    } catch (error) {
      results.vulnerabilities.push(
        `Dependency scan error: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.secure = false;
    }

    return results;
  }

  private async scanCodeSecurity() {
    const results = {
      secure: true,
      vulnerabilities: [] as string[],
      threats: [] as string[],
      recommendations: [] as string[],
    };

    try {
      // Check for common security issues in code
      const files = this.findCodeFiles();

      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");

        // Check for common security patterns
        const issues = this.analyzeFileForSecurity(content, file);
        results.vulnerabilities.push(...issues.vulnerabilities);
        results.threats.push(...issues.threats);
        results.recommendations.push(...issues.recommendations);

        if (issues.vulnerabilities.length > 0 || issues.threats.length > 0) {
          results.secure = false;
        }
      }

      if (
        results.vulnerabilities.length === 0 &&
        results.threats.length === 0
      ) {
        results.recommendations.push(
          "No obvious security issues detected in code",
        );
      }
    } catch (error) {
      results.secure = false;
      results.vulnerabilities.push(
        `Code security scan error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private findCodeFiles(): string[] {
    const extensions = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
    ];
    const files: string[] = [];

    function scanDir(dir: string) {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (
            stat.isDirectory() &&
            !item.startsWith(".") &&
            item !== "node_modules"
          ) {
            scanDir(fullPath);
          } else if (
            stat.isFile() &&
            extensions.some((ext) => item.endsWith(ext))
          ) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    scanDir(".");
    return files.slice(0, 50); // Limit to first 50 files for performance
  }

  private analyzeFileForSecurity(content: string, filePath: string) {
    const issues = {
      vulnerabilities: [] as string[],
      threats: [] as string[],
      recommendations: [] as string[],
    };

    // Common security patterns to check
    const patterns = [
      {
        regex: /password\s*=\s*["'][^"']*["']/gi,
        type: "vulnerability",
        message: "Hardcoded password detected",
      },
      {
        regex: /api[_-]?key\s*=\s*["'][^"']*["']/gi,
        type: "vulnerability",
        message: "Hardcoded API key detected",
      },
      {
        regex: /secret\s*=\s*["'][^"']*["']/gi,
        type: "vulnerability",
        message: "Hardcoded secret detected",
      },
      {
        regex: /eval\s*\(/g,
        type: "threat",
        message: "Use of eval() detected",
      },
      {
        regex: /innerHTML\s*=/g,
        type: "threat",
        message: "Direct innerHTML assignment detected",
      },
      {
        regex: /document\.write\s*\(/g,
        type: "threat",
        message: "Use of document.write detected",
      },
      {
        regex: /console\.log\s*\(/g,
        type: "info",
        message: "Console logging in production code",
      },
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        const message = `${pattern.message} in ${filePath} (${matches.length} instances)`;

        if (pattern.type === "vulnerability") {
          issues.vulnerabilities.push(message);
        } else if (pattern.type === "threat") {
          issues.threats.push(message);
        }

        if (pattern.type !== "info") {
          issues.recommendations.push(
            `Review and fix ${pattern.message.toLowerCase()} in ${filePath}`,
          );
        }
      }
    }

    return issues;
  }

  private generateSecuritySummary(results: any): string {
    const status = results.secure ? "✅ SECURE" : "❌ VULNERABILITIES DETECTED";
    const vulnCount = results.vulnerabilities.length;
    const threatCount = results.threats.length;
    const recCount = results.recommendations.length;

    return `**Security Scan Summary:** ${status}
- Vulnerabilities: ${vulnCount}
- Threats: ${threatCount}
- Recommendations: ${recCount}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Security Scan MCP Server started");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRaySecurityScanServer();
  server.run().catch(console.error);
}

export { StrRaySecurityScanServer };
