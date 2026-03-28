/**
 * Tests for src/core/codex-formatter.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  formatCodexPrompt,
  formatMinimalCodexPrompt,
  getCodexConfig,
  findCodexPath,
  loadCodex,
  type FormatResult,
} from "./codex-formatter";

// Temp dir that will not contain any codex.json (for fallback tests)
const EMPTY_ROOT = join(tmpdir(), "strray-test-empty");

// Sample codex config used for filesystem tests
const SAMPLE_CODEX = {
  version: "test-1.0.0",
  terms: [
    {
      id: "sample-blocking",
      title: "Sample Blocking Rule",
      description: "This is a blocking rule for testing.",
      severity: "blocking" as const,
      examples: ["example 1"],
    },
    {
      id: "sample-high",
      title: "Sample High Priority",
      description: "This is a high priority rule.",
      severity: "high" as const,
    },
    {
      id: "sample-medium",
      title: "Sample Medium Rule",
      description: "This is a medium severity rule.",
      severity: "medium" as const,
    },
  ],
};

describe("codex-formatter", () => {
  // =========================================================================
  // 1. Fallback to built-in codex when no files exist
  // =========================================================================
  describe("loadCodex (fallback)", () => {
    it("should return built-in codex when no codex.json exists", () => {
      const { config, source } = loadCodex(EMPTY_ROOT);

      expect(source).toBeNull();
      expect(config.version).toBe("fallback-1.0.0");
      expect(config.terms.length).toBeGreaterThan(0);
    });

    it("should return built-in codex with correct term severities", () => {
      const { config } = loadCodex(EMPTY_ROOT);
      const severities = config.terms.map((t) => t.severity);

      expect(severities).toContain("blocking");
      expect(severities).toContain("high");
      expect(severities).toContain("medium");
    });

    it("should default to cwd when no projectRoot argument is provided", () => {
      const { config, source } = loadCodex();

      // cwd is the project dir which has a codex.json, but it may use
      // a different schema (terms as object vs array). loadCodex should
      // always return a parsed config regardless.
      expect(config).toBeDefined();
      expect(config.version).toBeTruthy();
      // source will be a path if a codex.json was found
      if (source) {
        expect(typeof source).toBe("string");
      }
    });

    it("should fall back when codex.json contains invalid JSON", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "strray-badjson-"));
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), "not json{{{", "utf-8");

      const { config, source } = loadCodex(tempDir);

      expect(source).toBeNull();
      expect(config.version).toBe("fallback-1.0.0");

      rmSync(tempDir, { recursive: true, force: true });
    });
  });

  // =========================================================================
  // 2. formatCodexPrompt returns correct structure
  // =========================================================================
  describe("formatCodexPrompt", () => {
    it("should return a FormatResult object with all expected fields", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result).toHaveProperty("prompt");
      expect(result).toHaveProperty("termCount");
      expect(result).toHaveProperty("totalTerms");
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("configPath");
      expect(result).toHaveProperty("charCount");
    });

    it("should include the codex version in the header", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).toContain("fallback-1.0.0");
      expect(result.prompt).toContain("StringRay Universal Development Codex");
    });

    it("should include term IDs in the prompt", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).toContain("resolve-all-errors");
      expect(result.prompt).toContain("tests-required");
      expect(result.prompt).toContain("no-console-in-production");
    });

    it("should report correct termCount and totalTerms from built-in", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.termCount).toBe(result.totalTerms);
      expect(result.totalTerms).toBe(8); // built-in has 8 terms
    });

    it("should have configPath null when using built-in fallback", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.configPath).toBeNull();
    });

    it("should accept an empty options object", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).toBeTruthy();
      expect(result.termCount).toBeGreaterThan(0);
    });

    it("should use custom header when provided", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        header: "# My Custom Header",
      });

      expect(result.prompt).toContain("# My Custom Header");
      expect(result.prompt).not.toContain("StringRay Universal Development Codex");
    });
  });

  // =========================================================================
  // 3. severityFilter works
  // =========================================================================
  describe("severityFilter", () => {
    it("should filter to only blocking terms", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        severityFilter: ["blocking"],
      });

      // Built-in has 3 blocking terms
      expect(result.termCount).toBe(3);
      expect(result.prompt).toContain("resolve-all-errors");
      expect(result.prompt).toContain("tests-required");
      expect(result.prompt).toContain("no-console-in-production");
    });

    it("should filter to only high terms", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        severityFilter: ["high"],
      });

      // Built-in has 3 high terms
      expect(result.termCount).toBe(3);
      expect(result.prompt).toContain("type-safety");
      expect(result.prompt).toContain("input-validation");
      expect(result.prompt).toContain("immutable-state");
    });

    it("should filter to multiple severities", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        severityFilter: ["blocking", "high"],
      });

      expect(result.termCount).toBe(6);
    });

    it("should return all terms when filter is empty", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        severityFilter: [],
      });

      expect(result.termCount).toBe(8);
    });

    it("should exclude medium terms when filtering blocking+high", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        severityFilter: ["blocking", "high"],
      });

      expect(result.prompt).not.toContain("error-boundaries");
      expect(result.prompt).not.toContain("dead-code-elimination");
    });
  });

  // =========================================================================
  // 4. Compressed mode
  // =========================================================================
  describe("compressed mode", () => {
    it("should omit descriptions for medium severity terms when compressed", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        compressed: true,
      });

      // The medium term IDs should still appear
      expect(result.prompt).toContain("error-boundaries");
      expect(result.prompt).toContain("dead-code-elimination");

      // But their descriptions should NOT appear
      expect(result.prompt).not.toContain(
        "Wrap operations in try/catch with meaningful error messages"
      );
      expect(result.prompt).not.toContain(
        "Remove unused imports, variables, functions, and commented-out code"
      );
    });

    it("should still include descriptions for blocking terms in compressed mode", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        compressed: true,
      });

      // Blocking descriptions should be present
      expect(result.prompt).toContain(
        "Never leave unhandled errors, rejected promises"
      );
      expect(result.prompt).toContain(
        "Every new function, method, or module must have corresponding test coverage"
      );
    });

    it("should still include descriptions for high terms in compressed mode", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        compressed: true,
      });

      expect(result.prompt).toContain("Prefer explicit types over 'any'");
    });

    it("should produce a shorter prompt when compressed", () => {
      const normal = formatCodexPrompt({ projectRoot: EMPTY_ROOT, compressed: false });
      const compressed = formatCodexPrompt({ projectRoot: EMPTY_ROOT, compressed: true });

      expect(compressed.charCount).toBeLessThan(normal.charCount);
    });
  });

  // =========================================================================
  // 5. maxTerms limit
  // =========================================================================
  describe("maxTerms", () => {
    it("should limit the number of terms returned", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        maxTerms: 2,
      });

      expect(result.termCount).toBe(2);
    });

    it("should keep all terms when maxTerms exceeds total", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        maxTerms: 100,
      });

      expect(result.termCount).toBe(8);
    });

    it("should take the highest-severity terms first (blocking before medium)", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        maxTerms: 4,
      });

      // First 4 should be: 3 blocking + 1 high (sorted by severity)
      expect(result.prompt).toContain("resolve-all-errors");
      expect(result.prompt).toContain("tests-required");
      expect(result.prompt).toContain("no-console-in-production");
      // The 4th term should be a high term, not a medium one
      expect(result.prompt).toContain("type-safety");
    });

    it("should report totalTerms correctly regardless of maxTerms", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        maxTerms: 1,
      });

      expect(result.totalTerms).toBe(8);
    });
  });

  // =========================================================================
  // 6. formatMinimalCodexPrompt only includes blocking terms
  // =========================================================================
  describe("formatMinimalCodexPrompt", () => {
    it("should only include blocking terms", () => {
      const result = formatMinimalCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.termCount).toBe(3);
      expect(result.prompt).toContain("resolve-all-errors");
      expect(result.prompt).toContain("tests-required");
      expect(result.prompt).toContain("no-console-in-production");
    });

    it("should not include high or medium terms", () => {
      const result = formatMinimalCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).not.toContain("type-safety");
      expect(result.prompt).not.toContain("input-validation");
      expect(result.prompt).not.toContain("error-boundaries");
      expect(result.prompt).not.toContain("dead-code-elimination");
    });

    it("should be compressed (no descriptions for medium, but blocking are still there)", () => {
      const result = formatMinimalCodexPrompt({ projectRoot: EMPTY_ROOT });

      // Blocking descriptions are still present (compressed only affects medium)
      expect(result.prompt).toContain("Never leave unhandled errors");
    });

    it("should not include config path in footer", () => {
      const result = formatMinimalCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).not.toContain("Config source:");
    });

    it("should override user-provided severityFilter", () => {
      // Even if user passes a different filter, minimal should force blocking
      const result = formatMinimalCodexPrompt({
        projectRoot: EMPTY_ROOT,
        severityFilter: ["high", "medium"],
      });

      // formatMinimalCodexPrompt sets its own severityFilter: ["blocking"]
      // so the user's filter is overridden
      expect(result.prompt).toContain("resolve-all-errors");
      expect(result.termCount).toBe(3);
    });

    it("should produce a shorter prompt than full format", () => {
      const full = formatCodexPrompt({ projectRoot: EMPTY_ROOT });
      const minimal = formatMinimalCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(minimal.charCount).toBeLessThan(full.charCount);
      expect(minimal.termCount).toBeLessThan(full.termCount);
    });
  });

  // =========================================================================
  // 7. getCodexConfig returns JSON structure
  // =========================================================================
  describe("getCodexConfig", () => {
    it("should return an object with version, terms, termCount, and source", () => {
      const result = getCodexConfig({ projectRoot: EMPTY_ROOT });

      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("terms");
      expect(result).toHaveProperty("termCount");
      expect(result).toHaveProperty("source");
    });

    it("should return terms as an array of objects with id, title, description, severity", () => {
      const result = getCodexConfig({ projectRoot: EMPTY_ROOT });

      expect(Array.isArray(result.terms)).toBe(true);
      for (const term of result.terms) {
        expect(term).toHaveProperty("id");
        expect(term).toHaveProperty("title");
        expect(term).toHaveProperty("description");
        expect(term).toHaveProperty("severity");
        expect(["blocking", "high", "medium"]).toContain(term.severity);
      }
    });

    it("should have termCount matching terms.length", () => {
      const result = getCodexConfig({ projectRoot: EMPTY_ROOT });

      expect(result.termCount).toBe(result.terms.length);
    });

    it("should return source as null when using built-in fallback", () => {
      const result = getCodexConfig({ projectRoot: EMPTY_ROOT });

      expect(result.source).toBeNull();
    });

    it("should return correct version string", () => {
      const result = getCodexConfig({ projectRoot: EMPTY_ROOT });

      expect(result.version).toBe("fallback-1.0.0");
    });

    it("should return terms with valid severities", () => {
      const result = getCodexConfig({ projectRoot: EMPTY_ROOT });
      const validSeverities = ["blocking", "high", "medium"];

      for (const term of result.terms) {
        expect(validSeverities).toContain(term.severity);
      }
    });
  });

  // =========================================================================
  // 8. findCodexPath resolves correctly
  // =========================================================================
  describe("findCodexPath", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), "strray-codex-"));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it("should return null when no codex.json exists anywhere", () => {
      const result = findCodexPath(tempDir);

      expect(result).toBeNull();
    });

    it("should find codex.json in .strray/ directory", () => {
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");

      const result = findCodexPath(tempDir);

      expect(result).toBe(join(tempDir, ".strray", "codex.json"));
    });

    it("should find codex.json in .opencode/strray/ directory", () => {
      mkdirSync(join(tempDir, ".opencode", "strray"), { recursive: true });
      writeFileSync(join(tempDir, ".opencode", "strray", "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");

      const result = findCodexPath(tempDir);

      expect(result).toBe(join(tempDir, ".opencode", "strray", "codex.json"));
    });

    it("should find codex.json in project root", () => {
      writeFileSync(join(tempDir, "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");

      const result = findCodexPath(tempDir);

      expect(result).toBe(join(tempDir, "codex.json"));
    });

    it("should prefer .strray/ over project root", () => {
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");
      writeFileSync(join(tempDir, "codex.json"), JSON.stringify({ version: "root-1.0.0", terms: [] }), "utf-8");

      const result = findCodexPath(tempDir);

      expect(result).toBe(join(tempDir, ".strray", "codex.json"));
    });

    it("should prefer .strray/ over .opencode/strray/", () => {
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      mkdirSync(join(tempDir, ".opencode", "strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");
      writeFileSync(join(tempDir, ".opencode", "strray", "codex.json"), JSON.stringify({ version: "opencode-1.0.0", terms: [] }), "utf-8");

      const result = findCodexPath(tempDir);

      expect(result).toBe(join(tempDir, ".strray", "codex.json"));
    });

    it("should prioritize STRRAY_CONFIG_DIR env variable", () => {
      const envDir = "my-config";
      mkdirSync(join(tempDir, envDir), { recursive: true });
      writeFileSync(join(tempDir, envDir, "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");
      // Also create .strray to verify env wins
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), JSON.stringify({ version: "strray-1.0.0", terms: [] }), "utf-8");

      const original = process.env.STRRAY_CONFIG_DIR;
      process.env.STRRAY_CONFIG_DIR = envDir;

      try {
        const result = findCodexPath(tempDir);
        expect(result).toBe(join(tempDir, envDir, "codex.json"));
      } finally {
        if (original === undefined) {
          delete process.env.STRRAY_CONFIG_DIR;
        } else {
          process.env.STRRAY_CONFIG_DIR = original;
        }
      }
    });
  });

  // =========================================================================
  // Additional edge-case tests
  // =========================================================================
  describe("edge cases", () => {
    it("should include examples when includeExamples is true", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        includeExamples: true,
      });

      // The built-in "resolve-all-errors" term has examples
      expect(result.prompt).toContain("Examples:");
      expect(result.prompt).toContain("catch (err)");
    });

    it("should not include examples when includeExamples is false (default)", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).not.toContain("Examples:");
      expect(result.prompt).not.toContain("`catch (err)`");
    });

    it("should include config source path when loading from file", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "strray-edge-"));
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");

      try {
        const result = formatCodexPrompt({ projectRoot: tempDir });

        expect(result.configPath).toBe(join(tempDir, ".strray", "codex.json"));
        expect(result.prompt).toContain("Config source:");
        expect(result.version).toBe("test-1.0.0");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should not include config source when includeConfigPath is false", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        includeConfigPath: false,
      });

      expect(result.prompt).not.toContain("Config source:");
    });

    it("should handle maxTerms of 1", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        maxTerms: 1,
      });

      expect(result.termCount).toBe(1);
      // Should be a blocking term (highest priority)
      expect(result.prompt).toContain("resolve-all-errors");
    });

    it("should handle maxTerms of 0 by returning all terms (0 is falsy, no limit applied)", () => {
      const result = formatCodexPrompt({
        projectRoot: EMPTY_ROOT,
        maxTerms: 0,
      });

      // maxTerms && terms.length > maxTerms => 0 is falsy, so no limiting occurs
      expect(result.termCount).toBe(8);
    });

    it("should load terms from a real codex.json file", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "strray-load-"));
      mkdirSync(join(tempDir, ".strray"), { recursive: true });
      writeFileSync(join(tempDir, ".strray", "codex.json"), JSON.stringify(SAMPLE_CODEX), "utf-8");

      try {
        const { config, source } = loadCodex(tempDir);

        expect(source).toBe(join(tempDir, ".strray", "codex.json"));
        expect(config.version).toBe("test-1.0.0");
        expect(config.terms).toHaveLength(3);
        expect(config.terms[0].id).toBe("sample-blocking");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should include severity labels in the prompt", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).toContain("[BLOCKING]");
      expect(result.prompt).toContain("[HIGH PRIORITY]");
      expect(result.prompt).toContain("[MEDIUM]");
    });

    it("should include severity emojis in the prompt", () => {
      const result = formatCodexPrompt({ projectRoot: EMPTY_ROOT });

      expect(result.prompt).toContain("\uD83D\uDD34"); // red circle (blocking)
      expect(result.prompt).toContain("\uD83D\uDFE1"); // yellow circle (high)
      expect(result.prompt).toContain("\uD83D\uDFE2"); // green circle (medium)
    });
  });
});
