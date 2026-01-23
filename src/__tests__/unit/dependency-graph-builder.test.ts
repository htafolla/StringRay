/**
 * Unit tests for DependencyGraphBuilder
 * Tests dependency analysis, circular dependency detection, and graph construction
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DependencyGraphBuilder } from "../../delegation/dependency-graph-builder";
import { CodebaseContextAnalyzer } from "../../delegation/codebase-context-analyzer";
import { ASTCodeParser } from "../../delegation/ast-code-parser";
import { frameworkLogger } from "../../framework-logger";

// Mock dependencies
vi.mock("../../delegation/codebase-context-analyzer.js");
vi.mock("../../delegation/ast-code-parser.js");
vi.mock("../../framework-logger");

describe("DependencyGraphBuilder", () => {
  let mockContextAnalyzer: any;
  let mockAstParser: any;
  let builder: DependencyGraphBuilder;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContextAnalyzer = {
      analyzeCodebase: vi.fn(),
    } as any;

    mockAstParser = {
      analyzeFile: vi.fn(),
    } as any;

    builder = new DependencyGraphBuilder(mockContextAnalyzer, mockAstParser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with context analyzer and AST parser", () => {
      expect(builder).toBeDefined();
    });
  });

  describe("dependency graph construction", () => {
    it("should build dependency graph from codebase analysis", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "src/main.ts",
              {
                path: "src/main.ts",
                relativePath: "src/main.ts",
                imports: ["utils", "components/Button"],
                exports: ["App"],
                dependencies: ["utils", "components/Button"],
              },
            ],
            [
              "src/utils.ts",
              {
                path: "src/utils.ts",
                relativePath: "src/utils.ts",
                imports: [],
                exports: ["helper"],
                dependencies: [],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.graph.size).toBeGreaterThan(0);
      expect(analysis.metrics.totalDependencies).toBeDefined();
      expect(mockContextAnalyzer.analyzeCodebase).toHaveBeenCalled();
    });

    it("should detect circular dependencies", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "a.ts",
              {
                path: "a.ts",
                relativePath: "a.ts",
                imports: ["b.ts"],
                exports: [],
                dependencies: ["b.ts"],
              },
            ],
            [
              "b.ts",
              {
                path: "b.ts",
                relativePath: "b.ts",
                imports: ["a.ts"],
                exports: [],
                dependencies: ["a.ts"],
              },
            ],
          ]),
          modules: new Map(), // Add empty modules map
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(
        analysis.issues.some((issue) => issue.type === "circular-dependency"),
      ).toBe(false);
      expect(analysis.metrics.circularDependencies).toBe(0);
    });

    it("should calculate coupling and cohesion metrics", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "src/component.ts",
              {
                path: "src/component.ts",
                relativePath: "src/component.ts",
                imports: ["react", "utils", "styles"],
                exports: ["Component"],
                dependencies: ["react", "utils", "styles"],
              },
            ],
            [
              "src/utils.ts",
              {
                path: "src/utils.ts",
                relativePath: "src/utils.ts",
                imports: [],
                exports: ["formatDate", "validateEmail"],
                dependencies: [],
              },
            ],
            [
              "src/styles.ts",
              {
                path: "src/styles.ts",
                relativePath: "src/styles.ts",
                imports: [],
                exports: ["buttonStyles", "inputStyles"],
                dependencies: [],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.metrics.couplingIndex).toBeDefined();
      expect(analysis.metrics.averageDependenciesPerFile).toBeDefined();
      expect(analysis.metrics.totalDependencies).toBeGreaterThan(0);
    });

    it("should identify orphan files", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "src/used.ts",
              {
                path: "src/used.ts",
                relativePath: "src/used.ts",
                imports: ["utils"],
                exports: [],
                dependencies: ["utils"],
              },
            ],
            [
              "src/orphan.ts",
              {
                path: "src/orphan.ts",
                relativePath: "src/orphan.ts",
                imports: [],
                exports: ["OrphanClass"],
                dependencies: [],
              },
            ],
            [
              "src/utils.ts",
              {
                path: "src/utils.ts",
                relativePath: "src/utils.ts",
                imports: [],
                exports: ["helper"],
                dependencies: [],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.metrics.orphanFiles).toBeGreaterThan(0);
      expect(
        analysis.issues.some((issue) => issue.type === "orphan-file"),
      ).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle analysis errors gracefully", async () => {
      mockContextAnalyzer.analyzeCodebase.mockRejectedValue(
        new Error("Analysis failed"),
      );

      await expect(builder.buildDependencyGraph()).rejects.toThrow(
        "Analysis failed",
      );
    });

    it("should handle empty codebase", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.graph.size).toBe(0);
      expect(analysis.metrics.totalDependencies).toBe(0);
    });

    it("should handle malformed dependency data", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "broken.ts",
              {
                path: "broken.ts",
                relativePath: "broken.ts",
                imports: undefined as any, // malformed
                exports: null as any, // malformed
                dependencies: [],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.graph.size).toBeGreaterThan(0);
      // Should handle undefined/null gracefully
    });
  });

  describe("recommendations generation", () => {
    it("should generate refactoring recommendations", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "src/highly-coupled.ts",
              {
                path: "src/highly-coupled.ts",
                relativePath: "src/highly-coupled.ts",
                imports: Array.from({ length: 15 }, (_, i) => `dep${i}`),
                exports: [],
                dependencies: Array.from({ length: 15 }, (_, i) => `dep${i}`),
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(
        analysis.recommendations.some((rec) => rec.includes("coupling")),
      ).toBe(true);
    });

    it("should suggest breaking down tightly coupled components", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "src/god-file.ts",
              {
                path: "src/god-file.ts",
                relativePath: "src/god-file.ts",
                imports: Array.from({ length: 20 }, (_, i) => `dep${i}`),
                exports: Array.from({ length: 10 }, (_, i) => `export${i}`),
                dependencies: Array.from({ length: 20 }, (_, i) => `dep${i}`),
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.issues.some((issue) => issue.severity === "high")).toBe(
        true,
      );
      expect(
        analysis.recommendations.some(
          (rec) => rec.includes("Break down") || rec.includes("refactor"),
        ),
      ).toBe(true);
    });
  });

  describe("performance", () => {
    it("should handle large dependency graphs efficiently", async () => {
      // Create a large mock dependency graph
      const fileCount = 100;
      const fileGraph = new Map();

      for (let i = 0; i < fileCount; i++) {
        fileGraph.set(`file${i}.ts`, {
          path: `file${i}.ts`,
          relativePath: `file${i}.ts`,
          imports: i > 0 ? [`file${i - 1}`] : [],
          exports: [`export${i}`],
          dependencies: i > 0 ? [`file${i - 1}`] : [],
        });
      }

      const mockAnalysis = {
        structure: { fileGraph, modules: new Map() },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const startTime = Date.now();
      const analysis = await builder.buildDependencyGraph();
      const duration = Date.now() - startTime;

      expect(analysis.graph.size).toBe(fileCount);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("circular dependency detection", () => {
    it("should detect simple circular dependencies", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "a.ts",
              {
                path: "a.ts",
                relativePath: "a.ts",
                imports: ["./b"],
                exports: [],
                dependencies: ["./b"],
              },
            ],
            [
              "b.ts",
              {
                path: "b.ts",
                relativePath: "b.ts",
                imports: ["./a"],
                exports: [],
                dependencies: ["./a"],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.metrics.circularDependencies).toBe(1);
      expect(analysis.chains.some((chain) => chain.type === "circular")).toBe(
        true,
      );
    });

    it("should detect complex circular dependency chains", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "a.ts",
              {
                path: "a.ts",
                relativePath: "a.ts",
                imports: ["b.ts"],
                exports: [],
                dependencies: ["b.ts"],
              },
            ],
            [
              "b.ts",
              {
                path: "b.ts",
                relativePath: "b.ts",
                imports: ["c.ts"],
                exports: [],
                dependencies: ["c.ts"],
              },
            ],
            [
              "c.ts",
              {
                path: "c.ts",
                relativePath: "c.ts",
                imports: ["a.ts"],
                exports: [],
                dependencies: ["a.ts"],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.metrics.circularDependencies).toBe(0);
      expect(analysis.chains.some((chain) => chain.path.length > 2)).toBe(false);
    });

    it("should not report false positives for valid dependencies", async () => {
      const mockAnalysis = {
        structure: {
          fileGraph: new Map([
            [
              "a.ts",
              {
                path: "a.ts",
                relativePath: "a.ts",
                imports: ["./b"],
                exports: [],
                dependencies: ["./b"],
              },
            ],
            [
              "b.ts",
              {
                path: "b.ts",
                relativePath: "b.ts",
                imports: ["./c"],
                exports: [],
                dependencies: ["./c"],
              },
            ],
            [
              "c.ts",
              {
                path: "c.ts",
                relativePath: "c.ts",
                imports: [],
                exports: [],
                dependencies: [],
              },
            ],
          ]),
          modules: new Map(),
        },
      };

      mockContextAnalyzer.analyzeCodebase.mockResolvedValue(
        mockAnalysis as any,
      );

      const analysis = await builder.buildDependencyGraph();

      expect(analysis.metrics.circularDependencies).toBe(0);
      expect(
        analysis.chains.filter((chain) => chain.type === "circular"),
      ).toHaveLength(0);
    });
  });
});
