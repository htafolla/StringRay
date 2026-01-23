export interface TokenLimits {
    maxPromptTokens: number;
    warningThreshold: number;
    modelLimits: Record<string, number>;
}
export interface ContextPruningConfig {
    enabled: boolean;
    aggressivePruning: boolean;
    preserveCriticalContext: boolean;
}
export declare class TokenManager {
    private config;
    constructor(configPath?: string);
    private loadConfig;
    /**
     * Estimate token count for text (rough approximation)
     * Uses 4 characters per token as a conservative estimate
     */
    estimateTokens(text: string): number;
    /**
     * Check if prompt exceeds limits
     */
    checkLimits(prompt: string, modelName?: string): {
        withinLimit: boolean;
        currentTokens: number;
        maxTokens: number;
        needsPruning: boolean;
        warning: boolean;
    };
    /**
     * Prune context to fit within token limits
     */
    pruneContext(context: string, targetTokens?: number): string;
    private extractCriticalSections;
    private extractSection;
    private extractNonCriticalContent;
    private pruneNonCriticalContent;
    /**
     * Generate warning message for token limits
     */
    generateWarning(limitCheck: ReturnType<TokenManager['checkLimits']>): string;
    /**
     * Get current configuration
     */
    getConfig(): TokenLimits & {
        contextPruning: ContextPruningConfig;
    };
}
//# sourceMappingURL=token-manager.d.ts.map