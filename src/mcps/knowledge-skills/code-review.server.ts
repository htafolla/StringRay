/**
 * StrRay Code Review MCP Server
 *
 * Knowledge skill for automated code review, quality assessment,
 * and best practices validation - provides comprehensive code quality analysis
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface CodeReviewResult {
  file: string;
  issues: CodeIssue[];
  metrics: CodeMetrics;
  suggestions: string[];
  overallScore: number; // 0-100
}

interface CodeIssue {
  type: "error" | "warning" | "info";
  category: "security" | "performance" | "maintainability" | "style" | "logic";
  line: number;
  column?: number;
  message: string;
  suggestion: string;
  severity: "critical" | "high" | "medium" | "low";
  file?: string; // Optional file reference for multi-file analysis
}

interface CodeMetrics {
  cyclomaticComplexity: number;
  linesOfCode: number;
  commentRatio: number;
  duplicateLines: number;
  testCoverage?: number;
}

class StrRayCodeReviewServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-code-review",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    // Server initialization - removed unnecessary startup logging
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_code_quality",
            description:
              "Analyze code quality metrics, identify issues, and provide improvement suggestions",
            inputSchema: {
              type: "object",
              properties: {
                filePath: {
                  type: "string",
                  description: "Path to the file to analyze",
                },
                includeMetrics: {
                  type: "boolean",
                  description: "Include detailed code metrics in the analysis",
                  default: true,
                },
                focusAreas: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "security",
                      "performance",
                      "maintainability",
                      "style",
                      "logic",
                    ],
                  },
                  description: "Specific areas to focus the review on",
                },
              },
              required: ["filePath"],
            },
          },
          {
            name: "review_pull_request",
            description:
              "Review a pull request by analyzing changed files and providing comprehensive feedback",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of file paths to review",
                },
                baseBranch: {
                  type: "string",
                  description: "Base branch for comparison",
                  default: "main",
                },
                focusAreas: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "security",
                      "performance",
                      "maintainability",
                      "style",
                      "logic",
                    ],
                  },
                  description: "Specific areas to focus the review on",
                },
              },
              required: ["files"],
            },
          },
          {
            name: "check_best_practices",
            description:
              "Check adherence to coding best practices and standards",
            inputSchema: {
              type: "object",
              properties: {
                filePath: {
                  type: "string",
                  description: "Path to the file to check",
                },
                language: {
                  type: "string",
                  description:
                    "Programming language (typescript, javascript, python, etc.)",
                },
                standards: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific standards to check (airbnb, google, microsoft, etc.)",
                },
              },
              required: ["filePath"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_code_quality":
          return await this.analyzeCodeQuality(args);
        case "review_pull_request":
          return await this.reviewPullRequest(args);
        case "check_best_practices":
          return await this.checkBestPractices(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzeCodeQuality(args: any): Promise<any> {
    const { filePath, includeMetrics = true, focusAreas } = args;

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const extension = path.extname(filePath).toLowerCase();
      const language = this.detectLanguage(extension);

      const issues = this.analyzeCode(content, language, focusAreas);
      const metrics = includeMetrics
        ? this.calculateMetrics(content, language)
        : null;
      const suggestions = this.generateSuggestions(issues, metrics, language);
      const overallScore = this.calculateOverallScore(issues, metrics);

      const result: CodeReviewResult = {
        file: filePath,
        issues,
        metrics: metrics!,
        suggestions,
        overallScore,
      };

      return {
        content: [
          {
            type: "text",
            text:
              `Code Review Results for ${filePath}:\n\n` +
              `Overall Score: ${overallScore}/100\n\n` +
              `Issues Found: ${issues.length}\n` +
              (metrics
                ? `Lines of Code: ${metrics.linesOfCode}\n` +
                  `Cyclomatic Complexity: ${metrics.cyclomaticComplexity}\n` +
                  `Comment Ratio: ${(metrics.commentRatio * 100).toFixed(1)}%\n\n`
                : "") +
              `Key Issues:\n${issues
                .slice(0, 10)
                .map(
                  (issue) =>
                    `• ${issue.severity.toUpperCase()}: ${issue.message} (${issue.category})`,
                )
                .join("\n")}\n\n` +
              `Suggestions:\n${suggestions
                .slice(0, 5)
                .map((s) => `• ${s}`)
                .join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing code quality: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async reviewPullRequest(args: any): Promise<any> {
    const { files, baseBranch = "main", focusAreas } = args;

    try {
      const results: CodeReviewResult[] = [];

      for (const filePath of files) {
        if (!fs.existsSync(filePath)) {
          continue; // Skip files that don't exist
        }

        const content = fs.readFileSync(filePath, "utf-8");
        const extension = path.extname(filePath).toLowerCase();
        const language = this.detectLanguage(extension);

        const issues = this.analyzeCode(content, language, focusAreas);
        const metrics = this.calculateMetrics(content, language);
        const suggestions = this.generateSuggestions(issues, metrics, language);
        const overallScore = this.calculateOverallScore(issues, metrics);

        results.push({
          file: filePath,
          issues,
          metrics,
          suggestions,
          overallScore,
        });
      }

      const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
      const avgScore =
        results.length > 0
          ? Math.round(
              results.reduce((sum, r) => sum + r.overallScore, 0) /
                results.length,
            )
          : 0;

      const criticalIssues = results.flatMap((r) =>
        r.issues.filter((i) => i.severity === "critical"),
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Pull Request Review Summary:\n\n` +
              `Files Reviewed: ${results.length}\n` +
              `Total Issues: ${totalIssues}\n` +
              `Average Quality Score: ${avgScore}/100\n` +
              `Critical Issues: ${criticalIssues.length}\n\n` +
              `Quality Scores by File:\n${results
                .map(
                  (r) =>
                    `${r.file}: ${r.overallScore}/100 (${r.issues.length} issues)`,
                )
                .join("\n")}\n\n` +
              (criticalIssues.length > 0
                ? `🚨 Critical Issues:\n${criticalIssues
                    .map(
                      (issue) =>
                        `• ${issue.file}:${issue.line} - ${issue.message}`,
                    )
                    .join("\n")}\n\n`
                : "") +
              `Overall Assessment: ${this.assessOverallQuality(avgScore, totalIssues, criticalIssues.length)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reviewing pull request: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async checkBestPractices(args: any): Promise<any> {
    const { filePath, language: specifiedLanguage, standards = [] } = args;

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const extension = path.extname(filePath).toLowerCase();
      const detectedLanguage = this.detectLanguage(extension);
      const language = specifiedLanguage || detectedLanguage;

      const violations = this.checkStandardsCompliance(
        content,
        language,
        standards,
      );
      const recommendations = this.generateStandardsRecommendations(
        violations,
        language,
        standards,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Best Practices Check for ${filePath}:\n\n` +
              `Language: ${language}\n` +
              `Standards Checked: ${standards.length > 0 ? standards.join(", ") : "General best practices"}\n\n` +
              `Violations Found: ${violations.length}\n\n` +
              `Key Violations:\n${violations
                .slice(0, 10)
                .map(
                  (v) =>
                    `• ${v.severity.toUpperCase()}: ${v.rule} - ${v.description}`,
                )
                .join("\n")}\n\n` +
              `Recommendations:\n${recommendations
                .slice(0, 5)
                .map((r) => `• ${r}`)
                .join("\n")}\n\n` +
              `Compliance Score: ${this.calculateComplianceScore(violations)}/100`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error checking best practices: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private detectLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".cs": "csharp",
      ".php": "php",
      ".rb": "ruby",
      ".go": "go",
      ".rs": "rust",
      ".swift": "swift",
      ".kt": "kotlin",
      ".scala": "scala",
    };

    return languageMap[extension] || "unknown";
  }

  private analyzeCode(
    content: string,
    language: string,
    focusAreas?: string[],
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split("\n");

    // Security analysis
    if (!focusAreas || focusAreas.includes("security")) {
      issues.push(...this.analyzeSecurity(content, lines, language));
    }

    // Performance analysis
    if (!focusAreas || focusAreas.includes("performance")) {
      issues.push(...this.analyzePerformance(content, lines, language));
    }

    // Maintainability analysis
    if (!focusAreas || focusAreas.includes("maintainability")) {
      issues.push(...this.analyzeMaintainability(content, lines, language));
    }

    // Style analysis
    if (!focusAreas || focusAreas.includes("style")) {
      issues.push(...this.analyzeStyle(content, lines, language));
    }

    // Logic analysis
    if (!focusAreas || focusAreas.includes("logic")) {
      issues.push(...this.analyzeLogic(content, lines, language));
    }

    return issues;
  }

  private analyzeSecurity(
    content: string,
    lines: string[],
    language: string,
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // SQL injection patterns
      if (
        line.includes("query(") &&
        (line.includes("${") || line.includes("+"))
      ) {
        issues.push({
          type: "error",
          category: "security",
          line: lineNum,
          message: "Potential SQL injection vulnerability",
          suggestion: "Use parameterized queries or prepared statements",
          severity: "critical",
        });
      }

      // XSS patterns
      if (line.includes("innerHTML") || line.includes("outerHTML")) {
        issues.push({
          type: "error",
          category: "security",
          line: lineNum,
          message: "Direct HTML manipulation detected",
          suggestion: "Use textContent or sanitize HTML input",
          severity: "high",
        });
      }

      // Hardcoded secrets
      if (/(password|secret|key|token)\s*=\s*['"][^'"]*['"]/i.test(line)) {
        issues.push({
          type: "error",
          category: "security",
          line: lineNum,
          message: "Hardcoded secret detected",
          suggestion: "Move secrets to environment variables or secure vault",
          severity: "critical",
        });
      }

      // eval() usage
      if (line.includes("eval(")) {
        issues.push({
          type: "error",
          category: "security",
          line: lineNum,
          message: "Use of eval() detected",
          suggestion: "Avoid eval() for security reasons",
          severity: "high",
        });
      }
    });

    return issues;
  }

  private analyzePerformance(
    content: string,
    lines: string[],
    language: string,
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Inefficient loops
      if (
        line.includes("for") &&
        line.includes(".length") &&
        !line.includes("let ")
      ) {
        issues.push({
          type: "warning",
          category: "performance",
          line: lineNum,
          message: "Array length accessed in loop condition",
          suggestion: "Cache array length outside the loop",
          severity: "medium",
        });
      }

      // Memory leaks (event listeners)
      if (
        line.includes("addEventListener") &&
        !content.includes("removeEventListener")
      ) {
        issues.push({
          type: "warning",
          category: "performance",
          line: lineNum,
          message: "Event listener added without cleanup",
          suggestion:
            "Ensure event listeners are removed when no longer needed",
          severity: "medium",
        });
      }

      // Inefficient string concatenation
      if (
        language === "javascript" &&
        line.includes("+") &&
        line.includes("=")
      ) {
        issues.push({
          type: "warning",
          category: "performance",
          line: lineNum,
          message: "String concatenation in loop may be inefficient",
          suggestion: "Consider using array.join() or template literals",
          severity: "low",
        });
      }
    });

    return issues;
  }

  private analyzeMaintainability(
    content: string,
    lines: string[],
    language: string,
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Function length check
    const functions = content.match(
      /(?:function|const|let)\s+\w+\s*[=(]\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))/g,
    );
    if (functions) {
      functions.forEach((func) => {
        const funcStart = content.indexOf(func);
        const funcBody = content.substring(
          funcStart,
          content.indexOf("}", funcStart) + 1,
        );
        const funcLines = funcBody.split("\n").length;

        if (funcLines > 50) {
          issues.push({
            type: "warning",
            category: "maintainability",
            line:
              lines.findIndex((l) => l.includes(func.split(" ")[1] || func)) +
              1,
            message: `Function too long (${funcLines} lines)`,
            suggestion: "Break down into smaller, focused functions",
            severity: "medium",
          });
        }
      });
    }

    // Deep nesting check
    let maxNesting = 0;
    let currentNesting = 0;

    lines.forEach((line, index) => {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);

      if (currentNesting > 4) {
        issues.push({
          type: "warning",
          category: "maintainability",
          line: index + 1,
          message: "Excessive nesting depth",
          suggestion: "Extract nested logic into separate functions",
          severity: "medium",
        });
      }
    });

    return issues;
  }

  private analyzeStyle(
    content: string,
    lines: string[],
    language: string,
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Line length check
      if (line.length > 120) {
        issues.push({
          type: "info",
          category: "style",
          line: lineNum,
          message: "Line too long (>120 characters)",
          suggestion: "Break long lines for better readability",
          severity: "low",
        });
      }

      // Magic numbers
      if (
        /\b\d{2,}\b/.test(line) &&
        !line.includes("//") &&
        !line.includes("/*")
      ) {
        const numbers = line.match(/\b\d{2,}\b/g);
        if (numbers && numbers.some((n) => parseInt(n) > 1)) {
          issues.push({
            type: "info",
            category: "style",
            line: lineNum,
            message: "Magic number detected",
            suggestion: "Replace magic numbers with named constants",
            severity: "low",
          });
        }
      }
    });

    return issues;
  }

  private analyzeLogic(
    content: string,
    lines: string[],
    language: string,
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for console.log in production code
    lines.forEach((line, index) => {
      if (line.includes("console.log") && !line.includes("//")) {
        issues.push({
          type: "warning",
          category: "logic",
          line: index + 1,
          message: "console.log statement found",
          suggestion:
            "Remove console.log statements or replace with proper logging",
          severity: "low",
        });
      }
    });

    // Check for TODO comments
    lines.forEach((line, index) => {
      if (line.includes("TODO") || line.includes("FIXME")) {
        issues.push({
          type: "info",
          category: "logic",
          line: index + 1,
          message: "TODO/FIXME comment found",
          suggestion: "Address TODO items or create proper issues",
          severity: "low",
        });
      }
    });

    return issues;
  }

  private calculateMetrics(content: string, language: string): CodeMetrics {
    const lines = content.split("\n");
    const codeLines = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("/*") &&
        !trimmed.startsWith("*")
      );
    });

    const commentLines = lines.filter(
      (line) =>
        line.trim().startsWith("//") ||
        line.trim().startsWith("/*") ||
        line.trim().startsWith("*"),
    );

    // Simple cyclomatic complexity calculation
    const complexityKeywords = [
      "if",
      "else",
      "for",
      "while",
      "case",
      "catch",
      "&&",
      "||",
    ];
    let complexity = 1; // Base complexity
    complexityKeywords.forEach((keyword) => {
      const matches = (content.match(new RegExp(`\\b${keyword}\\b`, "g")) || [])
        .length;
      complexity += matches;
    });

    return {
      cyclomaticComplexity: complexity,
      linesOfCode: codeLines.length,
      commentRatio: commentLines.length / lines.length,
      duplicateLines: this.calculateDuplicateLines(lines),
    };
  }

  private calculateDuplicateLines(lines: string[]): number {
    const lineCount: Map<string, number> = new Map();

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        lineCount.set(trimmed, (lineCount.get(trimmed) || 0) + 1);
      }
    });

    let duplicates = 0;
    lineCount.forEach((count) => {
      if (count > 1) {
        duplicates += count;
      }
    });

    return duplicates;
  }

  private generateSuggestions(
    issues: CodeIssue[],
    metrics: CodeMetrics | null,
    language: string,
  ): string[] {
    const suggestions: string[] = [];

    if (issues.length === 0) {
      suggestions.push(
        "Code quality is excellent! Consider adding more comprehensive tests.",
      );
    }

    // Group issues by category and severity
    const criticalIssues = issues.filter((i) => i.severity === "critical");
    const highIssues = issues.filter((i) => i.severity === "high");

    if (criticalIssues.length > 0) {
      suggestions.push(
        "Address all critical security and error issues before committing.",
      );
    }

    if (highIssues.length > 0) {
      suggestions.push(
        "Review and fix high-priority issues to improve code reliability.",
      );
    }

    if (metrics) {
      if (metrics.cyclomaticComplexity > 20) {
        suggestions.push(
          "Consider breaking down complex functions to reduce cyclomatic complexity.",
        );
      }

      if (metrics.commentRatio < 0.1) {
        suggestions.push(
          "Add more comments to improve code documentation and maintainability.",
        );
      }

      if (metrics.linesOfCode > 500) {
        suggestions.push(
          "Large files detected. Consider splitting into smaller, focused modules.",
        );
      }
    }

    // Language-specific suggestions
    switch (language) {
      case "typescript":
        suggestions.push(
          "Ensure proper TypeScript type annotations and avoid 'any' types.",
        );
        break;
      case "javascript":
        suggestions.push(
          "Consider migrating to TypeScript for better type safety.",
        );
        break;
      case "python":
        suggestions.push("Follow PEP 8 style guidelines and add type hints.");
        break;
    }

    return suggestions;
  }

  private calculateOverallScore(
    issues: CodeIssue[],
    metrics: CodeMetrics | null,
  ): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach((issue) => {
      switch (issue.severity) {
        case "critical":
          score -= 10;
          break;
        case "high":
          score -= 5;
          break;
        case "medium":
          score -= 2;
          break;
        case "low":
          score -= 1;
          break;
      }
    });

    // Deduct points for poor metrics
    if (metrics) {
      if (metrics.cyclomaticComplexity > 20) score -= 10;
      if (metrics.commentRatio < 0.05) score -= 5;
      if (metrics.duplicateLines > 50) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessOverallQuality(
    avgScore: number,
    totalIssues: number,
    criticalIssues: number,
  ): string {
    if (avgScore >= 90 && criticalIssues === 0) {
      return "✅ EXCELLENT: Code quality is outstanding. Ready for production.";
    } else if (avgScore >= 75 && criticalIssues === 0) {
      return "👍 GOOD: Code quality is acceptable. Minor improvements recommended.";
    } else if (avgScore >= 60) {
      return "⚠️ NEEDS ATTENTION: Address critical issues and major improvements needed.";
    } else {
      return "🚨 CRITICAL: Major quality issues detected. Do not merge without fixes.";
    }
  }

  private checkStandardsCompliance(
    content: string,
    language: string,
    standards: string[],
  ): any[] {
    const violations: any[] = [];

    // TypeScript specific checks
    if (language === "typescript") {
      if (content.includes(": any")) {
        violations.push({
          rule: "no-any",
          description: "Avoid using 'any' type",
          severity: "medium",
        });
      }

      if (!content.includes("interface") && !content.includes("type")) {
        violations.push({
          rule: "use-types",
          description:
            "Consider using interfaces or types for better type safety",
          severity: "low",
        });
      }
    }

    // JavaScript specific checks
    if (language === "javascript") {
      if (content.includes("var ")) {
        violations.push({
          rule: "no-var",
          description: "Use 'const' or 'let' instead of 'var'",
          severity: "medium",
        });
      }
    }

    // Python specific checks
    if (language === "python") {
      if (content.includes("print(") && !content.includes("#")) {
        violations.push({
          rule: "no-print",
          description: "Avoid using print() in production code",
          severity: "low",
        });
      }
    }

    return violations;
  }

  private generateStandardsRecommendations(
    violations: any[],
    language: string,
    standards: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (violations.length === 0) {
      recommendations.push(`Code follows ${language} best practices.`);
      return recommendations;
    }

    violations.forEach((violation) => {
      recommendations.push(`Fix ${violation.rule}: ${violation.description}`);
    });

    // Language-specific recommendations
    switch (language) {
      case "typescript":
        recommendations.push(
          "Enable strict TypeScript settings for better type checking.",
        );
        break;
      case "javascript":
        recommendations.push(
          "Consider using ESLint with a comprehensive ruleset.",
        );
        break;
      case "python":
        recommendations.push(
          "Use black for code formatting and flake8 for linting.",
        );
        break;
    }

    return recommendations;
  }

  private calculateComplianceScore(violations: any[]): number {
    const baseScore = 100;
    const deductions = violations.reduce((total, violation) => {
      switch (violation.severity) {
        case "high":
          return total + 10;
        case "medium":
          return total + 5;
        case "low":
          return total + 2;
        default:
          return total + 1;
      }
    }, 0);

    return Math.max(0, baseScore - deductions);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Code Review MCP Server running...");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayCodeReviewServer();
  server.run().catch(console.error);
}

export { StrRayCodeReviewServer };
