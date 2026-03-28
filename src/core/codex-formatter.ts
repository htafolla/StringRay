/**
 * Codex Formatter — Standalone Codex-to-Prompt Converter
 *
 * Converts StringRay's Universal Development Codex terms into
 * formatted system prompt text. No OpenCode dependency, no plugin
 * API, no framework imports. Pure input/output.
 *
 * This is the decoupled replacement for the codex injection that
 * previously lived inside the OpenCode plugin (strray-codex-injection.ts).
 *
 * Usage from any host (Node.js, Python via bridge, HTTP, etc.):
 *   import { formatCodexPrompt } from './codex-formatter.js';
 *   const prompt = formatCodexPrompt({ projectRoot: '/path' });
 *   // Append to system prompt
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ============================================================================
// Types
// ============================================================================

export interface CodexTerm {
  id: string;
  title: string;
  description: string;
  severity: "blocking" | "high" | "medium";
  examples?: string[];
}

export interface CodexConfig {
  version: string;
  terms: CodexTerm[];
  categories?: Record<string, string[]>;
}

export interface FormatOptions {
  /** Project root for config resolution (default: cwd) */
  projectRoot?: string;
  /** Include only terms matching these severity levels (default: all) */
  severityFilter?: Array<"blocking" | "high" | "medium">;
  /** Include examples for each term (default: false) */
  includeExamples?: boolean;
  /** Maximum number of terms to include (default: all) */
  maxTerms?: number;
  /** Custom header text (default: auto-generated) */
  header?: string;
  /** Include config path reference in footer (default: true) */
  includeConfigPath?: boolean;
  /** Compress output by omitting descriptions for medium-severity terms */
  compressed?: boolean;
}

export interface FormatResult {
  /** The formatted prompt text */
  prompt: string;
  /** Number of terms included */
  termCount: number;
  /** Total terms available */
  totalTerms: number;
  /** Codex version */
  version: string;
  /** Config source path (or null if using built-in fallback) */
  configPath: string | null;
  /** Approximate character count */
  charCount: number;
}

// ============================================================================
// Built-in Fallback Codex (when no codex.json is found)
// ============================================================================

export const BUILTIN_CODEX: CodexConfig = {
  version: "fallback-1.0.0",
  terms: [
    {
      id: "resolve-all-errors",
      title: "Resolve All Errors",
      description: "Never leave unhandled errors, rejected promises, or uncaught exceptions in production code. Every error path must have explicit handling or propagation.",
      severity: "blocking",
      examples: ["catch (err) { logger.error('Operation failed', err); throw err; }"],
    },
    {
      id: "tests-required",
      title: "Tests Required",
      description: "Every new function, method, or module must have corresponding test coverage. Tests should validate both happy path and error cases.",
      severity: "blocking",
    },
    {
      id: "no-console-in-production",
      title: "No Console in Production",
      description: "Use structured logging instead of console.log, console.warn, or console.error. Console statements leak through to agent consoles and create noise.",
      severity: "blocking",
    },
    {
      id: "type-safety",
      title: "Type Safety",
      description: "Prefer explicit types over 'any'. Use TypeScript strict mode features. Validate external data at boundaries.",
      severity: "high",
    },
    {
      id: "input-validation",
      title: "Input Validation",
      description: "Validate all external inputs at the system boundary. Never trust client-side data, environment variables, or API responses without validation.",
      severity: "high",
    },
    {
      id: "immutable-state",
      title: "Immutable State Updates",
      description: "Prefer immutable patterns for state updates. Avoid mutating function parameters or shared state directly.",
      severity: "high",
    },
    {
      id: "error-boundaries",
      title: "Error Boundaries",
      description: "Wrap operations in try/catch with meaningful error messages. Include context about what failed and why.",
      severity: "medium",
    },
    {
      id: "dead-code-elimination",
      title: "Dead Code Elimination",
      description: "Remove unused imports, variables, functions, and commented-out code before committing.",
      severity: "medium",
    },
  ],
};

// ============================================================================
// Config Resolution
// ============================================================================

/**
 * Find codex.json using the standard priority chain.
 * Mirrors config-paths.ts resolveCodexPath() but returns first match.
 */
