/**
 * StringRay AI v1.0.7 - SecurityHardener Unit Tests
 *
 * Tests for SecurityHardener including:
 * - Security hardening rule application
 * - Audit result processing
 * - Input validation functionality
 * - Rate limiting and security event logging
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SecurityHardener } from "../../../security/security-hardener";
import { SecurityIssue } from "../../../security/security-auditor";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    chmod: vi.fn().mockResolvedValue(undefined),
  },
}));

import { promises as fs } from "fs";

describe("SecurityHardener", () => {
  let hardener: SecurityHardener;

  beforeEach(() => {
    vi.clearAllMocks();
    hardener = new SecurityHardener();
  });

  describe("hardenSecurity", () => {
    it("should apply fixes for hardcoded secrets issues", async () => {
      const issues: SecurityIssue[] = [
        {
          severity: "high",
          category: "hardcoded-secrets",
          file: "/test/config.ts",
          description: "Hardcoded API key detected",
          recommendation: "Move to environment variables",
        },
      ];

      const result = await hardener.hardenSecurity({ issues });

      expect(result.appliedFixes).toHaveLength(0); // Manual intervention required
      expect(result.remainingIssues).toHaveLength(1);
      if (result.remainingIssues[0]) {
        expect(result.remainingIssues[0].category).toBe("hardcoded-secrets");
      }
    });

    it("should apply fixes for file permission issues", async () => {
      const issues: SecurityIssue[] = [
        {
          severity: "high",
          category: "file-permissions",
          file: "/test/world-writable.txt",
          description: "File is world-writable",
          recommendation: "Restrict permissions",
        },
      ];

      const result = await hardener.hardenSecurity({ issues });

      expect(result.appliedFixes).toHaveLength(1);
      if (result.appliedFixes[0]) {
        expect(result.appliedFixes[0]).toContain("Fixed file permissions");
      }
      expect(result.remainingIssues).toHaveLength(0);
      expect(fs.chmod).toHaveBeenCalledWith("/test/world-writable.txt", 0o644);
    });

    it("should handle file permission fix failures", async () => {
      const issues: SecurityIssue[] = [
        {
          severity: "high" as const,
          category: "file-permissions",
          file: "/test/world-writable.txt",
          description: "File is world-writable",
          recommendation: "Restrict permissions",
        },
      ];

      vi.mocked(fs.chmod).mockRejectedValueOnce(new Error("Permission denied"));

      const result = await hardener.hardenSecurity({ issues });

      expect(result.appliedFixes).toHaveLength(0);
      expect(result.remainingIssues).toHaveLength(1);
      if (result.remainingIssues[0]) {
        expect(result.remainingIssues[0].description).toContain(
          "File is world-writable",
        );
      }
    });

    it("should handle dependency management issues", async () => {
      const issues: SecurityIssue[] = [
        {
          severity: "medium",
          category: "dependency-management",
          file: "/test/package.json",
          description: "Insecure dependency version",
          recommendation: "Update to specific version",
        },
      ];

      const result = await hardener.hardenSecurity({ issues });

      expect(result.appliedFixes).toHaveLength(0); // Manual intervention required
      expect(result.remainingIssues).toHaveLength(1);
    });

    it("should handle input validation issues", async () => {
      const issues: SecurityIssue[] = [
        {
          severity: "medium",
          category: "input-validation",
          file: "/test/api.ts",
          line: 10,
          description: "Missing input validation",
          recommendation: "Add validation",
        },
      ];

      const result = await hardener.hardenSecurity({ issues });

      expect(result.appliedFixes).toHaveLength(0); // Code modification required
      expect(result.remainingIssues).toHaveLength(1);
    });

    it("should handle multiple issues of different types", async () => {
      const issues: SecurityIssue[] = [
        {
          severity: "high",
          category: "file-permissions",
          file: "/test/file1.txt",
          description: "World-writable file",
          recommendation: "Fix permissions",
        },
        {
          severity: "high",
          category: "hardcoded-secrets",
          file: "/test/config.ts",
          description: "Hardcoded secret",
          recommendation: "Move to env vars",
        },
        {
          severity: "medium",
          category: "input-validation",
          file: "/test/api.ts",
          description: "Missing validation",
          recommendation: "Add validation",
        },
      ];

      const result = await hardener.hardenSecurity({ issues });

      expect(result.appliedFixes).toHaveLength(1); // Only file permissions can be auto-fixed
      if (result.appliedFixes[0]) {
        expect(result.appliedFixes[0]).toContain("Fixed file permissions");
      }
      expect(result.remainingIssues).toHaveLength(2); // Secrets and input validation require manual fixes
    });
  });

  describe("addSecurityHeaders", () => {
    it("should add security headers when enabled", () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const secureHeaders = hardener.addSecurityHeaders(headers);

      expect(secureHeaders).toHaveProperty("X-Content-Type-Options", "nosniff");
      expect(secureHeaders).toHaveProperty("X-Frame-Options", "DENY");
      expect(secureHeaders).toHaveProperty("X-XSS-Protection", "1; mode=block");
      expect(secureHeaders).toHaveProperty("Strict-Transport-Security");
      expect(secureHeaders).toHaveProperty("Content-Security-Policy");
      expect(secureHeaders).toHaveProperty("Referrer-Policy");
      expect(secureHeaders["Content-Type"]).toBe("application/json"); // Original headers preserved
    });

    it("should not add headers when disabled", () => {
      const disabledHardener = new SecurityHardener({
        enableSecureHeaders: false,
      });

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const secureHeaders = disabledHardener.addSecurityHeaders(headers);

      expect(secureHeaders).toEqual(headers); // No additional headers added
    });
  });

  describe("validateInput", () => {
    it("should validate string input successfully", () => {
      const schema = { type: "string", maxLength: 10 };
      const result = hardener.validateInput("test", schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid string type", () => {
      const schema = { type: "string" };
      const result = hardener.validateInput(123, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Expected string");
    });

    it("should reject string exceeding max length", () => {
      const schema = { type: "string", maxLength: 5 };
      const result = hardener.validateInput("this is too long", schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("String too long (max 5)");
    });

    it("should validate pattern matching", () => {
      const schema = { type: "string", pattern: "^[A-Z]+$" };
      const result = hardener.validateInput("ABC", schema);

      expect(result.valid).toBe(true);
    });

    it("should reject pattern mismatch", () => {
      const schema = { type: "string", pattern: "^[A-Z]+$" };
      const result = hardener.validateInput("abc123", schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("String does not match required pattern");
    });

    it("should skip validation when disabled", () => {
      const disabledHardener = new SecurityHardener({
        enableInputValidation: false,
      });

      const schema = { type: "string" };
      const result = disabledHardener.validateInput(123, schema);

      expect(result.valid).toBe(true); // Always valid when disabled
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("checkRateLimit", () => {
    let rateLimitMap: Map<string, number[]>;

    beforeEach(() => {
      rateLimitMap = new Map();
    });

    it("should allow requests within limit", () => {
      const identifier = "user1";

      for (let i = 0; i < 5; i++) {
        const allowed = hardener.checkRateLimit(identifier, rateLimitMap);
        expect(allowed).toBe(true);
      }

      expect(rateLimitMap.get(identifier)).toHaveLength(5);
    });

    it("should block requests exceeding limit", () => {
      const identifier = "user1";

      // Fill up the rate limit
      for (let i = 0; i < 100; i++) {
        hardener.checkRateLimit(identifier, rateLimitMap);
      }

      // Next request should be blocked
      const blocked = hardener.checkRateLimit(identifier, rateLimitMap);
      expect(blocked).toBe(false);
    });

    it("should allow requests after window expires", () => {
      const identifier = "user1";

      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let currentTime = 1000000000;

      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      // Fill rate limit
      for (let i = 0; i < 100; i++) {
        hardener.checkRateLimit(identifier, rateLimitMap);
      }

      // Advance time past the window (60 seconds)
      currentTime += 61000;

      // Should allow new requests
      const allowed = hardener.checkRateLimit(identifier, rateLimitMap);
      expect(allowed).toBe(true);

      vi.restoreAllMocks();
    });

    it("should skip rate limiting when disabled", () => {
      const disabledHardener = new SecurityHardener({
        enableRateLimiting: false,
      });

      const identifier = "user1";
      const allowed = disabledHardener.checkRateLimit(identifier, rateLimitMap);

      expect(allowed).toBe(true);
      expect(rateLimitMap.has(identifier)).toBe(false); // No tracking when disabled
    });
  });

  describe("logSecurityEvent", () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should log security events when enabled", () => {
      const event = {
        type: "rate_limit_exceeded",
        severity: "medium" as const,
        message: "Rate limit exceeded for user",
        metadata: { userId: "123", ip: "192.168.1.1" },
      };

      hardener.logSecurityEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        "🔒 SECURITY EVENT [MEDIUM]:",
        expect.stringContaining('"type":"rate_limit_exceeded"'),
      );

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.type).toBe("rate_limit_exceeded");
      expect(loggedData.severity).toBe("medium");
      expect(loggedData.timestamp).toBeDefined();
      expect(loggedData.metadata.userId).toBe("123");
    });

    it("should not log when disabled", () => {
      const disabledHardener = new SecurityHardener({
        enableAuditLogging: false,
      });

      const event = {
        type: "test_event",
        severity: "low" as const,
        message: "Test event",
      };

      disabledHardener.logSecurityEvent(event);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("Configuration", () => {
    it("should use default configuration", () => {
      const defaultHardener = new SecurityHardener();

      // Test that default values are applied by checking behavior
      const headers = defaultHardener.addSecurityHeaders({});
      expect(Object.keys(headers)).toHaveLength(6); // All security headers added
    });

    it("should accept custom configuration", () => {
      const customConfig = {
        enableInputValidation: false,
        enableRateLimiting: false,
        enableAuditLogging: false,
        enableSecureHeaders: false,
        maxRequestSizeBytes: 2048,
        rateLimitWindowMs: 30000,
        rateLimitMaxRequests: 50,
      };

      const customHardener = new SecurityHardener(customConfig);

      // Test configuration is applied
      const headers = customHardener.addSecurityHeaders({ test: "value" });
      expect(headers).toEqual({ test: "value" }); // No security headers added

      const validation = customHardener.validateInput(123, { type: "string" });
      expect(validation.valid).toBe(true); // Validation disabled
    });
  });
});
