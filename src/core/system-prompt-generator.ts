/**
 * StringRay Lean System Prompt Generator
 *
 * Generates optimized, token-efficient system prompts by implementing
 * selective injection and smart compression strategies.
 *
 * @version 1.0.0
 * @since 2026-03-03
 */

import { StringRayContextLoader, ContextLoadResult } from "./context-loader.js";
import { 
  validateContext, 
  preventSystemPromptBloat, 
  generateSafeSystemPrompt,
  ValidationResult
} from "./context-validator.js";

/**
 * Get the current framework version from package.json
 */
function getFrameworkVersion(): string {
  try {
    const fs = require("fs");
    const path = require("path");
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "1.4.6";
  } catch {
    return "1.4.6";
  }
}

/**
 * System prompt configuration options
 */
export interface SystemPromptConfig {
  showWelcomeBanner?: boolean;
  showCodexContext?: boolean;
  enableTokenOptimization?: boolean;
  maxTokenBudget?: number;
  showCriticalTermsOnly?: boolean;
  showEssentialLinks?: boolean;
}

/**
 * Essential codex terms (blocking enforcement only)
 */
const ESSENTIAL_TERMS = [
  {
    number: 1,
    title: "Progressive Prod-Ready Code",
    description: "All code must be production-ready from the first commit."
  },
  {
    number: 2, 
    title: "No Patches/Boiler/Stubs/Bridge Code",
    description: "Prohibit temporary patches and boilerplate code."
  },
  {
    number: 7,
    title: "Resolve All Errors (90% Runtime Prevention)", 
    description: "Zero-tolerance for unresolved errors.",
    zeroTolerance: true,
    enforcementLevel: "blocking" as const
  },
  {
    number: 8,
    title: "Prevent Infinite Loops",
    description: "Guarantee termination in all iterative processes.",
    zeroTolerance: true, 
    enforcementLevel: "blocking" as const
  },
  {
    number: 11,
    title: "Type Safety First",
    description: "Never use `any`, `@ts-ignore`, or `@ts-expect-error`.",
    zeroTolerance: true,
    enforcementLevel: "blocking" as const
  },
  {
    number: 5,
    title: "Surgical Changes Only",
    description: "Read first. Understand context. Fix root cause only. Minimal changes. Never refactor unless asked.",
    zeroTolerance: false,
    enforcementLevel: "critical" as const
  }
];

/**
 * Rules for code-writing agents (surgical changes)
 */
const SURGICAL_CHANGE_RULES = `
## Surgical Change Rules (Code Writers)
When writing or fixing code:
1. READ the entire file before making any changes
2. UNDERSTAND the existing code - trace logic, understand patterns
3. FIX only the root cause - never rewrite working code
4. PRESERVE existing functionality - never simplify logic
5. If a fix is complex: mark as TODO with explanation, do not skip
6. ALWAYS attempt to fix - never simplify to "make it work"
7. Tests: attempt fix first, only skip if truly blocked, return to later

## Test Fixing Rules
When fixing tests:
1. NEVER simplify tests to make them pass
2. If test is wrong: fix the code, not the test
3. If blocked: add TODO comment, return to later
4. Only skip tests with explicit TODO and reason
`;

/**
 * Lean welcome banner (minimal version)
 */
function getLeanWelcomeBanner(): string {
  const version = getFrameworkVersion();
  return `StringRay Framework v${version} - AI Orchestration Engine

🔧 Core: enforcer, architect, orchestrator, code-reviewer, refactorer, testing-lead
📚 Codex: 5 Essential Terms (99.6% Error Prevention Target)
🎯 Goal: Progressive, production-ready development workflow

`;
}

/**
 * Format critical codex terms for injection
 */
function formatEssentialTerms(): string {
  const parts = ["## Essential StringRay Rules (Blocking Enforcement)"];
  
  for (const term of ESSENTIAL_TERMS) {
    const termNum = term.number;
    const zeroTolBadge = term.zeroTolerance ? " ⚠️ ZERO TOLERANCE" : " 🟡 High Priority";
    parts.push(`\n**${termNum}. ${term.title}** ${zeroTolBadge}\n${term.description}`);
  }
  
  parts.push("\n🔗 Key: .opencode/strray/ (codex, config, agents docs)");
  
  return parts.join("");
}

/**
 * Generate optimized system prompt with bloat prevention
 */
