/**
 * StringRay AI v1.1.1 - Security Headers Middleware
 *
 * Comprehensive security headers implementation for HTTP responses.
 * Integrates with boot orchestrator and API endpoints.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export interface SecurityHeadersConfig {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableFrameOptions: boolean;
    enableXSSProtection: boolean;
    enableContentTypeOptions: boolean;
    enableReferrerPolicy: boolean;
    enablePermissionsPolicy: boolean;
    customCSP?: string;
    hstsMaxAge?: number;
    hstsIncludeSubdomains?: boolean;
    hstsPreload?: boolean;
}
export declare class SecurityHeadersMiddleware {
    private config;
    constructor(config?: Partial<SecurityHeadersConfig>);
    /**
     * Apply security headers to HTTP response
     */
    applySecurityHeaders(response: any): void;
    /**
     * Express.js middleware function
     */
    getExpressMiddleware(): (req: any, res: any, next: any) => void;
    /**
     * Fastify middleware function
     */
    getFastifyMiddleware(): (request: any, reply: any, done: any) => void;
    /**
     * Generic middleware for any HTTP framework
     */
    getMiddleware(): (response: any) => void;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<SecurityHeadersConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): SecurityHeadersConfig;
}
export declare const securityHeadersMiddleware: SecurityHeadersMiddleware;
//# sourceMappingURL=security-headers.d.ts.map