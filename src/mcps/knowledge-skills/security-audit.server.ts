/**
 * StrRay Security Audit MCP Server
 *
 * Knowledge skill for comprehensive security analysis, vulnerability assessment,
 * and compliance validation - ensures production-ready security posture
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface SecurityVulnerability {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category:
    | "injection"
    | "authentication"
    | "authorization"
    | "cryptography"
    | "configuration"
    | "data-protection"
    | "input-validation";
  cwe?: string; // Common Weakness Enumeration
  owasp?: string; // OWASP Top 10 reference
  file: string;
  line: number;
  column?: number;
  description: string;
  impact: string;
  recommendation: string;
  codeSnippet: string;
  confidence: number; // 0-100
}

interface SecurityAuditReport {
  summary: {
    totalFiles: number;
    vulnerabilitiesFound: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    overallRiskScore: number; // 0-100
    complianceScore: number; // 0-100
  };
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
  compliance: {
    owaspTop10: Record<string, boolean>;
    frameworks: string[];
  };
}

class StrRaySecurityAuditServer {
  private server: Server;

  constructor() {
        this.server = new Server(
      {
        name: "strray-security-audit",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    // Server initialization - removed unnecessary startup logging
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "audit_security",
            description:
              "Perform comprehensive security audit on codebase files",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of file paths to audit",
                },
                includeDependencies: {
                  type: "boolean",
                  description: "Include dependency vulnerability analysis",
                  default: true,
                },
                complianceFrameworks: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["owasp-top-10", "nist", "iso-27001", "pci-dss"],
                  },
                  description: "Compliance frameworks to check against",
                },
              },
              required: ["files"],
            },
          },
          {
            name: "check_vulnerability",
            description:
              "Check specific security vulnerability patterns in a file",
            inputSchema: {
              type: "object",
              properties: {
                filePath: {
                  type: "string",
                  description: "Path to the file to check",
                },
                vulnerabilityType: {
                  type: "string",
                  enum: [
                    "injection",
                    "authentication",
                    "authorization",
                    "cryptography",
                    "xss",
                    "csrf",
                    "secrets",
                    "configuration",
                  ],
                },
                severity: {
                  type: "string",
                  enum: ["critical", "high", "medium", "low", "info"],
                  description: "Minimum severity level to report",
                },
              },
              required: ["filePath", "vulnerabilityType"],
            },
          },
          {
            name: "generate_security_report",
            description:
              "Generate comprehensive security report with remediation steps",
            inputSchema: {
              type: "object",
              properties: {
                auditResults: {
                  type: "object",
                  description: "Results from audit_security tool",
                },
                format: {
                  type: "string",
                  enum: ["markdown", "json", "html"],
                  default: "markdown",
                },
                includeRemediation: {
                  type: "boolean",
                  default: true,
                },
              },
              required: ["auditResults"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "audit_security":
          return await this.auditSecurity(args);
        case "check_vulnerability":
          return await this.checkVulnerability(args);
        case "generate_security_report":
          return await this.generateSecurityReport(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async auditSecurity(args: any): Promise<any> {
    const {
      files,
      includeDependencies = true,
      complianceFrameworks = ["owasp-top-10"],
    } = args;

    try {
      const vulnerabilities: SecurityVulnerability[] = [];
      let totalFiles = 0;

      for (const filePath of files) {
        if (!fs.existsSync(filePath)) {
          continue;
        }

        totalFiles++;
        const content = fs.readFileSync(filePath, "utf-8");
        const extension = path.extname(filePath).toLowerCase();
        const language = this.detectLanguage(extension);

        const fileVulnerabilities = this.analyzeFileForVulnerabilities(
          content,
          filePath,
          language,
        );
        vulnerabilities.push(...fileVulnerabilities);
      }

      // Generate compliance analysis
      const compliance = this.analyzeCompliance(
        vulnerabilities,
        complianceFrameworks,
      );

      // Calculate summary metrics
      const summary = this.calculateSecuritySummary(
        vulnerabilities,
        totalFiles,
      );

      const report: SecurityAuditReport = {
        summary,
        vulnerabilities,
        recommendations: this.generateRecommendations(
          vulnerabilities,
          compliance,
        ),
        compliance,
      };

      return {
        content: [
          {
            type: "text",
            text:
              `Security Audit Report:\n\n` +
              `📊 SUMMARY\n` +
              `Files Analyzed: ${totalFiles}\n` +
              `Vulnerabilities Found: ${vulnerabilities.length}\n` +
              `Critical: ${summary.criticalCount} | High: ${summary.highCount} | Medium: ${summary.mediumCount} | Low: ${summary.lowCount}\n` +
              `Overall Risk Score: ${summary.overallRiskScore}/100\n` +
              `Compliance Score: ${summary.complianceScore}/100\n\n` +
              `🚨 TOP VULNERABILITIES\n${vulnerabilities
                .slice(0, 5)
                .map(
                  (v) =>
                    `${this.getSeverityIcon(v.severity)} ${v.title} (${v.category}) - ${v.file}:${v.line}`,
                )
                .join("\n")}\n\n` +
              `💡 KEY RECOMMENDATIONS\n${report.recommendations
                .slice(0, 3)
                .map((r) => `• ${r}`)
                .join("\n")}`,
          },
        ],
        data: report, // Include full report data
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing security audit: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async checkVulnerability(args: any): Promise<any> {
    const { filePath, vulnerabilityType, severity = "info" } = args;

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const extension = path.extname(filePath).toLowerCase();
      const language = this.detectLanguage(extension);

      const vulnerabilities = this.analyzeFileForVulnerabilities(
        content,
        filePath,
        language,
      )
        .filter(
          (v) =>
            v.category === vulnerabilityType ||
            this.mapVulnTypeToCategory(vulnerabilityType).includes(v.category),
        )
        .filter(
          (v) => this.severityLevel(v.severity) >= this.severityLevel(severity),
        );

      return {
        content: [
          {
            type: "text",
            text:
              `Vulnerability Check Results for ${vulnerabilityType}:\n\n` +
              `File: ${filePath}\n` +
              `Vulnerabilities Found: ${vulnerabilities.length}\n\n` +
              vulnerabilities
                .map(
                  (v) =>
                    `${this.getSeverityIcon(v.severity)} ${v.title}\n` +
                    `   Line ${v.line}: ${v.description}\n` +
                    `   Impact: ${v.impact}\n` +
                    `   Fix: ${v.recommendation}\n`,
                )
                .join("\n") +
              (vulnerabilities.length === 0
                ? "\n✅ No vulnerabilities of this type found!"
                : ""),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error checking vulnerability: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async generateSecurityReport(args: any): Promise<any> {
    const {
      auditResults,
      format = "markdown",
      includeRemediation = true,
    } = args;

    try {
      const report = auditResults.data || auditResults;
      let output = "";

      switch (format) {
        case "markdown":
          output = this.generateMarkdownReport(report, includeRemediation);
          break;
        case "json":
          output = JSON.stringify(report, null, 2);
          break;
        case "html":
          output = this.generateHTMLReport(report, includeRemediation);
          break;
        default:
          output = this.generateMarkdownReport(report, includeRemediation);
      }

      return {
        content: [
          {
            type: "text",
            text: `Security Report Generated (${format.toUpperCase()}):\n\n${format === "json" ? "```\n" + output + "\n```" : output.substring(0, 2000) + (output.length > 2000 ? "\n\n... (truncated)" : "")}`,
          },
        ],
        fullReport: output,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating security report: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private analyzeFileForVulnerabilities(
    content: string,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Injection vulnerabilities
      vulnerabilities.push(
        ...this.checkInjectionVulnerabilities(
          line,
          lineNum,
          filePath,
          language,
        ),
      );

      // Authentication & Authorization
      vulnerabilities.push(
        ...this.checkAuthVulnerabilities(line, lineNum, filePath, language),
      );

      // Cryptography issues
      vulnerabilities.push(
        ...this.checkCryptoVulnerabilities(line, lineNum, filePath, language),
      );

      // Configuration issues
      vulnerabilities.push(
        ...this.checkConfigurationVulnerabilities(
          line,
          lineNum,
          filePath,
          language,
        ),
      );

      // Data protection
      vulnerabilities.push(
        ...this.checkDataProtectionVulnerabilities(
          line,
          lineNum,
          filePath,
          language,
        ),
      );

      // Input validation
      vulnerabilities.push(
        ...this.checkInputValidationVulnerabilities(
          line,
          lineNum,
          filePath,
          language,
        ),
      );
    });

    return vulnerabilities;
  }

  private checkInjectionVulnerabilities(
    line: string,
    lineNum: number,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // SQL Injection
    if (
      line.includes("query(") ||
      line.includes("execute(") ||
      line.includes("sql(")
    ) {
      if (
        line.includes("${") ||
        line.includes("+") ||
        line.includes("concat(")
      ) {
        vulnerabilities.push({
          id: `SQLI-${filePath}-${lineNum}`,
          title: "Potential SQL Injection",
          severity: "critical",
          category: "injection",
          cwe: "CWE-89",
          owasp: "A03:2021-Injection",
          file: filePath,
          line: lineNum,
          description:
            "String concatenation or template literals used in SQL queries",
          impact: "Attackers can execute arbitrary SQL commands",
          recommendation: "Use parameterized queries or prepared statements",
          codeSnippet: line.trim(),
          confidence: 85,
        });
      }
    }

    // Command Injection
    if (
      line.includes("exec(") ||
      line.includes("spawn(") ||
      line.includes("system(")
    ) {
      if (line.includes("${") || line.includes("+")) {
        vulnerabilities.push({
          id: `CMDI-${filePath}-${lineNum}`,
          title: "Potential Command Injection",
          severity: "critical",
          category: "injection",
          cwe: "CWE-78",
          owasp: "A03:2021-Injection",
          file: filePath,
          line: lineNum,
          description: "Dynamic command execution with user input",
          impact: "Attackers can execute arbitrary system commands",
          recommendation: "Validate and sanitize input, use safe APIs",
          codeSnippet: line.trim(),
          confidence: 90,
        });
      }
    }

    return vulnerabilities;
  }

  private checkAuthVulnerabilities(
    line: string,
    lineNum: number,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Weak password policies
    if (
      line.includes("password") &&
      (line.includes("length") || line.includes("min"))
    ) {
      if (line.includes("6") || line.includes("8")) {
        vulnerabilities.push({
          id: `WEAKPASS-${filePath}-${lineNum}`,
          title: "Weak Password Policy",
          severity: "medium",
          category: "authentication",
          cwe: "CWE-521",
          owasp: "A02:2021-Cryptographic Failures",
          file: filePath,
          line: lineNum,
          description: "Password minimum length is too short",
          impact: "Weak passwords are easily cracked",
          recommendation:
            "Require at least 12 characters, mix of character types",
          codeSnippet: line.trim(),
          confidence: 75,
        });
      }
    }

    // JWT without expiration
    if (line.includes("jwt") || line.includes("JWT")) {
      if (
        !line.includes("expires") &&
        !line.includes("exp") &&
        !line.includes("expiresIn")
      ) {
        vulnerabilities.push({
          id: `JWTNOEXP-${filePath}-${lineNum}`,
          title: "JWT Without Expiration",
          severity: "high",
          category: "authentication",
          cwe: "CWE-613",
          owasp: "A07:2021-Identification and Authentication Failures",
          file: filePath,
          line: lineNum,
          description: "JWT tokens created without expiration time",
          impact: "Tokens never expire, infinite session vulnerability",
          recommendation: "Always set expiration time on JWT tokens",
          codeSnippet: line.trim(),
          confidence: 80,
        });
      }
    }

    return vulnerabilities;
  }

  private checkCryptoVulnerabilities(
    line: string,
    lineNum: number,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Weak hashing algorithms
    if (
      line.includes("md5(") ||
      line.includes("sha1(") ||
      line.includes("MD5") ||
      line.includes("SHA1")
    ) {
      vulnerabilities.push({
        id: `WEAKHASH-${filePath}-${lineNum}`,
        title: "Weak Hashing Algorithm",
        severity: "high",
        category: "cryptography",
        cwe: "CWE-328",
        owasp: "A02:2021-Cryptographic Failures",
        file: filePath,
        line: lineNum,
        description: "Using deprecated or weak hashing algorithms",
        impact: "Passwords and data easily compromised",
        recommendation:
          "Use bcrypt, scrypt, or Argon2 for passwords; SHA-256+ for data",
        codeSnippet: line.trim(),
        confidence: 95,
      });
    }

    // Insecure random number generation
    if (line.includes("Math.random(")) {
      vulnerabilities.push({
        id: `WEAKRAND-${filePath}-${lineNum}`,
        title: "Weak Random Number Generation",
        severity: "medium",
        category: "cryptography",
        cwe: "CWE-338",
        owasp: "A02:2021-Cryptographic Failures",
        file: filePath,
        line: lineNum,
        description: "Using Math.random() for security-sensitive operations",
        impact: "Predictable random values compromise security",
        recommendation: "Use crypto.randomBytes() or secure random APIs",
        codeSnippet: line.trim(),
        confidence: 85,
      });
    }

    return vulnerabilities;
  }

  private checkConfigurationVulnerabilities(
    line: string,
    lineNum: number,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Debug mode in production
    if (line.includes("DEBUG") || line.includes("debug")) {
      if (line.includes("true") || line.includes("enabled")) {
        vulnerabilities.push({
          id: `DEBUGPROD-${filePath}-${lineNum}`,
          title: "Debug Mode Enabled",
          severity: "medium",
          category: "configuration",
          cwe: "CWE-489",
          owasp: "A05:2021-Security Misconfiguration",
          file: filePath,
          line: lineNum,
          description: "Debug mode appears to be enabled",
          impact: "Sensitive information leaked in production",
          recommendation: "Disable debug mode in production environments",
          codeSnippet: line.trim(),
          confidence: 70,
        });
      }
    }

    // CORS misconfiguration
    if (line.includes("cors") || line.includes("CORS")) {
      if (line.includes("*") || line.includes("allow-all")) {
        vulnerabilities.push({
          id: `CORSMISCONFIG-${filePath}-${lineNum}`,
          title: "CORS Misconfiguration",
          severity: "medium",
          category: "configuration",
          cwe: "CWE-942",
          owasp: "A05:2021-Security Misconfiguration",
          file: filePath,
          line: lineNum,
          description: "Overly permissive CORS configuration",
          impact: "Cross-origin requests from any domain allowed",
          recommendation: "Specify allowed origins explicitly",
          codeSnippet: line.trim(),
          confidence: 75,
        });
      }
    }

    return vulnerabilities;
  }

  private checkDataProtectionVulnerabilities(
    line: string,
    lineNum: number,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Sensitive data logging
    if (line.includes("console.log") || line.includes("logger.")) {
      if (
        line.includes("password") ||
        line.includes("token") ||
        line.includes("secret") ||
        line.includes("key")
      ) {
        vulnerabilities.push({
          id: `SENSITIVELOG-${filePath}-${lineNum}`,
          title: "Sensitive Data Logging",
          severity: "high",
          category: "data-protection",
          cwe: "CWE-532",
          owasp: "A09:2021-Security Logging and Monitoring Failures",
          file: filePath,
          line: lineNum,
          description: "Logging sensitive information like passwords or tokens",
          impact: "Credentials exposed in logs",
          recommendation: "Never log sensitive data, use proper redaction",
          codeSnippet: line.trim(),
          confidence: 90,
        });
      }
    }

    // Insecure data transmission
    if (
      line.includes("http://") &&
      !line.includes("localhost") &&
      !line.includes("127.0.0.1")
    ) {
      vulnerabilities.push({
        id: `HTTPNOTLS-${filePath}-${lineNum}`,
        title: "Insecure HTTP Transmission",
        severity: "high",
        category: "data-protection",
        cwe: "CWE-319",
        owasp: "A02:2021-Cryptographic Failures",
        file: filePath,
        line: lineNum,
        description: "Data transmitted over unencrypted HTTP",
        impact: "Data intercepted by attackers",
        recommendation: "Use HTTPS for all data transmission",
        codeSnippet: line.trim(),
        confidence: 95,
      });
    }

    return vulnerabilities;
  }

  private checkInputValidationVulnerabilities(
    line: string,
    lineNum: number,
    filePath: string,
    language: string,
  ): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Missing input validation
    if (
      line.includes("req.body") ||
      line.includes("req.query") ||
      line.includes("req.params")
    ) {
      // Check if there's any validation on the same or next few lines
      const nextLines = this.getNextLines(filePath, lineNum, 3);
      const hasValidation = nextLines.some(
        (nextLine) =>
          nextLine.includes("validate") ||
          nextLine.includes("sanitize") ||
          nextLine.includes("joi") ||
          nextLine.includes("zod") ||
          nextLine.includes("isEmail") ||
          nextLine.includes("isLength"),
      );

      if (!hasValidation) {
        vulnerabilities.push({
          id: `NOVALIDATION-${filePath}-${lineNum}`,
          title: "Missing Input Validation",
          severity: "medium",
          category: "input-validation",
          cwe: "CWE-20",
          owasp: "A03:2021-Injection",
          file: filePath,
          line: lineNum,
          description: "User input processed without validation",
          impact: "Malicious input can cause security issues",
          recommendation: "Validate and sanitize all user inputs",
          codeSnippet: line.trim(),
          confidence: 60,
        });
      }
    }

    return vulnerabilities;
  }

  private getNextLines(
    filePath: string,
    startLine: number,
    count: number,
  ): string[] {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const result: string[] = [];

      for (
        let i = startLine;
        i < Math.min(startLine + count, lines.length);
        i++
      ) {
        const line = lines[i];
        if (line) {
          result.push(line);
        }
      }

      return result;
    } catch {
      return [];
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

  private calculateSecuritySummary(
    vulnerabilities: SecurityVulnerability[],
    totalFiles: number,
  ): SecurityAuditReport["summary"] {
    const counts = {
      critical: vulnerabilities.filter((v) => v.severity === "critical").length,
      high: vulnerabilities.filter((v) => v.severity === "high").length,
      medium: vulnerabilities.filter((v) => v.severity === "medium").length,
      low: vulnerabilities.filter((v) => v.severity === "low").length,
    };

    // Calculate risk score based on vulnerability counts and severity
    const riskScore = Math.min(
      100,
      counts.critical * 10 +
        counts.high * 5 +
        counts.medium * 2 +
        counts.low * 1,
    );

    // Calculate compliance score (inverse of risk score, adjusted for file count)
    const baseCompliance = Math.max(0, 100 - riskScore);
    const complianceScore = Math.max(
      0,
      baseCompliance - (totalFiles > 10 ? 5 : 0),
    );

    return {
      totalFiles,
      vulnerabilitiesFound: vulnerabilities.length,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      overallRiskScore: riskScore,
      complianceScore,
    };
  }

  private analyzeCompliance(
    vulnerabilities: SecurityVulnerability[],
    frameworks: string[],
  ): SecurityAuditReport["compliance"] {
    const owaspTop10: Record<string, boolean> = {};

    // OWASP Top 10 2021 mapping
    const owaspMapping: Record<string, string[]> = {
      "A01:2021-Broken Access Control": ["authorization"],
      "A02:2021-Cryptographic Failures": ["cryptography"],
      "A03:2021-Injection": ["injection"],
      "A04:2021-Insecure Design": ["configuration", "input-validation"],
      "A05:2021-Security Misconfiguration": ["configuration"],
      "A06:2021-Vulnerable Components": [], // Would need dependency analysis
      "A07:2021-Authentication Failures": ["authentication"],
      "A08:2021-Software Integrity": ["configuration"],
      "A09:2021-Security Logging": ["data-protection"],
      "A10:2021-SSRF": ["injection"], // Simplified mapping
    };

    // Check each OWASP category
    Object.entries(owaspMapping).forEach(([owaspId, categories]) => {
      const hasVulnsInCategory = vulnerabilities.some((v) =>
        categories.includes(v.category),
      );
      owaspTop10[owaspId] = !hasVulnsInCategory; // True if no vulnerabilities found
    });

    return {
      owaspTop10,
      frameworks,
    };
  }

  private generateRecommendations(
    vulnerabilities: SecurityVulnerability[],
    compliance: SecurityAuditReport["compliance"],
  ): string[] {
    const recommendations: string[] = [];

    // Group vulnerabilities by category
    const byCategory = vulnerabilities.reduce(
      (acc, v) => {
        acc[v.category] = (acc[v.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Generate category-specific recommendations
    if ((byCategory.injection || 0) > 0) {
      recommendations.push(
        "Implement parameterized queries and input sanitization to prevent injection attacks",
      );
    }

    if ((byCategory.authentication || 0) > 0) {
      recommendations.push(
        "Strengthen authentication mechanisms and implement proper session management",
      );
    }

    if ((byCategory.cryptography || 0) > 0) {
      recommendations.push(
        "Replace weak cryptographic algorithms with modern, secure alternatives",
      );
    }

    if ((byCategory.configuration || 0) > 0) {
      recommendations.push(
        "Review and harden security configurations, disable debug modes in production",
      );
    }

    if ((byCategory["data-protection"] || 0) > 0) {
      recommendations.push(
        "Implement proper data protection measures and avoid logging sensitive information",
      );
    }

    // OWASP compliance recommendations
    const failedOwasp = Object.entries(compliance.owaspTop10)
      .filter(([_, compliant]) => !compliant)
      .map(([category]) => category);

    if (failedOwasp.length > 0) {
      recommendations.push(
        `Address OWASP Top 10 compliance issues: ${failedOwasp.join(", ")}`,
      );
    }

    // General recommendations
    if (vulnerabilities.length === 0) {
      recommendations.push(
        "Maintain regular security audits and stay updated with security best practices",
      );
    } else {
      recommendations.push(
        "Implement automated security testing in CI/CD pipeline",
      );
      recommendations.push(
        "Conduct regular security training for development team",
      );
    }

    return recommendations;
  }

  private severityLevel(severity: string): number {
    const levels = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 0;
  }

  private mapVulnTypeToCategory(type: string): string[] {
    const mapping: Record<string, string[]> = {
      injection: ["injection"],
      authentication: ["authentication"],
      authorization: ["authorization"],
      cryptography: ["cryptography"],
      xss: ["injection", "data-protection"],
      csrf: ["authentication", "authorization"],
      secrets: ["data-protection", "configuration"],
      configuration: ["configuration"],
    };
    return mapping[type] || [];
  }

  private getSeverityIcon(severity: string): string {
    const icons = {
      critical: "🚨",
      high: "🔴",
      medium: "🟡",
      low: "🟢",
      info: "ℹ️",
    };
    return icons[severity as keyof typeof icons] || "❓";
  }

  private generateMarkdownReport(
    report: SecurityAuditReport,
    includeRemediation: boolean,
  ): string {
    let output = `# Security Audit Report\n\n`;

    output += `## Executive Summary\n\n`;
    output += `- **Files Analyzed**: ${report.summary.totalFiles}\n`;
    output += `- **Vulnerabilities Found**: ${report.summary.vulnerabilitiesFound}\n`;
    output += `- **Risk Score**: ${report.summary.overallRiskScore}/100\n`;
    output += `- **Compliance Score**: ${report.summary.complianceScore}/100\n\n`;

    output += `## Vulnerability Breakdown\n\n`;
    output += `| Severity | Count |\n`;
    output += `|----------|-------|\n`;
    output += `| Critical | ${report.summary.criticalCount} |\n`;
    output += `| High     | ${report.summary.highCount} |\n`;
    output += `| Medium   | ${report.summary.mediumCount} |\n`;
    output += `| Low      | ${report.summary.lowCount} |\n\n`;

    if (includeRemediation) {
      output += `## Key Recommendations\n\n`;
      report.recommendations.forEach((rec, i) => {
        output += `${i + 1}. ${rec}\n`;
      });
      output += `\n`;
    }

    output += `## Detailed Findings\n\n`;
    report.vulnerabilities.forEach((vuln) => {
      output += `### ${this.getSeverityIcon(vuln.severity)} ${vuln.title}\n\n`;
      output += `- **File**: ${vuln.file}:${vuln.line}\n`;
      output += `- **Category**: ${vuln.category}\n`;
      output += `- **Severity**: ${vuln.severity}\n`;
      output += `- **Description**: ${vuln.description}\n`;
      output += `- **Impact**: ${vuln.impact}\n`;
      output += `- **Recommendation**: ${vuln.recommendation}\n\n`;
      if (vuln.cwe) output += `- **CWE**: ${vuln.cwe}\n`;
      if (vuln.owasp) output += `- **OWASP**: ${vuln.owasp}\n`;
      output += `\n---\n\n`;
    });

    return output;
  }

  private generateHTMLReport(
    report: SecurityAuditReport,
    includeRemediation: boolean,
  ): string {
    // Simplified HTML generation - could be expanded
    return `<html><body><h1>Security Audit Report</h1><p>Risk Score: ${report.summary.overallRiskScore}/100</p></body></html>`;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Security Audit MCP Server running...");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRaySecurityAuditServer();
  server.run().catch(console.error);
}

export { StrRaySecurityAuditServer };
