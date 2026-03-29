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
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  detectProjectLanguage,
  LANGUAGE_CONFIGS,
} from "../utils/language-detector.js";
import { frameworkLogger } from "../core/framework-logger.js";

class StrRaySecurityScanServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "security-scan", version: "1.15.18",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    frameworkLogger.log("mcps/security-scan", "initialize", "info");
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

      try {
        switch (name) {
          case "security-scan":
            return await this.handleSecurityScan(args);
          case "dependency-audit":
            return await this.handleDependencyAudit(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        frameworkLogger.log("mcps/security-scan", "tool-handler", "error", { tool: name, error: String(error) });
        return {
          content: [
            {
              type: "text",
              text: `Error executing tool "${name}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleSecurityScan(args: any) {
    const scope = args.scope || "full";
    const auditLevel = args.auditLevel || "moderate";
    const includeOutdated = args.includeOutdated !== false;

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
          "npm",
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
      frameworkLogger.log("mcps/security-scan", "scan", "error", { error: String(error) });
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

    try {
      const detectedPm = this.detectPackageManager(packageManager);
      const results = await this.scanDependencies(auditLevel, true, detectedPm);

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

  private detectPackageManager(requested: string): string {
    if (requested !== "auto") return requested;

    if (fs.existsSync("pnpm-lock.yaml")) return "pnpm";
    if (fs.existsSync("yarn.lock")) return "yarn";
    if (fs.existsSync("package-lock.json")) return "npm";
    return "npm";
  }

  private async scanDependencies(auditLevel: string, includeOutdated: boolean, packageManager: string) {
    const ALLOWED_AUDIT_LEVELS = ["info", "low", "moderate", "high", "critical"];
    const results = {
      secure: true,
      vulnerabilities: [] as string[],
      recommendations: [] as string[],
    };

    // Validate auditLevel to prevent command injection
    const safeAuditLevel = ALLOWED_AUDIT_LEVELS.includes(auditLevel) ? auditLevel : "moderate";

    try {
      // Check for package.json
      if (!fs.existsSync("package.json")) {
        results.recommendations.push(
          "No package.json found - not a Node.js project",
        );
        return results;
      }

      // Run audit using detected/explicit package manager
      const pmCmd = packageManager === "yarn" ? "yarn" : packageManager === "pnpm" ? "pnpm" : "npm";

      try {
        const auditArgs =
          packageManager === "yarn"
            ? ["audit", "--level", safeAuditLevel, "--json"]
            : ["audit", "--audit-level", safeAuditLevel, "--json"];

        const auditOutput = execFileSync(pmCmd, auditArgs, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const auditData = JSON.parse(auditOutput);

        if (
          auditData.vulnerabilities &&
          Object.keys(auditData.vulnerabilities).length > 0
        ) {
          results.secure = false;
          results.vulnerabilities.push(
            `${Object.keys(auditData.vulnerabilities).length} ${pmCmd} vulnerabilities found`,
          );
          results.recommendations.push(
            `Run "${pmCmd} audit fix" to address vulnerabilities`,
          );
        }
      } catch (error: any) {
        // npm/yarn/pnpm audit returns non-zero exit code when vulnerabilities found
        // The JSON output is in error.stdout
        let auditData: any = null;
        if (error && error.stdout) {
          try {
            auditData = JSON.parse(error.stdout);
          } catch {
            // stdout was not valid JSON, fall through
          }
        }

        if (
          auditData &&
          auditData.vulnerabilities &&
          Object.keys(auditData.vulnerabilities).length > 0
        ) {
          results.secure = false;
          const vulnCount = Object.keys(auditData.vulnerabilities).length;
          const vulnEntries = Object.entries(auditData.vulnerabilities)
            .filter(([, info]: [string, any]) => info && info.severity !== undefined)
            .map(([name, info]: [string, any]) => `  - ${name} (${info.severity}): ${info.via?.[0]?.title || "unknown"}`);
          results.vulnerabilities.push(
            `${vulnCount} ${pmCmd} vulnerabilities found:\n${vulnEntries.join("\n")}`,
          );
          results.recommendations.push(
            `Run "${pmCmd} audit fix" to resolve vulnerabilities`,
          );
        } else {
          // Non-JSON parseable error; log it but don't mark as insecure
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes("vulnerabilities") || errorMsg.includes("ELIFECYCLE")) {
            results.secure = false;
            results.vulnerabilities.push(`${pmCmd} audit detected vulnerabilities`);
            results.recommendations.push(
              `Run "${pmCmd} audit" for details and "${pmCmd} audit fix" to resolve`,
            );
          }
        }
      }

      // Check for outdated packages
      if (includeOutdated) {
        try {
          const outdatedOutput = execFileSync(pmCmd, ["outdated", "--json"], {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
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
          // npm/yarn/pnpm outdated may return non-zero if packages are outdated or none found
          // Try to parse stdout for structured data
          let outdatedData: any = null;
          if (error && typeof error === "object" && "stdout" in error && error.stdout) {
            try {
              outdatedData = JSON.parse((error as any).stdout);
            } catch {
              // not valid JSON, ignore
            }
          }
          if (outdatedData && Object.keys(outdatedData).length > 0) {
            const outdatedCount = Object.keys(outdatedData).length;
            results.recommendations.push(
              `${outdatedCount} packages are outdated - consider updating`,
            );
            if (outdatedCount > 5) {
              results.vulnerabilities.push(
                "Many packages significantly outdated",
              );
            }
          }
          // else: no outdated packages or can't determine, skip silently
        }
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

  private findCodeFiles(maxDepth: number = 10): string[] {
    // Use language detector to find supported extensions
    const projectRoot = process.cwd();
    const projectLanguage = detectProjectLanguage(projectRoot);
    const langConfig = projectLanguage
      ? LANGUAGE_CONFIGS.find(
          (c: any) => c.language === projectLanguage.language,
        )
      : null;
    const extensions = langConfig?.extensions || [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".go",
      ".rs",
      ".cs",
      ".rb",
      ".php",
      ".swift",
      ".kt",
    ];
    const files: string[] = [];

    function scanDir(dir: string, currentDepth: number) {
      if (currentDepth > maxDepth) return;

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
            scanDir(fullPath, currentDepth + 1);
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

    scanDir(".", 0);
    return files.slice(0, 50); // Limit to first 50 files for performance
  }

  private analyzeFileForSecurity(content: string, filePath: string) {
    const issues = {
      vulnerabilities: [] as string[],
      threats: [] as string[],
      recommendations: [] as string[],
    };

    // Skip test files to reduce false positives
    const normalizedPath = filePath.replace(/\\/g, "/");
    if (
      /(__tests__|__mocks__|\.test\.|\.spec\.|_test\.|_spec\.|tests?\/|specs?\/|\.stories\.)/i.test(
        normalizedPath,
      ) ||
      /\/test[^/]*\//i.test(normalizedPath)
    ) {
      return issues;
    }

    // Filter out comment lines before scanning
    const nonCommentLines = content.split("\n").filter((line) => {
      const trimmed = line.trim();
      // Skip single-line comments
      if (/^\s*(\/\/|#|\/\/\/|--|\/\*|\*)/.test(trimmed)) return false;
      return true;
    });
    const filteredContent = nonCommentLines.join("\n");

    // Common security patterns to check
    const patterns = [
      {
        regex: /password\s*=\s*["'](?!\s*["'])[^"']*["']/gi,
        exclude: /password\s*=\s*["']\s*["']/gi, // empty string assignments
        type: "vulnerability",
        message: "Hardcoded password detected",
      },
      {
        regex: /api[_-]?key\s*=\s*["'](?!\s*["'])[^"']*["']/gi,
        exclude: /api[_-]?key\s*=\s*["']\s*["']/gi,
        type: "vulnerability",
        message: "Hardcoded API key detected",
      },
      {
        regex: /secret\s*=\s*["'](?!\s*["'])[^"']*["']/gi,
        exclude: /secret\s*=\s*["']\s*["']/gi,
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
      // For patterns with exclude rules, check both
      if (pattern.exclude && pattern.exclude.test(filteredContent)) {
        // Remove matches that are empty string assignments
        const allMatches = Array.from(filteredContent.matchAll(pattern.regex));
        const excludeMatches = Array.from(filteredContent.matchAll(pattern.exclude));
        // Filter: only keep matches where the matched string is NOT an empty assignment
        const excludePositions = new Set(
          excludeMatches.map((m) => m.index),
        );
        const validMatches = allMatches.filter(
          (m) => !excludePositions.has(m.index),
        );
        if (validMatches.length > 0) {
          const message = `${pattern.message} in ${filePath} (${validMatches.length} instances)`;
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
      } else {
        const matches = filteredContent.match(pattern.regex);
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
    frameworkLogger.log("mcps/security-scan", "start", "info");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRaySecurityScanServer();
  server.run().catch((error) => frameworkLogger.log("mcps/security-scan", "run", "error", { error: String(error) }));
}

export { StrRaySecurityScanServer };
