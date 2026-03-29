/**
 * Rule Loader Tests
 * 
 * Tests for all rule loader implementations and the loader orchestrator.
 * 
 * Phase 4 refactoring: Tests for extracted loader classes.
 * 
 * @module loaders/__tests__/loaders
 * @version 1.0.0
 */

import * as fs from "fs";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BaseLoader } from "../base-loader.js";
import { CodexLoader } from "../codex-loader.js";
import { AgentTriageLoader } from "../agent-triage-loader.js";
import { ProcessorLoader } from "../processor-loader.js";
import { AgentsMdValidationLoader } from "../agents-md-validation-loader.js";
import {
  LoaderOrchestrator,
  LoaderOrchestratorResult,
} from "../loader-orchestrator.js";
import { IRuleLoader, RuleDefinition } from "../../types.js";

// Mock fs and path modules
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      access: vi.fn(),
      stat: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join("/")),
  };
});

// Mock framework logger
vi.mock("../../../core/framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Rule Loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("BaseLoader", () => {
    class TestLoader extends BaseLoader {
      readonly name = "test-loader";

      async load(): Promise<RuleDefinition[]> {
        return [];
      }

      async isAvailable(): Promise<boolean> {
        return true;
      }
    }

    it("should create a concrete loader instance", () => {
      const loader = new TestLoader();
      expect(loader.name).toBe("test-loader");
    });

    it("should resolve paths relative to cwd", () => {
      const loader = new TestLoader();
      const resolvedPath = (loader as any).resolvePath("test.json");
      expect(resolvedPath).toContain("test.json");
    });

    it("should check file existence", async () => {
      const loader = new TestLoader();
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);

      const exists = await (loader as any).fileExists("test.json");
      expect(exists).toBe(true);
    });

    it("should return false when file does not exist", async () => {
      const loader = new TestLoader();
      vi.mocked(fs.promises.access).mockRejectedValue(new Error("ENOENT"));

      const exists = await (loader as any).fileExists("test.json");
      expect(exists).toBe(false);
    });

    it("should load JSON files", async () => {
      const loader = new TestLoader();
      const testData = { test: "data" };
      vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(testData));

      const data = await (loader as any).loadJsonFile("test.json");
      expect(data).toEqual(testData);
    });

    it("should read files as string", async () => {
      const loader = new TestLoader();
      vi.mocked(fs.promises.readFile).mockResolvedValue("file content");

      const content = await (loader as any).readFile("test.txt");
      expect(content).toBe("file content");
    });
  });

  describe("CodexLoader", () => {
    let loader: CodexLoader;

    beforeEach(() => {
      loader = new CodexLoader();
    });

    it("should have correct name", () => {
      expect(loader.name).toBe("codex");
    });

    it("should check availability based on codex.json existence", async () => {
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      const available = await loader.isAvailable();
      expect(available).toBe(true);
    });

    it("should return not available when codex.json does not exist", async () => {
      vi.mocked(fs.promises.access).mockRejectedValue(new Error("ENOENT"));
      const available = await loader.isAvailable();
      expect(available).toBe(false);
    });

    it("should load codex rules from valid codex.json", async () => {
      const mockCodexData = {
        version: "1.15.18",
        lastUpdated: "2024-01-01",
        errorPreventionTarget: 0.99,
        terms: {
          "1": {
            number: 1,
            title: "Test Rule",
            description: "Test description",
            category: "core",
            zeroTolerance: true,
            enforcementLevel: "blocking",
          },
          "2": {
            number: 2,
            title: "Warning Rule",
            description: "Warning description",
            category: "architecture",
            zeroTolerance: false,
            enforcementLevel: "medium",
          },
        },
      };

      vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(mockCodexData));

      const rules = await loader.load();

      expect(rules).toHaveLength(2);
      expect(rules[0].id).toBe("codex-1");
      expect(rules[0].name).toBe("Test Rule");
      expect(rules[0].severity).toBe("blocking");
      expect(rules[1].severity).toBe("warning");
    });

    it("should skip invalid terms", async () => {
      const mockCodexData = {
        version: "1.15.18",
        terms: {
          "1": {
            number: 1,
            title: "Valid Rule",
            description: "Valid description",
            category: "core",
            zeroTolerance: false,
            enforcementLevel: "low",
          },
          "invalid": "not an object",
          "alsoInvalid": null,
        },
      };

      vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(mockCodexData));

      const rules = await loader.load();

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("codex-1");
    });

    it("should handle file read errors gracefully", async () => {
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error("ENOENT"));

      const rules = await loader.load();

      expect(rules).toHaveLength(0);
    });

    it("should handle JSON parse errors gracefully", async () => {
      vi.mocked(fs.promises.readFile).mockResolvedValue("invalid json");

      const rules = await loader.load();

      expect(rules).toHaveLength(0);
    });
  });

  describe("AgentTriageLoader", () => {
    let loader: AgentTriageLoader;

    beforeEach(() => {
      loader = new AgentTriageLoader();
    });

    it("should have correct name", () => {
      expect(loader.name).toBe("agent-triage");
    });

    it("should check availability based on AGENTS.md existence", async () => {
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      const available = await loader.isAvailable();
      expect(available).toBe(true);
    });

    it("should load triage rules from AGENTS.md", async () => {
      const mockAgentsMd = `
# StringRay Agents

## Available Agents

| Agent | Purpose |
|-------|---------|
| @test | Testing |

### Triage Summary Guidelines

Always report commit status.

### Reflection
Documents go in docs/reflections/

### Complexity Routing
Simple: single agent
Complex: orchestrator

@agent invoke
`;

      vi.mocked(fs.promises.readFile).mockResolvedValue(mockAgentsMd);

      const rules = await loader.load();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.id === "agent-triage-commit-status")).toBe(true);
    });

    it("should handle missing AGENTS.md gracefully", async () => {
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error("ENOENT"));

      const rules = await loader.load();

      expect(rules).toHaveLength(0);
    });

    it("should return empty rules when no triage section found", async () => {
      const mockAgentsMd = "# Just a title\n\nSome content";
      vi.mocked(fs.promises.readFile).mockResolvedValue(mockAgentsMd);

      const rules = await loader.load();

      // Should still return some rules from content analysis
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe("ProcessorLoader", () => {
    let loader: ProcessorLoader;

    beforeEach(() => {
      loader = new ProcessorLoader();
    });

    it("should have correct name", () => {
      expect(loader.name).toBe("processor");
    });

    it("should always be available", async () => {
      const available = await loader.isAvailable();
      expect(available).toBe(true);
    });

    it("should load processor rules", async () => {
      const rules = await loader.load();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.id === "processor-validation")).toBe(true);
      expect(rules.some((r) => r.id === "processor-health")).toBe(true);
    });

    it("should have valid rule definitions", async () => {
      const rules = await loader.load();

      for (const rule of rules) {
        expect(rule.id).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.description).toBeDefined();
        expect(rule.category).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(rule.enabled).toBe(true);
        expect(typeof rule.validator).toBe("function");
      }
    });
  });

  describe("AgentsMdValidationLoader", () => {
    let loader: AgentsMdValidationLoader;

    beforeEach(() => {
      loader = new AgentsMdValidationLoader();
    });

    it("should have correct name", () => {
      expect(loader.name).toBe("agents-md-validation");
    });

    it("should check availability based on AGENTS.md existence", async () => {
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      const available = await loader.isAvailable();
      expect(available).toBe(true);
    });

    it("should load AGENTS.md validation rules", async () => {
      vi.mocked(fs.promises.readFile).mockResolvedValue("AGENTS.md content");

      const rules = await loader.load();

      expect(rules).toHaveLength(3);
      expect(rules.some((r) => r.id === "agents-md-exists")).toBe(true);
      expect(rules.some((r) => r.id === "agents-md-current")).toBe(true);
      expect(rules.some((r) => r.id === "agents-md-structure")).toBe(true);
    });

    it("should validate AGENTS.md exists correctly", async () => {
      vi.mocked(fs.promises.readFile).mockResolvedValue("content");
      const rules = await loader.load();
      const existsRule = rules.find((r) => r.id === "agents-md-exists");

      expect(existsRule).toBeDefined();

      // Test validator when file exists
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      const result = await existsRule!.validator({ operation: "test" });
      expect(result.passed).toBe(true);

      // Test validator when file does not exist
      vi.mocked(fs.promises.access).mockRejectedValue(new Error("ENOENT"));
      const resultMissing = await existsRule!.validator({ operation: "test" });
      expect(resultMissing.passed).toBe(false);
      expect(resultMissing.fixes).toBeDefined();
      expect(resultMissing.fixes!.length).toBeGreaterThan(0);
    });

    it("should validate AGENTS.md currency correctly", async () => {
      // Setup mocks - file exists and has old date (> 30 days)
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      vi.mocked(fs.promises.readFile).mockImplementation(async () => {
        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
        const dateStr = fortyDaysAgo.toISOString().split("T")[0];
        return `**Updated**: ${dateStr}\nContent`;
      });

      const rules = await loader.load();
      const currentRule = rules.find((r) => r.id === "agents-md-current");

      expect(currentRule).toBeDefined();

      const result = await currentRule!.validator({ operation: "test" });
      expect(result.passed).toBe(false);
      expect(result.message).toContain("days old");
    });

    it("should pass current AGENTS.md", async () => {
      vi.mocked(fs.promises.readFile).mockImplementation(async () => {
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        return `**Updated**: ${dateStr}\nContent`;
      });

      const rules = await loader.load();
      const currentRule = rules.find((r) => r.id === "agents-md-current");

      const result = await currentRule!.validator({ operation: "test" });
      expect(result.passed).toBe(true);
    });

    it("should handle missing date stamp", async () => {
      // Setup mocks - file exists but no date stamp
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      vi.mocked(fs.promises.readFile).mockResolvedValue("No date here");

      const rules = await loader.load();
      const currentRule = rules.find((r) => r.id === "agents-md-current");

      const result = await currentRule!.validator({ operation: "test" });
      expect(result.passed).toBe(false);
      expect(result.message).toContain("missing date stamp");
    });

    it("should validate AGENTS.md structure", async () => {
      // Setup mocks - file exists but missing required sections
      vi.mocked(fs.promises.access).mockResolvedValue(undefined);
      vi.mocked(fs.promises.readFile).mockResolvedValue("Missing sections");

      const rules = await loader.load();
      const structureRule = rules.find((r) => r.id === "agents-md-structure");

      expect(structureRule).toBeDefined();

      const result = await structureRule!.validator({ operation: "test" });
      expect(result.passed).toBe(false);
      expect(result.message).toContain("missing required sections");
    });
  });

  describe("LoaderOrchestrator", () => {
    it("should create orchestrator with default options", () => {
      const orchestrator = new LoaderOrchestrator();
      expect(orchestrator.getLoaderCount()).toBe(4);
    });

    it("should create orchestrator with custom options", () => {
      const orchestrator = new LoaderOrchestrator({
        continueOnError: false,
        enableLogging: false,
      });
      expect(orchestrator.getLoaderCount()).toBe(4);
    });

    it("should load all rules from available loaders", async () => {
      const orchestrator = new LoaderOrchestrator();

      // Mock all loaders to return test rules
      const mockRules: RuleDefinition[] = [
        {
          id: "test-1",
          name: "Test Rule 1",
          description: "Test",
          category: "code-quality",
          severity: "error",
          enabled: true,
          validator: async () => ({ passed: true, message: "OK" }),
        },
      ];

      // Replace loaders with mock
      orchestrator.clearLoaders();

      const mockLoader: IRuleLoader = {
        name: "mock-loader",
        load: vi.fn().mockResolvedValue(mockRules),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      orchestrator.registerLoader(mockLoader);

      const result = await orchestrator.loadAllRules();

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].id).toBe("test-1");
      expect(result.successfulLoaders).toBe(1);
      expect(result.failedLoaders).toBe(0);
    });

    it("should handle loader failures gracefully", async () => {
      const orchestrator = new LoaderOrchestrator({ continueOnError: true });
      orchestrator.clearLoaders();

      const failingLoader: IRuleLoader = {
        name: "failing-loader",
        load: vi.fn().mockRejectedValue(new Error("Load failed")),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      orchestrator.registerLoader(failingLoader);

      const result = await orchestrator.loadAllRules();

      expect(result.rules).toHaveLength(0);
      expect(result.successfulLoaders).toBe(0);
      expect(result.failedLoaders).toBe(1);
      expect(result.loaderResults.get("failing-loader")?.success).toBe(false);
    });

    it("should stop on first error when continueOnError is false", async () => {
      const orchestrator = new LoaderOrchestrator({ continueOnError: false });
      orchestrator.clearLoaders();

      const failingLoader: IRuleLoader = {
        name: "failing-loader",
        load: vi.fn().mockRejectedValue(new Error("Load failed")),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      orchestrator.registerLoader(failingLoader);

      await expect(orchestrator.loadAllRules()).rejects.toThrow("Load failed");
    });

    it("should skip unavailable loaders", async () => {
      const orchestrator = new LoaderOrchestrator();
      orchestrator.clearLoaders();

      const unavailableLoader: IRuleLoader = {
        name: "unavailable-loader",
        load: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(false),
      };

      orchestrator.registerLoader(unavailableLoader);

      const result = await orchestrator.loadAllRules();

      expect(result.rules).toHaveLength(0);
      expect(result.successfulLoaders).toBe(0);
      expect(unavailableLoader.load).not.toHaveBeenCalled();
    });

    it("should register custom loaders", () => {
      const orchestrator = new LoaderOrchestrator();
      orchestrator.clearLoaders();

      const customLoader: IRuleLoader = {
        name: "custom-loader",
        load: vi.fn().mockResolvedValue([]),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      orchestrator.registerLoader(customLoader);

      expect(orchestrator.getLoaderCount()).toBe(1);
      expect(orchestrator.getLoader("custom-loader")).toBe(customLoader);
    });

    it("should get all registered loaders", () => {
      const orchestrator = new LoaderOrchestrator();
      const loaders = orchestrator.getLoaders();

      expect(loaders).toHaveLength(4);
      expect(loaders.map((l) => l.name)).toContain("codex");
      expect(loaders.map((l) => l.name)).toContain("agent-triage");
      expect(loaders.map((l) => l.name)).toContain("processor");
      expect(loaders.map((l) => l.name)).toContain("agents-md-validation");
    });

    it("should remove loaders by name", () => {
      const orchestrator = new LoaderOrchestrator();
      const removed = orchestrator.removeLoader("codex");

      expect(removed).toBe(true);
      expect(orchestrator.getLoaderCount()).toBe(3);
      expect(orchestrator.getLoader("codex")).toBeUndefined();
    });

    it("should return false when removing non-existent loader", () => {
      const orchestrator = new LoaderOrchestrator();
      const removed = orchestrator.removeLoader("non-existent");

      expect(removed).toBe(false);
    });

    it("should clear all loaders", () => {
      const orchestrator = new LoaderOrchestrator();
      orchestrator.clearLoaders();

      expect(orchestrator.getLoaderCount()).toBe(0);
    });
  });

  describe("Integration Tests", () => {
    it("should load real codex rules if codex.json exists", async () => {
      // Skip this test in CI or when running with mocks
      if (process.env.CI || vi.isMockFunction(fs.promises.readFile)) {
        console.log("Skipping real codex test - running with mocks");
        return;
      }

      const loader = new CodexLoader();
      const available = await loader.isAvailable();

      if (available) {
        const rules = await loader.load();
        expect(rules.length).toBeGreaterThan(0);

        // Verify rule structure
        for (const rule of rules) {
          expect(rule.id).toMatch(/^codex-\d+$/);
          expect(rule.category).toBeDefined();
          expect(rule.severity).toBeDefined();
        }
      }
    });

    it("should load real AGENTS.md rules if file exists", async () => {
      const loader = new AgentTriageLoader();
      const available = await loader.isAvailable();

      if (available) {
        const rules = await loader.load();
        expect(Array.isArray(rules)).toBe(true);
      }
    });

    it("orchestrator should work with real loaders", async () => {
      const orchestrator = new LoaderOrchestrator({ enableLogging: false });
      const result = await orchestrator.loadAllRules();

      expect(result).toHaveProperty("rules");
      expect(result).toHaveProperty("successfulLoaders");
      expect(result).toHaveProperty("failedLoaders");
      expect(result).toHaveProperty("loaderResults");
      expect(Array.isArray(result.rules)).toBe(true);
    });
  });
});
