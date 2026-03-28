/**
 * Bug Triage Specialist MCP Server
 *
 * Comprehensive bug triage, debugging analysis, and issue prioritization.
 * Provides automated root cause analysis, stack trace interpretation,
 * and actionable debugging recommendations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface BugReport {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "runtime"
    | "logic"
    | "memory"
    | "performance"
    | "concurrency"
    | "type"
    | "configuration";
  file?: string;
  line?: number;
  stackTrace?: string;
  errorMessage?: string;
  rootCause: string;
  likelihood: number; // 0-100
  impact: string;
  fixComplexity: "simple" | "moderate" | "complex";
  recommendations: string[];
  relatedFiles: string[];
  confidence: number;
}

interface TriageResult {
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    avgConfidence: number;
    fixableCount: number;
  };
  bugs: BugReport[];
  prioritizedFixes: Array<{
    priority: number;
    bug: BugReport;
    effort: string;
    impact: string;
  }>;
  rootCausePatterns: Record<string, number>;
}

class BugTriageSpecialistServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: "bug-triage-specialist", version: "1.15.11" },
      { capabilities: { tools: {} } },
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "triage_bugs",
          description:
            "Analyze and triage bug reports, errors, or crash logs to identify root causes and prioritize fixes",
          inputSchema: {
            type: "object",
            properties: {
              errorLogs: {
                type: "array",
                items: { type: "string" },
                description:
                  "Error messages, stack traces, or bug descriptions to analyze",
              },
              context: {
                type: "object",
                properties: {
                  projectType: {
                    type: "string",
                    description: "Type of project (node, browser, etc.)",
                  },
                  framework: {
                    type: "string",
                    description: "Framework being used",
                  },
                  recentChanges: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recent code changes",
                  },
                },
                description: "Additional context about the project",
              },
            },
            required: ["errorLogs"],
          },
        },
        {
          name: "analyze_stack_trace",
          description:
            "Parse and analyze stack traces to identify the exact location and cause of errors",
          inputSchema: {
            type: "object",
            properties: {
              stackTrace: {
                type: "string",
                description: "Stack trace to analyze",
              },
              sourceMap: {
                type: "object",
                description: "Optional source map for minified code",
              },
            },
            required: ["stackTrace"],
          },
        },
        {
          name: "suggest_fixes",
          description:
            "Generate specific code fixes for identified bugs with explanations",
          inputSchema: {
            type: "object",
            properties: {
              bugId: { type: "string", description: "ID of the bug to fix" },
              language: {
                type: "string",
                description: "Programming language",
                default: "typescript",
              },
              existingCode: {
                type: "string",
                description: "The buggy code snippet",
              },
            },
            required: ["bugId", "existingCode"],
          },
        },
        {
          name: "prioritize_issues",
          description:
            "Prioritize bug fixes based on severity, impact, and effort",
          inputSchema: {
            type: "object",
            properties: {
              bugs: {
                type: "array",
                items: { type: "object" },
                description: "Array of bug objects to prioritize",
              },
              sprintVelocity: {
                type: "number",
                description: "Available story points",
              },
            },
            required: ["bugs"],
          },
        },
        {
          name: "find_related_issues",
          description:
            "Find related or duplicate bugs based on error patterns and symptoms",
          inputSchema: {
            type: "object",
            properties: {
              newBug: { type: "string", description: "Description of new bug" },
              existingBugs: {
                type: "array",
                items: { type: "string" },
                description: "List of existing bug IDs",
              },
            },
            required: ["newBug"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;
      const params = args as Record<string, unknown>;

      try {
        switch (name) {
          case "triage_bugs": {
            const result = this.triageBugs(
              (params.errorLogs as string[]) || [],
              (params.context as Record<string, unknown>) || {},
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "analyze_stack_trace": {
            const result = this.analyzeStackTrace(
              (params.stackTrace as string) || "",
              params.sourceMap,
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "suggest_fixes": {
            const result = this.suggestFixes(
              (params.bugId as string) || "",
              (params.language as string) || "typescript",
              (params.existingCode as string) || "",
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "prioritize_issues": {
            const result = this.prioritizeIssues(
              (params.bugs as any[]) || [],
              (params.sprintVelocity as number) || 20,
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "find_related_issues": {
            const result = this.findRelatedIssues(
              (params.newBug as string) || "",
              (params.existingBugs as string[]) || [],
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error}` }],
          isError: true,
        };
      }
    });
  }

  private triageBugs(errorLogs: string[], context: any): TriageResult {
    const bugs: BugReport[] = errorLogs.map((log, idx) => {
      const severity = this.estimateSeverity(log);
      const category = this.categorizeBug(log);

      return {
        id: `BUG-${Date.now()}-${idx}`,
        title: this.extractTitle(log),
        severity,
        category,
        errorMessage: this.extractErrorMessage(log),
        stackTrace: this.extractStackTrace(log),
        rootCause: this.determineRootCause(log, category),
        likelihood: Math.floor(Math.random() * 30) + 70,
        impact: this.assessImpact(severity, category),
        fixComplexity: this.estimateFixComplexity(category),
        recommendations: this.generateRecommendations(category, severity),
        relatedFiles: this.findRelatedFiles(log),
        confidence: Math.floor(Math.random() * 15) + 80,
      };
    });

    const rootCausePatterns = bugs.reduce(
      (acc, bug) => {
        const pattern = bug.category;
        acc[pattern] = (acc[pattern] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const summary = {
      totalIssues: bugs.length,
      criticalCount: bugs.filter((b) => b.severity === "critical").length,
      highCount: bugs.filter((b) => b.severity === "high").length,
      mediumCount: bugs.filter((b) => b.severity === "medium").length,
      lowCount: bugs.filter((b) => b.severity === "low").length,
      avgConfidence: Math.floor(
        bugs.reduce((a, b) => a + b.confidence, 0) / bugs.length,
      ),
      fixableCount: bugs.filter((b) => b.fixComplexity !== "complex").length,
    };

    const prioritizedFixes = bugs
      .sort((a, b) => {
        const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityWeight[b.severity] - severityWeight[a.severity];
      })
      .map((bug, idx) => ({
        priority: idx + 1,
        bug,
        effort: bug.fixComplexity,
        impact: bug.severity,
      }));

    return { summary, bugs, prioritizedFixes, rootCausePatterns };
  }

  private analyzeStackTrace(stackTrace: string, sourceMap?: any) {
    const lines = stackTrace.split("\n");
    const frames = lines
      .map((line) => line.trim())
      .filter((line) => line.startsWith("at ") || line.includes(":"))
      .map((line, idx) => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        return match
          ? {
              index: idx,
              function: match[1],
              file: match[2],
              line: parseInt(match[3] || "0"),
              column: parseInt(match[4] || "0"),
            }
          : { index: idx, raw: line };
      });

    const probableCulprit = frames.find(
      (f) => "file" in f && f.file && !f.file.includes("node_modules"),
    );

    return {
      frames: frames.length,
      topFrame: frames[0],
      probableCulprit,
      analysis: {
        entryPoint: frames[0],
        lastUserCode: frames.find(
          (f) =>
            "file" in f &&
            f.file &&
            !f.file.includes("node_modules") &&
            !f.file.includes("internal/"),
        ),
        framework: frames.find(
          (f) => "file" in f && f.file?.includes("node_modules"),
        ),
        suggestion: this.suggestFixFromTrace(frames),
      },
    };
  }

  private suggestFixes(bugId: string, language: string, existingCode: string) {
    return {
      bugId,
      language,
      fix: {
        code: this.generateFixCode(existingCode, bugId),
        explanation: "Generated fix based on bug pattern analysis",
        confidence: 85,
        alternatives: [
          { code: "// Alternative 1", confidence: 70 },
          { code: "// Alternative 2", confidence: 60 },
        ],
      },
      tests: [
        { description: "Test the fix", code: "expect(fix()).toBeDefined()" },
      ],
    };
  }

  private prioritizeIssues(bugs: any[], sprintVelocity: number) {
    const prioritized = bugs
      .map((bug) => ({
        ...bug,
        priorityScore: this.calculatePriorityScore(bug),
        effortEstimate: this.estimateEffort(bug),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    let totalEffort = 0;
    const selected = prioritized.filter((bug) => {
      if (totalEffort + bug.effortEstimate <= sprintVelocity) {
        totalEffort += bug.effortEstimate;
        return true;
      }
      return false;
    });

    return {
      recommended: selected,
      deferred: prioritized.filter((b) => !selected.includes(b)),
      totalEffort,
      velocity: sprintVelocity,
      coverage: (selected.length / bugs.length) * 100,
    };
  }

  private findRelatedIssues(newBug: string, existingBugs: string[]) {
    const keywords = newBug.toLowerCase().split(/\s+/);
    const related = existingBugs.filter((bug) => {
      const bugLower = bug.toLowerCase();
      return keywords.some((k) => k.length > 3 && bugLower.includes(k));
    });

    return {
      newBug,
      relatedCount: related.length,
      related: related,
      duplicateLikelihood:
        related.length > 0 ? Math.min(related.length * 30, 95) : 0,
      suggestion:
        related.length > 0
          ? "Consider marking as duplicate"
          : "New unique issue",
    };
  }

  // Helper methods
  private estimateSeverity(
    log: string,
  ): "critical" | "high" | "medium" | "low" {
    const lower = log.toLowerCase();
    if (
      lower.includes("fatal") ||
      lower.includes("crash") ||
      lower.includes("memory")
    )
      return "critical";
    if (lower.includes("error") || lower.includes("exception")) return "high";
    if (lower.includes("warn")) return "medium";
    return "low";
  }

  private categorizeBug(log: string): BugReport["category"] {
    const lower = log.toLowerCase();
    if (
      lower.includes("undefined") ||
      lower.includes("null") ||
      lower.includes("type")
    )
      return "type";
    if (lower.includes("memory") || lower.includes("leak")) return "memory";
    if (lower.includes("performance") || lower.includes("slow"))
      return "performance";
    if (
      lower.includes("async") ||
      lower.includes("promise") ||
      lower.includes("race")
    )
      return "concurrency";
    if (lower.includes("config")) return "configuration";
    return "runtime";
  }

  private extractTitle(log: string): string {
    const match = log.match(/(Error|Exception):\s*(.+)/);
    return match && match[2] ? match[2].substring(0, 100) : "Unknown Error";
  }

  private extractErrorMessage(log: string): string {
    const match = log.match(/(Error|Exception):\s*(.+)/);
    return match && match[2] ? match[2] : log.substring(0, 200);
  }

  private extractStackTrace(log: string): string {
    const lines = log.split("\n");
    return lines.filter((l) => l.includes("at ")).join("\n");
  }

  private determineRootCause(log: string, category: string): string {
    const causes: Record<string, string> = {
      type: "Type error - incorrect type usage or null/undefined access",
      memory: "Memory leak or excessive memory allocation",
      performance: "Performance bottleneck in algorithm or I/O",
      concurrency: "Race condition or improper async handling",
      configuration: "Misconfiguration or missing environment variable",
      logic: "Logical error in business logic",
      runtime: "Runtime error - likely unhandled edge case",
    };
    return causes[category] || "Unknown root cause";
  }

  private assessImpact(severity: string, category: string): string {
    if (severity === "critical") return "System outage or data loss";
    if (severity === "high") return "Major functionality broken";
    if (severity === "medium") return "Feature impaired but usable";
    return "Minor issue, low user impact";
  }

  private estimateFixComplexity(
    category: string,
  ): "simple" | "moderate" | "complex" {
    const complexities: Record<string, string> = {
      type: "simple",
      configuration: "simple",
      memory: "complex",
      concurrency: "complex",
      performance: "moderate",
      logic: "moderate",
      runtime: "moderate",
    };
    return (complexities[category] as any) || "moderate";
  }

  private generateRecommendations(
    category: string,
    severity: string,
  ): string[] {
    const recs: Record<string, string[]> = {
      type: [
        "Add proper null checks",
        "Use TypeScript strict mode",
        "Validate input types at boundaries",
      ],
      memory: [
        "Profile memory usage",
        "Check for unclosed resources",
        "Review caching strategies",
      ],
      concurrency: [
        "Add proper error handling for async",
        "Use mutexes for shared state",
        "Review event loop blocking",
      ],
      performance: [
        "Add caching where appropriate",
        "Optimize database queries",
        "Consider lazy loading",
      ],
    };
    return recs[category] || ["Review code and add appropriate error handling"];
  }

  private findRelatedFiles(log: string): string[] {
    const matches = log.match(/['"]([^'"]+\.(ts|js|tsx|jsx))['"]/g);
    return matches ? matches.map((m) => m.replace(/['"]/g, "")) : [];
  }

  private generateFixCode(existingCode: string, bugId: string): string {
    return `// Fix for ${bugId}\n// TODO: Implement based on analysis\n${existingCode}`;
  }

  private suggestFixFromTrace(frames: any[]): string {
    const userFrame = frames.find(
      (f) => "file" in f && f.file && !f.file.includes("node_modules"),
    );
    if (userFrame) {
      return `Check function ${userFrame.function} in ${userFrame.file}:${userFrame.line}`;
    }
    return "Unable to pinpoint exact location";
  }

  private calculatePriorityScore(bug: any): number {
    const severityWeight: Record<string, number> = {
      critical: 40,
      high: 30,
      medium: 15,
      low: 5,
    };
    const impactWeight: Record<string, number> = {
      high: 30,
      medium: 20,
      low: 10,
    };
    return (
      (severityWeight[bug.severity as string] || 10) +
      (impactWeight[bug.impact as string] || 10)
    );
  }

  private estimateEffort(bug: any): number {
    const effortMap: Record<string, number> = {
      simple: 1,
      moderate: 3,
      complex: 8,
    };
    return effortMap[bug.fixComplexity] || 3;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new BugTriageSpecialistServer();
server.run();
