export interface FileInfo {
    path: string;
    relativePath: string;
    size: number;
    extension: string;
    language: string;
    isSourceCode: boolean;
    linesOfCode: number;
    imports: string[];
    exports: string[];
    dependencies: string[];
    lastModified: Date;
    content?: string;
}
export interface ModuleInfo {
    name: string;
    path: string;
    files: FileInfo[];
    entryPoint?: string | undefined;
    dependencies: string[];
    dependents: string[];
    type: "source" | "config" | "docs" | "test" | "infrastructure";
}
export interface CodebaseStructure {
    rootPath: string;
    totalFiles: number;
    totalLinesOfCode: number;
    languages: Map<string, number>;
    modules: Map<string, ModuleInfo>;
    fileGraph: Map<string, FileInfo>;
    dependencyGraph: Map<string, Set<string>>;
    architecture: {
        framework: string[];
        patterns: string[];
        structure: "monolithic" | "modular" | "microservices";
        entryPoints: string[];
    };
}
export interface ContextMetrics {
    fileCount: number;
    linesOfCode: number;
    languages: string[];
    complexity: number;
    coupling: number;
    cohesion: number;
    testCoverage: number;
    architecturalPatterns: string[];
    qualityScore: number;
}
export interface CodebaseAnalysis {
    structure: CodebaseStructure;
    metrics: ContextMetrics;
    insights: string[];
    recommendations: string[];
    risks: string[];
    scannedAt: Date;
}
export interface MemoryConfig {
    maxFilesInMemory: number;
    maxFileSizeBytes: number;
    enableStreaming: boolean;
    batchSize: number;
    enableCaching: boolean;
    cacheTtlMs: number;
    enableConcurrentProcessing?: boolean;
    concurrencyLimit?: number;
}
export declare class CodebaseContextAnalyzer {
    private projectRoot;
    private memoryConfig;
    private analysisCache;
    private ignorePatterns;
    private supportedLanguages;
    constructor(projectRoot?: string, memoryConfig?: Partial<MemoryConfig>);
    /**
     * Perform comprehensive codebase analysis with memory optimization
     */
    analyzeCodebase(): Promise<CodebaseAnalysis>;
    /**
     * Get cached analysis result with intelligent invalidation
     */
    private getCachedAnalysis;
    /**
     * Set cached analysis result with size limits
     */
    private setCachedAnalysis;
    /**
     * Extract file path from cache key for validation
     */
    private extractFilePathFromCacheKey;
    /**
     * Stream file content for large files to reduce memory usage
     */
    private streamFileContent;
    /**
     * Build complete codebase structure map with batching for memory efficiency
     */
    private buildCodebaseStructure;
    /**
     * Analyze individual file for structure and dependencies with memory optimization
     */
    private analyzeFile;
    /**
     * Analyze module directory structure
     */
    private analyzeModule;
    /**
     * Extract imports and exports from source code
     */
    private extractImportsExports;
    private extractJsTsImportsExports;
    private extractPythonImportsExports;
    private extractJavaImportsExports;
    /**
     * Build dependency graph between files
     */
    private buildDependencyGraph;
    /**
     * Detect architectural patterns and framework usage
     */
    private detectArchitecture;
    /**
     * Calculate comprehensive context metrics
     */
    private calculateContextMetrics;
    private calculateComplexityScore;
    private calculateCouplingScore;
    private calculateCohesionScore;
    private estimateTestCoverage;
    private calculateQualityScore;
    /**
     * Generate insights based on analysis
     */
    private generateInsights;
    /**
     * Generate recommendations for improvement
     */
    private generateRecommendations;
    /**
     * Identify potential risks and issues
     */
    private identifyRisks;
    private isModuleDirectory;
    private isConfigFile;
    private classifyModule;
    private findEntryPoint;
    private hasFramework;
    private detectMVCPattern;
    private detectRepositoryPattern;
    private detectObserverPattern;
    private detectFactoryPattern;
    private hasMicroservicesIndicators;
    private isEntryPoint;
    private detectCircularDependencies;
}
export declare const createCodebaseContextAnalyzer: (projectRoot?: string, memoryConfig?: Partial<MemoryConfig>) => CodebaseContextAnalyzer;
//# sourceMappingURL=codebase-context-analyzer.d.ts.map