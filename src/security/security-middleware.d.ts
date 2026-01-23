/**
 * StringRay Framework - Security Middleware
 *
 * Production-ready security middleware with comprehensive protection
 * Implements OWASP security headers, input validation, and attack prevention
 */
import { Request, Response, NextFunction } from "express";
export interface SecurityConfig {
    helmet?: {
        contentSecurityPolicy?: boolean;
        hsts?: boolean;
        noSniff?: boolean;
        frameguard?: boolean;
        xssFilter?: boolean;
    };
    rateLimiting?: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
    };
    cors?: {
        enabled: boolean;
        origins: string[];
        methods: string[];
        headers: string[];
    };
    inputValidation?: {
        enabled: boolean;
        sanitize: boolean;
        maxBodySize: string;
    };
}
export declare class SecurityMiddleware {
    private config;
    constructor(config?: Partial<SecurityConfig>);
    /**
     * Apply security headers (minimal for AI orchestration)
     */
    securityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Rate limiting middleware
     */
    rateLimit(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * CORS middleware (disabled for plugins)
     */
    cors(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Input validation and sanitization middleware
     */
    inputValidation(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Sanitize input data (AI prompt security focused)
     */
    private sanitizeInput;
    /**
     * Validate JSON structure
     */
    private validateJsonStructure;
    /**
     * Parse size string (e.g., '10mb' -> bytes)
     */
    private parseSize;
    /**
     * Get all security middlewares
     */
    getAllMiddlewares(): Array<(req: Request, res: Response, next: NextFunction) => void>;
}
export declare const securityMiddleware: SecurityMiddleware;
//# sourceMappingURL=security-middleware.d.ts.map