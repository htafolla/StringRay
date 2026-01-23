/**
 * StringRay AI v1.1.1 - Security Headers Middleware
 *
 * Comprehensive security headers implementation for HTTP responses.
 * Integrates with boot orchestrator and API endpoints.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export class SecurityHeadersMiddleware {
    config;
    constructor(config = {}) {
        this.config = {
            enableCSP: true,
            enableHSTS: true,
            enableFrameOptions: true,
            enableXSSProtection: true,
            enableContentTypeOptions: true,
            enableReferrerPolicy: true,
            enablePermissionsPolicy: true,
            hstsMaxAge: 31536000, // 1 year
            hstsIncludeSubdomains: true,
            hstsPreload: false,
            ...config,
        };
    }
    /**
     * Apply security headers to HTTP response
     */
    applySecurityHeaders(response) {
        if (!response || typeof response.setHeader !== "function") {
            console.warn("SecurityHeadersMiddleware: Invalid response object");
            return;
        }
        const headers = {};
        // Content Security Policy
        if (this.config.enableCSP) {
            headers["Content-Security-Policy"] =
                this.config.customCSP ||
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'";
        }
        // HTTP Strict Transport Security
        if (this.config.enableHSTS) {
            let hstsValue = `max-age=${this.config.hstsMaxAge}`;
            if (this.config.hstsIncludeSubdomains) {
                hstsValue += "; includeSubDomains";
            }
            if (this.config.hstsPreload) {
                hstsValue += "; preload";
            }
            headers["Strict-Transport-Security"] = hstsValue;
        }
        // X-Frame-Options
        if (this.config.enableFrameOptions) {
            headers["X-Frame-Options"] = "DENY";
        }
        // X-XSS-Protection
        if (this.config.enableXSSProtection) {
            headers["X-XSS-Protection"] = "1; mode=block";
        }
        // X-Content-Type-Options
        if (this.config.enableContentTypeOptions) {
            headers["X-Content-Type-Options"] = "nosniff";
        }
        // Referrer-Policy
        if (this.config.enableReferrerPolicy) {
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        }
        // Permissions-Policy
        if (this.config.enablePermissionsPolicy) {
            headers["Permissions-Policy"] =
                "geolocation=(), microphone=(), camera=()";
        }
        // Set headers on response
        Object.entries(headers).forEach(([key, value]) => {
            response.setHeader(key, value);
        });
    }
    /**
     * Express.js middleware function
     */
    getExpressMiddleware() {
        return (req, res, next) => {
            this.applySecurityHeaders(res);
            next();
        };
    }
    /**
     * Fastify middleware function
     */
    getFastifyMiddleware() {
        return (request, reply, done) => {
            this.applySecurityHeaders(reply);
            done();
        };
    }
    /**
     * Generic middleware for any HTTP framework
     */
    getMiddleware() {
        return this.applySecurityHeaders.bind(this);
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// Export singleton instance
export const securityHeadersMiddleware = new SecurityHeadersMiddleware();
//# sourceMappingURL=security-headers.js.map