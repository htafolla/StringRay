/**
 * StringRay AI v1.1.1 - Dependency Graph Builder
 *
 * Builds comprehensive dependency graphs for codebase analysis.
 * Tracks file relationships, import/export chains, and architectural dependencies.
 *
 * @version 1.0.0
 * @since 2026-01-11
 */

import * as path from "path";
import { frameworkLogger } from "../framework-logger.js";
import {
  CodebaseContextAnalyzer,
  FileInfo,
  ModuleInfo,
} from "./codebase-context-analyzer.js";
import { ASTCodeParser, ImportInfo, ExportInfo } from "./ast-code-parser.js";

export interface DependencyNode {
  file: string;
  module: string;
  imports: string[];
  exports: string[];
  dependents: string[];
  depth: number;
  circular: boolean;
}

export interface DependencyChain {
  start: string;
  end: string;
  path: string[];
  type: "direct" | "indirect" | "circular";
}

export interface DependencyMetrics {
  totalDependencies: number;
  uniqueModules: number;
  maxDepth: number;
  circularDependencies: number;
  orphanFiles: number;
  tightlyCoupledFiles: number;
  averageDependenciesPerFile: number;
  couplingIndex: number;
}

export interface DependencyAnalysis {
  graph: Map<string, DependencyNode>;
  chains: DependencyChain[];
  metrics: DependencyMetrics;
  issues: DependencyIssue[];
  recommendations: string[];
}

export interface DependencyIssue {
  type:
    | "circular-dependency"
    | "orphan-file"
    | "tight-coupling"
    | "deep-dependency";
  severity: "low" | "medium" | "high" | "critical";
  files: string[];
  description: string;
  impact: string;
  suggestion: string;
}

export class DependencyGraphBuilder {
  private codebaseAnalyzer: CodebaseContextAnalyzer;
  private astParser: ASTCodeParser;

  constructor(
    codebaseAnalyzer: CodebaseContextAnalyzer,
    astParser: ASTCodeParser,
  ) {
    this.codebaseAnalyzer = codebaseAnalyzer;
    this.astParser = astParser;
  }

  /**
   * Build comprehensive dependency graph for the codebase
   */
  async buildDependencyGraph(): Promise<DependencyAnalysis> {
    await frameworkLogger.log(
      "dependency-graph-builder",
      "analysis-start",
      "info",
      {
        message: "Building comprehensive dependency graph",
      },
    );

    const codebaseAnalysis = await this.codebaseAnalyzer.analyzeCodebase();

    const graph = new Map<string, DependencyNode>();
    const chains: DependencyChain[] = [];

    // Build initial graph from codebase analysis
    for (const [filePath, fileInfo] of Array.from(
      codebaseAnalysis.structure.fileGraph,
    )) {
      graph.set(filePath, {
        file: filePath,
        module: this.getModuleName(
          filePath,
          codebaseAnalysis.structure.modules,
        ),
        imports: fileInfo.imports,
        exports: fileInfo.exports,
        dependents: [],
        depth: 0,
        circular: false,
      });
    }

    // Enhance with AST analysis for more accurate dependencies
    await this.enhanceWithASTAnalysis(
      graph,
      codebaseAnalysis.structure.fileGraph,
    );

    // Calculate dependents (reverse dependencies)
    this.calculateDependents(graph);

    // Calculate dependency depths
    this.calculateDepths(graph);

    // Detect circular dependencies
    const circularChains = this.detectCircularDependencies(graph);
    chains.push(...circularChains);

    // Mark circular files
    this.markCircularDependencies(graph, circularChains);

    // Calculate metrics
    const metrics = this.calculateDependencyMetrics(graph, chains);

    // Identify issues
    const issues = this.identifyDependencyIssues(graph, chains, metrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, metrics);

    const analysis: DependencyAnalysis = {
      graph,
      chains,
      metrics,
      issues,
      recommendations,
    };

    await frameworkLogger.log(
      "dependency-graph-builder",
      "analysis-complete",
      "success",
      {
        files: graph.size,
        dependencies: metrics.totalDependencies,
        circularDeps: metrics.circularDependencies,
        issues: issues.length,
      },
    );

    return analysis;
  }

