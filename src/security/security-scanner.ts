/**
 * StringRay Framework - Security Scanner
 *
 * Automated security vulnerability scanning and compliance validation
 * Integrates with security tools and provides comprehensive security reports
 */

import { exec } from "child_process";
import { promises as fs } from "fs";
import { frameworkLogger } from "../framework-logger";
import { promisify } from "util";
import {
  promptSecurityValidator,
  PromptSecurityValidator,
} from "./prompt-security-validator";

const execAsync = promisify(exec);

export interface SecurityScanConfig {
  enabled: boolean;
  tools: {
    npmAudit: boolean;
    trivy: boolean;
    eslintSecurity: boolean;
    dependencyCheck: boolean;
  };
  severityThreshold: "low" | "moderate" | "high" | "critical";
  reportPath: string;
  failOnVulnerabilities: boolean;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: "low" | "moderate" | "high" | "critical";
  package?: string;
  version?: string;
  cve?: string;
  url?: string;
  recommendation: string;
}

export interface SecurityReport {
  timestamp: string;
  duration: number;
  tools: {
    npmAudit: SecurityVulnerability[];
    trivy: SecurityVulnerability[];
    eslintSecurity: SecurityVulnerability[];
    dependencyCheck: SecurityVulnerability[];
  };
  summary: {
    totalVulnerabilities: number;
    bySeverity: Record<string, number>;
    byTool: Record<string, number>;
  };
  recommendations: string[];
  compliant: boolean;
}

export class SecurityScanner {
  private config: SecurityScanConfig;

  constructor(config: Partial<SecurityScanConfig> = {}) {
    this.config = {
      enabled: true,
      tools: {
        npmAudit: true,
        trivy: false, // Requires separate installation
        eslintSecurity: true,
        dependencyCheck: false, // Requires separate installation
        ...config.tools,
      },
      severityThreshold: "moderate",
      reportPath: "./security-report.json",
      failOnVulnerabilities: true,
      ...config,
    };
  }