export function findCodexPath(projectRoot?: string): string | null {
  const root = projectRoot || process.cwd();
  const envDir = process.env.STRRAY_CONFIG_DIR;

  const candidates: string[] = [];

  if (envDir) {
    candidates.push(resolve(root, envDir, "codex.json"));
  }
  candidates.push(join(root, ".strray", "codex.json"));
  candidates.push(join(root, ".opencode", "strray", "codex.json"));
  // Additional fallback locations (for standalone usage)
  candidates.push(join(root, "codex.json"));
  candidates.push(join(root, "src", "codex.json"));
  candidates.push(join(root, "docs", "agents", "codex.json"));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Load and parse codex.json. Falls back to built-in codex if not found.
 */
export function loadCodex(projectRoot?: string): { config: CodexConfig; source: string | null } {
  const codexPath = findCodexPath(projectRoot);

  if (codexPath) {
    try {
      const raw = readFileSync(codexPath, "utf-8");
      const config = JSON.parse(raw) as CodexConfig;
      return { config, source: codexPath };
    } catch {
      // Fall through to built-in
    }
  }

  return { config: BUILTIN_CODEX, source: null };
}

// ============================================================================
// Formatting
// ============================================================================

const SEVERITY_LABELS: Record<string, string> = {
  blocking: "BLOCKING",
  high: "HIGH PRIORITY",
  medium: "MEDIUM",
};

const SEVERITY_EMOJI: Record<string, string> = {
  blocking: "🔴",
  high: "🟡",
  medium: "🟢",
};

/**
 * Format codex terms into a system-prompt-ready string.
 *
 * This is the primary export. Any host (OpenCode, Hermes, Claude Desktop,
 * custom agent) can call this to get enforcement text for their system prompt.
 */
export function formatCodexPrompt(options: FormatOptions = {}): FormatResult {
  const {
    projectRoot,
    severityFilter,
    includeExamples = false,
    maxTerms,
    header,
    includeConfigPath = true,
    compressed = false,
  } = options;

  const { config, source } = loadCodex(projectRoot);

  // Filter terms by severity
  let terms = config.terms;
  if (severityFilter && severityFilter.length > 0) {
    terms = terms.filter((t) => severityFilter.includes(t.severity));
  }

  // Sort by severity (blocking first, then high, then medium)
  const severityOrder: Record<string, number> = { blocking: 0, high: 1, medium: 2 };
  terms = [...terms].sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  // Limit term count
  if (maxTerms && terms.length > maxTerms) {
    terms = terms.slice(0, maxTerms);
  }

  // Build prompt sections
  const parts: string[] = [];

  // Header
  if (header) {
    parts.push(header);
  } else {
    parts.push(`## StringRay Universal Development Codex v${config.version}`);
    parts.push("The following rules are enforced on all code operations. Violations will be caught by quality gates.");
  }

  // Terms
  for (const term of terms) {
    const emoji = SEVERITY_EMOJI[term.severity] || "⚪";
    const label = SEVERITY_LABELS[term.severity] || term.severity.toUpperCase();
    const line = `\n**${emoji} ${term.id}** [${label}]`;

    parts.push(line);

    // Always include description for blocking/high, skip for medium when compressed
    if (term.description && !(compressed && term.severity === "medium")) {
      parts.push(`  ${term.description}`);
    }

    if (includeExamples && term.examples && term.examples.length > 0) {
      parts.push("  Examples:");
      for (const example of term.examples) {
        parts.push(`  \`${example}\``);
      }
    }
  }

  // Footer
  if (includeConfigPath && source) {
    parts.push(`\n_Config source: ${source}_`);
  }

  const prompt = parts.join("\n");

  return {
    prompt,
    termCount: terms.length,
    totalTerms: config.terms.length,
    version: config.version,
    configPath: source,
    charCount: prompt.length,
  };
}

/**
 * Get codex as a structured JSON object (for programmatic consumers).
 */
export function getCodexConfig(options: { projectRoot?: string } = {}): {
  version: string;
  terms: CodexTerm[];
  termCount: number;
  source: string | null;
} {
  const { config, source } = loadCodex(options.projectRoot);
  return {
    version: config.version,
    terms: config.terms,
    termCount: config.terms.length,
    source,
  };
}

/**
 * Get a minimal codex prompt for token-constrained environments.
 * Only includes blocking terms, no descriptions.
 */
export function formatMinimalCodexPrompt(options: FormatOptions = {}): FormatResult {
  return formatCodexPrompt({
    ...options,
    severityFilter: ["blocking"],
    compressed: true,
    includeConfigPath: false,
  });
}
