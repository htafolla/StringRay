/**
 * StringRay AI v1.0.4 - Security Audit Tool
 *
 * Comprehensive security auditing for the framework and its components.
 * Identifies vulnerabilities, misconfigurations, and security weaknesses.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";

export interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  file: string;
  line?: number;
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
}

export interface SecurityAuditResult {
  totalFiles: number;
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  score: number; // Security score out of 100
}

export class SecurityAuditor {
  private readonly dangerousPatterns = [
    // Code injection
    {
      pattern: /eval\s*\(/g,
      severity: "critical" as const,
      category: "code-injection",
      cwe: "CWE-95",
    },
    {
      pattern: /Function\s*\(/g,
      severity: "critical" as const,
      category: "code-injection",
      cwe: "CWE-95",
    },
    {
      pattern: /new\s+Function\s*\(/g,
      severity: "critical" as const,
      category: "code-injection",
      cwe: "CWE-95",
    },

    // Command injection
    {
      pattern: /child_process\.exec\s*\(/g,
      severity: "high" as const,
      category: "command-injection",
      cwe: "CWE-78",
    },
    {
      pattern: /child_process\.spawn\s*\(/g,
      severity: "high" as const,
      category: "command-injection",
      cwe: "CWE-78",
    },
    {
      pattern: /execSync\s*\(/g,
      severity: "high" as const,
      category: "command-injection",
      cwe: "CWE-78",
    },

    // SQL injection (if applicable)
    {
      pattern: /SELECT.*\+/g,
      severity: "high" as const,
      category: "sql-injection",
      cwe: "CWE-89",
    },
    {
      pattern: /INSERT.*\+/g,
      severity: "high" as const,
      category: "sql-injection",
      cwe: "CWE-89",
    },

    // Path traversal
    {
      pattern: /\.\.[\/\\]/g,
      severity: "high" as const,
      category: "path-traversal",
      cwe: "CWE-22",
    },
    {
      pattern: /path\.join\s*\(\s*\.\./g,
      severity: "high" as const,
      category: "path-traversal",
      cwe: "CWE-22",
    },

    // Hardcoded secrets
    {
      pattern: /password\s*[:=]\s*['"][^'"]*['"]/gi,
      severity: "high" as const,
      category: "hardcoded-secrets",
      cwe: "CWE-798",
    },
    {
      pattern: /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/gi,
      severity: "high" as const,
      category: "hardcoded-secrets",
      cwe: "CWE-798",
    },
    {
      pattern: /secret\s*[:=]\s*['"][^'"]*['"]/gi,
      severity: "high" as const,
      category: "hardcoded-secrets",
      cwe: "CWE-798",
    },

    // Insecure random
    {
      pattern: /Math\.random\s*\(\)/g,
      severity: "medium" as const,
      category: "weak-cryptography",
      cwe: "CWE-338",
    },

    // Console logging sensitive data
    {
      pattern: /console\.log\s*\([^)]*password[^)]*\)/gi,
      severity: "medium" as const,
      category: "information-disclosure",
      cwe: "CWE-532",
    },
    {
      pattern: /console\.log\s*\([^)]*secret[^)]*\)/gi,
      severity: "medium" as const,
      category: "information-disclosure",
      cwe: "CWE-532",
    },

    // Missing input validation
    {
      pattern: /req\.body\./g,
      severity: "medium" as const,
      category: "input-validation",
      cwe: "CWE-20",
    },
    {
      pattern: /req\.query\./g,
      severity: "medium" as const,
      category: "input-validation",
      cwe: "CWE-20",
    },

    // Insecure deserialization
    {
      pattern: /JSON\.parse\s*\([^)]*req\./g,
      severity: "medium" as const,
      category: "deserialization",
      cwe: "CWE-502",
    },

    // Race conditions
    {
      pattern: /setTimeout.*0/g,
      severity: "low" as const,
      category: "race-conditions",
      cwe: "CWE-362",
    },

    // Information disclosure in errors
    {
      pattern: /throw\s+new\s+Error\s*\([^)]*stack[^)]*\)/gi,
      severity: "low" as const,
      category: "information-disclosure",
      cwe: "CWE-209",
    },
  ];

  private readonly dangerousImports = [
    "child_process",
    "fs",
    "net",
    "http",
    "https",
    "crypto",
    "tls",
    "cluster",
    "worker_threads",
    "vm",
  ];

  /**
   * Run comprehensive security audit
   */
  async auditProject(projectPath: string = "."): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];
    const files = this.getAllFiles(projectPath);

    console.log(`🔍 Security Auditor: Scanning ${files.length} files...`);

    for (const file of files) {
      if (this.shouldAuditFile(file)) {
        const fileIssues = await this.auditFile(file);
        issues.push(...fileIssues);
      }
    }

    // Additional checks
    issues.push(...this.auditPackageJson(projectPath));
    issues.push(...this.auditConfiguration(projectPath));
    issues.push(...this.auditDependencies(projectPath));

    const summary = this.generateSummary(issues);
    const score = this.calculateSecurityScore(issues, files.length);

    return {
      totalFiles: files.length,
      issues,
      summary,
      score,
    };
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];

    const traverse = (currentPath: string) => {
      const items = readdirSync(currentPath);

      for (const item of items) {
        const fullPath = join(currentPath, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          traverse(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };

    traverse(dirPath);
    return files;
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      ".nuxt",
      "coverage",
    ];
    return skipDirs.includes(dirName);
  }

  private shouldAuditFile(filePath: string): boolean {
    const auditExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".md"];
    const excludePatterns = [/__tests__/, /test\.ts$/, /spec\.ts$/];

    // Check if file should be excluded from security audit
    if (excludePatterns.some((pattern) => pattern.test(filePath))) {
      return false;
    }

    return auditExtensions.some((ext) => filePath.endsWith(ext));
  }

  private async auditFile(filePath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Pattern-based security checks
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const { pattern, severity, category, cwe } of this
          .dangerousPatterns) {
          const matches = line?.match(pattern);
          if (matches && line) {
            // Skip false positives in security validation and test code
            if (this.isFalsePositive(filePath, line, category)) {
              continue;
            }

            issues.push({
              severity,
              category,
              file: filePath,
              line: lineNumber,
              description: `Potentially dangerous pattern detected: ${pattern}`,
              recommendation: this.getRecommendationForCategory(category),
              cwe,
            });
          }
        }
      }

      // Import security checks
      if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
        issues.push(...this.auditImports(content, filePath));
      }

      // File permission checks
      issues.push(...this.auditFilePermissions(filePath));
    } catch (error) {
      issues.push({
        severity: "medium",
        category: "file-access",
        file: filePath,
        description: `Failed to audit file: ${error}`,
        recommendation: "Ensure file is readable and not corrupted",
      });
    }

    return issues;
  }

  private isFalsePositive(
    filePath: string,
    line: string | undefined,
    category: string,
  ): boolean {
    if (!line) return false;

    const safeLine = line as string;

    // Security validation code that legitimately uses dangerous patterns for detection
    if (
      filePath.includes("security-auditor.ts") &&
      category === "code-injection"
    ) {
      return true;
    }

    // Test code that uses eval in string literals for testing purposes
    if (
      filePath.includes("__tests__") &&
      category === "code-injection" &&
      safeLine.includes("eval(")
    ) {
      return (
        safeLine.includes("'eval('") ||
        safeLine.includes('"eval(') ||
        safeLine.includes("`eval(")
      );
    }

    // Security validation modules that check for dangerous patterns
    if (filePath.includes("codex-parser.ts") && category === "code-injection") {
      return (
        safeLine.includes("content.includes('eval(')") ||
        safeLine.includes("content.includes('Function(')")
      );
    }

    return false;
  }

  private auditImports(content: string, filePath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const dangerousImport of this.dangerousImports) {
      const importPatterns = [
        new RegExp(`import.*from.*['"]${dangerousImport}['"]`, "g"),
        new RegExp(`require\\s*\\(\\s*['"]${dangerousImport}['"]\\s*\\)`, "g"),
        new RegExp(`import.*${dangerousImport}`, "g"),
      ];

      for (const pattern of importPatterns) {
        if (pattern.test(content)) {
          issues.push({
            severity: "medium",
            category: "dangerous-imports",
            file: filePath,
            description: `Potentially dangerous import detected: ${dangerousImport}`,
            recommendation:
              "Review usage and ensure proper sandboxing/validation",
            cwe: "CWE-350",
          });
          break; // Only report once per import per file
        }
      }
    }

    return issues;
  }

  private auditFilePermissions(filePath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    try {
      const stat = statSync(filePath);
      const mode = stat.mode;

      // Check for world-writable files
      if (mode & parseInt("2", 8)) {
        issues.push({
          severity: "high",
          category: "file-permissions",
          file: filePath,
          description: "File is world-writable",
          recommendation:
            "Restrict file permissions to prevent unauthorized modification",
          cwe: "CWE-732",
        });
      }

      // Check for executable scripts in sensitive directories
      if (mode & parseInt("111", 8) && filePath.includes("config")) {
        issues.push({
          severity: "medium",
          category: "file-permissions",
          file: filePath,
          description: "Executable file in configuration directory",
          recommendation: "Review if this file needs execute permissions",
          cwe: "CWE-732",
        });
      }
    } catch (error) {
      // File permission check failed
    }

    return issues;
  }

  private auditPackageJson(projectPath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    try {
      const packagePath = join(projectPath, "package.json");
      const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

      // Check for vulnerable dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      for (const [dep, version] of Object.entries(allDeps)) {
        if (
          typeof version === "string" &&
          (version.includes("*") || version.includes("latest"))
        ) {
          issues.push({
            severity: "medium",
            category: "dependency-management",
            file: packagePath,
            description: `Insecure version constraint for ${dep}: ${version}`,
            recommendation:
              "Use specific version ranges to avoid vulnerable versions",
            cwe: "CWE-1104",
          });
        }
      }

      // Check for missing security scripts
      const scripts = packageJson.scripts || {};
      if (!scripts["audit"] || !scripts["security-audit"]) {
        issues.push({
          severity: "low",
          category: "security-practices",
          file: packagePath,
          description: "Missing security audit scripts",
          recommendation:
            "Add npm audit and security audit scripts to package.json",
        });
      }
    } catch (error) {
      issues.push({
        severity: "medium",
        category: "configuration",
        file: join(projectPath, "package.json"),
        description: "Failed to audit package.json",
        recommendation: "Ensure package.json is valid and accessible",
      });
    }

    return issues;
  }

  private auditConfiguration(projectPath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    const configFiles = [
      ".opencode/oh-my-opencode.json",
      "config.json",
      ".env",
    ];

    for (const configFile of configFiles) {
      const configPath = join(projectPath, configFile);
      try {
        const content = readFileSync(configPath, "utf-8");

        // Check for hardcoded secrets
        const secretPatterns = [
          /password\s*[:=]\s*['"][^'"]*['"]/gi,
          /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/gi,
          /secret\s*[:=]\s*['"][^'"]*['"]/gi,
          /token\s*[:=]\s*['"][^'"]*['"]/gi,
        ];

        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            issues.push({
              severity: "high",
              category: "hardcoded-secrets",
              file: configPath,
              description:
                "Potential hardcoded secrets detected in configuration",
              recommendation:
                "Move secrets to environment variables or secure vault",
              cwe: "CWE-798",
            });
            break;
          }
        }
      } catch (error) {
        // Config file doesn't exist or can't be read
      }
    }

    return issues;
  }

  private auditDependencies(projectPath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    try {
      const packageLockPath = join(projectPath, "package-lock.json");
      const yarnLockPath = join(projectPath, "yarn.lock");

      if (
        !statSync(packageLockPath).isFile() &&
        !statSync(yarnLockPath).isFile()
      ) {
        issues.push({
          severity: "medium",
          category: "dependency-management",
          file: join(projectPath, "package.json"),
          description: "Missing lockfile (package-lock.json or yarn.lock)",
          recommendation:
            "Use lockfiles to ensure reproducible and secure dependency versions",
          cwe: "CWE-1104",
        });
      }
    } catch (error) {
      // Lockfile check failed
    }

    return issues;
  }

  private getRecommendationForCategory(category: string): string {
    const recommendations: Record<string, string> = {
      "code-injection":
        "Use static code analysis and avoid dynamic code execution",
      "command-injection":
        "Validate and sanitize all user inputs, use parameterized commands",
      "sql-injection":
        "Use parameterized queries or ORM with built-in protection",
      "path-traversal":
        "Validate paths, use allowlists, resolve to absolute paths",
      "hardcoded-secrets":
        "Use environment variables or secure credential management",
      "weak-cryptography":
        "Use cryptographically secure random number generators",
      "information-disclosure":
        "Avoid logging sensitive information, use proper log levels",
      "input-validation":
        "Implement comprehensive input validation and sanitization",
      deserialization:
        "Validate serialized data, use safe deserialization libraries",
      "race-conditions": "Use proper synchronization primitives",
      "dangerous-imports": "Review usage and implement proper access controls",
      "file-permissions":
        "Restrict file permissions to minimum required access",
    };

    return (
      recommendations[category] ||
      "Review and implement appropriate security measures"
    );
  }

  private generateSummary(issues: SecurityIssue[]) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const issue of issues) {
      summary[issue.severity]++;
    }

    return summary;
  }

  private calculateSecurityScore(
    issues: SecurityIssue[],
    totalFiles: number,
  ): number {
    let score = 100;

    // Weight issues by severity
    const weights = {
      critical: 20,
      high: 10,
      medium: 5,
      low: 2,
      info: 1,
    };

    for (const issue of issues) {
      score -= weights[issue.severity];
    }

    // Bonus for having many files (indicates thorough codebase)
    if (totalFiles > 50) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate security audit report
   */
  generateReport(result: SecurityAuditResult): string {
    let report = `# 🔒 StringRay Framework Security Audit Report

**Audit Date:** ${new Date().toISOString()}
**Framework Version:** v1.0.0
**Files Scanned:** ${result.totalFiles}
**Security Score:** ${result.score}/100

## 📊 Summary

- **Critical Issues:** ${result.summary.critical}
- **High Severity:** ${result.summary.high}
- **Medium Severity:** ${result.summary.medium}
- **Low Severity:** ${result.summary.low}
- **Informational:** ${result.summary.info}

## 🚨 Issues Found

`;

    if (result.issues.length === 0) {
      report += "✅ No security issues found!\n\n";
    } else {
      // Group issues by severity
      const groupedIssues = result.issues.reduce(
        (groups, issue) => {
          if (!groups[issue.severity]) groups[issue.severity] = [];
          groups[issue.severity]!.push(issue);
          return groups;
        },
        {} as Record<string, SecurityIssue[]>,
      );

      for (const [severity, issues] of Object.entries(groupedIssues)) {
        report += `### ${severity.toUpperCase()} SEVERITY (${issues.length})\n\n`;
        for (const issue of issues) {
          report += `**${issue.category.toUpperCase()}** in \`${issue.file}\`${issue.line ? `:${issue.line}` : ""}\n`;
          report += `${issue.description}\n`;
          report += `💡 ${issue.recommendation}\n`;
          if (issue.cwe) {
            report += `🔗 CWE: ${issue.cwe}\n`;
          }
          report += "\n";
        }
      }
    }

    report += `## 🛡️ Security Recommendations

1. **Address all Critical and High severity issues immediately**
2. **Implement automated security scanning in CI/CD pipeline**
3. **Regular security audits and dependency updates**
4. **Use security headers and secure coding practices**
5. **Monitor for new vulnerabilities in dependencies**

## 📈 Score Interpretation

- **90-100:** Excellent security posture
- **80-89:** Good security with minor issues
- **70-79:** Adequate security, address high-priority issues
- **60-69:** Security concerns present, immediate action required
- **<60:** Critical security issues, immediate remediation needed

---
*Generated by StringRay Security Auditor v1.0.0*
`;

    return report;
  }
}

// Export singleton instance
export const securityAuditor = new SecurityAuditor();
