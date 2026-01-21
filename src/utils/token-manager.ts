import * as fs from 'fs';
import * as path from 'path';

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

export class TokenManager {
  private config: TokenLimits & { contextPruning: ContextPruningConfig };

  constructor(configPath: string = path.join(process.cwd(), '.strray', 'config.json')) {
    this.config = this.loadConfig(configPath);
  }

  private loadConfig(configPath: string): TokenLimits & { contextPruning: ContextPruningConfig } {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.token_management || {
        maxPromptTokens: 240000,
        warningThreshold: 200000,
        modelLimits: { 'opencode/grok-code': 256000 },
        contextPruning: {
          enabled: true,
          aggressivePruning: false,
          preserveCriticalContext: true
        }
      };
    } catch (error) {
      // Fallback defaults if config loading fails
      return {
        maxPromptTokens: 240000,
        warningThreshold: 200000,
        modelLimits: { 'opencode/grok-code': 256000 },
        contextPruning: {
          enabled: true,
          aggressivePruning: false,
          preserveCriticalContext: true
        }
      };
    }
  }

  /**
   * Estimate token count for text (rough approximation)
   * Uses 4 characters per token as a conservative estimate
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if prompt exceeds limits
   */
  checkLimits(prompt: string, modelName?: string): {
    withinLimit: boolean;
    currentTokens: number;
    maxTokens: number;
    needsPruning: boolean;
    warning: boolean;
  } {
    const currentTokens = this.estimateTokens(prompt);
    const maxTokens = modelName ? this.config.modelLimits[modelName] || this.config.maxPromptTokens : this.config.maxPromptTokens;

    const withinLimit = currentTokens <= maxTokens;
    const needsPruning = currentTokens > this.config.maxPromptTokens;
    const warning = currentTokens > this.config.warningThreshold;

    return {
      withinLimit,
      currentTokens,
      maxTokens,
      needsPruning,
      warning
    };
  }

  /**
   * Prune context to fit within token limits
   */
  pruneContext(context: string, targetTokens: number = this.config.maxPromptTokens): string {
    if (!this.config.contextPruning.enabled) {
      return context;
    }

    const currentTokens = this.estimateTokens(context);

    if (currentTokens <= targetTokens) {
      return context; // No pruning needed
    }

    // Preserve critical sections (AGENTS.md header, codex terms, etc.)
    const criticalSections = this.extractCriticalSections(context);
    const criticalTokens = this.estimateTokens(criticalSections.join('\n'));

    // Calculate available tokens for non-critical content
    const availableTokens = Math.max(targetTokens - criticalTokens, targetTokens * 0.3); // Reserve at least 30%
    const nonCriticalContent = this.extractNonCriticalContent(context);
    const prunedNonCritical = this.pruneNonCriticalContent(nonCriticalContent, availableTokens);

    return `${criticalSections.join('\n')}\n\n${prunedNonCritical}`;
  }

  private extractCriticalSections(context: string): string[] {
    const lines = context.split('\n');
    const criticalSections: string[] = [];

    // Always preserve codex terms and framework overview
    const codexSection = this.extractSection(lines, 'Universal Development Codex');
    const frameworkSection = this.extractSection(lines, 'StrRay Framework');

    if (codexSection) criticalSections.push(codexSection);
    if (frameworkSection) criticalSections.push(frameworkSection);

    return criticalSections;
  }

  private extractSection(lines: string[], sectionTitle: string): string | null {
    const startIndex = lines.findIndex(line => line.includes(sectionTitle));
    if (startIndex === -1) return null;

    let endIndex = lines.length;
    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine && currentLine.startsWith('#') && currentLine !== lines[startIndex]) {
        endIndex = i;
        break;
      }
    }

    return lines.slice(startIndex, endIndex).join('\n');
  }

  private extractNonCriticalContent(context: string): string {
    const criticalSections = this.extractCriticalSections(context);
    let result = context;

    for (const section of criticalSections) {
      result = result.replace(section, '');
    }

    return result.trim();
  }

  private pruneNonCriticalContent(content: string, maxTokens: number): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let currentTokens = 0;

    for (const line of lines) {
      const lineTokens = this.estimateTokens(line);

      if (currentTokens + lineTokens <= maxTokens) {
        result.push(line);
        currentTokens += lineTokens;
      } else {
        // Truncate line if too long
        if (lineTokens > maxTokens * 0.1) { // If single line is >10% of limit
          const maxChars = maxTokens * 4 * 0.1; // Convert tokens to chars
          result.push(line.substring(0, maxChars) + '...[truncated]');
        }
        break;
      }
    }

    return result.join('\n');
  }

  /**
   * Generate warning message for token limits
   */
  generateWarning(limitCheck: ReturnType<TokenManager['checkLimits']>): string {
    if (limitCheck.withinLimit && !limitCheck.warning) return '';

    const messages: string[] = [];

    if (limitCheck.warning) {
      messages.push(`⚠️  Token usage warning: ${limitCheck.currentTokens.toLocaleString()} tokens (${((limitCheck.currentTokens / limitCheck.maxTokens) * 100).toFixed(1)}% of limit)`);
    }

    if (!limitCheck.withinLimit) {
      messages.push(`🚨 Token limit exceeded: ${limitCheck.currentTokens.toLocaleString()} > ${limitCheck.maxTokens.toLocaleString()} tokens`);
      messages.push('Context will be automatically pruned to fit within limits.');
    }

    return messages.join('\n');
  }

  /**
   * Get current configuration
   */
  getConfig(): TokenLimits & { contextPruning: ContextPruningConfig } {
    return { ...this.config };
  }
}