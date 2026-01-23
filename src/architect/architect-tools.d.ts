/**
 * Architect Tools - Integration layer between architect agent and contextual analysis system
 * Provides tools for codebase intelligence, architectural assessment, and design planning
 */
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
export declare function contextAnalysis(projectRoot: string, files?: string[], depth?: "overview" | "detailed" | "comprehensive"): Promise<ContextAnalysisResult>;
/**
 * Codebase Structure Tool - File organization and module analysis
 */
export declare function codebaseStructure(projectRoot: string, includeMetrics?: boolean): Promise<any>;
/**
 * Dependency Analysis Tool - Component relationship and coupling analysis
 */
export declare function dependencyAnalysis(projectRoot: string, focusAreas?: string[]): Promise<DependencyAnalysis>;
/**
 * Architecture Assessment Tool - Overall architectural health evaluation
 */
export declare function architectureAssessment(projectRoot: string, assessmentType?: "quick" | "comprehensive"): Promise<ArchitectureAssessment>;
export declare const architectTools: {
    contextAnalysis: typeof contextAnalysis;
    codebaseStructure: typeof codebaseStructure;
    dependencyAnalysis: typeof dependencyAnalysis;
    architectureAssessment: typeof architectureAssessment;
};
//# sourceMappingURL=architect-tools.d.ts.map