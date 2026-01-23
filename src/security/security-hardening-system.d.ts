/**
 * StringRay AI v1.1.1 - Security Hardening System
 *
 * Comprehensive security hardening implementation with OWASP compliance.
 * Implements defense-in-depth security architecture for enterprise applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import { IncomingMessage, ServerResponse } from "http";
export declare const SECURITY_CONFIG: {
    readonly headers: {
        readonly "X-Content-Type-Options": "nosniff";
        readonly "X-Frame-Options": "DENY";
        readonly "X-XSS-Protection": "1; mode=block";
        readonly "Strict-Transport-Security": "max-age=31536000; includeSubDomains";
        readonly "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'";
        readonly "Referrer-Policy": "strict-origin-when-cross-origin";
        readonly "Permissions-Policy": "geolocation=(), microphone=(), camera=()";
        readonly "Cross-Origin-Embedder-Policy": "require-corp";
        readonly "Cross-Origin-Opener-Policy": "same-origin";
        readonly "Cross-Origin-Resource-Policy": "same-origin";
    };
    readonly rateLimiting: {
        readonly windowMs: number;
        readonly maxRequests: 100;
        readonly skipSuccessfulRequests: false;
        readonly skipFailedRequests: false;
    };
    readonly inputValidation: {
        readonly maxStringLength: 10000;
        readonly maxArrayLength: 1000;
        readonly maxObjectDepth: 10;
        readonly allowedCharacters: RegExp;
        readonly sqlInjectionPatterns: readonly [RegExp, RegExp];
        readonly xssPatterns: readonly [RegExp, RegExp, RegExp, RegExp];
    };
    readonly encryption: {
        readonly algorithm: "aes-256-gcm";
        readonly keyLength: 32;
        readonly ivLength: 16;
        readonly saltRounds: 12;
    };
    readonly audit: {
        readonly logLevel: "detailed";
        readonly retentionDays: 90;
        readonly sensitiveFields: readonly ["password", "token", "secret", "key", "authorization"];
    };
};
export type SecurityEventType = "input_validation_failure" | "rate_limit_exceeded" | "authentication_failure" | "authorization_failure" | "suspicious_activity" | "sql_injection_attempt" | "xss_attempt" | "csrf_attempt" | "security_header_missing" | "encryption_failure" | "audit_log_failure";
export type SecuritySeverity = "low" | "medium" | "high" | "critical";
export interface SecurityEvent {
    id: string;
    type: SecurityEventType;
    severity: SecuritySeverity;
    message: string;
    source: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: number;
    metadata: Record<string, any>;
    stackTrace?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    sanitizedValue?: any;
    securityEvents: SecurityEvent[];
}
export interface RateLimitEntry {
    count: number;
    resetTime: number;
    lastRequest: number;
}
export interface SecurityMiddlewareOptions {
    enableRateLimiting?: boolean;
    enableInputValidation?: boolean;
    enableSecurityHeaders?: boolean;
    enableAuditLogging?: boolean;
    enableCsrfProtection?: boolean;
    enableHsts?: boolean;
    customHeaders?: Record<string, string>;
    trustedOrigins?: string[];
    rateLimitOptions?: Partial<typeof SECURITY_CONFIG.rateLimiting>;
}
/**
 * Core security hardening system
 */
export declare class SecurityHardeningSystem extends EventEmitter {
    private rateLimitStore;
    private securityEvents;
    private encryptionKey;
    private auditLogEnabled;
    constructor(encryptionKey?: string);
    /**
     * Setup event handlers for security events
     */
    private setupEventHandlers;
    /**
     * Create security middleware for HTTP requests
     */
    createSecurityMiddleware(options?: SecurityMiddlewareOptions): (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
    /**
     * Check rate limiting for requests
     */
    private checkRateLimit;
    /**
     * Apply security headers to response
     */
    private applySecurityHeaders;
    /**
     * Validate CSRF token
     */
    private validateCsrfToken;
    /**
     * Validate and sanitize input data
     */
    validateInput(input: any, context?: string): ValidationResult;
    /**
     * Validate string input
     */
    private validateString;
    /**
     * Validate object input
     */
    private validateObject;
    /**
     * Validate array input
     */
    private validateArray;
    /**
     * Check for security patterns in input
     */
    private checkSecurityPatterns;
    /**
     * Encrypt sensitive data
     */
    encryptData(data: string): string;
    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData: string): string;
    /**
     * Hash password securely
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate secure random token
     */
    generateSecureToken(length?: number): string;
    /**
     * Log audit event
     */
    private logAuditEvent;
    /**
     * Sanitize headers for audit logging
     */
    private sanitizeHeadersForAudit;
    /**
     * Emit security event
     */
    private emitSecurityEvent;
    /**
     * Handle security events
     */
    private handleSecurityEvent;
    /**
     * Handle rate limit exceeded
     */
    private handleRateLimitExceeded;
    /**
     * Handle validation failure
     */
    private handleValidationFailure;
    /**
     * Get client IP address
     */
    private getClientIP;
    /**
     * Get rate limit info for IP
     */
    private getRateLimitInfo;
    /**
     * Get object depth
     */
    private getObjectDepth;
    /**
     * Cleanup old rate limit entries
     */
    private cleanupRateLimitStore;
    /**
     * Get security events
     */
    getSecurityEvents(limit?: number): SecurityEvent[];
    /**
     * Clear security events
     */
    clearSecurityEvents(): void;
    /**
     * Get security statistics
     */
    getSecurityStats(): {
        totalEvents: number;
        eventsByType: Record<SecurityEventType, number>;
        eventsBySeverity: Record<SecuritySeverity, number>;
        recentEvents: SecurityEvent[];
    };
    /**
     * Enable/disable audit logging
     */
    setAuditLogging(enabled: boolean): void;
}
export declare const securityHardeningSystem: SecurityHardeningSystem;
//# sourceMappingURL=security-hardening-system.d.ts.map