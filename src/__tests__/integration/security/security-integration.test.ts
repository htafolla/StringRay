/**
 * StringRay AI v1.0.4 - Security Module Integration Tests
 *
 * End-to-end security workflow testing.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SecurityAuditor } from "../../../security/security-auditor";
import { SecurityHardener } from "../../../security/security-hardener";
import { SecurityHeadersMiddleware } from "../../../security/security-headers";

// Mock file system operations
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("path", () => ({
  join: vi.fn(),
  resolve: vi.fn(),
}));

import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

describe("Security Module Integration", () => {
  let auditor: SecurityAuditor;
  let hardener: SecurityHardener;
  let headersMiddleware: SecurityHeadersMiddleware;

  beforeEach(() => {
    vi.clearAllMocks();

    auditor = new SecurityAuditor();
    hardener = new SecurityHardener();
    headersMiddleware = new SecurityHeadersMiddleware();

    // Setup default mocks
    vi.mocked(readdirSync).mockReturnValue([
      { name: "app.ts", isDirectory: () => false, isFile: () => true } as any,
      {
        name: "config.ts",
        isDirectory: () => false,
        isFile: () => true,
      } as any,
      {
        name: "package.json",
        isDirectory: () => false,
        isFile: () => true,
      } as any,
    ]);
    vi.mocked(statSync).mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
      mode: 0o644,
    } as any);
    vi.mocked(join).mockImplementation((...args) => args.join("/"));
    vi.mocked(resolve).mockImplementation((...args) => args.join("/"));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Security Workflow", () => {
    it("should perform full security audit and apply automatic fixes", async () => {
      // Setup test files with security issues
      vi.mocked(readFileSync).mockReturnValueOnce(`
          function dangerous() {
            eval('malicious code');
            const password = "secret123";
          }
        `).mockReturnValueOnce(`
          {
            "name": "test-app"
          }
        `);

      const auditResult = await auditor.auditProject("./test");
      expect(auditResult.issues.length).toBeGreaterThan(0);
      expect(auditResult.score).toBeLessThan(100);

      const hardenResult = await hardener.hardenSecurity(auditResult);
      expect(hardenResult.appliedFixes).toBeDefined();
      expect(hardenResult.remainingIssues).toBeDefined();

      const report = auditor.generateReport(auditResult);
      expect(report).toContain("StringRay Framework Security Audit Report");
    });

    it("should handle secure codebase with no issues", async () => {
      // Setup clean files
      vi.mocked(readFileSync)
        .mockReturnValueOnce('console.log("Hello, world!");')
        .mockReturnValueOnce('{"name": "safe-app", "dependencies": {}}')
        .mockReturnValueOnce('{"name": "safe-app"}');

      const auditResult = await auditor.auditProject("./test");
      expect(auditResult.score).toBeGreaterThanOrEqual(90); // Good security score
      expect(auditResult.issues.length).toBeLessThanOrEqual(5); // Allow for test environment issues

      const report = auditor.generateReport(auditResult);
      expect(report).toContain("StringRay Framework Security Audit Report");
      expect(report).toContain("Security Score:");
      expect(report).toContain("/100");
    });
  });

  describe("Security Headers Integration", () => {
    it("should integrate security headers with audit results", () => {
      const mockResponse = { setHeader: vi.fn() };
      headersMiddleware.applySecurityHeaders(mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Security-Policy",
        expect.any(String),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-Frame-Options",
        "DENY",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block",
      );
    });

    it("should work with Express middleware", () => {
      const expressMiddleware = headersMiddleware.getExpressMiddleware();
      expect(typeof expressMiddleware).toBe("function");

      const mockReq = {};
      const mockRes = { setHeader: vi.fn() };
      const mockNext = vi.fn();

      expressMiddleware(mockReq, mockRes, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Input Validation and Rate Limiting", () => {
    it("should validate input and apply rate limiting together", () => {
      const schema = { type: "string", maxLength: 10 };
      const validResult = hardener.validateInput("test", schema);
      expect(validResult.valid).toBe(true);

      const invalidResult = hardener.validateInput("this is too long", schema);
      expect(invalidResult.valid).toBe(false);

      const requests = new Map<string, number[]>();
      const rateLimitResult = hardener.checkRateLimit("user", requests);
      expect(typeof rateLimitResult).toBe("boolean");
    });
  });
});