  /**
   * Run comprehensive security scan
   */
  async runSecurityScan(): Promise<SecurityReport> {
    const jobId = `security-scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    if (!this.config.enabled) {
      return this.createEmptyReport();
    }

    frameworkLogger.log("security-scanner", "scan-start", "info", {
      jobId,
      tools: this.config.tools,
      severityThreshold: this.config.severityThreshold,
    });

    const results = await Promise.allSettled([
      this.config.tools.npmAudit ? this.runNpmAudit() : Promise.resolve([]),
      this.config.tools.trivy ? this.runTrivyScan() : Promise.resolve([]),
      this.config.tools.eslintSecurity
        ? this.runEslintSecurity()
        : Promise.resolve([]),
      this.config.tools.dependencyCheck
        ? this.runDependencyCheck()
        : Promise.resolve([]),
    ]);

    const tools = {
      npmAudit: results[0].status === "fulfilled" ? results[0].value : [],
      trivy: results[1].status === "fulfilled" ? results[1].value : [],
      eslintSecurity: results[2].status === "fulfilled" ? results[2].value : [],
      dependencyCheck:
        results[3].status === "fulfilled" ? results[3].value : [],
    };

    const duration = Date.now() - startTime;
    const report = this.generateReport(tools, duration);

    // Save report
    await this.saveReport(report, jobId);

    // Log results
    await this.logResults(report);

    return report;
  }

  /**
   * Run npm audit
   */
  private async runNpmAudit(): Promise<SecurityVulnerability[]> {
    try {
      const { stdout } = await execAsync("npm audit --json");
      const auditResult = JSON.parse(stdout);

      const vulnerabilities: SecurityVulnerability[] = [];

      if (auditResult.vulnerabilities) {
        for (const [packageName, vuln] of Object.entries(
          auditResult.vulnerabilities,
        ) as any) {
          vulnerabilities.push({
            id: vuln.name || packageName,
            title: vuln.title || "Security vulnerability",
            description: vuln.overview || "No description available",
            severity: this.mapNpmSeverity(vuln.severity),
            package: packageName,
            version: vuln.version,
            cve: vuln.cwe,
            url: vuln.url,
            recommendation: vuln.recommendation || "Update to a secure version",
          });
        }
      }

      return vulnerabilities;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn("⚠️ npm audit failed:", errorMessage);
      return [];
    }
  }

  /**
   * Run Trivy security scan
   */
  private async runTrivyScan(): Promise<SecurityVulnerability[]> {
    try {
      const { stdout } = await execAsync("trivy fs --format json .");
      const trivyResult = JSON.parse(stdout);

      const vulnerabilities: SecurityVulnerability[] = [];

      if (trivyResult.Results) {
        for (const result of trivyResult.Results) {
          if (result.Vulnerabilities) {
            for (const vuln of result.Vulnerabilities) {
              vulnerabilities.push({
                id: vuln.VulnerabilityID,
                title: vuln.Title,
                description: vuln.Description,
                severity: this.mapTrivySeverity(vuln.Severity),
                package: vuln.PkgName,
                version: vuln.InstalledVersion,
                cve: vuln.VulnerabilityID,
                url: vuln.PrimaryURL,
                recommendation: vuln.FixedVersion
                  ? `Update to ${vuln.FixedVersion}`
                  : "Review and mitigate",
              });
            }
          }
        }
      }

      return vulnerabilities;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn("⚠️ Trivy scan failed:", errorMessage);
      return [];
    }
  }

  /**
   * Run ESLint security rules
   */
  private async runEslintSecurity(): Promise<SecurityVulnerability[]> {
    try {
      const { stdout } = await execAsync("npx eslint --format json src/");
      const eslintResults = JSON.parse(stdout);

      const vulnerabilities: SecurityVulnerability[] = [];

      for (const result of eslintResults) {
        for (const message of result.messages) {
          if (
            message.ruleId &&
            (message.ruleId.includes("security") ||
              message.ruleId.includes("xss") ||
              message.ruleId.includes("injection"))
          ) {
            vulnerabilities.push({
              id: message.ruleId,
              title: message.message,
              description: `Security issue in ${result.filePath}:${message.line}:${message.column}`,
              severity: "moderate",
              recommendation:
                "Fix the security vulnerability according to ESLint recommendations",
            });
          }
        }
      }

      return vulnerabilities;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn("⚠️ ESLint security scan failed:", errorMessage);
      return [];
    }
  }

  /**
   * Run OWASP Dependency Check
   */
  private async runDependencyCheck(): Promise<SecurityVulnerability[]> {
    try {
      const { stdout } = await execAsync(
        "dependency-check --format JSON --out . --scan .",
      );
      const dcResult = JSON.parse(stdout);

      const vulnerabilities: SecurityVulnerability[] = [];

      if (dcResult.dependencies) {
        for (const dep of dcResult.dependencies) {
          if (dep.vulnerabilities) {
            for (const vuln of dep.vulnerabilities) {
              vulnerabilities.push({
                id: vuln.name,
                title: vuln.description,
                description: vuln.description,
                severity: this.mapDependencyCheckSeverity(vuln.severity),
                package: dep.fileName,
                cve: vuln.name,
                url: vuln.references?.[0]?.url,
                recommendation: "Update dependency or apply security patches",
              });
            }
          }
        }
      }

      return vulnerabilities;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn("⚠️ Dependency check failed:", errorMessage);
      return [];
    }
  }

  /**
   * Generate comprehensive security report
   */
  private generateReport(
    tools: SecurityReport["tools"],
    duration: number,
  ): SecurityReport {
    const allVulnerabilities = [
      ...tools.npmAudit,
      ...tools.trivy,
      ...tools.eslintSecurity,
      ...tools.dependencyCheck,
    ];

    const bySeverity = allVulnerabilities.reduce(
      (acc, vuln) => {
        acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byTool = {
      npmAudit: tools.npmAudit.length,
      trivy: tools.trivy.length,
      eslintSecurity: tools.eslintSecurity.length,
      dependencyCheck: tools.dependencyCheck.length,
    };

    const highSeverityCount =
      (bySeverity.high || 0) + (bySeverity.critical || 0);
    const shouldFail =
      this.config.failOnVulnerabilities &&
      highSeverityCount > 0 &&
      this.config.severityThreshold !== "low";

    const recommendations = this.generateRecommendations(allVulnerabilities);

    return {
      timestamp: new Date().toISOString(),
      duration,
      tools,
      summary: {
        totalVulnerabilities: allVulnerabilities.length,
        bySeverity,
        byTool,
      },
      recommendations,
      compliant: !shouldFail,
    };
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    vulnerabilities: SecurityVulnerability[],
  ): string[] {
    const recommendations: string[] = [];

    if (vulnerabilities.some((v) => v.severity === "critical")) {
      recommendations.push(
        "🚨 Critical security vulnerabilities found - immediate action required",
      );
    }

    if (vulnerabilities.some((v) => v.severity === "high")) {
      recommendations.push(
        "⚠️ High-severity vulnerabilities detected - prioritize fixes",
      );
    }

    if (vulnerabilities.filter((v) => v.package).length > 0) {
      recommendations.push(
        "📦 Update vulnerable dependencies to latest secure versions",
      );
    }

    if (vulnerabilities.filter((v) => v.id.includes("eslint")).length > 0) {
      recommendations.push("🔧 Fix code security issues identified by ESLint");
    }

    recommendations.push(
      "🔍 Run regular security scans and keep dependencies updated",
    );
    recommendations.push(
      "📋 Review security policies and implement security headers",
    );

    return recommendations;
  }

  /**
   * Save report to file
   */
  private async saveReport(report: SecurityReport, jobId: string): Promise<void> {
    try {
      await fs.writeFile(
        this.config.reportPath,
        JSON.stringify(report, null, 2),
      );
      frameworkLogger.log("security-scanner", "report-saved", "success", {
        jobId,
        reportPath: this.config.reportPath,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn("⚠️ Failed to save security report:", errorMessage);
    }
  }

  /**
   * Log security scan results
   */
  private async logResults(report: SecurityReport): Promise<void> {
    await frameworkLogger.log('security-scanner', '-n-security-scan-complete-report-duration-ms-', 'info', { message: `\n🔒 Security Scan Complete (${report.duration}ms)` });
    await frameworkLogger.log('security-scanner', '-total-vulnerabilities-report-summary-totalvulnera', 'info', { message: 
      `📊 Total vulnerabilities: ${report.summary.totalVulnerabilities}`,
     });

    await frameworkLogger.log('security-scanner', '-n-by-severity-', 'info', { message: "\n📈 By Severity:" });
    for (const [severity, count] of Object.entries(report.summary.bySeverity)) {
      await frameworkLogger.log('security-scanner', '-severity-count-', 'info', { message: `  ${severity}: ${count}` });
    }

    await frameworkLogger.log('security-scanner', '-n-by-tool-', 'info', { message: "\n🛠️ By Tool:" });
    for (const [tool, count] of Object.entries(report.summary.byTool)) {
      await frameworkLogger.log('security-scanner', '-tool-count-', 'info', { message: `  ${tool}: ${count}` });
    }

    if (report.recommendations.length > 0) {
      await frameworkLogger.log('security-scanner', '-n-recommendations-', 'info', { message: "\n💡 Recommendations:" });
      for (const rec of report.recommendations) {
        await frameworkLogger.log('security-scanner', '-rec-', 'info', { message: `  • ${rec}` });
      }
    }

    if (report.compliant) {
      // Security scan result - kept as console.log for user visibility
    } else {
      // Security scan failure - kept as console.log for user visibility
    }
  }

  /**
   * Map npm audit severity levels
   */
  private mapNpmSeverity(severity: string): SecurityVulnerability["severity"] {
    switch (severity) {
      case "critical":
        return "critical";
      case "high":
        return "high";
      case "moderate":
        return "moderate";
      case "low":
        return "low";
      default:
        return "moderate";
    }
  }

  /**
   * Map Trivy severity levels
   */
  private mapTrivySeverity(
    severity: string,
  ): SecurityVulnerability["severity"] {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "critical";
      case "HIGH":
        return "high";
      case "MEDIUM":
        return "moderate";
      case "LOW":
        return "low";
      default:
        return "moderate";
    }
  }

  /**
   * Map Dependency Check severity levels
   */
  private mapDependencyCheckSeverity(
    severity: string,
  ): SecurityVulnerability["severity"] {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "critical";
      case "HIGH":
        return "high";
      case "MEDIUM":
        return "moderate";
      case "LOW":
        return "low";
      default:
        return "moderate";
    }
  }

  /**
   * Validate AI prompt security
   */
  async validatePrompt(prompt: string): Promise<{
    isSafe: boolean;
    violations: string[];
    riskLevel: string;
  }> {
    const result = promptSecurityValidator.validatePrompt(prompt);

    if (!result.isSafe) {
      console.warn(
        `🚨 Prompt security violation detected (risk: ${result.riskLevel}):`,
        result.violations,
      );
    }

    return {
      isSafe: result.isSafe,
      violations: result.violations,
      riskLevel: result.riskLevel,
    };
  }

  /**
   * Validate AI response security
   */
  async validateResponse(response: string): Promise<{
    isSafe: boolean;
    violations: string[];
    riskLevel: string;
  }> {
    const result = promptSecurityValidator.validateResponse(response);

    if (!result.isSafe) {
      console.warn(
        `🚨 Response security violation detected (risk: ${result.riskLevel}):`,
        result.violations,
      );
    }

    return {
      isSafe: result.isSafe,
      violations: result.violations,
      riskLevel: result.riskLevel,
    };
  }

  /**
   * Create empty report when scanning is disabled
   */
  private createEmptyReport(): SecurityReport {
    return {
      timestamp: new Date().toISOString(),
      duration: 0,
      tools: {
        npmAudit: [],
        trivy: [],
        eslintSecurity: [],
        dependencyCheck: [],
      },
      summary: {
        totalVulnerabilities: 0,
        bySeverity: {},
        byTool: {
          npmAudit: 0,
          trivy: 0,
          eslintSecurity: 0,
          dependencyCheck: 0,
        },
      },
      recommendations: ["Security scanning is disabled"],
      compliant: true,
    };
  }
}

// Export singleton instance
export const securityScanner = new SecurityScanner();
