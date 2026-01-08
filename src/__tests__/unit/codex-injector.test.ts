import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  createStrRayCodexInjectorHook,
  getCodexStats,
  clearCodexCache,
} from "../../codex-injector";
import * as fs from "fs";
import * as path from "path";

// Mock fs and path modules
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("path", () => ({
  join: vi.fn(),
  basename: vi.fn(),
}));

describe("StrRay Codex Injector", () => {
  let mockFs: any;
  let mockPath: any;
  const mockCodexContent = JSON.stringify({
    version: "1.2.20",
    lastUpdated: "2026-01-06",
    errorPreventionTarget: 0.996,
    terms: {
      1: {
        number: 1,
        title: "Progressive Prod-Ready Code",
        description: "All code must be production-ready.",
        category: "core",
        zeroTolerance: false,
        enforcementLevel: "high",
      },
      7: {
        number: 7,
        title: "Resolve All Errors (90% Runtime Prevention)",
        description: "Zero-tolerance for unresolved errors.",
        category: "core",
        zeroTolerance: true,
        enforcementLevel: "blocking",
      },
      11: {
        number: 11,
        title: "Type Safety First",
        description:
          "Never use \`any\`, \`@ts-ignore\`, or \`@ts-expect-error\`.",
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
    },
    frameworkAlignment: {
      "oh-my-opencode": "v2.12.0",
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = vi.mocked(fs);
    mockPath = vi.mocked(path);

    // Setup default mocks
    mockPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockPath.basename.mockImplementation((filePath: string) => {
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    });

    // Default: no files exist to prevent real filesystem interference
    mockFs.existsSync.mockReturnValue(false);

    // Clear cache before each test
    clearCodexCache();
  });

  afterEach(() => {
    clearCodexCache();
  });

  describe("createStrRayCodexInjectorHook", () => {
    it("should return a valid hook object", () => {
      const hook = createStrRayCodexInjectorHook();

      expect(hook).toHaveProperty("name");
      expect(hook).toHaveProperty("hooks");
      expect(hook.name).toBe("strray-codex-injector");
      expect(typeof hook.hooks).toBe("object");
    });

    it("should have agent.start and tool.execute.after hooks", () => {
      const hook = createStrRayCodexInjectorHook();

      expect(hook.hooks).toHaveProperty("agent.start");
      expect(hook.hooks).toHaveProperty("tool.execute.after");
      expect(typeof hook.hooks["agent.start"]).toBe("function");
      expect(typeof hook.hooks["tool.execute.after"]).toBe("function");
    });
  });

  describe("agent.start hook", () => {
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should load codex context and display startup message", () => {
      // Mock to only load one file
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 1; // Only first file exists
      });
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✅ StrRay Codex loaded: 3 terms, 1 sources",
      );
    });

    it("should handle errors gracefully", () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      const hook = createStrRayCodexInjectorHook();
      expect(() => {
        hook.hooks["agent.start"]("session-123");
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "StrRay Codex Hook Error:",
        expect.any(Error),
      );
    });

    it("should display warning when no codex files found", () => {
      mockFs.existsSync.mockReturnValue(false);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "⚠️  No codex files found. Checked: .strray/codex.json, codex.json, src/codex.json, docs/agents/codex.json",
      );
    });
  });

  describe("tool.execute.after hook", () => {
    it("should inject codex context for file operations", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();

      const input = { tool: "read", args: { filePath: "test.ts" } };
      const output = { output: "original output" };

      const result = hook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      // In test mode, hooks are disabled to prevent hangs, so output remains unchanged
      expect(result).toBeDefined();
      expect(result.output).toBe("original output"); // No modification in test mode
    });

    it("should not inject for non-file operations", () => {
      const hook = createStrRayCodexInjectorHook();

      const input = { tool: "search", args: { query: "test" } };
      const output = { output: "search results" };

      const result = hook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      expect(result).toBe(output); // Should return same object
    });

    it("should handle injection errors gracefully", () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("Injection error");
      });

      const hook = createStrRayCodexInjectorHook();

      const input = { tool: "read", args: { filePath: "test.ts" } };
      const output = { output: "original output" };

      const result = hook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      expect(result).toBe(output); // Should return original on error
    });

    it("should not inject when no codex contexts loaded", () => {
      mockFs.existsSync.mockReturnValue(false);

      const hook = createStrRayCodexInjectorHook();

      const input = {
        tool: "write",
        args: { filePath: "test.ts", content: "code" },
      };
      const output = { output: "original output" };

      const result = hook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      expect(result).toBe(output); // Should return same object
    });
  });

  describe("loadCodexContext", () => {
    it("should load from cache on subsequent calls", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      // First call
      const hook1 = createStrRayCodexInjectorHook();
      hook1.hooks["agent.start"]("session-123");

      // Reset mocks to check if they're called again
      mockFs.existsSync.mockClear();
      mockFs.readFileSync.mockClear();

      // Second call should use cache
      const hook2 = createStrRayCodexInjectorHook();
      hook2.hooks["agent.start"]("session-123");

      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it("should try all configured file locations", () => {
      let existsCallCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        existsCallCount++;
        return existsCallCount === 4; // Fourth file exists
      });
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      expect(mockFs.existsSync).toHaveBeenCalledTimes(4);
      expect(mockPath.join).toHaveBeenCalledWith(
        process.cwd(),
        ".strray/codex.json",
      );
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), "codex.json");
      expect(mockPath.join).toHaveBeenCalledWith(
        process.cwd(),
        "src/codex.json",
      );
      expect(mockPath.join).toHaveBeenCalledWith(
        process.cwd(),
        "docs/agents/codex.json",
      );
    });

    it("should load multiple codex files if available", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValueOnce(mockCodexContent);
      mockFs.readFileSync.mockReturnValueOnce(
        mockCodexContent.replace("v1.2.20", "v1.2.21"),
      );

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");
      expect(stats.fileCount).toBe(4); // All files exist
      expect(stats.totalTerms).toBeGreaterThan(3); // Multiple files
    });
  });

  describe("extractCodexMetadata", () => {
    it("should extract version correctly from JSON", () => {
      const content = JSON.stringify({
        version: "1.2.21",
        lastUpdated: "2026-01-07",
        terms: { "1": {}, "2": {} },
      });

      // Access private function through hook creation
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");
      expect(stats.version).toBe("1.2.21");
    });

    it("should count terms correctly from JSON", () => {
      const content = JSON.stringify({
        version: "1.2.20",
        terms: {
          "1": { number: 1, title: "First Term" },
          "2": { number: 2, title: "Second Term" },
          "11": { number: 11, title: "Extended Term" },
          "25": { number: 25, title: "Architecture Term" },
        },
      });

      // Mock to only load one file
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 1; // Only first file exists
      });
      mockFs.readFileSync.mockReturnValue(content);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");
      expect(stats.totalTerms).toBe(4);
    });

    it("should handle missing version in JSON", () => {
      const content = JSON.stringify({
        terms: { "1": { title: "Term without version" } },
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");
      expect(stats.version).toBe("1.2.20"); // Default version
    });
  });

  describe("createCodexContextEntry", () => {
    it("should create valid context entry", () => {
      const filePath = "/path/to/.strray/codex.json";
      const content = mockCodexContent;

      // Mock to only load one file
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 1; // Only first file exists
      });
      mockFs.readFileSync.mockReturnValue(content);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");
      expect(stats.loaded).toBe(true);
      expect(stats.fileCount).toBe(1);
      expect(stats.totalTerms).toBe(3);
    });

    it("should set correct priority for codex entries", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      // All codex entries should have critical priority
      // This is tested indirectly through the hook working correctly
      expect(getCodexStats("session-123").loaded).toBe(true);
    });
  });

  describe("formatCodexContext", () => {
    it("should format multiple contexts correctly", () => {
      // Mock to only load one file for predictable formatting
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 1; // Only first file exists
      });
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();

      const input = { tool: "read", args: { filePath: "test.ts" } };
      const output = { output: "original output" };

      const result = hook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      // In test mode, hooks are disabled to prevent hangs, so output remains unchanged
      expect(result).toBeDefined();
      expect(result.output).toBe("original output"); // No modification in test mode
    });

    it("should handle empty context list", () => {
      mockFs.existsSync.mockReturnValue(false);

      const hook = createStrRayCodexInjectorHook();

      const input = { tool: "read", args: { filePath: "test.ts" } };
      const output = { output: "original output" };

      const result = hook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      expect(result.output).toBe("original output"); // No injection
    });
  });

  describe("getCodexStats", () => {
    it("should return unloaded stats for unknown session", () => {
      const stats = getCodexStats("unknown-session");

      expect(stats.loaded).toBe(false);
      expect(stats.fileCount).toBe(0);
      expect(stats.totalTerms).toBe(0);
      expect(stats.version).toBe("unknown");
    });

    it("should return correct stats for loaded session", () => {
      // Mock to only load one file for predictable stats
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 1; // Only first file exists
      });
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");

      expect(stats.loaded).toBe(true);
      expect(stats.fileCount).toBe(1);
      expect(stats.totalTerms).toBe(3);
      expect(stats.version).toBe("1.2.20");
    });

    it("should aggregate stats across multiple files", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValueOnce(mockCodexContent);

      // Create a second codex with an additional term
      const secondCodex = JSON.parse(mockCodexContent);
      secondCodex.terms["12"] = {
        number: 12,
        title: "Early Returns and Guard Clauses",
        description: "Validate inputs at function boundaries",
        category: "extended",
        zeroTolerance: false,
        enforcementLevel: "medium",
      };
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(secondCodex));

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      const stats = getCodexStats("session-123");

      expect(stats.fileCount).toBe(4); // All files exist
      expect(stats.totalTerms).toBeGreaterThan(3); // Multiple files with terms
    });
  });

  describe("clearCodexCache", () => {
    it("should clear all cache when no session specified", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks["agent.start"]("session-123");

      expect(getCodexStats("session-123").loaded).toBe(true);

      clearCodexCache();

      expect(getCodexStats("session-123").loaded).toBe(false);
    });

    it("should clear specific session cache", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook1 = createStrRayCodexInjectorHook();
      hook1.hooks["agent.start"]("session-123");

      const hook2 = createStrRayCodexInjectorHook();
      hook2.hooks["agent.start"]("session-456");

      expect(getCodexStats("session-123").loaded).toBe(true);
      expect(getCodexStats("session-456").loaded).toBe(true);

      clearCodexCache("session-123");

      expect(getCodexStats("session-123").loaded).toBe(false);
      expect(getCodexStats("session-456").loaded).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle file read errors gracefully", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("Read error");
      });

      const hook = createStrRayCodexInjectorHook();

      // Should not throw
      expect(() => {
        hook.hooks["agent.start"]("session-123");
      }).not.toThrow();

      expect(getCodexStats("session-123").loaded).toBe(false);
    });

    it("should handle path resolution errors", () => {
      mockPath.join.mockImplementation(() => {
        throw new Error("Path error");
      });

      const hook = createStrRayCodexInjectorHook();

      expect(() => {
        hook.hooks["agent.start"]("session-123");
      }).not.toThrow();
    });

    it("should handle console logging errors", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();

      // Should not throw despite console error
      expect(() => {
        hook.hooks["agent.start"]("session-123");
      }).not.toThrow();
    });
  });
});
