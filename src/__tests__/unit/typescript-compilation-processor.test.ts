/**
 * Tests for TypeScript Compilation Processor
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock child_process and fs before importing the processor
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("../../core/framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocks are set up
import { execSync } from "child_process";
import { existsSync } from "fs";
import { frameworkLogger } from "../../core/framework-logger.js";
import {
  runTypeScriptCompilation,
  parseTypeScriptErrors,
  typescriptCompilationProcessor,
  TypeScriptCompilationResult,
} from "../../processors/typescript-compilation-processor.js";

describe("typescript-compilation-processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseTypeScriptErrors", () => {
    it("should parse standard TypeScript error lines", () => {
      const stderr = [
        "src/foo.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.",
        "src/bar.ts(20,12): error TS2571: Object is of type 'unknown'.",
        "some unrelated output line",
      ].join("\n");

      const errors = parseTypeScriptErrors(stderr);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain("error TS2322");
      expect(errors[1]).toContain("error TS2571");
    });

    it("should return empty array when no error lines found", () => {
      const stderr = "some random output without errors";
      const errors = parseTypeScriptErrors(stderr);
      expect(errors).toHaveLength(0);
    });

    it("should trim whitespace from error lines", () => {
      const stderr = "  src/foo.ts(1,1): error TS1005: ';' expected.  \n";
      const errors = parseTypeScriptErrors(stderr);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe("src/foo.ts(1,1): error TS1005: ';' expected.");
    });

    it("should handle empty stderr", () => {
      const errors = parseTypeScriptErrors("");
      expect(errors).toHaveLength(0);
    });
  });

  describe("runTypeScriptCompilation", () => {
    it("should skip when no tsconfig.json exists", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = runTypeScriptCompilation("/project");

      expect(existsSync).toHaveBeenCalledWith("/project/tsconfig.json");
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("no tsconfig.json found");
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should pass when tsc --noEmit succeeds", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      const result = runTypeScriptCompilation("/project");

      expect(existsSync).toHaveBeenCalledWith("/project/tsconfig.json");
      expect(execSync).toHaveBeenCalledWith("npx tsc --noEmit", {
        cwd: "/project",
        stdio: "pipe",
        timeout: 30000,
      });
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should catch type errors when tsc --noEmit fails", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const mockError = new Error("tsc failed");
      mockError.stderr = Buffer.from(
        [
          "src/bad.ts(5,3): error TS2322: Type 'string' is not assignable to type 'number'.",
          "src/worse.ts(10,7): error TS7006: Parameter 'x' implicitly has an 'any' type.",
        ].join("\n"),
      );
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      const result = runTypeScriptCompilation("/project");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errorCount).toBe(2);
      expect(result.errors[0]).toContain("error TS2322");
      expect(result.errors[1]).toContain("error TS7006");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should use raw stderr when no error TS lines found", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const mockError = new Error("Command failed");
      mockError.stderr = Buffer.from("some non-standard error output");
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      const result = runTypeScriptCompilation("/project");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe("some non-standard error output");
    });

    it("should use error.message when stderr is unavailable", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const mockError = new Error("spawn ENOENT");
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      const result = runTypeScriptCompilation("/project");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe("spawn ENOENT");
    });

    it("should respect custom timeout", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      runTypeScriptCompilation("/project", 5000);

      expect(execSync).toHaveBeenCalledWith("npx tsc --noEmit", {
        cwd: "/project",
        stdio: "pipe",
        timeout: 5000,
      });
    });

    it("should default to process.cwd() when no cwd provided", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      runTypeScriptCompilation();

      expect(existsSync).toHaveBeenCalledWith(
        `${process.cwd()}/tsconfig.json`,
      );
      expect(execSync).toHaveBeenCalledWith("npx tsc --noEmit", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 30000,
      });
    });

    it("should handle timeout errors from execSync", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const mockError = new Error("Command timed out after 30000ms");
      mockError.stderr = Buffer.from(
        "Command timed out after 30000ms\nsrc/huge.ts(1,1): error TS2304: Cannot find name 'x'.",
      );
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      const result = runTypeScriptCompilation("/project", 30000);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("error TS2304");
      expect(result.errorCount).toBe(1);
    });

    it("should log via frameworkLogger on success", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      runTypeScriptCompilation("/project");

      expect(frameworkLogger.log).toHaveBeenCalledWith(
        "typescript-compilation-processor",
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    it("should log via frameworkLogger on skip", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      runTypeScriptCompilation("/project");

      expect(frameworkLogger.log).toHaveBeenCalledWith(
        "typescript-compilation-processor",
        "skipped - no tsconfig.json found",
        "info",
        expect.any(Object),
      );
    });

    it("should log via frameworkLogger on failure", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const mockError = new Error("tsc failed");
      mockError.stderr = Buffer.from(
        "src/bad.ts(5,3): error TS2322: Type 'string' is not assignable to type 'number'.",
      );
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      runTypeScriptCompilation("/project");

      expect(frameworkLogger.log).toHaveBeenCalledWith(
        "typescript-compilation-processor",
        "tsc --noEmit found type errors",
        "error",
        expect.objectContaining({ errorCount: 1 }),
      );
    });
  });

  describe("typescriptCompilationProcessor", () => {
    it("should be defined with correct properties", () => {
      expect(typescriptCompilationProcessor).toBeDefined();
      expect(typescriptCompilationProcessor.name).toBe("typescriptCompilation");
      expect(typescriptCompilationProcessor.priority).toBe(15);
      expect(typescriptCompilationProcessor.enabled).toBe(true);
    });

    it("should execute successfully using context directory", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      const result = await typescriptCompilationProcessor.execute({
        directory: "/my-project",
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fall back to process.cwd() when no directory in context", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      const result = await typescriptCompilationProcessor.execute({});

      expect(result.success).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "npx tsc --noEmit",
        expect.objectContaining({ cwd: process.cwd() }),
      );
    });

    it("should return errors when tsc fails via execute", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const mockError = new Error("tsc failed");
      mockError.stderr = Buffer.from(
        "src/err.ts(1,1): error TS2322: Type 'string' is not assignable to type 'number'.",
      );
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      const result = await typescriptCompilationProcessor.execute({
        directory: "/project",
      });

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.errors[0]).toContain("error TS2322");
    });
  });
});
