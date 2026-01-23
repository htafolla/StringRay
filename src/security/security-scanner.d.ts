/**
 * StringRay Framework - Security Scanner
 *
 * Automated security vulnerability scanning and compliance validation
 * Integrates with security tools and provides comprehensive security reports
 */
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
export declare class SecurityScanner {
    private config;
    constructor(config?: Partial<SecurityScanConfig>);
    /**
     * Run comprehensive security scan
     */
    runSecurityScan(): Promise<SecurityReport>;
    /**
     * Run npm audit
     */
    private runNpmAudit;
    /**
     * Run Trivy security scan
     */
    private runTrivyScan;
    /**
     * Run ESLint security rules
     */
    private runEslintSecurity;
    /**
     * Run OWASP Dependency Check
     */
    private runDependencyCheck;
    /**
     * Generate comprehensive security report
     */
    private generateReport;
    /**
     * Generate security recommendations
     */
    private generateRecommendations;
    /**
     * Save report to file
     */
    private saveReport;
    /**
     * Log security scan results
     */
    private logResults;
    /**
     * Map npm audit severity levels
     */
    private mapNpmSeverity;
    /**
     * Map Trivy severity levels
     */
    private mapTrivySeverity;
    /**
     * Map Dependency Check severity levels
     */
    private mapDependencyCheckSeverity;
    /**
     * Validate AI prompt security
     */
    validatePrompt(prompt: string): Promise<{
        isSafe: boolean;
        violations: string[];
        riskLevel: string;
    }>;
    /**
     * Validate AI response security
     */
    validateResponse(response: string): Promise<{
        isSafe: boolean;
        violations: string[];
        riskLevel: string;
    }>;
    /**
     * Create empty report when scanning is disabled
     */
    private createEmptyReport;
}
export declare const securityScanner: SecurityScanner;
//# sourceMappingURL=security-scanner.d.ts.map