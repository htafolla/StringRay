/**
 * Architect Tools - Integration layer between architect agent and contextual analysis system
 * Provides tools for codebase intelligence, architectural assessment, and design planning
 */

import { createCodebaseContextAnalyzer } from "../delegation/codebase-context-analyzer";
import { ASTCodeParser } from "../delegation/ast-code-parser";
import { DependencyGraphBuilder } from "../delegation/dependency-graph-builder";
import { frameworkLogger } from "../framework-logger";
import * as fs from "fs";
import * as path from "path";

export interface ContextAnalysisResult {
  codebaseStructure: any;
  architecturalPatterns: string[];
  dependencyIssues: string[];
  scalabilityAssessment: {
    score: number;
    recommendations: string[];
  };
  maintainabilityIndex: number;
  complexityAnalysis: any;
}

export interface ArchitectureAssessment {
  overallHealth: "excellent" | "good" | "fair" | "poor" | "critical";
  scores: {
    modularity: number;
    coupling: number;
    cohesion: number;
    testability: number;
    scalability: number;
  };
  issues: Array<{
    type: "critical" | "major" | "minor";
    description: string;
    impact: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export interface DependencyAnalysis {
  graph: any;
  circularDependencies: string[];
  tightlyCoupledModules: string[];
  orphanModules: string[];
  healthScore: number;
  recommendations: string[];
}

/**
 * Context Analysis Tool - Comprehensive codebase intelligence gathering
 */
export async function contextAnalysis(
  projectRoot: string,
  files?: string[],
  depth: "overview" | "detailed" | "comprehensive" = "detailed",
): Promise<ContextAnalysisResult> {
  await frameworkLogger.log(
    "architect-tools",
    "context-analysis-start",
    "info",
    {
      projectRoot,
      fileCount: files?.length || 0,
      depth,
    },
  );

  try {
    // Initialize contextual analysis components
    const contextAnalyzer = createCodebaseContextAnalyzer(projectRoot, {
      maxFilesInMemory: depth === "comprehensive" ? 500 : 100,
      maxFileSizeBytes: 1024 * 1024, // 1MB
      enableStreaming: true,
      batchSize: 20,
      enableCaching: true,
    });

    const astParser = new ASTCodeParser();
    const dependencyBuilder = new DependencyGraphBuilder(
      contextAnalyzer,
      astParser,
    );

    // Perform comprehensive analysis
    const analysis = await contextAnalyzer.analyzeCodebase();

    // Enhanced analysis based on depth
    let architecturalPatterns: string[] = [];
    let dependencyIssues: string[] = [];
    let scalabilityAssessment: ContextAnalysisResult["scalabilityAssessment"];
    let maintainabilityIndex: number;
    let complexityAnalysis: any;

    if (depth !== "overview") {
      // Build dependency graph for deeper analysis
      const dependencyAnalysis = await dependencyBuilder.buildDependencyGraph();

      architecturalPatterns = identifyArchitecturalPatterns(
        analysis,
        dependencyAnalysis,
      );
      dependencyIssues = analyzeDependencyHealth(dependencyAnalysis);
      scalabilityAssessment = assessScalability(analysis, dependencyAnalysis);
      maintainabilityIndex = calculateMaintainabilityIndex(
        analysis,
        dependencyAnalysis,
      );
      complexityAnalysis = analyzeComplexityPatterns(analysis);
    } else {
      // Basic analysis for overview
      architecturalPatterns = identifyBasicPatterns(analysis);
      dependencyIssues = [];
      scalabilityAssessment = {
        score: 75,
        recommendations: ["Detailed analysis recommended"],
      };
      maintainabilityIndex = 75;
      complexityAnalysis = { overview: true };
    }

    const result: ContextAnalysisResult = {
      codebaseStructure: analysis.structure,
      architecturalPatterns,
      dependencyIssues,
      scalabilityAssessment,
      maintainabilityIndex,
      complexityAnalysis,
    };

    await frameworkLogger.log(
      "architect-tools",
      "context-analysis-complete",
      "success",
      {
        projectRoot,
        filesAnalyzed: analysis.structure.totalFiles,
        patternsFound: architecturalPatterns.length,
        issuesFound: dependencyIssues.length,
        maintainabilityIndex,
      },
    );

    return result;
  } catch (error) {
    await frameworkLogger.log(
      "architect-tools",
      "context-analysis-failed",
      "error",
      {
        projectRoot,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    throw error;
  }
}

/**
 * Codebase Structure Tool - File organization and module analysis
 */
export async function codebaseStructure(
  projectRoot: string,
  includeMetrics: boolean = true,
): Promise<any> {
  await frameworkLogger.log(
    "architect-tools",
    "structure-analysis-start",
    "info",
    {
      projectRoot,
      includeMetrics,
    },
  );

  const contextAnalyzer = createCodebaseContextAnalyzer(projectRoot);
  const analysis = await contextAnalyzer.analyzeCodebase();

  const structure = {
    overview: {
      totalFiles: analysis.structure.totalFiles,
      totalLinesOfCode: analysis.structure.totalLinesOfCode,
      languages: Array.from(analysis.structure.languages.entries()),
      modules: analysis.structure.modules.size,
    },
    fileTypes: analysis.structure.fileGraph
      ? groupByFileType(analysis.structure.fileGraph)
      : {},
    moduleStructure: analysis.structure.modules
      ? Array.from(analysis.structure.modules.values())
      : [],
    ...(includeMetrics && {
      metrics: {
        qualityScore: analysis.metrics.qualityScore,
        complexity: analysis.metrics.complexity,
        coupling: analysis.metrics.coupling,
        cohesion: analysis.metrics.cohesion,
      },
    }),
  };

  await frameworkLogger.log(
    "architect-tools",
    "structure-analysis-complete",
    "success",
    {
      projectRoot,
      filesAnalyzed: analysis.structure.totalFiles,
    },
  );

  return structure;
}

/**
 * Dependency Analysis Tool - Component relationship and coupling analysis
 */
export async function dependencyAnalysis(
  projectRoot: string,
  focusAreas?: string[],
): Promise<DependencyAnalysis> {
  await frameworkLogger.log(
    "architect-tools",
    "dependency-analysis-start",
    "info",
    {
      projectRoot,
      focusAreas: focusAreas?.length || 0,
    },
  );

  const contextAnalyzer = createCodebaseContextAnalyzer(projectRoot);
  const astParser = new ASTCodeParser();
  const dependencyBuilder = new DependencyGraphBuilder(
    contextAnalyzer,
    astParser,
  );

  const analysis = await dependencyBuilder.buildDependencyGraph();

  // Analyze dependency health
  const circularDependencies = analysis.issues
    .filter((issue) => issue.type === "circular-dependency")
    .map((issue) => issue.description);

  const tightlyCoupledModules = identifyTightlyCoupledModules(analysis.graph);
  const orphanModules = identifyOrphanModules(analysis.graph);
  const healthScore = calculateDependencyHealthScore(analysis);

  const recommendations = generateDependencyRecommendations(
    circularDependencies,
    tightlyCoupledModules,
    orphanModules,
    healthScore,
  );

  const result: DependencyAnalysis = {
    graph: analysis.graph,
    circularDependencies,
    tightlyCoupledModules,
    orphanModules,
    healthScore,
    recommendations,
  };

  await frameworkLogger.log(
    "architect-tools",
    "dependency-analysis-complete",
    "success",
    {
      projectRoot,
      circularDeps: circularDependencies.length,
      tightlyCoupled: tightlyCoupledModules.length,
      orphans: orphanModules.length,
      healthScore,
    },
  );

  return result;
}

/**
 * Architecture Assessment Tool - Overall architectural health evaluation
 */
export async function architectureAssessment(
  projectRoot: string,
  assessmentType: "quick" | "comprehensive" = "comprehensive",
): Promise<ArchitectureAssessment> {
  await frameworkLogger.log(
    "architect-tools",
    "architecture-assessment-start",
    "info",
    {
      projectRoot,
      assessmentType,
    },
  );

  // Gather all necessary data
  const contextResult = await contextAnalysis(
    projectRoot,
    undefined,
    assessmentType === "comprehensive" ? "detailed" : "overview",
  );
  const dependencyResult = await dependencyAnalysis(projectRoot);

  // Calculate architectural health scores
  const scores = calculateArchitecturalScores(contextResult, dependencyResult);
  const overallHealth = determineOverallHealth(scores);
  const issues = identifyArchitecturalIssues(
    contextResult,
    dependencyResult,
    scores,
  );
  const recommendations = generateArchitecturalRecommendations(issues, scores);

  const result: ArchitectureAssessment = {
    overallHealth,
    scores,
    issues,
    recommendations,
  };

  await frameworkLogger.log(
    "architect-tools",
    "architecture-assessment-complete",
    "success",
    {
      projectRoot,
      overallHealth,
      issueCount: issues.length,
      recommendationCount: recommendations.length,
    },
  );

  return result;
}

// Helper functions

function identifyArchitecturalPatterns(
  codebaseAnalysis: any,
  dependencyAnalysis: any,
): string[] {
  const patterns: string[] = [];

  // MVC Pattern detection
  if (hasMVCPattern(codebaseAnalysis)) {
    patterns.push("Model-View-Controller (MVC)");
  }

  // Repository Pattern
  if (hasRepositoryPattern(codebaseAnalysis)) {
    patterns.push("Repository Pattern");
  }

  // Observer Pattern
  if (hasObserverPattern(codebaseAnalysis)) {
    patterns.push("Observer Pattern");
  }

  // Factory Pattern
  if (hasFactoryPattern(codebaseAnalysis)) {
    patterns.push("Factory Pattern");
  }

  // Microservices indicators
  if (hasMicroservicesIndicators(codebaseAnalysis)) {
    patterns.push("Microservices Architecture");
  }

  // Layered Architecture
  if (hasLayeredArchitecture(dependencyAnalysis)) {
    patterns.push("Layered Architecture");
  }

  return patterns;
}

function identifyBasicPatterns(codebaseAnalysis: any): string[] {
  const patterns: string[] = [];

  // Basic pattern detection based on file structure
  const fileNames = Array.from(
    codebaseAnalysis.structure.fileGraph?.keys() || [],
  );

  if (
    fileNames.some(
      (f: unknown) => typeof f === "string" && f.includes("controller"),
    )
  )
    patterns.push("Controller Layer Detected");
  if (
    fileNames.some(
      (f: unknown) => typeof f === "string" && f.includes("service"),
    )
  )
    patterns.push("Service Layer Detected");
  if (
    fileNames.some(
      (f: unknown) =>
        typeof f === "string" && (f.includes("model") || f.includes("entity")),
    )
  )
    patterns.push("Data Models Detected");

  return patterns;
}

function analyzeDependencyHealth(dependencyAnalysis: any): string[] {
  const issues: string[] = [];

  if (dependencyAnalysis.metrics.circularDependencies > 0) {
    issues.push(
      `${dependencyAnalysis.metrics.circularDependencies} circular dependencies detected`,
    );
  }

  if (dependencyAnalysis.metrics.couplingIndex > 80) {
    issues.push(
      `High coupling index: ${dependencyAnalysis.metrics.couplingIndex}`,
    );
  }

  if (dependencyAnalysis.metrics.orphanFiles > 0) {
    issues.push(
      `${dependencyAnalysis.metrics.orphanFiles} orphan files detected`,
    );
  }

  return issues;
}

function assessScalability(
  codebaseAnalysis: any,
  dependencyAnalysis: any,
): ContextAnalysisResult["scalabilityAssessment"] {
  let score = 100;
  const recommendations: string[] = [];

  // Coupling impact on scalability
  if (dependencyAnalysis.metrics.couplingIndex > 70) {
    score -= 20;
    recommendations.push("Reduce coupling to improve scalability");
  }

  // Modularity impact
  if (
    codebaseAnalysis.structure.modules.size < 5 &&
    codebaseAnalysis.structure.totalFiles > 50
  ) {
    score -= 15;
    recommendations.push("Increase modularity for better scalability");
  }

  // File size impact
  const avgFileSize =
    codebaseAnalysis.structure.totalLinesOfCode /
    codebaseAnalysis.structure.totalFiles;
  if (avgFileSize > 500) {
    score -= 10;
    recommendations.push("Break down large files for better maintainability");
  }

  return { score: Math.max(0, score), recommendations };
}

function calculateMaintainabilityIndex(
  codebaseAnalysis: any,
  dependencyAnalysis: any,
): number {
  let index = 100;

  // Complexity impact
  if (codebaseAnalysis.metrics.complexity > 80) index -= 25;

  // Coupling impact
  if (dependencyAnalysis.metrics.couplingIndex > 70) index -= 20;

  // Test coverage impact (estimated)
  const estimatedTestCoverage = codebaseAnalysis.metrics.testCoverage || 50;
  if (estimatedTestCoverage < 70)
    index -= Math.floor((70 - estimatedTestCoverage) / 2);

  return Math.max(0, index);
}

function analyzeComplexityPatterns(codebaseAnalysis: any): any {
  return {
    averageComplexity: codebaseAnalysis.metrics.complexity || 0,
    highComplexityFiles: [], // Would be populated with actual analysis
    complexityDistribution: "analyzed", // Placeholder
    recommendations: generateComplexityRecommendations(codebaseAnalysis),
  };
}

function hasMVCPattern(analysis: any): boolean {
  const files = Array.from(analysis.structure.fileGraph?.keys() || []);
  const hasControllers = files.some(
    (f: unknown) => typeof f === "string" && f.includes("controller"),
  );
  const hasModels = files.some(
    (f: unknown) => typeof f === "string" && f.includes("model"),
  );
  const hasViews = files.some(
    (f: unknown) =>
      typeof f === "string" && (f.includes("view") || f.includes("component")),
  );

  return hasControllers && hasModels && hasViews;
}

function hasRepositoryPattern(analysis: any): boolean {
  const files = Array.from(analysis.structure.fileGraph?.keys() || []);
  return files.some(
    (f: unknown) => typeof f === "string" && f.includes("repository"),
  );
}

function hasObserverPattern(analysis: any): boolean {
  // Would require AST analysis for pattern detection
  return false; // Placeholder
}

function hasFactoryPattern(analysis: any): boolean {
  const files = Array.from(analysis.structure.fileGraph?.keys() || []);
  return files.some(
    (f: unknown) => typeof f === "string" && f.includes("factory"),
  );
}

function hasMicroservicesIndicators(analysis: any): boolean {
  const files = Array.from(analysis.structure.fileGraph?.keys() || []);
  return files.some(
    (f: unknown) =>
      typeof f === "string" &&
      (f.includes("docker") || f.includes("kubernetes")),
  );
}

function hasLayeredArchitecture(dependencyAnalysis: any): boolean {
  // Would analyze dependency graph for layered structure
  return false; // Placeholder
}

function groupByFileType(fileGraph: Map<string, any>): Record<string, number> {
  const types: Record<string, number> = {};

  for (const fileInfo of fileGraph.values()) {
    const type = fileInfo.language || "other";
    types[type] = (types[type] || 0) + 1;
  }

  return types;
}

function identifyTightlyCoupledModules(graph: any): string[] {
  // Placeholder - would analyze dependency graph for tightly coupled modules
  return [];
}

function identifyOrphanModules(graph: any): string[] {
  // Placeholder - would identify modules with no dependencies
  return [];
}

function calculateDependencyHealthScore(analysis: any): number {
  let score = 100;

  if (analysis.metrics.circularDependencies > 0)
    score -= analysis.metrics.circularDependencies * 10;
  if (analysis.metrics.couplingIndex > 70)
    score -= analysis.metrics.couplingIndex - 70;
  if (analysis.metrics.orphanFiles > 0)
    score -= analysis.metrics.orphanFiles * 5;

  return Math.max(0, score);
}

function generateDependencyRecommendations(
  circularDeps: string[],
  tightlyCoupled: string[],
  orphans: string[],
  healthScore: number,
): string[] {
  const recommendations: string[] = [];

  if (circularDeps.length > 0) {
    recommendations.push(
      "Resolve circular dependencies by introducing interfaces or mediator patterns",
    );
  }

  if (tightlyCoupled.length > 0) {
    recommendations.push(
      "Reduce coupling by applying dependency inversion principle",
    );
  }

  if (orphans.length > 0) {
    recommendations.push(
      "Review orphan modules - they may indicate dead code or missing integration",
    );
  }

  if (healthScore < 70) {
    recommendations.push(
      "Consider architectural refactoring to improve dependency health",
    );
  }

  return recommendations;
}

function calculateArchitecturalScores(
  context: ContextAnalysisResult,
  deps: DependencyAnalysis,
): ArchitectureAssessment["scores"] {
  return {
    modularity: context.codebaseStructure.modules?.size > 5 ? 85 : 60,
    coupling: Math.max(0, 100 - deps.healthScore),
    cohesion: context.maintainabilityIndex,
    testability: 75, // Placeholder
    scalability: context.scalabilityAssessment.score,
  };
}

function determineOverallHealth(
  scores: ArchitectureAssessment["scores"],
): ArchitectureAssessment["overallHealth"] {
  const avgScore =
    Object.values(scores).reduce((a, b) => a + b, 0) /
    Object.values(scores).length;

  if (avgScore >= 85) return "excellent";
  if (avgScore >= 70) return "good";
  if (avgScore >= 55) return "fair";
  if (avgScore >= 40) return "poor";
  return "critical";
}

function identifyArchitecturalIssues(
  context: ContextAnalysisResult,
  deps: DependencyAnalysis,
  scores: ArchitectureAssessment["scores"],
): ArchitectureAssessment["issues"] {
  const issues: ArchitectureAssessment["issues"] = [];

  if (scores.coupling > 80) {
    issues.push({
      type: "critical",
      description: "High coupling between components",
      impact: "Makes changes difficult and increases bug risk",
      recommendation:
        "Apply dependency inversion and interface segregation principles",
    });
  }

  if (scores.modularity < 60) {
    issues.push({
      type: "major",
      description: "Low modularity",
      impact: "Code is monolithic and hard to maintain",
      recommendation: "Break down into smaller, focused modules",
    });
  }

  if (deps.circularDependencies.length > 0) {
    issues.push({
      type: "major",
      description: `${deps.circularDependencies.length} circular dependencies detected`,
      impact: "Creates tight coupling and makes testing difficult",
      recommendation: "Refactor to break circular dependencies",
    });
  }

  return issues;
}

function generateArchitecturalRecommendations(
  issues: ArchitectureAssessment["issues"],
  scores: ArchitectureAssessment["scores"],
): string[] {
  const recommendations: string[] = [];

  if (issues.some((i) => i.type === "critical")) {
    recommendations.push("Address critical architectural issues immediately");
  }

  if (scores.scalability < 70) {
    recommendations.push(
      "Improve scalability by reducing coupling and increasing modularity",
    );
  }

  if (scores.testability < 70) {
    recommendations.push(
      "Enhance testability by improving separation of concerns",
    );
  }

  recommendations.push(
    "Regular architectural reviews to maintain code quality",
  );

  return recommendations;
}

function generateComplexityRecommendations(codebaseAnalysis: any): string[] {
  const recommendations: string[] = [];

  if (codebaseAnalysis.metrics.complexity > 80) {
    recommendations.push(
      "Break down complex functions into smaller, focused units",
    );
  }

  if (codebaseAnalysis.structure.totalLinesOfCode > 10000) {
    recommendations.push(
      "Consider splitting large codebases into separate modules",
    );
  }

  return recommendations;
}

// Export tools for MCP integration
export const architectTools = {
  contextAnalysis,
  codebaseStructure,
  dependencyAnalysis,
  architectureAssessment,
};
