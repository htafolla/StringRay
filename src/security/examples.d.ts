/**
 * StringRay Framework - Security Usage Examples
 *
 * Examples of how to use the security components in an AI orchestration context
 */
export declare function setupSecurityMiddleware(app: any): void;
export declare function runSecurityChecks(): Promise<import("./security-scanner").SecurityReport>;
export declare function validateUserPrompt(prompt: string): Promise<string>;
export declare class SecureAgentOrchestrator {
    private securityValidator;
    executeSecureTask(prompt: string, agentType: string): Promise<{
        response: string;
        agent: string;
        timestamp: string;
    }>;
    private executeWithAgent;
}
export declare function demonstrateSecurity(): Promise<void>;
//# sourceMappingURL=examples.d.ts.map