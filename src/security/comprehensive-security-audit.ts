/**
 * 0xRay Comprehensive Security Audit System
 *
 * Multi-agent security audit system with vulnerability scanning,
 * automated remediation, compliance checking, and weighted voting
 * for architectural decisions.
 *
 * @version 1.22.13
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { frameworkLogger } from "../core/framework-logger.js";

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
export type ComplianceStandard = "owasp-top-10" | "cwe" | "nist" | "iso-27001" | "pci-dss";

export interface Vulnerability {
  id: string;
  title: string;
  severity: SeverityLevel;
  category: VulnerabilityCategory;
  cwe: string;
  owasp?: string | undefined;
  file: string;
  line: number;
  column?: number | undefined;
  description: string;
  impact: string;
  recommendation: string;
  codeSnippet: string;
  confidence: number;
  autoRemediation?: RemediationStep[] | undefined;
}

export type VulnerabilityCategory =
  | "injection"
  | "authentication"
  | "authorization"
  | "cryptography"
  | "configuration"
  | "data-protection"
  | "input-validation"
  | "sensitive-data-exposure"
  | "security-misconfiguration"
  | "dependency-vulnerability";

export interface RemediationStep {
  step: number;
  action: string;
  code?: string | undefined;
  file?: string | undefined;
  line?: number | undefined;
  estimatedEffort: "low" | "medium" | "high";
  automated: boolean;
}

export interface SecurityAuditConfig {
  projectPath: string;
  scanDepth?: "shallow" | "medium" | "deep";
  includeDependencies?: boolean;
  complianceStandards?: ComplianceStandard[];
  enableAutoRemediation?: boolean;
  enableWeightedVoting?: boolean;
  agentWeights?: Record<string, number>;
  outputPath?: string | undefined;
}

export interface WeightedVote {
  agentId: string;
  agentName: string;
  vote: "approve" | "reject" | "abstain";
  weight: number;
  reasoning: string;
  concerns?: string[] | undefined;
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  votes: WeightedVote[];
  finalDecision: "approved" | "rejected" | "needs-revision";
  approvedBy: WeightedVote[];
  rejectedBy: WeightedVote[];
  timestamp: Date;
}

export interface ComplianceResult {
  standard: ComplianceStandard;
  passed: boolean;
  score: number;
  findings: Vulnerability[];
  recommendations: string[];
}

export interface SecurityAuditReport {
  metadata: {
    auditId: string;
    timestamp: Date;
    projectPath: string;
    totalFilesScanned: number;
    duration: number;
  };
  summary: {
    totalVulnerabilities: number;
    bySeverity: Record<SeverityLevel, number>;
    byCategory: Record<VulnerabilityCategory, number>;
    securityScore: number;
    complianceScore: number;
  };
  vulnerabilities: Vulnerability[];
  compliance: ComplianceResult[];
  remediation: {
    totalIssues: number;
    automatable: number;
    manualRequired: number;
    estimatedFixTime: string;
    prioritizedFixes: RemediationPlan[];
  };
  architecturalDecisions: ArchitecturalDecision[];
  agentConsensus: {
    participatingAgents: string[];
    averageAgreement: number;
    contentiousIssues: Vulnerability[];
  } | undefined;
}

export interface RemediationPlan {
  vulnerabilityId: string;
  title: string;
  severity: SeverityLevel;
  priority: number;
  steps: RemediationStep[];
  dependencies: string[];
  estimatedTime: string;
}

export class ComprehensiveSecurityAuditSystem {
  private config: SecurityAuditConfig;
  private vulnerabilities: Vulnerability[] = [];
  private architecturalDecisions: ArchitecturalDecision[] = [];
  private agentVotes: Map<string, WeightedVote[]> = new Map();

  private readonly severityWeights: Record<SeverityLevel, number> = {
    critical: 20,
    high: 10,
    medium: 5,
    low: 2,
    info: 0,
  };

  private readonly defaultAgentWeights: Record<string, number> = {
    "security-auditor": 0.35,
    "code-analyzer": 0.30,
    "testing-lead": 0.20,
    "architect": 0.15,
  };

  private readonly dangerousPatterns: PatternRule[] = [
    {
      pattern: /eval\s*\(/g,
      severity: "critical",
      category: "injection",
      cwe: "CWE-95",
      owasp: "A03:2021-Injection",
      title: "Code Injection via eval()",
      impact: "Arbitrary code execution possible",
      recommendation: "Avoid eval(). Use safer alternatives like JSON.parse() for data",
      autoRemediation: {
        action: "Replace eval() with safe alternative",
        automated: false,
        estimatedEffort: "medium",
      },
    },
    {
      pattern: /Function\s*\(/g,
      severity: "critical",
      category: "injection",
      cwe: "CWE-95",
      owasp: "A03:2021-Injection",
      title: "Dynamic Function Creation",
      impact: "Arbitrary code execution possible",
      recommendation: "Use direct function calls instead of dynamic construction",
      autoRemediation: {
        action: "Replace Function() with named function",
        automated: false,
        estimatedEffort: "medium",
      },
    },
    {
      pattern: /child_process\.exec\s*\(/g,
      severity: "critical",
      category: "injection",
      cwe: "CWE-78",
      owasp: "A03:2021-Injection",
      title: "Command Injection via exec()",
      impact: "OS command injection possible",
      recommendation: "Use execFile() with validated arguments or avoid shell commands",
      autoRemediation: {
        action: "Replace exec() with execFile()",
        automated: false,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /child_process\.spawn\s*\(/g,
      severity: "high",
      category: "injection",
      cwe: "CWE-78",
      owasp: "A03:2021-Injection",
      title: "Potential Command Injection via spawn()",
      impact: "Shell injection possible with user input",
      recommendation: "Validate all spawn arguments, avoid shell: true",
      autoRemediation: {
        action: "Add argument validation",
        automated: false,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /execSync\s*\(/g,
      severity: "high",
      category: "injection",
      cwe: "CWE-78",
      owasp: "A03:2021-Injection",
      title: "Command Injection via execSync()",
      impact: "Synchronous OS command injection",
      recommendation: "Use execFileSync() or avoid shell execution",
      autoRemediation: {
        action: "Replace execSync() with execFileSync()",
        automated: false,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi,
      severity: "high",
      category: "sensitive-data-exposure",
      cwe: "CWE-798",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Hardcoded Password Detected",
      impact: "Credentials exposed in source code",
      recommendation: "Use environment variables or secure secret management",
      autoRemediation: {
        action: "Move to environment variable",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      severity: "high",
      category: "sensitive-data-exposure",
      cwe: "CWE-798",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Hardcoded API Key Detected",
      impact: "API keys exposed in source code",
      recommendation: "Use environment variables or secure vault",
      autoRemediation: {
        action: "Move to environment variable",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      severity: "high",
      category: "sensitive-data-exposure",
      cwe: "CWE-798",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Hardcoded Secret Detected",
      impact: "Secrets exposed in source code",
      recommendation: "Use secure secret management solution",
      autoRemediation: {
        action: "Move to secure vault",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /token\s*[:=]\s*['"][^'"]+['"]/gi,
      severity: "medium",
      category: "sensitive-data-exposure",
      cwe: "CWE-798",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Hardcoded Token Detected",
      impact: "Tokens exposed in source code",
      recommendation: "Use secure token storage or environment variables",
      autoRemediation: {
        action: "Move to environment variable",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /Math\.random\s*\(/g,
      severity: "medium",
      category: "cryptography",
      cwe: "CWE-338",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Weak Random Number Generation",
      impact: "Predictable random values for security-sensitive operations",
      recommendation: "Use crypto.randomBytes() or crypto.randomUUID()",
      autoRemediation: {
        action: "Replace with crypto.randomBytes()",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /md5\s*\(/gi,
      severity: "high",
      category: "cryptography",
      cwe: "CWE-328",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Weak Hashing Algorithm (MD5)",
      impact: "MD5 is cryptographically broken",
      recommendation: "Use SHA-256+ or bcrypt/argon2 for passwords",
      autoRemediation: {
        action: "Replace with SHA-256 or bcrypt",
        automated: false,
        estimatedEffort: "medium",
      },
    },
    {
      pattern: /sha1\s*\(/gi,
      severity: "medium",
      category: "cryptography",
      cwe: "CWE-328",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Weak Hashing Algorithm (SHA-1)",
      impact: "SHA-1 is deprecated for security purposes",
      recommendation: "Use SHA-256+ or bcrypt/argon2 for passwords",
      autoRemediation: {
        action: "Replace with SHA-256 or bcrypt",
        automated: false,
        estimatedEffort: "medium",
      },
    },
    {
      pattern: /console\.log\s*\([^)]*(password|secret|token|key)[^)]*\)/gi,
      severity: "high",
      category: "data-protection",
      cwe: "CWE-532",
      owasp: "A09:2021-Security Logging and Monitoring Failures",
      title: "Sensitive Data Logging",
      impact: "Credentials exposed in logs",
      recommendation: "Never log sensitive data. Redact or mask sensitive values",
      autoRemediation: {
        action: "Remove sensitive data from log statement",
        automated: false,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /http:\/\//g,
      severity: "high",
      category: "data-protection",
      cwe: "CWE-319",
      owasp: "A02:2021-Cryptographic Failures",
      title: "Insecure HTTP Connection",
      impact: "Data transmitted in plaintext",
      recommendation: "Use HTTPS for all external connections",
      autoRemediation: {
        action: "Replace http:// with https://",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /cors.*\*|CORS.*\*|allow-all/gi,
      severity: "medium",
      category: "security-misconfiguration",
      cwe: "CWE-942",
      owasp: "A05:2021-Security Misconfiguration",
      title: "Overly Permissive CORS Configuration",
      impact: "Any origin can access resources",
      recommendation: "Specify allowed origins explicitly",
      autoRemediation: {
        action: "Configure specific allowed origins",
        automated: false,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /DEBUG\s*[:=]\s*true/gi,
      severity: "medium",
      category: "security-misconfiguration",
      cwe: "CWE-489",
      owasp: "A05:2021-Security Misconfiguration",
      title: "Debug Mode Enabled",
      impact: "Sensitive information may be exposed",
      recommendation: "Disable debug mode in production",
      autoRemediation: {
        action: "Disable DEBUG in production",
        automated: true,
        estimatedEffort: "low",
      },
    },
    {
      pattern: /\.\.[/\\]/,
      severity: "high",
      category: "injection",
      cwe: "CWE-22",
      owasp: "A01:2021-Broken Access Control",
      title: "Potential Path Traversal",
      impact: "Unauthorized file access possible",
      recommendation: "Validate and sanitize all file paths. Use path.resolve()",
      autoRemediation: {
        action: "Add path validation",
        automated: false,
        estimatedEffort: "medium",
      },
    },
    {
      pattern: /path\.join\s*\(\s*.*,\s*.*\.\./g,
      severity: "high",
      category: "injection",
      cwe: "CWE-22",
      owasp: "A01:2021-Broken Access Control",
      title: "Path Traversal via path.join()",
      impact: "Directory traversal attack possible",
      recommendation: "Validate paths and use allowlists",
      autoRemediation: {
        action: "Add path validation and sanitization",
        automated: false,
        estimatedEffort: "medium",
      },
    },
  ];

  constructor(config: SecurityAuditConfig) {
    this.config = {
      includeDependencies: true,
      enableAutoRemediation: true,
      enableWeightedVoting: true,
      complianceStandards: ["owasp-top-10", "cwe"],
      agentWeights: this.defaultAgentWeights,
      ...config,
      scanDepth: config.scanDepth ?? "medium",
    } as Required<SecurityAuditConfig>;
  }

  async runAudit(): Promise<SecurityAuditReport> {
    const startTime = Date.now();
    const auditId = `security-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    frameworkLogger.log("comprehensive-security-audit", "audit-start", "info", {
      auditId,
      projectPath: this.config.projectPath,
      config: this.config,
    });

    const files = this.getProjectFiles();
    this.vulnerabilities = [];

    for (const file of files) {
      const fileVulns = await this.auditFile(file);
      this.vulnerabilities.push(...fileVulns);
    }

    if (this.config.includeDependencies) {
      this.vulnerabilities.push(...this.auditDependencies());
    }

    const complianceResults = this.checkCompliance();
    const remediation = this.generateRemediationPlan();

    if (this.config.enableWeightedVoting) {
      await this.collectAgentVotes();
      this.resolveArchitecturalDecisions();
    }

    const report: SecurityAuditReport = {
      metadata: {
        auditId,
        timestamp: new Date(),
        projectPath: this.config.projectPath,
        totalFilesScanned: files.length,
        duration: Date.now() - startTime,
      },
      summary: this.calculateSummary(),
      vulnerabilities: this.vulnerabilities,
      compliance: complianceResults,
      remediation,
      architecturalDecisions: this.architecturalDecisions,
      agentConsensus: this.config.enableWeightedVoting
        ? this.calculateAgentConsensus()
        : undefined,
    };

    if (this.config.outputPath) {
      this.saveReport(report);
    }

    frameworkLogger.log("comprehensive-security-audit", "audit-complete", "info", {
      auditId,
      totalVulnerabilities: this.vulnerabilities.length,
      securityScore: report.summary.securityScore,
    });

    return report;
  }

  private getProjectFiles(): string[] {
    const files: string[] = [];
    const skipDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      ".nuxt",
      "coverage",
      ".opencode",
      "var",
      "ci-test-env",
    ];

    const traverse = (dir: string) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            if (!skipDirs.includes(item) && !item.startsWith(".")) {
              traverse(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = item.slice(item.lastIndexOf("."));
            if ([".ts", ".tsx", ".js", ".jsx", ".json"].includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    };

    traverse(this.config.projectPath);
    return files;
  }

  private async auditFile(filePath: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        for (const rule of this.dangerousPatterns) {
          if (rule.pattern.test(line)) {
            const vuln = this.createVulnerability(rule, filePath, i + 1, line);
            if (!this.isFalsePositive(vuln, filePath)) {
              vulnerabilities.push(vuln);
            }
          }
        }
      }

      vulnerabilities.push(...this.auditImports(content, filePath));
    } catch {
      // Skip files that can't be read
    }

    return vulnerabilities;
  }

  private createVulnerability(
    rule: PatternRule,
    filePath: string,
    line: number,
    codeSnippet: string,
  ): Vulnerability {
    return {
      id: `VULN-${rule.category}-${filePath}-${line}`,
      title: rule.title,
      severity: rule.severity,
      category: rule.category,
      cwe: rule.cwe,
      owasp: rule.owasp,
      file: filePath,
      line,
      description: `Pattern detected: ${rule.title}`,
      impact: rule.impact,
      recommendation: rule.recommendation,
      codeSnippet: codeSnippet.trim(),
      confidence: 85,
      autoRemediation: rule.autoRemediation
        ? [
            {
              step: 1,
              action: rule.autoRemediation.action,
              code: rule.autoRemediation.code,
              file: filePath,
              line,
              estimatedEffort: rule.autoRemediation.estimatedEffort,
              automated: rule.autoRemediation.automated,
            },
          ]
        : undefined,
    };
  }

  private isFalsePositive(vuln: Vulnerability, filePath: string): boolean {
    if (filePath.includes("security-auditor") && vuln.category === "injection") {
      return true;
    }

    if (filePath.includes("__tests__")) {
      return true;
    }

    if (vuln.codeSnippet.includes("'eval(')") || vuln.codeSnippet.includes('"eval(')) {
      return true;
    }

    return false;
  }

  private auditImports(content: string, filePath: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const dangerousImports = ["crypto", "tls", "cluster", "worker_threads", "vm"];

    for (const imp of dangerousImports) {
      const patterns = [
        new RegExp(`import.*from.*['"]${imp}['"]`),
        new RegExp(`require\\s*\\(\\s*['"]${imp}['"]\\s*\\)`),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          vulnerabilities.push({
            id: `IMP-${imp}-${filePath}`,
            title: `Dangerous Import: ${imp}`,
            severity: "info",
            category: "security-misconfiguration",
            cwe: "CWE-350",
            file: filePath,
            line: 1,
            description: `Import of sensitive module: ${imp}`,
            impact: "Module usage should be reviewed for security implications",
            recommendation: "Ensure proper access controls and validation when using this module",
            codeSnippet: content.match(pattern)?.[0] || "",
            confidence: 70,
          });
          break;
        }
      }
    }

    return vulnerabilities;
  }

  private auditDependencies(): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    try {
      const packagePath = join(this.config.projectPath, "package.json");
      const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      for (const [dep, version] of Object.entries(allDeps)) {
        if (typeof version === "string" && (version === "*" || version === "latest")) {
          vulnerabilities.push({
            id: `DEP-${dep}`,
            title: `Unpinned Dependency: ${dep}`,
            severity: "medium",
            category: "dependency-vulnerability",
            cwe: "CWE-1104",
            file: packagePath,
            line: 1,
            description: `Dependency version not pinned: ${dep}`,
            impact: "May receive vulnerable updates without review",
            recommendation: "Pin to specific version range for reproducibility",
            codeSnippet: `${dep}: "${version}"`,
            confidence: 90,
          });
        }
      }
    } catch {
      // Skip if package.json not found
    }

    return vulnerabilities;
  }

  private checkCompliance(): ComplianceResult[] {
    const results: ComplianceResult[] = [];
    const standards = this.config.complianceStandards ?? ["owasp-top-10", "cwe"];

    for (const standard of standards) {
      results.push(this.evaluateStandard(standard));
    }

    return results;
  }

  private evaluateStandard(standard: ComplianceStandard): ComplianceResult {
    const vulnsByCategory = this.groupByCategory();

    switch (standard) {
      case "owasp-top-10":
        return this.evaluateOWASP(vulnsByCategory);
      case "cwe":
        return this.evaluateCWE();
      case "nist":
        return this.evaluateNIST();
      case "iso-27001":
        return this.evaluateISO27001();
      case "pci-dss":
        return this.evaluatePCIDSS();
      default:
        return {
          standard,
          passed: true,
          score: 100,
          findings: [],
          recommendations: [],
        };
    }
  }

  private evaluateOWASP(
    vulnsByCategory: Record<string, Vulnerability[]>,
  ): ComplianceResult {
    const owaspChecks: Record<string, string[]> = {
      "A01:2021-Broken Access Control": ["authorization", "injection"],
      "A02:2021-Cryptographic Failures": ["cryptography", "sensitive-data-exposure"],
      "A03:2021-Injection": ["injection", "input-validation"],
      "A04:2021-Insecure Design": ["configuration"],
      "A05:2021-Security Misconfiguration": ["security-misconfiguration"],
      "A06:2021-Vulnerable Components": ["dependency-vulnerability"],
      "A07:2021-Authentication Failures": ["authentication"],
      "A08:2021-Software Integrity Failures": ["dependency-vulnerability"],
      "A09:2021-Security Logging Failures": ["data-protection"],
      "A10:2021-SSRF": ["injection"],
    };

    const findings: Vulnerability[] = [];
    let totalChecks = Object.keys(owaspChecks).length;
    let passedChecks = 0;

    for (const [owaspId, categories] of Object.entries(owaspChecks)) {
      const hasVulns = categories.some(
        (cat) => vulnsByCategory[cat] && vulnsByCategory[cat].length > 0,
      );

      if (!hasVulns) {
        passedChecks++;
      } else {
        findings.push(
          ...categories.flatMap((cat) => vulnsByCategory[cat] || []),
        );
      }
    }

    const score = Math.round((passedChecks / totalChecks) * 100);
    const passed = score >= 80;

    return {
      standard: "owasp-top-10",
      passed,
      score,
      findings: [...new Set(findings)],
      recommendations: passed
        ? []
        : ["Address vulnerabilities to improve OWASP Top 10 compliance"],
    };
  }

  private evaluateCWE(): ComplianceResult {
    const criticalCWEs = [
      "CWE-78", // OS Command Injection
      "CWE-89", // SQL Injection
      "CWE-95", // Code Injection
      "CWE-79", // XSS
      "CWE-306", // Missing Authentication
      "CWE-862", // Missing Authorization
      "CWE-798", // Hardcoded Credentials
    ];

    const criticalVulns = this.vulnerabilities.filter(
      (v) => v.severity === "critical" && criticalCWEs.includes(v.cwe),
    );

    const score = Math.max(0, 100 - criticalVulns.length * 20);
    const passed = criticalVulns.length === 0;

    return {
      standard: "cwe",
      passed,
      score,
      findings: criticalVulns,
      recommendations: criticalVulns.length > 0
        ? ["Address critical CWE vulnerabilities immediately"]
        : [],
    };
  }

  private evaluateNIST(): ComplianceResult {
    const findings = this.vulnerabilities.filter(
      (v) => v.severity === "critical" || v.severity === "high",
    );

    const score = Math.max(
      0,
      100 - findings.filter((v) => v.severity === "critical").length * 15 -
        findings.filter((v) => v.severity === "high").length * 5,
    );

    return {
      standard: "nist",
      passed: score >= 70,
      score,
      findings,
      recommendations: findings.length > 0
        ? ["Prioritize critical and high severity issues for NIST compliance"]
        : [],
    };
  }

  private evaluateISO27001(): ComplianceResult {
    const securityControls = {
      accessControl: this.vulnerabilities.filter(
        (v) => v.category === "authentication" || v.category === "authorization",
      ),
      cryptography: this.vulnerabilities.filter(
        (v) => v.category === "cryptography",
      ),
      dataProtection: this.vulnerabilities.filter(
        (v) => v.category === "sensitive-data-exposure",
      ),
    };

    const controlScores = Object.values(securityControls).map(
      (vulns) => Math.max(0, 100 - vulns.length * 10),
    );
    const score = Math.round(
      controlScores.reduce((a, b) => a + b, 0) / controlScores.length,
    );

    return {
      standard: "iso-27001",
      passed: score >= 80,
      score,
      findings: Object.values(securityControls).flat(),
      recommendations:
        score < 80
          ? ["Strengthen security controls for ISO 27001 compliance"]
          : [],
    };
  }

  private evaluatePCIDSS(): ComplianceResult {
    const pciVulns = this.vulnerabilities.filter(
      (v) =>
        v.category === "cryptography" ||
        v.category === "sensitive-data-exposure" ||
        v.severity === "critical",
    );

    const score = Math.max(0, 100 - pciVulns.length * 10);

    return {
      standard: "pci-dss",
      passed: score >= 90,
      score,
      findings: pciVulns,
      recommendations:
        score < 90
          ? [
              "Critical security issues must be resolved for PCI DSS compliance",
            ]
          : [],
    };
  }

  private groupByCategory(): Record<string, Vulnerability[]> {
    return this.vulnerabilities.reduce(
      (acc, vuln) => {
        if (!acc[vuln.category]) {
          acc[vuln.category] = [];
        }
        acc[vuln.category]!.push(vuln);
        return acc;
      },
      {} as Record<string, Vulnerability[]>,
    );
  }

  private generateRemediationPlan(): SecurityAuditReport["remediation"] {
    const automatable: Vulnerability[] = [];
    const manualRequired: Vulnerability[] = [];

    for (const vuln of this.vulnerabilities) {
      if (vuln.autoRemediation?.[0]?.automated) {
        automatable.push(vuln);
      } else {
        manualRequired.push(vuln);
      }
    }

    const prioritizedFixes = this.prioritizeFixes([
      ...automatable,
      ...manualRequired,
    ]);

    const totalTime = this.estimateFixTime(prioritizedFixes);

    return {
      totalIssues: this.vulnerabilities.length,
      automatable: automatable.length,
      manualRequired: manualRequired.length,
      estimatedFixTime: totalTime,
      prioritizedFixes,
    };
  }

  private prioritizeFixes(vulnerabilities: Vulnerability[]): RemediationPlan[] {
    const severityPriority: Record<SeverityLevel, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
      info: 5,
    };

    const plans: RemediationPlan[] = vulnerabilities.map((vuln) => ({
      vulnerabilityId: vuln.id,
      title: vuln.title,
      severity: vuln.severity,
      priority: severityPriority[vuln.severity],
      steps: vuln.autoRemediation || [],
      dependencies: [],
      estimatedTime: this.estimateFixTimeForVuln(vuln),
    }));

    return plans.sort((a, b) => a.priority - b.priority);
  }

  private estimateFixTime(vulnerabilities: RemediationPlan[]): string {
    let totalMinutes = 0;

    for (const plan of vulnerabilities) {
      switch (plan.estimatedTime) {
        case "15 minutes":
          totalMinutes += 15;
          break;
        case "1 hour":
          totalMinutes += 60;
          break;
        case "4 hours":
          totalMinutes += 240;
          break;
        default:
          totalMinutes += 30;
      }
    }

    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else if (totalMinutes < 480) {
      return `${Math.round(totalMinutes / 60)} hours`;
    } else {
      return `${Math.round(totalMinutes / 480)} days`;
    }
  }

  private estimateFixTimeForVuln(vuln: Vulnerability): string {
    const effort = vuln.autoRemediation?.[0]?.estimatedEffort;
    switch (effort) {
      case "low":
        return "15 minutes";
      case "medium":
        return "1 hour";
      case "high":
        return "4 hours";
      default:
        return "30 minutes";
    }
  }

  private calculateSummary(): SecurityAuditReport["summary"] {
    const bySeverity: Record<SeverityLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const byCategory: Record<VulnerabilityCategory, number> = {
      injection: 0,
      authentication: 0,
      authorization: 0,
      cryptography: 0,
      configuration: 0,
      "data-protection": 0,
      "input-validation": 0,
      "sensitive-data-exposure": 0,
      "security-misconfiguration": 0,
      "dependency-vulnerability": 0,
    };

    for (const vuln of this.vulnerabilities) {
      bySeverity[vuln.severity]++;
      byCategory[vuln.category]++;
    }

    let securityScore = 100;
    for (const [severity, count] of Object.entries(bySeverity)) {
      securityScore -= this.severityWeights[severity as SeverityLevel] * count;
    }
    securityScore = Math.max(0, Math.min(100, securityScore));

    const complianceScore = this.vulnerabilities.length === 0
      ? 100
      : Math.max(0, 100 - this.vulnerabilities.filter((v) => v.severity === "critical").length * 15);

    return {
      totalVulnerabilities: this.vulnerabilities.length,
      bySeverity,
      byCategory,
      securityScore,
      complianceScore,
    };
  }

  private async collectAgentVotes(): Promise<void> {
    const agents = Object.keys(this.config.agentWeights || this.defaultAgentWeights);

    for (const agent of agents) {
      const vote = this.simulateAgentVote(agent);
      this.agentVotes.set(agent, [vote]);
    }
  }

  private simulateAgentVote(agent: string): WeightedVote {
    const highSevVulns = this.vulnerabilities.filter(
      (v) => v.severity === "critical" || v.severity === "high",
    );

    const concerns: string[] = [];
    for (const vuln of highSevVulns.slice(0, 3)) {
      concerns.push(`Security concern: ${vuln.title}`);
    }

    const weight = this.config.agentWeights?.[agent] || this.defaultAgentWeights[agent] || 0.25;

    let vote: "approve" | "reject" | "abstain" = "approve";
    if (highSevVulns.length > 10) {
      vote = "reject";
    } else if (highSevVulns.length > 5) {
      vote = Math.random() > 0.5 ? "approve" : "abstain";
    }

    return {
      agentId: `agent-${agent}`,
      agentName: agent,
      vote,
      weight,
      reasoning: `Security review by ${agent} with ${weight * 100}% weight`,
      concerns: concerns.length > 0 ? concerns : undefined,
    };
  }

  private resolveArchitecturalDecisions(): void {
    for (const [agent, votes] of this.agentVotes) {
      const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0);
      const approvalWeight = votes
        .filter((v) => v.vote === "approve")
        .reduce((sum, v) => sum + v.weight, 0);

      const decision: ArchitecturalDecision = {
        id: `decision-${agent}-${Date.now()}`,
        title: `Security Architecture Decision for ${agent}`,
        description: "Review of security measures and vulnerability handling",
        proposedBy: agent,
        votes,
        finalDecision: approvalWeight / totalWeight >= 0.5 ? "approved" : "needs-revision",
        approvedBy: votes.filter((v) => v.vote === "approve"),
        rejectedBy: votes.filter((v) => v.vote === "reject"),
        timestamp: new Date(),
      };

      this.architecturalDecisions.push(decision);
    }
  }

  private calculateAgentConsensus(): SecurityAuditReport["agentConsensus"] {
    const participatingAgents = Array.from(this.agentVotes.keys());
    const allVotes = Array.from(this.agentVotes.values()).flat();

    const approvalCount = allVotes.filter((v) => v.vote === "approve").length;
    const totalVotes = allVotes.length;
    const averageAgreement = totalVotes > 0 ? (approvalCount / totalVotes) * 100 : 0;

    const contentiousVulns = this.vulnerabilities.filter(
      (v) => v.severity === "critical" || v.severity === "high",
    );

    return {
      participatingAgents,
      averageAgreement: Math.round(averageAgreement),
      contentiousIssues: contentiousVulns.slice(0, 10),
    };
  }

  private saveReport(report: SecurityAuditReport): void {
    const outputPath = this.config.outputPath || join(
      this.config.projectPath,
      "security-audit-report.json",
    );

    writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

    frameworkLogger.log(
      "comprehensive-security-audit",
      "report-saved",
      "info",
      { outputPath },
    );
  }

  generateMarkdownReport(report: SecurityAuditReport): string {
    let md = `# Security Audit Report

## Executive Summary

- **Audit ID**: ${report.metadata.auditId}
- **Timestamp**: ${report.metadata.timestamp.toISOString()}
- **Project Path**: ${report.metadata.projectPath}
- **Files Scanned**: ${report.metadata.totalFilesScanned}
- **Duration**: ${report.metadata.duration}ms

## Security Score

**${report.summary.securityScore}/100** ${this.getScoreEmoji(report.summary.securityScore)}

## Vulnerability Summary

| Severity | Count |
|----------|-------|
| Critical | ${report.summary.bySeverity.critical} |
| High | ${report.summary.bySeverity.high} |
| Medium | ${report.summary.bySeverity.medium} |
| Low | ${report.summary.bySeverity.low} |
| Info | ${report.summary.bySeverity.info} |

## Compliance Results

`;

    for (const compliance of report.compliance) {
      const status = compliance.passed ? "✅ PASS" : "❌ FAIL";
      md += `### ${compliance.standard.toUpperCase()} - ${status}\n`;
      md += `**Score**: ${compliance.score}/100\n\n`;
    }

    md += `## Detailed Findings\n\n`;

    if (report.vulnerabilities.length === 0) {
      md += "✅ No vulnerabilities found!\n\n";
    } else {
      for (const vuln of report.vulnerabilities) {
        md += `### ${this.getSeverityEmoji(vuln.severity)} ${vuln.title}\n\n`;
        md += `- **Severity**: ${vuln.severity.toUpperCase()}\n`;
        md += `- **File**: \`${vuln.file}:${vuln.line}\`\n`;
        md += `- **CWE**: ${vuln.cwe}\n`;
        if (vuln.owasp) md += `- **OWASP**: ${vuln.owasp}\n`;
        md += `- **Description**: ${vuln.description}\n`;
        md += `- **Impact**: ${vuln.impact}\n`;
        md += `- **Recommendation**: ${vuln.recommendation}\n`;
        md += `- **Confidence**: ${vuln.confidence}%\n\n`;
        md += `\`\`\`\n${vuln.codeSnippet}\n\`\`\`\n\n`;
        md += "---\n\n";
      }
    }

    md += `## Remediation Plan\n\n`;
    md += `- **Total Issues**: ${report.remediation.totalIssues}\n`;
    md += `- **Automatable Fixes**: ${report.remediation.automatable}\n`;
    md += `- **Manual Fixes Required**: ${report.remediation.manualRequired}\n`;
    md += `- **Estimated Fix Time**: ${report.remediation.estimatedFixTime}\n\n`;

    if (report.remediation.prioritizedFixes.length > 0) {
      md += "### Prioritized Fixes\n\n";
      md += "| Priority | Title | Severity | Est. Time |\n";
      md += "|----------|-------|----------|----------|\n";

      for (const fix of report.remediation.prioritizedFixes.slice(0, 20)) {
        md += `| ${fix.priority} | ${fix.title} | ${fix.severity} | ${fix.estimatedTime} |\n`;
      }
      md += "\n";
    }

    if (report.agentConsensus) {
      md += `## Agent Consensus\n\n`;
      md += `- **Participating Agents**: ${report.agentConsensus.participatingAgents.join(", ")}\n`;
      md += `- **Average Agreement**: ${report.agentConsensus.averageAgreement}%\n\n`;
    }

    md += `---\n*Generated by 0xRay Comprehensive Security Audit System v1.22.28*\n`;

    return md;
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return "🟢 Excellent";
    if (score >= 70) return "🟡 Good";
    if (score >= 50) return "🟠 Fair";
    return "🔴 Poor";
  }

  private getSeverityEmoji(severity: SeverityLevel): string {
    const emojis: Record<SeverityLevel, string> = {
      critical: "🚨",
      high: "🔴",
      medium: "🟡",
      low: "🟢",
      info: "ℹ️",
    };
    return emojis[severity];
  }

  addVote(vote: WeightedVote): void {
    const existing = this.agentVotes.get(vote.agentName) || [];
    existing.push(vote);
    this.agentVotes.set(vote.agentName, existing);
  }

  getVulnerabilities(): Vulnerability[] {
    return this.vulnerabilities;
  }

  getArchitecturalDecisions(): ArchitecturalDecision[] {
    return this.architecturalDecisions;
  }
}

interface PatternRule {
  pattern: RegExp;
  severity: SeverityLevel;
  category: VulnerabilityCategory;
  cwe: string;
  owasp?: string;
  title: string;
  impact: string;
  recommendation: string;
  autoRemediation?: {
    action: string;
    code?: string;
    automated: boolean;
    estimatedEffort: "low" | "medium" | "high";
  };
}

export function createSecurityAuditSystem(
  config: SecurityAuditConfig,
): ComprehensiveSecurityAuditSystem {
  return new ComprehensiveSecurityAuditSystem(config);
}

export async function runQuickSecurityAudit(
  projectPath: string,
): Promise<SecurityAuditReport> {
  const system = new ComprehensiveSecurityAuditSystem({
    projectPath,
    scanDepth: "shallow",
    includeDependencies: true,
    complianceStandards: ["owasp-top-10", "cwe"],
    enableAutoRemediation: true,
    enableWeightedVoting: true,
  });

  return system.runAudit();
}

export async function runDeepSecurityAudit(
  projectPath: string,
  outputPath?: string,
): Promise<SecurityAuditReport> {
  const system = new ComprehensiveSecurityAuditSystem({
    projectPath,
    scanDepth: "deep",
    includeDependencies: true,
    complianceStandards: ["owasp-top-10", "cwe", "nist", "iso-27001", "pci-dss"],
    enableAutoRemediation: true,
    enableWeightedVoting: true,
    outputPath,
  });

  return system.runAudit();
}
