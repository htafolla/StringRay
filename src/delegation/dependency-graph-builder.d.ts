/**
 * StringRay AI v1.1.1 - Dependency Graph Builder
 *
 * Builds comprehensive dependency graphs for codebase analysis.
 * Tracks file relationships, import/export chains, and architectural dependencies.
 *
 * @version 1.0.0
 * @since 2026-01-11
 */
import { CodebaseContextAnalyzer } from "./codebase-context-analyzer";
import { ASTCodeParser } from "./ast-code-parser";
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
    type: "circular-dependency" | "orphan-file" | "tight-coupling" | "deep-dependency";
    severity: "low" | "medium" | "high" | "critical";
    files: string[];
    description: string;
    impact: string;
    suggestion: string;
}
export declare class DependencyGraphBuilder {
    private codebaseAnalyzer;
    private astParser;
    constructor(codebaseAnalyzer: CodebaseContextAnalyzer, astParser: ASTCodeParser);
    /**
     * Build comprehensive dependency graph for the codebase
     */
    buildDependencyGraph(): Promise<DependencyAnalysis>;
    /**
     * Enhance dependency graph with AST analysis
     */
    private enhanceWithASTAnalysis;
    /**
     * Calculate which files depend on each file (reverse dependencies)
     */
    private calculateDependents;
    /**
     * Calculate dependency depth for each file
     */
    private calculateDepths;
    /**
     * Detect circular dependencies in the graph
     */
    private detectCircularDependencies;
    /**
     * Mark files that are part of circular dependencies
     */
    private markCircularDependencies;
    /**
     * Calculate comprehensive dependency metrics
     */
    private calculateDependencyMetrics;
    /**
     * Identify dependency-related issues
     */
    private identifyDependencyIssues;
    /**
     * Generate recommendations based on issues and metrics
     */
    private generateRecommendations;
    private getModuleName;
    private isSourceFile;
    private resolveImport;
}
//# sourceMappingURL=dependency-graph-builder.d.ts.map