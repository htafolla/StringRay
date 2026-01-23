/**
 * StringRay AI v1.1.1 - Security Hardening Module
 *
 * Implements additional security measures and hardening for the framework.
 * Addresses vulnerabilities identified during security audit.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { SecurityIssue } from "./security-auditor";
export interface SecurityHardeningConfig {
    enableInputValidation: boolean;
    enableRateLimiting: boolean;
    enableAuditLogging: boolean;
    enableSecureHeaders: boolean;
    maxRequestSizeBytes: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
}
export declare class SecurityHardener {
    private config;
    constructor(config?: Partial<SecurityHardeningConfig>);
    /**
     * Apply security hardening based on audit results
     */
    hardenSecurity(auditResult: {
        issues: SecurityIssue[];
    }): Promise<{
        appliedFixes: string[];
        remainingIssues: SecurityIssue[];
    }>;
    private applyFixForIssue;
    private fixHardcodedSecrets;
    private fixFilePermissions;
    private fixDependencyManagement;
    private addInputValidation;
    /**
     * Add security headers to HTTP responses
     */
    addSecurityHeaders(headers: Record<string, string>): Record<string, string>;
    /**
     * Validate input data
     */
    validateInput(input: any, schema: any): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Check rate limiting
     */
    checkRateLimit(identifier: string, requests: Map<string, number[]>): boolean;
    /**
     * Log security events
     */
    logSecurityEvent(event: {
        type: string;
        severity: "low" | "medium" | "high" | "critical";
        message: string;
        metadata?: Record<string, any>;
    }): void;
}
export declare const securityHardener: SecurityHardener;
//# sourceMappingURL=security-hardener.d.ts.map