/**
 * StringRay AI v1.1.1 - AST Code Parser
 *
 * AST-based code parsing and structural analysis using ast-grep.
 * Provides advanced code understanding, pattern detection, and refactoring insights.
 *
 * @version 1.0.0
 * @since 2026-01-11
 */
export interface ASTPattern {
    name: string;
    pattern: string;
    language: string;
    description: string;
}
export interface ASTMatch {
    pattern: string;
    file: string;
    line: number;
    column: number;
    content: string;
    captures?: Record<string, string>;
}
export interface CodeStructure {
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: ImportInfo[];
    exports: ExportInfo[];
    patterns: PatternInfo[];
    complexity: {
        cyclomatic: number;
        cognitive: number;
        nesting: number;
    };
}
export interface FunctionInfo {
    name: string;
    line: number;
    parameters: string[];
    returnType?: string;
    complexity: number;
    lines: number;
}
export interface ClassInfo {
    name: string;
    line: number;
    methods: string[];
    properties: string[];
    extends?: string;
    implements?: string[];
}
export interface ImportInfo {
    module: string;
    names: string[];
    line: number;
    type: "default" | "named" | "namespace" | "side-effect";
    file: string;
}
export interface ExportInfo {
    name: string;
    type: "function" | "class" | "variable" | "default";
    line: number;
}
export interface PatternInfo {
    pattern: string;
    occurrences: number;
    files: string[];
    type: "anti-pattern" | "best-practice" | "refactoring-opportunity";
    severity: "low" | "medium" | "high" | "critical";
}
export interface ASTAnalysis {
    structure: CodeStructure;
    patterns: PatternInfo[];
    issues: CodeIssue[];
    suggestions: RefactoringSuggestion[];
    metrics: CodeMetrics;
}
export interface CodeIssue {
    type: "bug" | "security" | "performance" | "maintainability";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    file: string;
    line: number;
    suggestion: string;
}
export interface RefactoringSuggestion {
    type: "extract-method" | "rename" | "move" | "simplify" | "consolidate";
    description: string;
    file: string;
    line: number;
    impact: "low" | "medium" | "high";
    effort: "low" | "medium" | "high";
}
export interface CodeMetrics {
    linesOfCode: number;
    functions: number;
    classes: number;
    complexity: number;
    duplication: number;
    testCoverage: number;
    maintainabilityIndex: number;
}
export declare class ASTCodeParser {
    private astGrepPath;
    private astGrepAvailable;
    private patterns;
    constructor(astGrepPath?: string);
    /**
     * Analyze code file using AST parsing
     */
    analyzeFile(filePath: string): Promise<ASTAnalysis>;
    /**
     * Parse code structure using ast-grep (advanced)
     */
    private parseCodeStructureWithAstGrep;
    /**
     * Parse code structure using regex (fallback)
     */
    private parseCodeStructureWithRegex;
    /**
     * Find AST matches using ast-grep
     */
    private findMatches;
    /**
     * Regex-based pattern matching (fallback when ast-grep not available)
     */
    private regexBasedMatching;
    /**
     * Extract named captures from regex match
     */
    private extractCaptures;
    /**
     * Detect code patterns using ast-grep (advanced)
     */
    private detectPatternsWithAstGrep;
    /**
     * Detect code patterns using regex (fallback)
     */
    private detectPatternsWithRegex;
    /**
     * Identify code issues
     */
    private identifyIssues;
    /**
     * Generate refactoring suggestions
     */
    private generateRefactoringSuggestions;
    /**
     * Calculate code metrics
     */
    private calculateMetrics;
    private detectLanguage;
    private findAstGrep;
    private parseParameters;
    private calculateFunctionComplexity;
    private parseImportNames;
    private determineImportType;
    private extractExportName;
    private determineExportType;
    private calculateCyclomaticComplexity;
    private calculateCognitiveComplexity;
    private calculateMaxNesting;
    private getLineNumber;
    private calculateMaintainabilityIndex;
    private findDuplicateImports;
}
//# sourceMappingURL=ast-code-parser.d.ts.map