import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  StringRayContextLoader,
  strRayContextLoader,
  CodexContext,
  CodexTerm,
} from "../../context-loader";
import * as fs from "fs";
import * as path from "path";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock path module
vi.mock("path", () => ({
  join: vi.fn(),
}));

/**
 * Removes common leading indentation from template literals
 * Prevents parsing issues with indented multiline strings in tests
 */
function dedent(strings: TemplateStringsArray, ...values: unknown[]): string {
  const raw = strings.raw?.[0] ?? strings[0] ?? "";
  const lines = raw.split("\n");

  // Find minimum indentation from non-empty lines
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length === 0) return raw;

  const minIndent = Math.min(
    ...nonEmptyLines.map((line) => {
      const match = line.match(/^(\s*)/);
      return match?.[1]?.length ?? 0;
    }),
  );

  // Remove common indentation and trim
  const dedented = lines
    .map((line) =>
      line.startsWith(" ".repeat(minIndent)) ? line.slice(minIndent) : line,
    )
    .join("\n")
    .trim();

  return dedented;
}

describe("StringRayContextLoader", () => {
  let loader: StringRayContextLoader;
  let mockFs: any;
  let mockPath: any;

  const mockCodexContent = JSON.stringify({
    version: "1.2.22",
    lastUpdated: "2026-01-06",
    errorPreventionTarget: 0.996,
    terms: {
      1: {
        number: 1,
        title: "Progressive Prod-Ready Code",
        description:
          "All code must be production-ready from the first commit. No placeholder, stub, or incomplete implementations. Every function, class, and module must be fully functional and ready for deployment.",
        category: "core",
        zeroTolerance: false,
        enforcementLevel: "high",
      },
      2: {
        number: 2,
        title: "No Patches/Boiler/Stubs/Bridge Code",
        description:
          "Prohibit: Temporary patches, Boilerplate code, Stub implementations, Bridge code. All code must have clear, permanent purpose and complete implementation.",
        category: "core",
        zeroTolerance: false,
        enforcementLevel: "high",
      },
      3: {
        number: 3,
        title: "Do Not Over-Engineer the Solution",
        description:
          "Solutions should be simple and direct, focused on the actual problem, free of unnecessary abstractions.",
        category: "core",
        zeroTolerance: false,
        enforcementLevel: "low",
      },
      7: {
        number: 7,
        title: "Resolve All Errors (90% Runtime Prevention)",
        description:
          "Zero-tolerance for unresolved errors: All errors must be resolved, No console.log debugging, Systematic error handling, Error prevention through type safety, 90% of runtime errors prevented.",
        category: "core",
        zeroTolerance: true,
        enforcementLevel: "blocking",
      },
      8: {
        number: 8,
        title: "Prevent Infinite Loops",
        description:
          "Guarantee termination: Clear termination conditions, Base cases for recursion, Exit strategies for events, Timeout mechanisms for async, No indefinite iteration patterns.",
        category: "core",
        zeroTolerance: true,
        enforcementLevel: "blocking",
      },
      11: {
        number: 11,
        title: "Type Safety First",
        description:
          "Never use any/@ts-ignore/@ts-expect-error, Leverage TypeScript fully, Use discriminated unions, Prefer type inference, Type errors are blocking.",
        category: "extended",
        zeroTolerance: true,
        enforcementLevel: "blocking",
      },
    },
    interweaves: ["Error Prevention Interweave"],
    lenses: ["Code Quality Lens"],
    principles: ["SOLID Principles"],
    antiPatterns: ["Spaghetti code"],
    validationCriteria: {
      "All functions have implementations": false,
      "No TODO comments in production code": false,
      "All error paths are handled": false,
    },
    frameworkAlignment: {
      "oh-my-opencode": "v1.1.1",
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance for clean test state
    (StringRayContextLoader as any).instance = null;
    loader = StringRayContextLoader.getInstance();
    mockFs = vi.mocked(fs);
    mockPath = vi.mocked(path);

    // Clear cache to ensure fresh state
    loader.clearCache();

    // Default path.join behavior
    mockPath.join.mockImplementation((...args: string[]) => args.join("/"));
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = StringRayContextLoader.getInstance();
      const instance2 = StringRayContextLoader.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should export singleton instance", () => {
      const instance1 = StringRayContextLoader.getInstance();
      expect(strRayContextLoader).toStrictEqual(instance1);
    });
  });

  describe("loadCodexContext", () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
    });

    it("should return error for invalid project root", async () => {
      const result = await loader.loadCodexContext("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid project root path");
    });

    it("should return cached context on subsequent calls", async () => {
      const firstResult = await loader.loadCodexContext("/test/project");
      expect(firstResult.success).toBe(true);

      // Second call should return cached result
      mockFs.existsSync.mockClear();
      mockFs.readFileSync.mockClear();

      const secondResult = await loader.loadCodexContext("/test/project");
      expect(secondResult.success).toBe(true);
      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it("should load context from first available file", async () => {
      mockFs.existsSync.mockImplementation((path: string) =>
        path.includes(".strray/codex.json"),
      );

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.version).toBe("1.2.22");
    });

    it("should try all file paths until one succeeds", async () => {
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 2; // Second file exists
      });

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledTimes(2);
    });

    it("should return error when no files found", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(false);
      expect(result.error).toContain("No valid codex file found");
    });

    it("should handle file read errors gracefully", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File read error");
      });

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(false);
      expect(result.warnings).toHaveLength(2); // Two file paths attempted
      expect(result.warnings[0]).toContain("Failed to parse");
    });

    it("should parse codex content correctly", () => {
      const jsonContent = JSON.stringify({
        version: "1.2.22",
        lastUpdated: "2026-01-06",
        errorPreventionTarget: 0.996,
        terms: {
          1: {
            number: 1,
            title: "Progressive Prod-Ready Code",
            description:
              "All code must be production-ready from the first commit.",
            category: "core",
            zeroTolerance: false,
            enforcementLevel: "high",
          },
          2: {
            number: 2,
            title: "No Patches/Boiler/Stubs/Bridge Code",
            description: "Prohibit temporary patches and boilerplate code.",
            category: "core",
            zeroTolerance: false,
            enforcementLevel: "high",
          },
        },
        interweaves: ["Error Prevention Interweave"],
        lenses: ["Code Quality Lens"],
        principles: [],
        antiPatterns: [],
        validationCriteria: {},
        frameworkAlignment: {},
      });

      const context = loader["parseCodexContent"](jsonContent, "test.json");

      expect(context.version).toBe("1.2.22");
      expect(context.errorPreventionTarget).toBe(0.996);
      expect(context.terms.size).toBe(2);
      expect(context.interweaves).toContain("Error Prevention Interweave");
      expect(context.lenses).toContain("Code Quality Lens");
    });

    it("should return error for invalid project root", async () => {
      const result = await loader.loadCodexContext("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid project root path");
    });

    it("should return cached context on subsequent calls", async () => {
      const firstResult = await loader.loadCodexContext("/test/project");
      expect(firstResult.success).toBe(true);

      // Second call should return cached result
      mockFs.existsSync.mockClear();
      mockFs.readFileSync.mockClear();

      const secondResult = await loader.loadCodexContext("/test/project");
      expect(secondResult.success).toBe(true);
      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it("should load context from first available file", async () => {
      mockFs.existsSync.mockImplementation((path: string) =>
        path.includes(".strray/codex.json"),
      );

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.version).toBe("1.2.22");
    });

    it("should try all file paths until one succeeds", async () => {
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 2; // Second file exists
      });

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledTimes(2);
    });

    it("should return error when no files found", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(false);
      expect(result.error).toContain("No valid codex file found");
    });

    it("should handle file read errors gracefully", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File read error");
      });

      const result = await loader.loadCodexContext("/test/project");

      expect(result.success).toBe(false);
      expect(result.warnings).toHaveLength(2); // Two file paths attempted
      expect(result.warnings[0]).toContain("Failed to parse");
    });
  });

  describe("parseCodexContent", () => {
    it("should throw error for invalid content", () => {
      expect(() => {
        loader["parseCodexContent"]("", "test.json");
      }).toThrow("Invalid content provided");
    });

    it("should throw error for invalid source path", () => {
      expect(() => {
        loader["parseCodexContent"]("content", "");
      }).toThrow("Invalid source path provided");
    });

    it("should parse version correctly", () => {
      const content = JSON.stringify({
        version: "1.2.21",
        terms: {},
      });
      const context = loader["parseCodexContent"](content, "test.json");
      expect(context.version).toBe("1.2.21");
    });

    it("should parse error prevention target", () => {
      const content = JSON.stringify({
        errorPreventionTarget: 0.955,
        terms: {},
      });
      const context = loader["parseCodexContent"](content, "test.json");
      expect(context.errorPreventionTarget).toBe(0.955);
    });

    it("should parse codex terms correctly", () => {
      const content = JSON.stringify({
        terms: {
          1: {
            number: 1,
            title: "Test Term One",
            description: "This is the first term description.",
            category: "core",
          },
          2: {
            number: 2,
            title: "Test Term Two",
            description: "This is the second term description.",
            category: "core",
          },
          11: {
            number: 11,
            title: "Extended Term",
            description: "This is an extended term.",
            category: "extended",
          },
        },
      });

      const context = loader["parseCodexContent"](content, "test.json");

      expect(context.terms.size).toBe(3);

      const term1 = context.terms.get(1);
      expect(term1).toBeDefined();
      expect(term1!.number).toBe(1);
      expect(term1!.description).toBe("This is the first term description.");
      expect(term1!.category).toBe("core");

      const term11 = context.terms.get(11);
      expect(term11!.category).toBe("extended");
    });

    it("should infer term categories correctly", () => {
      const content = JSON.stringify({
        terms: {
          1: {
            number: 1,
            title: "Core Term",
            description: "Description",
            category: "core",
          },
          15: {
            number: 15,
            title: "Extended Term",
            description: "Description",
            category: "extended",
          },
          25: {
            number: 25,
            title: "Architecture Term",
            description: "Description",
            category: "architecture",
          },
          35: {
            number: 35,
            title: "Advanced Term",
            description: "Description",
            category: "advanced",
          },
        },
      });

      const context = loader["parseCodexContent"](content, "test.json");

      expect(context.terms.get(1)!.category).toBe("core");
      expect(context.terms.get(15)!.category).toBe("extended");
      expect(context.terms.get(25)!.category).toBe("architecture");
      expect(context.terms.get(35)!.category).toBe("advanced");
    });

    it("should set enforcement levels correctly", () => {
      const content = JSON.stringify({
        terms: {
          7: {
            number: 7,
            title: "Zero Tolerance Term",
            description: "Description",
            category: "core",
            zeroTolerance: true,
            enforcementLevel: "blocking",
          },
          8: {
            number: 8,
            title: "Another Zero Tolerance Term",
            description: "Description",
            category: "core",
            zeroTolerance: true,
            enforcementLevel: "blocking",
          },
          11: {
            number: 11,
            title: "High Enforcement Term",
            description: "Description",
            category: "extended",
            enforcementLevel: "low",
          },
        },
      });

      const context = loader["parseCodexContent"](content, "test.json");

      expect(context.terms.get(7)!.zeroTolerance).toBe(true);
      expect(context.terms.get(7)!.enforcementLevel).toBe("blocking");
      expect(context.terms.get(8)!.zeroTolerance).toBe(true);
      expect(context.terms.get(11)!.enforcementLevel).toBe("low");
    });

    it("should parse interweaves and lenses", () => {
      const content = JSON.stringify({
        interweaves: ["Error Prevention Interweave"],
        lenses: ["Code Quality Lens", "Performance Lens"],
        terms: {},
      });

      const context = loader["parseCodexContent"](content, "test.json");

      expect(context.interweaves).toContain("Error Prevention Interweave");
      expect(context.lenses).toContain("Code Quality Lens");
      expect(context.lenses).toContain("Performance Lens");
    });

    it("should parse validation criteria", () => {
      const content = JSON.stringify({
        validationCriteria: {
          "All functions have implementations": false,
          "No TODO comments in production code": false,
          "All error paths are handled": false,
        },
        terms: {},
      });

      const context = loader["parseCodexContent"](content, "test.json");

      expect(
        context.validationCriteria["All functions have implementations"],
      ).toBe(false);
      expect(
        context.validationCriteria["No TODO comments in production code"],
      ).toBe(false);
    });

    it("should handle missing optional fields", () => {
      const content = JSON.stringify({
        version: "1.2.20",
        terms: {
          1: {
            number: 1,
            title: "Test Term",
            description: "Description",
            category: "core",
          },
        },
      });

      const context = loader["parseCodexContent"](content, "test.json");

      expect(context.version).toBe("1.2.20");
      expect(context.interweaves).toEqual([]);
      expect(context.lenses).toEqual([]);
      expect(context.principles).toEqual([]);
      expect(context.antiPatterns).toEqual([]);
      expect(context.validationCriteria).toEqual({});
      expect(context.frameworkAlignment).toEqual({});
      expect(context.errorPreventionTarget).toBe(0.996); // default value
    });
  });

  describe("getTerm", () => {
    let context: CodexContext;

    beforeEach(async () => {
      // Ensure mocks are set up for context loading
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const result = await loader.loadCodexContext("/test/project");
      context = result.context!;
    });

    it("should return correct term by number", () => {
      const term = loader.getTerm(context, 1);
      expect(term).toBeDefined();
      expect(term!.number).toBe(1);
    });

    it("should return undefined for non-existent terms", () => {
      const term = loader.getTerm(context, 999);
      expect(term).toBeUndefined();
    });
  });

  describe("getCoreTerms", () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext("/test/project");
      context = result.context!;
    });

    it("should return only core terms", () => {
      const coreTerms = loader.getCoreTerms(context);

      expect(coreTerms.length).toBeGreaterThan(0);
      coreTerms.forEach((term) => {
        expect(term.category).toBe("core");
      });
    });

    it("should sort terms by number", () => {
      const coreTerms = loader.getCoreTerms(context);

      for (let i = 1; i < coreTerms.length; i++) {
        const currentTerm = coreTerms[i];
        const previousTerm = coreTerms[i - 1];
        expect(currentTerm!.number).toBeGreaterThan(previousTerm!.number);
      }
    });
  });

  describe("getZeroToleranceTerms", () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext("/test/project");
      context = result.context!;
    });

    it("should return terms with zero tolerance or blocking enforcement", () => {
      const zeroToleranceTerms = loader.getZeroToleranceTerms(context);

      zeroToleranceTerms.forEach((term) => {
        expect(term.zeroTolerance || term.enforcementLevel === "blocking").toBe(
          true,
        );
      });
    });
  });

  describe("validateAgainstCodex", () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext("/test/project");
      context = result.context!;
    });

    it("should throw error for invalid context", () => {
      expect(() => {
        loader.validateAgainstCodex(null as any, "test", {});
      }).toThrow("Invalid codex context provided");
    });

    it("should throw error for invalid action", () => {
      expect(() => {
        loader.validateAgainstCodex(context, "", {});
      }).toThrow("Invalid action provided");
    });

    it("should detect type safety violations", () => {
      const result = loader.validateAgainstCodex(context, "use any type here", {
        includesAny: true,
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.term.number).toBe(11);
    });

    it("should detect unresolved tasks", () => {
      const result = loader.validateAgainstCodex(context, "test", {
        code: "TODO: fix this later\nFIXME: another issue\nXXX: temp code",
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.term.number === 7)).toBe(true);
    });

    it("should detect over-engineered solutions", () => {
      const result = loader.validateAgainstCodex(context, "test", {
        isOverEngineered: true,
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.term.number === 3)).toBe(true);
      expect(result.recommendations).toContain(
        "Simplify the solution by removing unnecessary abstractions",
      );
    });

    it("should detect infinite loops", () => {
      const result = loader.validateAgainstCodex(context, "test", {
        isInfiniteLoop: true,
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.term.number === 8)).toBe(true);
      expect(result.recommendations).toContain(
        "Add clear termination conditions to prevent infinite loops",
      );
    });

    it("should return compliant for valid code", () => {
      const result = loader.validateAgainstCodex(context, "valid action", {});

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("cache management", () => {
    it("should clear cache correctly", async () => {
      await loader.loadCodexContext("/test/project");
      expect(loader.isContextLoaded()).toBe(true);

      loader.clearCache();
      expect(loader.isContextLoaded()).toBe(false);
    });
  });

  describe("context statistics", () => {
    it("should return correct stats when loaded", async () => {
      await loader.loadCodexContext("/test/project");
      const stats = loader.getContextStats();

      expect(stats.loaded).toBe(true);
      expect(stats.termCount).toBeGreaterThan(0);
      expect(typeof stats.categoryBreakdown).toBe("object");
      expect(typeof stats.zeroToleranceCount).toBe("number");
    });

    it("should return empty stats when not loaded", () => {
      const stats = loader.getContextStats();

      expect(stats.loaded).toBe(false);
      expect(stats.termCount).toBe(0);
      expect(stats.zeroToleranceCount).toBe(0);
    });
  });
});
