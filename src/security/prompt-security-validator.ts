/**
 * StrRay Framework - AI Prompt Security Validator
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

export class PromptSecurityValidator {
  private config: PromptSecurityConfig;

  constructor(config: Partial<PromptSecurityConfig> = {}) {
    this.config = {
      enabled: true,
      maxPromptLength: 10000,
      allowedPatterns: [],
      blockedPatterns: [
        /system\s+prompt\s*[:=]/gi,
        /ignore\s+previous\s+instructions/gi,
        /you\s+are\s+now\s+/gi,
        /forget\s+your\s+previous\s+/gi,
        /override\s+(your\s+)?instructions/gi,
        /jailbreak/gi,
        /dan.*mode/gi,
      ],
      sanitizeLevel: "strict",
      ...config,
    };
  }

  /**
   * Validate AI prompt for security issues
   */
  validatePrompt(prompt: string): SecurityValidationResult {
    if (!this.config.enabled) {
      return { isSafe: true, violations: [], riskLevel: "low" };
    }

    const violations: string[] = [];
    let riskLevel: SecurityValidationResult["riskLevel"] = "low";

    // Length check
    if (prompt.length > this.config.maxPromptLength) {
      violations.push(
        `Prompt too long: ${prompt.length} > ${this.config.maxPromptLength}`,
      );
      riskLevel = "medium";
    }

    // Blocked pattern check
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(prompt)) {
        violations.push(`Blocked pattern detected: ${pattern.source}`);
        riskLevel = "high";
      }
    }

    // Advanced pattern analysis
    if (this.containsSystemPromptOverride(prompt)) {
      violations.push("Potential system prompt override attempt");
      riskLevel = "critical";
    }

    if (this.containsInjectionAttempts(prompt)) {
      violations.push("Potential prompt injection detected");
      riskLevel = "high";
    }

    const isSafe = violations.length === 0;
    const sanitizedPrompt = isSafe ? undefined : this.sanitizePrompt(prompt);

    return {
      isSafe,
      violations,
      sanitizedPrompt,
      riskLevel,
    };
  }

  /**
   * Check for system prompt override attempts
   */
  private containsSystemPromptOverride(prompt: string): boolean {
    const overrideIndicators = [
      "you are now",
      "act as if",
      "pretend to be",
      "role-play as",
      "from now on you are",
      "ignore your system",
      "override your",
      "new personality",
      "different role",
    ];

    const lowerPrompt = prompt.toLowerCase();
    return overrideIndicators.some((indicator) =>
      lowerPrompt.includes(indicator),
    );
  }

  /**
   * Check for prompt injection attempts
   */
  private containsInjectionAttempts(prompt: string): boolean {
    const injectionIndicators = [
      "ignore previous",
      "forget instructions",
      "start over",
      "new conversation",
      "reset context",
      "clear memory",
      "delete history",
    ];

    const lowerPrompt = prompt.toLowerCase();
    return injectionIndicators.some((indicator) =>
      lowerPrompt.includes(indicator),
    );
  }

  /**
   * Sanitize prompt by removing dangerous patterns
   */
  private sanitizePrompt(prompt: string): string {
    let sanitized = prompt;

    // Remove blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }

    // Additional sanitization based on level
    if (
      this.config.sanitizeLevel === "strict" ||
      this.config.sanitizeLevel === "paranoid"
    ) {
      // Remove potential code execution
      sanitized = sanitized.replace(/```[\s\S]*?```/g, "[CODE_BLOCK_REMOVED]");

      // Remove potential file system access
      sanitized = sanitized.replace(/(?:\/|\\)\.\.(?:\/|\\)/g, "/");

      // Remove potential command injection
      sanitized = sanitized.replace(/[;&|`$()]/g, "");
    }

    if (this.config.sanitizeLevel === "paranoid") {
      // Extreme sanitization - only allow alphanumeric, spaces, and basic punctuation
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s.,!?-]/g, "");
    }

    return sanitized;
  }

  /**
   * Validate agent response for safety
   */
  validateResponse(response: string): SecurityValidationResult {
    // Similar validation but focused on response safety
    const violations: string[] = [];

    // Check for potentially harmful content
    if (
      response.includes("system prompt") ||
      response.includes("internal instructions")
    ) {
      violations.push("Response contains sensitive system information");
    }

    // Check for code execution attempts
    if (/eval\s*\(|Function\s*\(/.test(response)) {
      violations.push("Response contains potential code execution");
    }

    return {
      isSafe: violations.length === 0,
      violations,
      riskLevel: violations.length > 0 ? "medium" : "low",
    };
  }
}

// Export singleton instance
export const promptSecurityValidator = new PromptSecurityValidator();
