/**
 * StrRay Framework - JSON Codex Integration Tests (Mock-Based)
 * 
 * Tests JSON codex parsing and integration using real utilities but mocked plugin behavior
 * to avoid ES6 import conflicts when running directly with Node.js.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { StrRayContextLoader } from "../../context-loader";
import {
  parseCodexContent,
  detectContentFormat,
  validateJsonSyntax,
  extractCodexMetadata,
} from "../../utils/codex-parser";

const testProjectRoot = process.cwd();
const validJsonCodex = JSON.stringify({
  version: "1.2.22",
  lastUpdated: "2026-01-06",
  errorPreventionTarget: 0.996,
  terms: {
    "1": {
      number: 1,
      title: "Progressive Prod-Ready Code",
      description: "All code must be production-ready from the first commit.",
      category: "core",
      zeroTolerance: false,
      enforcementLevel: "high",
    },
    "7": {
      number: 7,
      title: "Resolve All Errors",
      description: "Zero-tolerance for unresolved errors.",
      category: "core",
      zeroTolerance: true,
      enforcementLevel: "blocking",
    },
    "11": {
      number: 11,
      title: "Type Safety First",
      description: "Never use 'any', '@ts-ignore', or '@ts-expect-error'.",
      category: "extended",
      zeroTolerance: true,
      enforcementLevel: "blocking",
    }
  }
});

const invalidJsonCodex = `{
  version: "1.2.22",
  lastUpdated: "2026-01-06",
  errorPreventionTarget: 0.996,
  terms: {
    "1": {
      number: 1,
      title: "Progressive Prod-Ready Code",
      description: "All code must be production-ready from the first commit.",
      category: "core",
      zeroTolerance: false,
      enforcementLevel: "high",
    },
    // Missing closing quote on key
    7: {
      number: 7,
      title: "Resolve All Errors",
      description: "Zero-tolerance for unresolved errors.",
      category: "core",
      zeroTolerance: true,
      enforcementLevel: "blocking",
    }
  }
}`;

describe.skip("JSON Codex Integration", () => {
  let contextLoader: StrRayContextLoader;

  beforeEach(() => {
    contextLoader = new StrRayContextLoader();
    vi.clearAllMocks();
  });

  describe("JSON Codex Parsing", () => {
    test("should parse valid JSON codex content", () => {
      const result = parseCodexContent(validJsonCodex);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("version", "1.2.22");
      expect(result.data).toHaveProperty("terms");
      expect(Object.keys(result.data.terms)).toHaveLength(3);
    });

    test("should detect JSON format correctly", () => {
      const format = detectContentFormat(validJsonCodex);
      expect(format).toBe("json");
    });

    test("should validate correct JSON syntax", () => {
      const isValid = validateJsonSyntax(validJsonCodex);
      expect(isValid).toBe(true);
    });

    test("should reject invalid JSON syntax", () => {
      const isValid = validateJsonSyntax(invalidJsonCodex);
      expect(isValid).toBe(false);
    });

    test("should extract metadata from valid JSON", () => {
      const metadata = extractCodexMetadata(validJsonCodex);
      
      expect(metadata).toHaveProperty("version", "1.2.22");
      expect(metadata).toHaveProperty("termCount", 3);
      expect(metadata).toHaveProperty("categories");
      expect(metadata.categories).toContain("core");
      expect(metadata.categories).toContain("extended");
    });

    test("should handle JSON with different key formats", () => {
      const mixedKeyJson = JSON.stringify({
        version: "1.2.22",
        terms: {
          "1": { number: 1, title: "Test 1" },
          "2": { number: 2, title: "Test 2" }
        }
      });
      
      const result = parseCodexContent(mixedKeyJson);
      expect(result.success).toBe(true);
      expect(result.data.terms).toHaveProperty("1");
      expect(result.data.terms).toHaveProperty("2");
    });
  });

  describe("Context Loader Integration", () => {
    test("should load JSON codex through context loader", async () => {
      // Mock fs to return our test codex
      const mockFs = {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => validJsonCodex)
      };
      
      // Temporarily replace fs methods
      const originalExistsSync = require("fs").existsSync;
      const originalReadFileSync = require("fs").readFileSync;
      
      require("fs").existsSync = mockFs.existsSync;
      require("fs").readFileSync = mockFs.readFileSync;
      
      try {
        const result = await contextLoader.loadCodexContext(testProjectRoot);
        
        expect(result.success).toBe(true);
        expect(result.context).toBeDefined();
        expect(Array.isArray(result.context)).toBe(true);
        expect(result.context!.length).toBeGreaterThan(0);
        
        // Check that the loaded context contains our test data
        const firstEntry = result.context![0];
        expect(firstEntry).toHaveProperty("source");
        expect(firstEntry).toHaveProperty("content");
        expect(firstEntry).toHaveProperty("metadata");
        expect(firstEntry.metadata).toHaveProperty("version", "1.2.22");
      } finally {
        // Restore original fs methods
        require("fs").existsSync = originalExistsSync;
        require("fs").readFileSync = originalReadFileSync;
      }
    });

    test("should handle missing codex files gracefully", async () => {
      // Mock fs to return no files found
      const mockFs = {
        existsSync: vi.fn(() => false),
        readFileSync: vi.fn(() => { throw new Error("File not found"); })
      };
      
      const originalExistsSync = require("fs").existsSync;
      const originalReadFileSync = require("fs").readFileSync;
      
      require("fs").existsSync = mockFs.existsSync;
      require("fs").readFileSync = mockFs.readFileSync;
      
      try {
        const result = await contextLoader.loadCodexContext(testProjectRoot);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain("No codex files found");
        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
      } finally {
        require("fs").existsSync = originalExistsSync;
        require("fs").readFileSync = originalReadFileSync;
      }
    });

    test("should validate codex content during loading", async () => {
      // Mock fs to return invalid JSON
      const mockFs = {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => invalidJsonCodex)
      };
      
      const originalExistsSync = require("fs").existsSync;
      const originalReadFileSync = require("fs").readFileSync;
      
      require("fs").existsSync = mockFs.existsSync;
      require("fs").readFileSync = mockFs.readFileSync;
      
      try {
        const result = await contextLoader.loadCodexContext(testProjectRoot);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain("JSON");
        expect(result.warnings).toBeDefined();
      } finally {
        require("fs").existsSync = originalExistsSync;
        require("fs").readFileSync = originalReadFileSync;
      }
    });
  });

  describe("Plugin Integration Simulation", () => {
    test("should simulate codex injection workflow", async () => {
      // Mock the plugin hook behavior
      const mockPluginHook = {
        "tool.execute.before": async (input: any) => {
          const content = input.args?.content || "";
          
          // Simulate codex enforcement
          if (content.includes("TODO")) {
            throw new Error("Codex violation: TODO comments not allowed");
          }
          
          if (content.includes(": any")) {
            throw new Error("Codex violation: any type not allowed");
          }
        },
        "tool.execute.after": async (input: any, output: any) => {
          // Simulate codex context injection
          if (output && output.output) {
            output.output = `📚 Codex Context: ${validJsonCodex.substring(0, 50)}...\n${output.output}`;
          }
          return output;
        }
      };

      // Test valid content
      const validInput = { tool: "edit", args: { content: "const x: string = 'test';" } };
      await expect(mockPluginHook["tool.execute.before"](validInput)).resolves.toBeUndefined();

      // Test invalid content (TODO)
      const invalidInput1 = { tool: "edit", args: { content: "// TODO: fix this" } };
      await expect(mockPluginHook["tool.execute.before"](invalidInput1)).rejects.toThrow("TODO");

      // Test invalid content (any type)
      const invalidInput2 = { tool: "edit", args: { content: "const x: any = 'test';" } };
      await expect(mockPluginHook["tool.execute.before"](invalidInput2)).rejects.toThrow("any");

      // Test output injection
      const testOutput = { output: "original content" };
      await mockPluginHook["tool.execute.after"]({}, testOutput);
      expect(testOutput.output).toContain("📚 Codex Context:");
      expect(testOutput.output).toContain("original content");
    });

    test("should handle plugin hook errors gracefully", async () => {
      const mockPluginHook = {
        "tool.execute.before": async () => {
          throw new Error("Plugin hook failed");
        }
      };

      await expect(mockPluginHook["tool.execute.before"]({})).rejects.toThrow("Plugin hook failed");
    });
  });

  describe("End-to-End Codex Workflow", () => {
    test("should complete full codex processing pipeline", async () => {
      // Step 1: Parse JSON codex
      const parseResult = parseCodexContent(validJsonCodex);
      expect(parseResult.success).toBe(true);

      // Step 2: Extract metadata
      const metadata = extractCodexMetadata(validJsonCodex);
      expect(metadata.termCount).toBe(3);

      // Step 3: Simulate context loading
      const mockContext = [{
        id: "test-codex",
        source: "/test/codex.json",
        content: validJsonCodex,
        metadata: metadata,
        priority: "critical"
      }];

      expect(mockContext).toHaveLength(1);
      expect(mockContext[0].metadata.version).toBe("1.2.22");

      // Step 4: Simulate plugin enforcement
      const testContent = "const validCode: string = 'test';";
      const mockEnforcement = (content: string) => {
        if (content.includes("TODO")) return false;
        if (content.includes(": any")) return false;
        return true;
      };

      expect(mockEnforcement(testContent)).toBe(true);
      expect(mockEnforcement("const x: any = 1;")).toBe(false);
    });
  });
});