  /**
   * Enhance dependency graph with AST analysis
   */
  private async enhanceWithASTAnalysis(
    graph: Map<string, DependencyNode>,
    fileGraph: Map<string, FileInfo>,
  ): Promise<void> {
    for (const [filePath, fileInfo] of Array.from(fileGraph)) {
      if (this.isSourceFile(filePath)) {
        try {
          const astAnalysis = await this.astParser.analyzeFile(filePath);

          // Update imports and exports with AST data
          const node = graph.get(filePath);
          if (node) {
            node.imports = Array.from(
              new Set([
                ...node.imports,
                ...astAnalysis.structure.imports.map((imp) => imp.module),
              ]),
            );

            node.exports = Array.from(
              new Set([
                ...node.exports,
                ...astAnalysis.structure.exports.map((exp) => exp.name),
              ]),
            );
          }
        } catch (error) {
          await frameworkLogger.log(
            "dependency-graph-builder",
            "ast-enhancement-failed",
            "info",
            {
              filePath,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }
      }
    }
  }

  /**
   * Calculate which files depend on each file (reverse dependencies)
   */
  private calculateDependents(graph: Map<string, DependencyNode>): void {
    for (const [filePath, node] of Array.from(graph)) {
      // Handle malformed data gracefully
      if (!node.imports || !Array.isArray(node.imports)) {
        continue;
      }

      for (const importPath of node.imports) {
        // Skip invalid import paths
        if (typeof importPath !== "string") {
          continue;
        }

        // Resolve import to actual file
        const resolvedFile = this.resolveImport(importPath, filePath, graph);
        if (resolvedFile && graph.has(resolvedFile)) {
          const dependentNode = graph.get(resolvedFile)!;
          if (!dependentNode.dependents.includes(filePath)) {
            dependentNode.dependents.push(filePath);
          }
        }
      }
    }
  }

  /**
   * Calculate dependency depth for each file
   */
  private calculateDepths(graph: Map<string, DependencyNode>): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const calculateDepth = (filePath: string): number => {
      if (visited.has(filePath)) {
        return graph.get(filePath)!.depth;
      }

      visited.add(filePath);
      recursionStack.add(filePath);

      const node = graph.get(filePath)!;
      let maxDepth = 0;

      // Handle malformed data gracefully
      if (!node.imports || !Array.isArray(node.imports)) {
        node.depth = 0;
        return 0;
      }

      for (const importPath of node.imports) {
        // Skip invalid import paths
        if (typeof importPath !== "string") {
          continue;
        }
        const resolvedFile = this.resolveImport(importPath, filePath, graph);
        if (resolvedFile && graph.has(resolvedFile)) {
          if (recursionStack.has(resolvedFile)) {
            // Circular dependency detected
            continue;
          }
          const depth = calculateDepth(resolvedFile) + 1;
          maxDepth = Math.max(maxDepth, depth);
        }
      }

      recursionStack.delete(filePath);
      node.depth = maxDepth;
      return maxDepth;
    };

    for (const filePath of Array.from(graph.keys())) {
      calculateDepth(filePath);
    }
  }

  /**
   * Detect circular dependencies in the graph
   */
  private detectCircularDependencies(
    graph: Map<string, DependencyNode>,
  ): DependencyChain[] {
    const circularChains: DependencyChain[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (filePath: string, path: string[] = []): void => {
      visited.add(filePath);
      recursionStack.add(filePath);
      path.push(filePath);

      const node = graph.get(filePath)!;

      // Handle malformed data gracefully
      if (!node.imports || !Array.isArray(node.imports)) {
        recursionStack.delete(filePath);
        path.pop();
        return;
      }

      for (const importPath of node.imports) {
        // Skip invalid import paths
        if (typeof importPath !== "string") {
          continue;
        }
        const resolvedFile = this.resolveImport(importPath, filePath, graph);
        if (!resolvedFile || !graph.has(resolvedFile)) continue;

        if (!visited.has(resolvedFile)) {
          dfs(resolvedFile, [...path]);
        } else if (recursionStack.has(resolvedFile)) {
          // Found circular dependency
          const cycleStart = path.indexOf(resolvedFile);
          const cycle = [...path.slice(cycleStart), resolvedFile];

          circularChains.push({
            start: resolvedFile,
            end: resolvedFile,
            path: cycle,
            type: "circular",
          });
        }
      }

      recursionStack.delete(filePath);
      path.pop();
    };

    for (const filePath of Array.from(graph.keys())) {
      if (!visited.has(filePath)) {
        dfs(filePath);
      }
    }

    return circularChains;
  }

  /**
   * Mark files that are part of circular dependencies
   */
  private markCircularDependencies(
    graph: Map<string, DependencyNode>,
    circularChains: DependencyChain[],
  ): void {
    for (const chain of circularChains) {
      for (const filePath of chain.path) {
        const node = graph.get(filePath);
        if (node) {
          node.circular = true;
        }
      }
    }
  }

  /**
   * Calculate comprehensive dependency metrics
   */
  private calculateDependencyMetrics(
    graph: Map<string, DependencyNode>,
    chains: DependencyChain[],
  ): DependencyMetrics {
    const allImports = Array.from(graph.values()).flatMap(
      (node) => node.imports,
    );
    const uniqueModules = new Set(allImports).size;
    const maxDepth = Math.max(
      ...Array.from(graph.values()).map((node) => node.depth),
    );
    const circularDependencies = chains.filter(
      (chain) => chain.type === "circular",
    ).length;

    const orphanFiles = Array.from(graph.values()).filter(
      (node) =>
        node.dependents.length === 0 &&
        (!node.imports || node.imports.length === 0),
    ).length;

    const tightlyCoupledFiles = Array.from(graph.values()).filter(
      (node) =>
        node.dependents.length > 10 ||
        (node.imports && node.imports.length > 10),
    ).length;

    const averageDependenciesPerFile = allImports.length / graph.size;

    // Calculate coupling index (0-100, higher = more coupled)
    const couplingIndex = Math.min(
      100,
      averageDependenciesPerFile * 10 +
        circularDependencies * 20 +
        tightlyCoupledFiles * 5,
    );

    return {
      totalDependencies: allImports.length,
      uniqueModules,
      maxDepth: maxDepth || 0,
      circularDependencies,
      orphanFiles,
      tightlyCoupledFiles,
      averageDependenciesPerFile,
      couplingIndex,
    };
  }

  /**
   * Identify dependency-related issues
   */
  private identifyDependencyIssues(
    graph: Map<string, DependencyNode>,
    chains: DependencyChain[],
    metrics: DependencyMetrics,
  ): DependencyIssue[] {
    const issues: DependencyIssue[] = [];

    // Circular dependencies
    for (const chain of chains.filter((c) => c.type === "circular")) {
      issues.push({
        type: "circular-dependency",
        severity: chain.path.length > 4 ? "critical" : "high",
        files: chain.path,
        description: `Circular dependency detected: ${chain.path.join(" -> ")}`,
        impact: "Makes code harder to test, maintain, and understand",
        suggestion:
          "Refactor to break the circular dependency using dependency injection or event-driven patterns",
      });
    }

    // Orphan files
    if (metrics.orphanFiles > 0) {
      const orphans = Array.from(graph.values())
        .filter(
          (node) =>
            node.dependents.length === 0 &&
            (!node.imports || node.imports.length === 0),
        )
        .map((node) => node.file);

      issues.push({
        type: "orphan-file",
        severity: metrics.orphanFiles > 10 ? "medium" : "low",
        files: orphans,
        description: `${metrics.orphanFiles} files have no dependencies or dependents`,
        impact: "May indicate dead code or unused functionality",
        suggestion:
          "Review orphan files for removal or integration into the codebase",
      });
    }

    // Tight coupling
    if (metrics.tightlyCoupledFiles > 0) {
      const tightlyCoupled = Array.from(graph.values())
        .filter(
          (node) => node.dependents.length > 10 || node.imports.length > 10,
        )
        .map((node) => node.file);

      issues.push({
        type: "tight-coupling",
        severity: "high",
        files: tightlyCoupled,
        description: `${metrics.tightlyCoupledFiles} files have high coupling (many dependencies)`,
        impact: "Changes to these files will affect many other files",
        suggestion:
          "Consider breaking down tightly coupled files into smaller, focused modules",
      });
    }

    // Deep dependency chains
    if (metrics.maxDepth > 5) {
      const deepFiles = Array.from(graph.values())
        .filter((node) => node.depth > 5)
        .map((node) => node.file);

      issues.push({
        type: "deep-dependency",
        severity: "medium",
        files: deepFiles,
        description: `Some files have dependency depth > 5 (max: ${metrics.maxDepth})`,
        impact: "Makes code harder to understand and test",
        suggestion: "Consider flattening the dependency hierarchy",
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on issues and metrics
   */
  private generateRecommendations(
    issues: DependencyIssue[],
    metrics: DependencyMetrics,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.couplingIndex > 70) {
      recommendations.push(
        "High coupling detected - consider implementing dependency injection to reduce tight coupling",
      );
    }

    if (metrics.circularDependencies > 0) {
      recommendations.push(
        "Break circular dependencies by introducing interfaces or event-driven communication",
      );
    }

    if (metrics.maxDepth > 3) {
      recommendations.push(
        "Flatten deep dependency chains by creating facade classes or reducing abstraction layers",
      );
    }

    if (metrics.orphanFiles > metrics.totalDependencies * 0.1) {
      recommendations.push(
        "High number of orphan files - conduct code cleanup to remove dead code",
      );
    }

    if (issues.some((issue) => issue.type === "tight-coupling")) {
      recommendations.push(
        "Break down tightly coupled components by implementing facade pattern or adapter pattern",
      );
    }

    return recommendations;
  }

  // Helper methods

  private getModuleName(
    filePath: string,
    modules: Map<string, ModuleInfo>,
  ): string {
    for (const [modulePath, module] of Array.from(modules)) {
      if (filePath.startsWith(modulePath)) {
        return module.name;
      }
    }
    return path.dirname(filePath).split(path.sep).pop() || "root";
  }

  private isSourceFile(filePath: string): boolean {
    const extensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
    ];
    return extensions.some((ext) => filePath.endsWith(ext));
  }

  private resolveImport(
    importPath: string,
    fromFile: string,
    graph: Map<string, DependencyNode>,
  ): string | null {
    // Handle relative imports
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      const fromDir = path.dirname(fromFile);
      const resolvedPath = path.resolve(fromDir, importPath);

      // For test environments, also try relative path resolution
      const relativeResolved = path
        .relative("", resolvedPath)
        .replace(/\\/g, "/");

      // Try different extensions
      const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".py", ".java"];
      for (const ext of extensions) {
        // Try absolute path first
        let testPath = resolvedPath + ext;
        if (graph.has(testPath)) {
          return testPath;
        }

        // Try relative path
        testPath = relativeResolved + ext;
        if (graph.has(testPath)) {
          return testPath;
        }

        // Try just the basename for test environments
        const basename = path.basename(resolvedPath) + ext;
        if (graph.has(basename)) {
          return basename;
        }

        // Try index files in directories
        const indexPath = path.join(resolvedPath, "index" + ext);
        if (graph.has(indexPath)) {
          return indexPath;
        }
      }
    }

    // Handle module imports (simplified - would need module resolution logic)
    // For now, just return null for external modules
    return null;
  }
}
