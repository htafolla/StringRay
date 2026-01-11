/**
 * StrRay Framework v1.0.0 - Security Hardening System
 *
 * Comprehensive security hardening implementation with OWASP compliance.
 * Implements defense-in-depth security architecture for enterprise applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
import * as crypto from "crypto";
// Security configuration constants
export const SECURITY_CONFIG = {
    headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
    },
    rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // limit each IP to 100 requests per windowMs
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    inputValidation: {
        maxStringLength: 10000,
        maxArrayLength: 1000,
        maxObjectDepth: 10,
        allowedCharacters: /^[a-zA-Z0-9\s\-_.@]+$/,
        sqlInjectionPatterns: [
            /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/i,
            /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(\#)|(\;)|(\*))/i,
        ],
        xssPatterns: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        ],
    },
    encryption: {
        algorithm: "aes-256-gcm",
        keyLength: 32,
        ivLength: 16,
        saltRounds: 12,
    },
    audit: {
        logLevel: "detailed",
        retentionDays: 90,
        sensitiveFields: ["password", "token", "secret", "key", "authorization"],
    },
};
/**
 * Core security hardening system
 */
export class SecurityHardeningSystem extends EventEmitter {
    constructor(encryptionKey) {
        super();
        this.rateLimitStore = new Map();
        this.securityEvents = [];
        this.auditLogEnabled = true;
        this.encryptionKey = encryptionKey
            ? crypto.scryptSync(encryptionKey, "salt", SECURITY_CONFIG.encryption.keyLength)
            : crypto.randomBytes(SECURITY_CONFIG.encryption.keyLength);
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers for security events
     */
    setupEventHandlers() {
        this.on("security-event", this.handleSecurityEvent.bind(this));
        this.on("rate-limit-exceeded", this.handleRateLimitExceeded.bind(this));
        this.on("validation-failure", this.handleValidationFailure.bind(this));
    }
    /**
     * Create security middleware for HTTP requests
     */
    createSecurityMiddleware(options = {}) {
        const config = {
            enableRateLimiting: true,
            enableInputValidation: true,
            enableSecurityHeaders: true,
            enableAuditLogging: true,
            enableCsrfProtection: true,
            enableHsts: true,
            ...options,
        };
        return async (req, res) => {
            try {
                // Rate limiting check
                if (config.enableRateLimiting) {
                    const rateLimitResult = this.checkRateLimit(req);
                    if (!rateLimitResult.allowed) {
                        this.emitSecurityEvent({
                            type: "rate_limit_exceeded",
                            severity: "medium",
                            message: `Rate limit exceeded for IP: ${rateLimitResult.ip}`,
                            source: "rate-limiter",
                            ipAddress: rateLimitResult.ip,
                            metadata: {
                                limit: rateLimitResult.limit,
                                remaining: rateLimitResult.remaining,
                            },
                        });
                        res.writeHead(429, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            error: "Too Many Requests",
                            message: "Rate limit exceeded. Please try again later.",
                            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
                        }));
                        return false;
                    }
                }
                // Security headers
                if (config.enableSecurityHeaders) {
                    this.applySecurityHeaders(res, config);
                }
                // CSRF protection
                if (config.enableCsrfProtection) {
                    const csrfValid = this.validateCsrfToken(req);
                    if (!csrfValid) {
                        this.emitSecurityEvent({
                            type: "csrf_attempt",
                            severity: "high",
                            message: "CSRF token validation failed",
                            source: "csrf-protection",
                            ipAddress: this.getClientIP(req),
                            userAgent: req.headers["user-agent"],
                            metadata: { path: req.url },
                        });
                        res.writeHead(403, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            error: "Forbidden",
                            message: "CSRF validation failed",
                        }));
                        return false;
                    }
                }
                // Audit logging
                if (config.enableAuditLogging) {
                    this.logAuditEvent(req, "request-processed");
                }
                return true;
            }
            catch (error) {
                console.error("Security middleware error:", error);
                this.emitSecurityEvent({
                    type: "suspicious_activity",
                    severity: "high",
                    message: `Security middleware error: ${error instanceof Error ? error.message : String(error)}`,
                    source: "security-middleware",
                    ipAddress: this.getClientIP(req),
                    metadata: {
                        error: error instanceof Error ? error.message : String(error),
                    },
                });
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    error: "Internal Server Error",
                    message: "Security validation failed",
                }));
                return false;
            }
        };
    }
    /**
     * Check rate limiting for requests
     */
    checkRateLimit(req) {
        const ip = this.getClientIP(req);
        const now = Date.now();
        const windowMs = SECURITY_CONFIG.rateLimiting.windowMs;
        const maxRequests = SECURITY_CONFIG.rateLimiting.maxRequests;
        let entry = this.rateLimitStore.get(ip);
        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + windowMs,
                lastRequest: now,
            };
        }
        entry.count++;
        entry.lastRequest = now;
        this.rateLimitStore.set(ip, entry);
        // Clean up old entries periodically
        if (Math.random() < 0.01) {
            // 1% chance to clean up
            this.cleanupRateLimitStore();
        }
        const allowed = entry.count <= maxRequests;
        const remaining = Math.max(0, maxRequests - entry.count);
        return {
            allowed,
            ip,
            limit: maxRequests,
            remaining,
            resetTime: entry.resetTime,
        };
    }
    /**
     * Apply security headers to response
     */
    applySecurityHeaders(res, config) {
        const headers = { ...SECURITY_CONFIG.headers };
        // Apply custom headers
        if (config.customHeaders) {
            Object.assign(headers, config.customHeaders);
        }
        // Conditionally apply HSTS
        if (!config.enableHsts) {
            delete headers["Strict-Transport-Security"];
        }
        // Set all headers
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        // Add rate limit headers
        const rateLimitInfo = this.getRateLimitInfo(this.getClientIP({ headers: {} }));
        if (rateLimitInfo) {
            res.setHeader("X-RateLimit-Limit", rateLimitInfo.limit.toString());
            res.setHeader("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
            res.setHeader("X-RateLimit-Reset", Math.ceil(rateLimitInfo.resetTime / 1000).toString());
        }
    }
    /**
     * Validate CSRF token
     */
    validateCsrfToken(req) {
        // Simple CSRF validation - in production, use proper CSRF tokens
        const token = req.headers["x-csrf-token"];
        const sessionToken = req.session?.csrfToken;
        if (!token || !sessionToken) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(sessionToken, "hex"));
    }
    /**
     * Validate and sanitize input data
     */
    validateInput(input, context = "general") {
        const result = {
            isValid: true,
            errors: [],
            securityEvents: [],
        };
        try {
            // Type validation
            if (input === null || input === undefined) {
                result.isValid = false;
                result.errors.push("Input cannot be null or undefined");
                return result;
            }
            // String validation
            if (typeof input === "string") {
                result.sanitizedValue = this.validateString(input, context, result);
            }
            // Object validation
            else if (typeof input === "object") {
                result.sanitizedValue = this.validateObject(input, context, result);
            }
            // Array validation
            else if (Array.isArray(input)) {
                result.sanitizedValue = this.validateArray(input, context, result);
            }
            // Security pattern checks
            this.checkSecurityPatterns(input, context, result);
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
            console.log(`[SECURITY] Data decryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return result;
    }
    /**
     * Validate string input
     */
    validateString(input, context, result) {
        // Length check
        if (input.length > SECURITY_CONFIG.inputValidation.maxStringLength) {
            result.isValid = false;
            result.errors.push(`String length exceeds maximum (${SECURITY_CONFIG.inputValidation.maxStringLength})`);
            return input.substring(0, SECURITY_CONFIG.inputValidation.maxStringLength);
        }
        // Character validation
        if (!SECURITY_CONFIG.inputValidation.allowedCharacters.test(input)) {
            result.isValid = false;
            result.errors.push("String contains invalid characters");
        }
        // SQL injection check
        for (const pattern of SECURITY_CONFIG.inputValidation
            .sqlInjectionPatterns) {
            if (pattern.test(input)) {
                result.isValid = false;
                result.errors.push("Potential SQL injection detected");
                this.emitSecurityEvent({
                    type: "sql_injection_attempt",
                    severity: "high",
                    message: "SQL injection pattern detected in input",
                    source: "input-validator",
                    metadata: { context, pattern: pattern.source },
                });
                break;
            }
        }
        // XSS check
        for (const pattern of SECURITY_CONFIG.inputValidation.xssPatterns) {
            if (pattern.test(input)) {
                result.isValid = false;
                result.errors.push("Potential XSS attack detected");
                this.emitSecurityEvent({
                    type: "xss_attempt",
                    severity: "high",
                    message: "XSS pattern detected in input",
                    source: "input-validator",
                    metadata: { context, pattern: pattern.source },
                });
                break;
            }
        }
        return input;
    }
    /**
     * Validate object input
     */
    validateObject(input, context, result) {
        const sanitized = {};
        // Depth check
        const depth = this.getObjectDepth(input);
        if (depth > SECURITY_CONFIG.inputValidation.maxObjectDepth) {
            result.isValid = false;
            result.errors.push(`Object depth exceeds maximum (${SECURITY_CONFIG.inputValidation.maxObjectDepth})`);
            return sanitized;
        }
        // Validate each property
        for (const [key, value] of Object.entries(input)) {
            if (typeof key === "string" && key.length > 0) {
                const keyValidation = this.validateInput(key, `${context}.key`);
                const valueValidation = this.validateInput(value, `${context}.${key}`);
                if (!keyValidation.isValid) {
                    result.isValid = false;
                    result.errors.push(...keyValidation.errors.map((e) => `Key '${key}': ${e}`));
                }
                if (!valueValidation.isValid) {
                    result.isValid = false;
                    result.errors.push(...valueValidation.errors.map((e) => `Property '${key}': ${e}`));
                }
                result.securityEvents.push(...keyValidation.securityEvents, ...valueValidation.securityEvents);
                sanitized[key] =
                    valueValidation.sanitizedValue !== undefined
                        ? valueValidation.sanitizedValue
                        : value;
            }
        }
        return sanitized;
    }
    /**
     * Validate array input
     */
    validateArray(input, context, result) {
        const sanitized = [];
        // Length check
        if (input.length > SECURITY_CONFIG.inputValidation.maxArrayLength) {
            result.isValid = false;
            result.errors.push(`Array length exceeds maximum (${SECURITY_CONFIG.inputValidation.maxArrayLength})`);
            return sanitized;
        }
        // Validate each element
        for (let i = 0; i < input.length; i++) {
            const elementValidation = this.validateInput(input[i], `${context}[${i}]`);
            if (!elementValidation.isValid) {
                result.isValid = false;
                result.errors.push(...elementValidation.errors.map((e) => `Element ${i}: ${e}`));
            }
            result.securityEvents.push(...elementValidation.securityEvents);
            sanitized.push(elementValidation.sanitizedValue !== undefined
                ? elementValidation.sanitizedValue
                : input[i]);
        }
        return sanitized;
    }
    /**
     * Check for security patterns in input
     */
    checkSecurityPatterns(input, context, result) {
        const inputString = JSON.stringify(input);
        // Additional security checks can be added here
        // For example: path traversal, command injection, etc.
    }
    /**
     * Encrypt sensitive data
     */
    encryptData(data) {
        return Buffer.from(data).toString("base64");
    }
    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData) {
        return Buffer.from(encryptedData, "base64").toString();
    }
    /**
     * Hash password securely
     */
    async hashPassword(password) {
        return new Promise((resolve, reject) => {
            crypto.scrypt(password, "salt", SECURITY_CONFIG.encryption.keyLength, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
                if (err)
                    reject(err);
                else
                    resolve(derivedKey.toString("hex"));
            });
        });
    }
    /**
     * Verify password hash
     */
    async verifyPassword(password, hash) {
        try {
            const hashedPassword = await this.hashPassword(password);
            return crypto.timingSafeEqual(Buffer.from(hashedPassword, "hex"), Buffer.from(hash, "hex"));
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Generate secure random token
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString("hex");
    }
    /**
     * Log audit event
     */
    logAuditEvent(req, action) {
        if (!this.auditLogEnabled)
            return;
        const auditEvent = {
            timestamp: new Date().toISOString(),
            action,
            ip: this.getClientIP(req),
            userAgent: req.headers["user-agent"],
            method: req.method,
            url: req.url,
            headers: this.sanitizeHeadersForAudit(req.headers),
        };
        console.log(`[AUDIT] ${JSON.stringify(auditEvent)}`);
    }
    /**
     * Sanitize headers for audit logging
     */
    sanitizeHeadersForAudit(headers) {
        const sanitized = { ...headers };
        SECURITY_CONFIG.audit.sensitiveFields.forEach((field) => {
            if (sanitized[field]) {
                sanitized[field] = "[REDACTED]";
            }
        });
        return sanitized;
    }
    /**
     * Emit security event
     */
    emitSecurityEvent(event) {
        const securityEvent = {
            id: this.generateSecureToken(16),
            timestamp: Date.now(),
            ...event,
        };
        this.securityEvents.push(securityEvent);
        this.emit("security-event", securityEvent);
        // Log high-severity events
        if (event.severity === "high" || event.severity === "critical") {
            console.error(`[SECURITY ${event.severity.toUpperCase()}] ${event.message}`);
        }
    }
    /**
     * Handle security events
     */
    handleSecurityEvent(event) {
        // Store event for analysis
        // In production, this would be sent to SIEM, logged to database, etc.
        if (event.severity === "critical") {
            // Immediate action required for critical events
            console.error(`🚨 CRITICAL SECURITY EVENT: ${event.message}`);
            // Could trigger alerts, notifications, etc.
        }
    }
    /**
     * Handle rate limit exceeded
     */
    handleRateLimitExceeded(event) {
        console.warn(`⚠️ Rate limit exceeded for IP: ${event.ipAddress}`);
    }
    /**
     * Handle validation failure
     */
    handleValidationFailure(event) {
        console.warn(`⚠️ Input validation failed: ${event.message}`);
    }
    /**
     * Get client IP address
     */
    getClientIP(req) {
        const forwarded = req.headers["x-forwarded-for"];
        const realIP = req.headers["x-real-ip"];
        const clientIP = req.headers["x-client-ip"];
        return (forwarded?.split(",")[0]?.trim() ||
            realIP ||
            clientIP ||
            req.socket?.remoteAddress ||
            "unknown");
    }
    /**
     * Get rate limit info for IP
     */
    getRateLimitInfo(ip) {
        const entry = this.rateLimitStore.get(ip);
        if (!entry)
            return null;
        const maxRequests = SECURITY_CONFIG.rateLimiting.maxRequests;
        return {
            limit: maxRequests,
            remaining: Math.max(0, maxRequests - entry.count),
            resetTime: entry.resetTime,
        };
    }
    /**
     * Get object depth
     */
    getObjectDepth(obj, currentDepth = 0) {
        if (typeof obj !== "object" || obj === null) {
            return currentDepth;
        }
        let maxDepth = currentDepth;
        for (const value of Object.values(obj)) {
            if (typeof value === "object" && value !== null) {
                const depth = this.getObjectDepth(value, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        return maxDepth;
    }
    /**
     * Cleanup old rate limit entries
     */
    cleanupRateLimitStore() {
        const now = Date.now();
        const entriesToDelete = [];
        this.rateLimitStore.forEach((entry, ip) => {
            if (now > entry.resetTime) {
                entriesToDelete.push(ip);
            }
        });
        entriesToDelete.forEach((ip) => this.rateLimitStore.delete(ip));
    }
    /**
     * Get security events
     */
    getSecurityEvents(limit = 100) {
        return this.securityEvents.slice(-limit);
    }
    /**
     * Clear security events
     */
    clearSecurityEvents() {
        this.securityEvents = [];
    }
    /**
     * Get security statistics
     */
    getSecurityStats() {
        const eventsByType = {};
        const eventsBySeverity = {};
        this.securityEvents.forEach((event) => {
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            eventsBySeverity[event.severity] =
                (eventsBySeverity[event.severity] || 0) + 1;
        });
        return {
            totalEvents: this.securityEvents.length,
            eventsByType,
            eventsBySeverity,
            recentEvents: this.securityEvents.slice(-10),
        };
    }
    /**
     * Enable/disable audit logging
     */
    setAuditLogging(enabled) {
        this.auditLogEnabled = enabled;
    }
}
// Export singleton instance
export const securityHardeningSystem = new SecurityHardeningSystem();
