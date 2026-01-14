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

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      helmet: {
        contentSecurityPolicy: false, // Not needed for AI orchestration
        hsts: false, // Plugin doesn't serve HTTPS directly
        noSniff: true,
        frameguard: false, // Plugin doesn't render frames
        xssFilter: false, // Not applicable for API requests
        ...config.helmet,
      },
      rateLimiting: {
        enabled: true,
        windowMs: 60 * 1000, // 1 minute (reasonable for AI requests)
        maxRequests: 50, // Conservative limit for AI API calls
        ...config.rateLimiting,
      },
      cors: {
        enabled: false, // oh-my-opencode handles CORS for plugins
        origins: [],
        methods: [],
        headers: [],
        ...config.cors,
      },
      inputValidation: {
        enabled: true, // Critical for prompt sanitization
        sanitize: true, // Essential for AI prompt security
        maxBodySize: "1mb", // Reasonable for AI prompts
        ...config.inputValidation,
      },
    };
  }

  /**
   * Apply security headers (minimal for AI orchestration)
   */
  securityHeaders(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only essential headers for API security
      if (this.config.helmet?.noSniff) {
        res.setHeader("X-Content-Type-Options", "nosniff");
      }

      // API-specific security headers
      res.setHeader("X-API-Version", "1.0.0");
      res.setHeader("X-Framework", "StringRay");

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(): (req: Request, res: Response, next: NextFunction) => void {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.rateLimiting?.enabled) {
        return next();
      }

      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const now = Date.now();
      const windowMs = this.config.rateLimiting.windowMs;
      const maxRequests = this.config.rateLimiting.maxRequests;

      const clientData = requests.get(clientIP);

      if (!clientData || now > clientData.resetTime) {
        // New window
        requests.set(clientIP, {
          count: 1,
          resetTime: now + windowMs,
        });
        return next();
      }

      if (clientData.count >= maxRequests) {
        res.status(429).json({
          error: "Too many requests",
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        });
        return;
      }

      clientData.count++;
      next();
    };
  }

  /**
   * CORS middleware (disabled for plugins)
   */
  cors(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // CORS handled by oh-my-opencode framework
      next();
    };
  }

  /**
   * Input validation and sanitization middleware
   */
  inputValidation(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.inputValidation?.enabled) {
        return next();
      }

      try {
        // Basic input sanitization
        if (this.config.inputValidation.sanitize) {
          this.sanitizeInput(req.body);
          this.sanitizeInput(req.query);
          this.sanitizeInput(req.params);
        }

        // Validate JSON structure if content-type is application/json
        const contentType = req.headers["content-type"];
        if (
          contentType &&
          contentType.includes("application/json") &&
          req.body
        ) {
          this.validateJsonStructure(req.body);
        }

        next();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(400).json({ error: "Invalid input", details: errorMessage });
      }
    };
  }

  /**
   * Sanitize input data (AI prompt security focused)
   */
  private sanitizeInput(data: any): void {
    if (typeof data === "string") {
      // Remove potentially dangerous patterns for AI prompts
      data = data.replace(/system\s*prompt\s*[:=]/gi, ""); // Prevent system prompt override
      data = data.replace(/ignore\s+previous\s+instructions/gi, ""); // Prevent prompt injection
      data = data.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "",
      ); // Basic XSS
      data = data.replace(/javascript:/gi, ""); // Protocol injection
    } else if (typeof data === "object" && data !== null) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = this.sanitizeInput(data[key]);
        }
      }
    }
  }

  /**
   * Validate JSON structure
   */
  private validateJsonStructure(data: any): void {
    // Prevent prototype pollution
    if (data.__proto__ || data.constructor.prototype !== Object.prototype) {
      throw new Error("Invalid object structure");
    }

    // Check for circular references (basic check)
    const seen = new WeakSet();
    const checkCircular = (obj: any): void => {
      if (typeof obj === "object" && obj !== null) {
        if (seen.has(obj)) {
          throw new Error("Circular reference detected");
        }
        seen.add(obj);
        for (const key in obj) {
          checkCircular(obj[key]);
        }
      }
    };

    checkCircular(data);
  }

  /**
   * Parse size string (e.g., '10mb' -> bytes)
   */
  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = sizeStr
      .toLowerCase()
      .match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match || !match[1]) return 1024 * 1024; // Default 1MB

    const value = parseFloat(match[1]);
    const unit = match[2] || "b";

    return value * (units[unit] || 1);
  }

  /**
   * Get all security middlewares
   */
  getAllMiddlewares(): Array<
    (req: Request, res: Response, next: NextFunction) => void
  > {
    return [
      this.securityHeaders(),
      this.rateLimit(),
      this.cors(),
      this.inputValidation(),
    ];
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();
