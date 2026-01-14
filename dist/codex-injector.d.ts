/**
 * StringRay Codex Context Injector Hook
 *
 * Injects Universal Development Codex v1.2.20 context into agent operations.
 * Follows production-tested pattern from rules-injector.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
/**
 * Create strray-codex-injector hook
 *
 * This hook injects codex context into tool outputs and displays
 * a welcome message on agent startup, following the production-tested
 * pattern from oh-my-opencode's rules-injector.
 */
export declare function createStringRayCodexInjectorHook(): {
    name: "strray-codex-injector";
    hooks: {
        "agent.start": (sessionId: string) => Promise<void>;
        "tool.execute.before": (input: {
            tool: string;
            args?: Record<string, unknown>;
        }, sessionId: string) => Promise<void>;
        "tool.execute.after": (input: {
            tool: string;
            args?: Record<string, unknown>;
        }, output: {
            output?: string;
            [key: string]: unknown;
        }, sessionId: string) => Promise<{
            [key: string]: unknown;
            output?: string;
        } | {
            output: string;
        }>;
    };
};
/**
 * Get codex statistics for debugging
 */
export declare function getCodexStats(sessionId: string): {
    loaded: boolean;
    fileCount: number;
    totalTerms: number;
    version: string;
};
/**
 * Clear codex cache (useful for testing or forced reload)
 */
export declare function clearCodexCache(sessionId?: string): void;
/**
 * CodexInjector class for plugin compatibility
 */
export declare class CodexInjector {
    injectCodexRules(context: any, options: any): any;
    getCodexStats(): {
        loaded: boolean;
        fileCount: number;
        totalTerms: number;
        version: string;
    };
    /**
     * Permissive comment validation - recognizes that comments are beneficial
     * Only flags truly problematic patterns, provides guidance not requirements
     */
    validateCommentsPermissively(content: string): {
        guidance: string[];
        concerns: string[];
    };
}
//# sourceMappingURL=codex-injector.d.ts.map