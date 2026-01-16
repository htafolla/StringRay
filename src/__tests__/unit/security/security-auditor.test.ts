/**
 * StringRay AI v1.0.5 - SecurityAuditor Unit Tests
 *
 * Comprehensive tests for the SecurityAuditor class including:
 * - Vulnerability detection patterns
 * - False positive filtering
 * - Audit reporting functionality
 * - File scanning and analysis
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SecurityAuditor } from "../../../security/security-auditor";
import * as fs from "fs";

// Mock fs module
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("crypto", () => ({
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue("mock-hash"),
  }),
}));

describe("SecurityAuditor", () => {
  let auditor: SecurityAuditor;
  let mockFs: any;

  beforeEach(() => {
    vi.clearAllMocks();
    auditor = new SecurityAuditor();
    mockFs = vi.mocked(fs);

    // Setup default mocks
    mockFs.readdirSync.mockReturnValue(["test.ts", "test.js", "package.json"]);
    mockFs.statSync.mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(false),
      isFile: vi.fn().mockReturnValue(true),
      mode: 0o644, // Regular file permissions
    });
  });

  describe("auditProject", () => {
    it("should return audit result with issues found", async () => {
      mockFs.readdirSync.mockReturnValue(["vulnerable.ts"]);
      mockFs.readFileSync.mockReturnValue("const result = eval(userInput);");

      const result = await auditor.auditProject("/test");

      expect(result).toHaveProperty("totalFiles");
      expect(result).toHaveProperty("issues");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("score");
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it("should detect eval() usage as critical vulnerability", async () => {
      mockFs.readdirSync.mockReturnValue(["vulnerable.ts"]);
      mockFs.readFileSync.mockReturnValue("const result = eval(userInput);");

      const result = await auditor.auditProject("/test");

      expect(result.issues.length).toBeGreaterThan(0);
      const evalIssue = result.issues.find(
        (issue) => issue.category === "code-injection",
      );
      expect(evalIssue).toBeDefined();
      expect(evalIssue?.severity).toBe("critical");
    });

    it("should detect hardcoded secrets", async () => {
      mockFs.readdirSync.mockReturnValue(["config.ts"]);
      mockFs.readFileSync.mockReturnValue(
        'const apiKey = "sk-1234567890abcdef";',
      );

      const result = await auditor.auditProject("/test");

      const secretIssue = result.issues.find(
        (issue) => issue.category === "hardcoded-secrets",
      );
      expect(secretIssue).toBeDefined();
      expect(secretIssue?.severity).toBe("high");
    });

    it("should detect dangerous imports", async () => {
      mockFs.readdirSync.mockReturnValue(["dangerous.ts"]);
      mockFs.readFileSync.mockReturnValue('const fs = require("fs");');

      const result = await auditor.auditProject("/test");

      const importIssue = result.issues.find(
        (issue) => issue.category === "dangerous-imports",
      );
      expect(importIssue).toBeDefined();
    });

    it("should skip excluded directories", async () => {
      mockFs.readdirSync.mockImplementation((path: string) => {
        if (path === "/test") {
          return ["node_modules", "src", "dist"];
        }
        // For any subdirectory, return empty to avoid infinite recursion
        return [];
      });
      mockFs.statSync.mockImplementation((path: string) => {
        return {
          isDirectory: () => true,
          isFile: () => false,
          mode: 0o755,
        };
      });

      const result = await auditor.auditProject("/test");

      expect(result.totalFiles).toBe(0);
    });

    it("should handle package.json auditing", async () => {
      mockFs.readdirSync.mockReturnValue(["package.json"]);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          dependencies: { lodash: "*" },
          scripts: { test: "jest" },
        }),
      );

      const result = await auditor.auditProject("/test");

      expect(
        result.issues.some(
          (issue) => issue.category === "dependency-management",
        ),
      ).toBe(true);
      expect(
        result.issues.some((issue) => issue.category === "security-practices"),
      ).toBe(true);
    });

    it("should calculate security score correctly", async () => {
      mockFs.readdirSync.mockReturnValue(["safe.ts"]);
      mockFs.readFileSync.mockReturnValue('console.log("safe code");');

      const result = await auditor.auditProject("/test");

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("generateReport", () => {
    it("should generate comprehensive security report", () => {
      const mockResult = {
        totalFiles: 10,
        issues: [
          {
            severity: "critical" as const,
            category: "code-injection",
            file: "/test/vulnerable.ts",
            line: 5,
            description: "Eval usage detected",
            recommendation: "Avoid eval",
            cwe: "CWE-95",
          },
        ],
        summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
        score: 80,
      };

      const report = auditor.generateReport(mockResult);

      expect(report).toContain("StringRay Framework Security Audit Report");
      expect(report).toContain("CRITICAL SEVERITY");
      expect(report).toContain("80/100");
      expect(report).toContain("Eval usage detected");
      expect(report).toContain("CWE-95");
    });

    it("should handle reports with no issues", () => {
      const mockResult = {
        totalFiles: 5,
        issues: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        score: 100,
      };

      const report = auditor.generateReport(mockResult);

      expect(report).toContain("No security issues found");
      expect(report).toContain("100/100");
    });
  });

  describe("Error Handling", () => {
    it("should handle file read errors gracefully", async () => {
      mockFs.readdirSync.mockReturnValue(["badfile.ts"]);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = await auditor.auditProject("/test");

      expect(
        result.issues.some((issue) => issue.category === "file-access"),
      ).toBe(true);
    });

    it("should handle invalid package.json gracefully", async () => {
      mockFs.readdirSync.mockReturnValue(["package.json"]);
      mockFs.readFileSync.mockReturnValue("invalid json {");

      const result = await auditor.auditProject("/test");

      expect(
        result.issues.some((issue) => issue.category === "configuration"),
      ).toBe(true);
    });
  });
});
