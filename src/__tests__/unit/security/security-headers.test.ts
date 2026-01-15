/**
 * StringRay AI v1.0.4 - SecurityHeadersMiddleware Unit Tests
 *
 * Tests for SecurityHeadersMiddleware including:
 * - Header validation and application
 * - Express middleware integration
 * - Fastify middleware integration
 * - Configuration management
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SecurityHeadersMiddleware } from "../../../security/security-headers";

describe("SecurityHeadersMiddleware", () => {
  let middleware: SecurityHeadersMiddleware;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    middleware = new SecurityHeadersMiddleware();

    mockResponse = {
      setHeader: vi.fn(),
    };
  });

  describe("applySecurityHeaders", () => {
    it("should apply all default security headers", () => {
      middleware.applySecurityHeaders(mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Security-Policy",
        expect.stringContaining("default-src"),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Strict-Transport-Security",
        expect.stringContaining("max-age"),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-Frame-Options",
        "DENY",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Permissions-Policy",
        expect.stringContaining("geolocation"),
      );
    });

    it("should handle invalid response object gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      middleware.applySecurityHeaders(null as any);
      middleware.applySecurityHeaders({} as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        "SecurityHeadersMiddleware: Invalid response object",
      );
      consoleSpy.mockRestore();
    });

    it("should apply custom CSP when configured", () => {
      const customCSP = "default-src 'self'; script-src 'self' 'unsafe-eval'";
      const customMiddleware = new SecurityHeadersMiddleware({
        customCSP,
      });

      customMiddleware.applySecurityHeaders(mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Security-Policy",
        customCSP,
      );
    });

    it("should skip HSTS when disabled", () => {
      const customMiddleware = new SecurityHeadersMiddleware({
        enableHSTS: false,
      });

      const freshMockResponse = { setHeader: vi.fn() };
      customMiddleware.applySecurityHeaders(freshMockResponse);

      const hstsCalls = freshMockResponse.setHeader.mock.calls.filter(
        ([key]) => key === "Strict-Transport-Security",
      );
      expect(hstsCalls).toHaveLength(0);
    });

    it("should configure HSTS with custom max age", () => {
      const customMiddleware = new SecurityHeadersMiddleware({
        hstsMaxAge: 86400, // 1 day
      });

      const freshMockResponse = { setHeader: vi.fn() };
      customMiddleware.applySecurityHeaders(freshMockResponse);

      expect(freshMockResponse.setHeader).toHaveBeenCalledWith(
        "Strict-Transport-Security",
        "max-age=86400; includeSubDomains",
      );
    });

    it("should include preload in HSTS when configured", () => {
      const customMiddleware = new SecurityHeadersMiddleware({
        hstsPreload: true,
      });

      const freshMockResponse = { setHeader: vi.fn() };
      customMiddleware.applySecurityHeaders(freshMockResponse);

      expect(freshMockResponse.setHeader).toHaveBeenCalledWith(
        "Strict-Transport-Security",
        expect.stringContaining("preload"),
      );
    });

    it("should skip frame options when disabled", () => {
      const customMiddleware = new SecurityHeadersMiddleware({
        enableFrameOptions: false,
      });

      const freshMockResponse = { setHeader: vi.fn() };
      customMiddleware.applySecurityHeaders(freshMockResponse);

      const frameCalls = freshMockResponse.setHeader.mock.calls.filter(
        ([key]) => key === "X-Frame-Options",
      );
      expect(frameCalls).toHaveLength(0);
    });
  });

  describe("Express Middleware", () => {
    it("should return valid Express middleware function", () => {
      const expressMiddleware = middleware.getExpressMiddleware();

      expect(typeof expressMiddleware).toBe("function");
      expect(expressMiddleware.length).toBe(3); // Express middleware signature
    });

    it("should apply headers in Express middleware", () => {
      const expressMiddleware = middleware.getExpressMiddleware();
      const mockReq = {};
      const mockRes = { setHeader: vi.fn() };
      const mockNext = vi.fn();

      expressMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Fastify Middleware", () => {
    it("should return valid Fastify middleware function", () => {
      const fastifyMiddleware = middleware.getFastifyMiddleware();

      expect(typeof fastifyMiddleware).toBe("function");
      expect(fastifyMiddleware.length).toBe(3); // Fastify middleware signature
    });

    it("should apply headers in Fastify middleware", () => {
      const fastifyMiddleware = middleware.getFastifyMiddleware();
      const mockRequest = {};
      const mockReply = { setHeader: vi.fn() };
      const mockDone = vi.fn();

      fastifyMiddleware(mockRequest, mockReply, mockDone);

      expect(mockReply.setHeader).toHaveBeenCalled();
      expect(mockDone).toHaveBeenCalled();
    });
  });

  describe("Generic Middleware", () => {
    it("should return bound applySecurityHeaders function", () => {
      const genericMiddleware = middleware.getMiddleware();

      expect(typeof genericMiddleware).toBe("function");
      expect(genericMiddleware.length).toBe(1);
    });

    it("should apply headers when called directly", () => {
      const genericMiddleware = middleware.getMiddleware();

      genericMiddleware(mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalled();
    });
  });

  describe("Configuration Management", () => {
    it("should update configuration", () => {
      const newConfig = {
        enableCSP: false,
        enableHSTS: false,
        customCSP: "custom-policy",
      };

      middleware.updateConfig(newConfig);

      const config = middleware.getConfig();
      expect(config.enableCSP).toBe(false);
      expect(config.enableHSTS).toBe(false);
      expect(config.customCSP).toBe("custom-policy");
    });

    it("should return current configuration", () => {
      const config = middleware.getConfig();

      expect(config).toHaveProperty("enableCSP");
      expect(config).toHaveProperty("enableHSTS");
      expect(config).toHaveProperty("enableFrameOptions");
      expect(config).toHaveProperty("hstsMaxAge");
      expect(typeof config.enableCSP).toBe("boolean");
      expect(typeof config.hstsMaxAge).toBe("number");
    });

    it("should preserve existing config when updating partially", () => {
      const originalConfig = middleware.getConfig();
      const originalCSP = originalConfig.enableCSP;

      middleware.updateConfig({ enableHSTS: false });

      const newConfig = middleware.getConfig();
      expect(newConfig.enableCSP).toBe(originalCSP);
      expect(newConfig.enableHSTS).toBe(false);
    });
  });

  describe("Integration with SecurityHardener", () => {
    it("should work with security hardener headers", () => {
      // This test verifies that the middleware integrates properly
      // with the security hardener by checking that headers are applied
      middleware.applySecurityHeaders(mockResponse);

      // Verify that multiple headers are set (including those from security hardener)
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(7); // All default headers
    });
  });
});
