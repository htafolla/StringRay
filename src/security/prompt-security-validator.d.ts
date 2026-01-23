/**
 * StringRay Framework - AI Prompt Security Validator
 *
 * Specialized security validation for AI agent prompts and responses
 * Prevents prompt injection, system prompt override, and malicious inputs
 */
export interface PromptSecurityConfig {
    enabled: boolean;
    maxPromptLength: number;
    allowedPatterns: RegExp[];
    blockedPatterns: RegExp[];
    sanitizeLevel: "basic" | "strict" | "paranoid";
}
export interface SecurityValidationResult {
    isSafe: boolean;
    violations: string[];
    sanitizedPrompt?: string | undefined;
    riskLevel: "low" | "medium" | "high" | "critical";
}
export declare class PromptSecurityValidator {
    private config;
    constructor(config?: Partial<PromptSecurityConfig>);
    /**
     * Validate AI prompt for security issues
     */
    validatePrompt(prompt: string): SecurityValidationResult;
    /**
     * Check for system prompt override attempts
     */
    private containsSystemPromptOverride;
    /**
     * Check for prompt injection attempts
     */
    private containsInjectionAttempts;
    /**
     * Sanitize prompt by removing dangerous patterns
     */
    private sanitizePrompt;
    /**
     * Validate agent response for safety
     */
    validateResponse(response: string): SecurityValidationResult;
}
export declare const promptSecurityValidator: PromptSecurityValidator;
//# sourceMappingURL=prompt-security-validator.d.ts.map