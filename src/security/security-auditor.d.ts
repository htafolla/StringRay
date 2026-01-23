/**
 * StringRay AI v1.1.1 - Security Audit Tool
 *
 * Comprehensive security auditing for the framework and its components.
 * Identifies vulnerabilities, misconfigurations, and security weaknesses.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export interface SecurityIssue {
    severity: "critical" | "high" | "medium" | "low" | "info";
    category: string;
    file: string;
    line?: number;
    description: string;
    recommendation: string;
    cwe?: string;
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
    score: number;
}
export declare class SecurityAuditor {
    private readonly dangerousPatterns;
    private readonly dangerousImports;
    /**
     * Run comprehensive security audit
     */
    auditProject(projectPath?: string): Promise<SecurityAuditResult>;
    private getAllFiles;
    private shouldSkipDirectory;
    private shouldAuditFile;
    private auditFile;
    private isFalsePositive;
    private auditImports;
    private auditFilePermissions;
    private auditPackageJson;
    private auditConfiguration;
    private auditDependencies;
    private getRecommendationForCategory;
    private generateSummary;
    private calculateSecurityScore;
    /**
     * Generate security audit report
     */
    generateReport(result: SecurityAuditResult): string;
}
export declare const securityAuditor: SecurityAuditor;
//# sourceMappingURL=security-auditor.d.ts.map