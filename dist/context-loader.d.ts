/**
 * StringRay Context Loader
 *
 * Loads Universal Development Codex v1.2.20 context for agent initialization.
 * Provides structured access to 30+ codex terms, interweaves, lenses, and anti-patterns.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
/**
 * Codex term structure
 */
export interface CodexTerm {
    number: number;
    description: string;
    category: "core" | "extended" | "architecture" | "advanced";
    zeroTolerance?: boolean;
    enforcementLevel?: "low" | "medium" | "high" | "blocking";
}
/**
 * Parsed codex context
 */
export interface CodexContext {
    version: string;
    lastUpdated: string;
    terms: Map<number, CodexTerm>;
    interweaves: string[];
    lenses: string[];
    principles: string[];
    antiPatterns: string[];
    validationCriteria: Record<string, boolean>;
    frameworkAlignment: Record<string, string>;
    errorPreventionTarget: number;
}
/**
 * Context loading result
 */
export interface ContextLoadResult {
    success: boolean;
    context?: CodexContext;
    error?: string;
    warnings: string[];
}
/**
 * StringRay Context Loader
 *
 * Loads and parses the Universal Development Codex v1.2.20 from codex.json
 */
export declare class StringRayContextLoader {
    private static instance;
    private cachedContext;
    private codexFilePaths;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): StringRayContextLoader;
    /**
     * Load codex context
     *
     * Attempts to load the Universal Development Codex from multiple possible locations.
     * Returns cached context if available and not expired.
     */
    loadCodexContext(projectRoot: string): Promise<ContextLoadResult>;
    /**
     * Parse codex content from JSON or Markdown
     *
     * Extracts all 30+ codex terms, interweaves, lenses, and principles from content.
     * Supports both JSON and Markdown formats with explicit format detection.
     */
    private parseCodexContent;
    private inferTermCategory;
    /**
     * Get specific codex term by number
     */
    getTerm(context: CodexContext, termNumber: number): CodexTerm | undefined;
    /**
     * Get all core terms (1-10)
     */
    getCoreTerms(context: CodexContext): CodexTerm[];
    /**
     * Get zero-tolerance terms that require immediate blocking
     */
    getZeroToleranceTerms(context: CodexContext): CodexTerm[];
    /**
     * Validate action against codex
     *
     * Checks if an action complies with relevant codex terms.
     * Returns validation result with violations and recommendations.
     */
    validateAgainstCodex(context: CodexContext, action: string, actionDetails: Record<string, unknown>): {
        compliant: boolean;
        violations: Array<{
            term: CodexTerm;
            reason: string;
            severity: "low" | "medium" | "high" | "blocking";
        }>;
        recommendations: string[];
    };
    /**
     * Clear cached context (useful for testing or forced reload)
     */
    clearCache(): void;
    /**
     * Check if context is loaded and valid
     */
    isContextLoaded(): boolean;
    /**
     * Get context statistics
     */
    getContextStats(): {
        loaded: boolean;
        termCount: number;
        categoryBreakdown: Record<string, number>;
        zeroToleranceCount: number;
    };
}
/**
 * Export singleton instance
 */
export declare const strRayContextLoader: StringRayContextLoader;
//# sourceMappingURL=context-loader.d.ts.map