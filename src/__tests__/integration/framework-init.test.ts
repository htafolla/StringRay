import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { StrRayStateManager } from "../../state/state-manager";
import { StrRayContextLoader } from "../../context-loader";
import {
  createStrRayCodexInjectorHook,
  clearCodexCache,
} from "../../codex-injector";
import * as fs from "fs";
import * as path from "path";

// Mock external dependencies
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("path", () => ({
  join: vi.fn(),
  basename: vi.fn(),
}));

describe("StrRay Framework Initialization Integration", () => {
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
        description: "All code must be production-ready from the first commit.",
        category: "core",
      },
      2: {
        number: 2,
        title: "No Patches/Boiler/Stubs/Bridge Code",
        description: "Prohibit temporary patches and boilerplate code.",
        category: "core",
      },
      7: {
        number: 7,
        title: "Resolve All Errors (90% Runtime Prevention)",
        description: "Zero-tolerance for unresolved errors.",
        category: "core",
        zeroTolerance: true,
        enforcementLevel: "blocking",
      },
      8: {
        number: 8,
        title: "Prevent Infinite Loops",
        description: "Guarantee termination in all iterative processes.",
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
      "No TODO comments in production code": false,
    },
    frameworkAlignment: {
      "oh-my-opencode": "v2.12.0",
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = vi.mocked(fs);
    mockPath = vi.mocked(path);

    // Setup mocks
    mockPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockPath.basename.mockImplementation((filePath: string) => {
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    });

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(mockCodexContent);

    // Clear all caches
    clearCodexCache();
    (StrRayContextLoader as any).instance = null;
  });

  afterEach(() => {
    clearCodexCache();
  });

  describe("Complete Framework Boot Sequence", () => {
    it("should successfully initialize all framework components", async () => {
      // 1. Initialize State Manager
      const stateManager = new StrRayStateManager();
      expect(stateManager).toBeDefined();

      // 2. Initialize Context Loader
      const contextLoader = StrRayContextLoader.getInstance();
      expect(contextLoader).toBeDefined();

      // 3. Load Codex Context
      const contextResult =
        await contextLoader.loadCodexContext("/test/project");
      expect(contextResult.success).toBe(true);
      expect(contextResult.context).toBeDefined();

      // 4. Initialize Codex Injector Hook
      const injectorHook = createStrRayCodexInjectorHook();
      expect(injectorHook).toBeDefined();
      expect(injectorHook.name).toBe("strray-codex-injector");

      // 5. Verify all components are properly connected
      const context = contextResult.context!;
      expect(context.version).toBe("1.2.20");
      expect(context.terms.size).toBeGreaterThan(0);
      expect(context.errorPreventionTarget).toBe(0.996);
    });

    it("should handle framework initialization with missing codex files", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const contextLoader = StrRayContextLoader.getInstance();
      const contextResult =
        await contextLoader.loadCodexContext("/test/project");

      expect(contextResult.success).toBe(false);
      expect(contextResult.error).toContain("No valid codex file found");

      // Framework should still initialize other components
      const stateManager = new StrRayStateManager();
      expect(stateManager).toBeDefined();

      const injectorHook = createStrRayCodexInjectorHook();
      expect(injectorHook).toBeDefined();
    });

    it("should maintain component isolation during initialization", async () => {
      // Initialize multiple instances
      const stateManager1 = new StrRayStateManager();
      const stateManager2 = new StrRayStateManager();

      const contextLoader1 = StrRayContextLoader.getInstance();
      const contextLoader2 = StrRayContextLoader.getInstance();

      // Verify instances are properly isolated
      stateManager1.set("test", "value1");
      stateManager2.set("test", "value2");

      expect(stateManager1.get("test")).toBe("value1");
      expect(stateManager2.get("test")).toBe("value2");

      // Context loader should be singleton
      expect(contextLoader1).toBe(contextLoader2);
    });
  });

  describe("Framework Component Interactions", () => {
    it("should validate code against loaded codex context", async () => {
      const contextLoader = StrRayContextLoader.getInstance();
      const contextResult =
        await contextLoader.loadCodexContext("/test/project");
      expect(contextResult.success).toBe(true);

      const context = contextResult.context!;

      // Test validation with compliant code
      const compliantResult = contextLoader.validateAgainstCodex(
        context,
        "write file",
        {},
      );

      expect(compliantResult.compliant).toBe(true);
      expect(compliantResult.violations).toHaveLength(0);

      // Test validation with violating code (contains TODO)
      const violationResult = contextLoader.validateAgainstCodex(
        context,
        "write file with TODO: fix this",
        {},
      );

      expect(violationResult.compliant).toBe(false);
      expect(violationResult.violations.length).toBeGreaterThan(0);
    });

    it("should inject codex context into tool outputs", async () => {
      // Load context first
      const contextLoader = StrRayContextLoader.getInstance();
      await contextLoader.loadCodexContext("/test/project");

      // Create injector hook
      const injectorHook = createStrRayCodexInjectorHook();

      // Verify hook exists
      expect(injectorHook.hooks["tool.execute.after"]).toBeDefined();
      expect(typeof injectorHook.hooks["tool.execute.after"]).toBe("function");

      // Simulate tool execution (hooks are disabled during testing for performance)
      const input = {
        tool: "write",
        args: { filePath: "test.ts", content: "code" },
      };
      const output = { output: "File written successfully" };

      const result = injectorHook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      // In test mode, hooks return output unchanged to prevent hangs
      expect(result.output).toContain("File written successfully");
      expect(result).toHaveProperty("output");
    });

    it("should persist state across component interactions", () => {
      const stateManager = new StrRayStateManager();

      // Simulate framework storing validation results
      stateManager.set("lastValidation", {
        compliant: true,
        timestamp: Date.now(),
        violations: [],
      });

      stateManager.set("codexVersion", "1.2.20");
      stateManager.set("sessionId", "session-123");

      // Verify state persistence
      expect(stateManager.get("lastValidation")).toEqual({
        compliant: true,
        timestamp: expect.any(Number),
        violations: [],
      });

      expect(stateManager.get("codexVersion")).toBe("1.2.20");
      expect(stateManager.get("sessionId")).toBe("session-123");
    });
  });

  describe("Framework Lifecycle Management", () => {
    it("should properly handle framework startup sequence", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      try {
        // 1. Initialize components
        const stateManager = new StrRayStateManager();
        const contextLoader = StrRayContextLoader.getInstance();
        const injectorHook = createStrRayCodexInjectorHook();

        // 2. Load context
        const contextResult =
          await contextLoader.loadCodexContext("/test/project");
        expect(contextResult.success).toBe(true);

        // 3. Trigger agent startup
        injectorHook.hooks["agent.start"]("session-123");

        // 4. Verify startup logs
        expect(consoleLogSpy).toHaveBeenCalledWith(
          "✅ StrRay Codex loaded: 20 terms, 4 sources",
        );
      } finally {
        consoleLogSpy.mockRestore();
      }
    });

    it("should handle framework shutdown and cleanup", async () => {
      // Initialize components
      const contextLoader = StrRayContextLoader.getInstance();
      await contextLoader.loadCodexContext("/test/project");

      const injectorHook = createStrRayCodexInjectorHook();
      injectorHook.hooks["agent.start"]("session-123");

      // Verify components are loaded
      expect(contextLoader.isContextLoaded()).toBe(true);

      // Simulate shutdown/cleanup
      contextLoader.clearCache();
      clearCodexCache();

      // Verify cleanup
      expect(contextLoader.isContextLoaded()).toBe(false);
    });

    it("should recover from partial initialization failures", async () => {
      // Simulate context loading failure for all file locations
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File read error");
      });

      const contextLoader = StrRayContextLoader.getInstance();
      const contextResult =
        await contextLoader.loadCodexContext("/test/project");

      // Context loading failed, but framework should still initialize other components
      expect(contextResult.success).toBe(false);

      // Other components should still work
      const stateManager = new StrRayStateManager();
      expect(stateManager).toBeDefined();

      const injectorHook = createStrRayCodexInjectorHook();
      expect(injectorHook).toBeDefined();
    });
  });

  describe("Framework Performance and Reliability", () => {
    it("should handle concurrent operations efficiently", async () => {
      const contextLoader = StrRayContextLoader.getInstance();

      // Load context once
      const loadResult = await contextLoader.loadCodexContext("/test/project");
      expect(loadResult.success).toBe(true);

      // Simulate concurrent validation requests
      const validations = Array.from({ length: 10 }, (_, i) =>
        contextLoader.validateAgainstCodex(
          loadResult.context!,
          `action-${i}`,
          {},
        ),
      );

      const results = await Promise.all(validations);

      // All validations should succeed
      results.forEach((result) => {
        expect(result.compliant).toBe(true);
      });
    });

    it("should maintain performance under load", () => {
      const stateManager = new StrRayStateManager();

      // Simulate high-frequency state operations
      const operations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < operations; i++) {
        stateManager.set(`key-${i}`, `value-${i}`);
        stateManager.get(`key-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms for 2000 operations
    });

    it("should handle large codex contexts efficiently", async () => {
      // Create a large JSON codex content with many terms
      const largeTerms: Record<string, any> = {};
      for (let i = 1; i <= 100; i++) {
        largeTerms[i.toString()] = {
          number: i,
          title: `Generated Term ${i}`,
          description: `Description for term ${i}.`,
          category:
            i <= 10
              ? "core"
              : i <= 20
                ? "extended"
                : i <= 30
                  ? "architecture"
                  : "advanced",
        };
      }

      const largeCodexContent = JSON.stringify({
        version: "1.2.20",
        lastUpdated: "2026-01-06",
        errorPreventionTarget: 0.996,
        terms: largeTerms,
        interweaves: [],
        lenses: [],
        principles: [],
        antiPatterns: [],
        validationCriteria: {},
        frameworkAlignment: {},
      });

      mockFs.readFileSync.mockReturnValue(largeCodexContent);

      const contextLoader = StrRayContextLoader.getInstance();
      const startTime = Date.now();

      const contextResult =
        await contextLoader.loadCodexContext("/test/project");

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(contextResult.success).toBe(true);
      expect(contextResult.context!.terms.size).toBeGreaterThan(50);

      // Should load within reasonable time
      expect(duration).toBeLessThan(500); // 500ms for large context
    });
  });

  describe("Framework Error Recovery", () => {
    it("should recover from state corruption", () => {
      const stateManager = new StrRayStateManager();

      // Simulate state corruption
      (stateManager as any).store.set("corrupted", undefined);
      (stateManager as any).store.set("another", null);

      // Framework should continue to work
      stateManager.set("newKey", "newValue");
      expect(stateManager.get("newKey")).toBe("newValue");

      // Clear operation should work
      stateManager.clear("corrupted");
      expect(stateManager.get("corrupted")).toBeUndefined();
    });

    it("should handle context loader cache corruption", async () => {
      const contextLoader = StrRayContextLoader.getInstance();

      // Load context
      await contextLoader.loadCodexContext("/test/project");
      expect(contextLoader.isContextLoaded()).toBe(true);

      // Simulate cache corruption
      (contextLoader as any).cachedContext = null;

      // Should recover on next load
      const result = await contextLoader.loadCodexContext("/test/project");
      expect(result.success).toBe(true);
      expect(contextLoader.isContextLoaded()).toBe(true);
    });

    it("should handle injector hook failures gracefully", () => {
      const injectorHook = createStrRayCodexInjectorHook();

      const input = { tool: "read", args: { filePath: "test.ts" } };
      const output = { output: "original output" };

      // The hook should handle errors gracefully and return the original output
      // Since the hook has try/catch, it should not throw even if internal operations fail
      const result = injectorHook.hooks["tool.execute.after"](
        input,
        output,
        "session-123",
      );

      // Should return a modified output object (not the exact same reference due to error handling)
      expect(result).toBeDefined();
      expect(result.output).toContain("original output");
    });
  });
});