export async function generateLeanSystemPrompt(
  config: SystemPromptConfig = {}
): Promise<string> {
  const {
    showWelcomeBanner = true,
    showCodexContext = false,  // Disabled by default for token efficiency
    enableTokenOptimization = true,
    maxTokenBudget = 2000,     // Conservative token budget
    showCriticalTermsOnly = true,
    showEssentialLinks = true
  } = config;

  let systemPrompt = "";

  // 1. Welcome banner (minimal if enabled)
  if (showWelcomeBanner) {
    const banner = getLeanWelcomeBanner();
    if (banner.length < maxTokenBudget * 0.2) { // 20% of budget
      systemPrompt += banner;
    }
  }

  // 2. Critical terms only (major token savings)
  if (showCriticalTermsOnly) {
    const essentialTerms = formatEssentialTerms();
    if ((systemPrompt.length + essentialTerms.length) < maxTokenBudget * 0.6) { // 60% of budget
      systemPrompt += essentialTerms;
    }
  }

  // 3. Full codex context only if explicitly enabled and within budget
  let finalPrompt = systemPrompt;
  if (showCodexContext && enableTokenOptimization) {
    try {
      const contextLoader = StringRayContextLoader.getInstance();
      const loadResult: ContextLoadResult = await contextLoader.loadCodexContext(process.cwd());
      
      if (loadResult.success && loadResult.context) {
        const codexSummary = generateCodexSummary(loadResult.context, maxTokenBudget);
        
        // Combine and validate total prompt
        const combinedPrompt = `${systemPrompt}\n\n${codexSummary}`;
        const validation = validateContext(combinedPrompt, {
          maxTotalPromptLength: maxTokenBudget * 2,
          enableCompression: true,
          preventDuplicateContent: true
        });

        if (validation.isValid) {
          finalPrompt = combinedPrompt;
        } else {
          // Use optimized version if validation fails
          finalPrompt = validation.optimizedContent || combinedPrompt;
        }
      }
    } catch (error) {
      // Silent fallback - prompt generation should not break
      finalPrompt = systemPrompt;
    }
  } else {
    finalPrompt = systemPrompt;
  }

  // 4. Apply bloat prevention to final prompt
  let safePrompt = preventSystemPromptBloat(finalPrompt);

  // 5. Essential links if space permits
  if (showEssentialLinks && safePrompt.length < 1500) {
    safePrompt += "\n📖 Documentation: .opencode/strray/ | AGENTS.md\n";
  }

  // Final validation and fallback
  if (safePrompt.length < 100) {
    return generateMinimalFallbackPrompt();
  }

  return safePrompt;
}

/**
 * Generate compressed codex summary
 */
function generateCodexSummary(context: any, maxTokens: number): string {
  const parts = ["\n## StringRay Codex Summary"];
  
  // Add just the most essential metadata
  parts.push(`\nVersion: ${context.version}`);
  parts.push(`Terms: ${context.terms?.size || 0} total`);
  parts.push(`Last Updated: ${context.lastUpdated}`);
  
  // Only add validation criteria if space permits
  if (context.validationCriteria && parts.join("").length < maxTokens * 0.8) {
    parts.push(`\n📋 Validation: ${Object.entries(context.validationCriteria).filter(([_,v]) => v).length}/${Object.keys(context.validationCriteria).length} criteria met`);
  }
  
  return parts.join("");
}

/**
 * Absolute minimal fallback prompt
 */
function generateMinimalFallbackPrompt(): string {
  return `StringRay Framework v${getFrameworkVersion()}
Essential: Production-ready code, zero-tolerance errors, type safety
📖: .opencode/strray/ | AGENTS.md
`;
}

/**
 * Smart context injection based on available tokens
 */
export function injectContextIntelligently(
  basePrompt: string,
  additionalContext: string,
  maxTokens: number = 4000
): string {
  const availableTokens = maxTokens - basePrompt.length;
  
  if (availableTokens <= 0) {
    return basePrompt; // No room for additional context
  }
  
  // Compress additional context if needed
  if (additionalContext.length > availableTokens) {
    additionalContext = compressContext(additionalContext, availableTokens * 0.8);
  }
  
  return basePrompt + "\n\n" + additionalContext;
}

/**
 * Context compression utilities
 */
function compressContext(context: string, targetLength: number): string {
  if (context.length <= targetLength) return context;
  
  // Simple compression: remove whitespace, keep first lines
  const lines = context.split('\n').filter(line => line.trim());
  const compressed: string[] = [];
  let currentLength = 0;
  
  for (const line of lines) {
    if (currentLength + line.length <= targetLength) {
      compressed.push(line);
      currentLength += line.length;
    } else {
      break;
    }
  }
  
  return compressed.join('\n') + '\n... (truncated)';
}

/**
 * System prompt validation
 */
export function validateSystemPrompt(prompt: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const maxLength = 8000; // Safety limit
  
  if (prompt.length > maxLength) {
    warnings.push(`Prompt exceeds maximum length: ${prompt.length} > ${maxLength}`);
  }
  
  if (prompt.length < 200) {
    warnings.push('Prompt may be too short for effective operation');
  }
  
  // Check for problematic patterns
  if (prompt.includes('══════════')) {
    warnings.push('ASCII art detected - consuming excessive tokens');
  }
  
  if (prompt.includes('v1.6.22') && prompt.includes('v1.2.25')) {
    warnings.push('Duplicate context blocks detected');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}