/**
 * StringRay Codex Context Injector Hook
 *
 * Injects Universal Development Codex v1.2.20 context into agent operations.
 * Follows production-tested pattern from rules-injector.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */

import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "./framework-logger.js";
// Dynamic imports for cross-environment compatibility
let extractCodexMetadata: any;
let StringRayContextLoader: any;
let importsInitialized = false;

async function initializeImports() {
  if (importsInitialized) return;

  try {
    // Try import with .js extension first (for Node.js/test environment)
    ({ extractCodexMetadata } = await import("./utils/codex-parser.js"));
    ({ StringRayContextLoader } = await import("./context-loader.js"));
  } catch (error) {
    // Fallback to import without .js extension (for oh-my-opencode plugin environment)
    ({ extractCodexMetadata } = await import("./utils/codex-parser"));
    ({ StringRayContextLoader } = await import("./context-loader"));
  }

  importsInitialized = true;
}

/**
 * Codex context entry with metadata
 */
interface CodexContextEntry {
  id: string;
  source: string;
  content: string;
  priority: "critical" | "high" | "normal" | "low";
  metadata: {
    version: string;
    termCount: number;
    loadedAt: string;
  };
}

/**
 * Session cache for codex context
 */
const codexCache = new Map<string, CodexContextEntry[]>();

/**
 * Codex file locations to search
 */
const CODEX_FILE_LOCATIONS = [
  ".strray/codex.json",
  "codex.json",
  "src/codex.json",
  "docs/agents/codex.json",
];

/**
 * Read file content safely
 */
function readFileContent(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    console.error(`StringRay Codex Hook Error:`, error);
  }
  return null;
}

/**
 * Create codex context entry
 */
async function createCodexContextEntry(
  filePath: string,
  content: string,
): Promise<CodexContextEntry> {
  await initializeImports();
  const metadata = extractCodexMetadata(content);

  return {
    id: `strray-codex-${path.basename(filePath)}`,
    source: filePath,
    content,
    priority: "critical",
    metadata: {
      version: metadata.version,
      termCount: metadata.termCount,
      loadedAt: new Date().toISOString(),
    },
  };
}

/**
 * Load codex context for current session
 */
async function loadCodexContext(
  sessionId: string,
): Promise<CodexContextEntry[]> {
  if (codexCache.has(sessionId)) {
    return codexCache.get(sessionId)!;
  }

  const codexContexts: CodexContextEntry[] = [];

  for (const relativePath of CODEX_FILE_LOCATIONS) {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      const content = readFileContent(fullPath);

      if (content) {
        const entry = await createCodexContextEntry(fullPath, content);
        codexContexts.push(entry);
      }
    } catch (error) {
      console.error(`StringRay Codex Hook Error:`, error);
    }
  }

  codexCache.set(sessionId, codexContexts);
  return codexContexts;
}

/**
 * Format codex context for display
 */
function formatCodexContext(
  contexts: CodexContextEntry[],
  sessionId: string,
): string {
  const parts = [
    "═════════════════════════════════════════════════════════════",
    "✨ StringRay Codex Context Loaded Successfully",
    "═════════════════════════════════════════════════════════════",
    "",
  ];

  for (const context of contexts) {
    parts.push(
      `✅ StringRay Codex loaded: ${context.source} (${context.metadata.termCount} terms)`,
    );
  }

  const stats = getCodexStats(sessionId);
  parts.push(
    `📁 Sources: ${stats.fileCount} file(s)`,
    `🎯 Error Prevention Target: 90% runtime error prevention`,
    "═════════════════════════════════════════════════════════════",
    "",
  );

  return parts.join("\n");
}

/**
 * Create strray-codex-injector hook
 *
 * This hook injects codex context into tool outputs and displays
 * a welcome message on agent startup, following the production-tested
 * pattern from oh-my-opencode's rules-injector.
 */
export function createStringRayCodexInjectorHook() {
  return {
    name: "strray-codex-injector" as const,
    hooks: {
      "agent.start": async (sessionId: string) => {
        try {
          await frameworkLogger.log(
            "codex-injector",
            "agent.start hook triggered",
            "info",
            { sessionId },
          );
          // Load codex context to ensure it's available for the session
          await loadCodexContext(sessionId);
          const stats = getCodexStats(sessionId);

          if (stats.loaded) {
            console.log(
              `✅ StringRay Codex loaded: ${stats.totalTerms} terms, ${stats.fileCount} sources`,
            );
            await frameworkLogger.log(
              "codex-injector",
              "codex context loaded successfully",
              "success",
              stats,
            );
          } else {
            console.log(
              "⚠️  No codex files found. Checked: .strray/codex.json, codex.json, src/codex.json, docs/agents/codex.json",
            );
            await frameworkLogger.log(
              "codex-injector",
              "no codex files found",
              "error",
            );
          }
        } catch (error) {
          await frameworkLogger.log(
            "codex-injector",
            "agent.start hook failed",
            "error",
            error,
          );
          console.error(`❌ StringRay: Error in agent.start hook:`, error);
          throw error;
        }
      },
      "tool.execute.before": async (
        input: { tool: string; args?: Record<string, unknown> },
        sessionId: string,
      ) => {
        try {
          await frameworkLogger.log(
            "codex-injector",
            "tool.execute.before hook triggered",
            "info",
            { tool: input.tool, sessionId },
          );

          // Log ALL tool usage for framework transparency
          await frameworkLogger.log(
            "framework-activity",
            `tool called: ${input.tool}`,
            "info",
            {
              tool: input.tool,
              args: input.args,
              sessionId,
            },
          );

          // Skip codex enforcement during testing
          if (
            process.env.NODE_ENV === "test" ||
            process.env.STRRAY_TEST_MODE === "true"
          ) {
            await frameworkLogger.log(
              "codex-injector",
              "skipping enforcement in test mode",
              "info",
            );
            return;
          }

          // Only enforce on critical tools that could violate codex terms
          const criticalTools = ["write", "edit", "multiedit", "batch"];
          if (!criticalTools.includes(input.tool)) {
            await frameworkLogger.log(
              "codex-injector",
              "non-critical tool allowed",
              "info",
              { tool: input.tool },
            );
            return; // Allow non-critical tools
          }

          await frameworkLogger.log(
            "codex-injector",
            "enforcing codex on critical tool",
            "info",
            { tool: input.tool },
          );

          // Load codex context for validation
          const codexContexts = await loadCodexContext(sessionId);
          if (codexContexts.length === 0) {
            console.log(
              "⚠️  No codex loaded - allowing action but enforcement disabled",
            );
            await frameworkLogger.log(
              "codex-injector",
              "no codex context available",
              "error",
              { sessionId },
            );
            return;
          }

          await frameworkLogger.log(
            "codex-injector",
            "codex context loaded for validation",
            "success",
            { contextCount: codexContexts.length },
          );

          // Use the initialized context loader
          await initializeImports();
          const contextLoader = new StringRayContextLoader();
          const loadResult = await contextLoader.loadCodexContext(sessionId);

          if (!loadResult.success || !loadResult.context) {
            console.log("⚠️  No codex context available - allowing action");
            return;
          }

          // Validate action against codex
          const actionDescription = `${input.tool} ${JSON.stringify(input.args || {})}`;
          const validation = contextLoader.validateAgainstCodex(
            loadResult.context,
            actionDescription,
            {
              strictMode: true,
              blockOnViolations: true,
            },
          );

          if (!validation.compliant) {
            // Check for blocking violations
            const blockingViolations = validation.violations.filter(
              (v: any) => v.severity === "blocking",
            );

            if (blockingViolations.length > 0) {
              const errorMsg = `🚫 BLOCKED: Codex violation detected\n${blockingViolations.map((v: any) => `• ${v.reason}`).join("\n")}`;
              console.error(errorMsg);
              frameworkLogger.log(
                "codex-injector",
                "blocking codex violation detected",
                "error",
                {
                  violationCount: blockingViolations.length,
                  tool: input.tool,
                },
              );
              throw new Error(
                `Codex enforcement blocked action: ${blockingViolations[0]?.reason || "Unknown violation"}`,
              );
            }

            // Log non-blocking violations but allow action
            console.log(`⚠️  Codex warnings detected:`);
            validation.violations.forEach((v: any) => {
              console.log(`   • ${v.reason}`);
            });
            console.log(
              `💡 Recommendations: ${validation.recommendations.join(", ")}`,
            );
            frameworkLogger.log(
              "codex-injector",
              "non-blocking codex warnings",
              "info",
              {
                warningCount: validation.violations.length,
                tool: input.tool,
              },
            );
          } else {
            frameworkLogger.log(
              "codex-injector",
              "codex validation passed",
              "success",
              { tool: input.tool },
            );
          }
        } catch (error) {
          frameworkLogger.log(
            "codex-injector",
            "tool.execute.before hook error",
            "error",
            {
              error: error instanceof Error ? error.message : String(error),
              tool: input.tool,
            },
          );
          console.error(`❌ StringRay: Error in tool.execute.before hook:`, error);
          // For blocking violations, re-throw to prevent action
          if (
            error instanceof Error &&
            error.message.includes("Codex enforcement blocked action")
          ) {
            throw error;
          }
          // For other errors, log but allow action to prevent breaking workflow
        }
      },
      "tool.execute.after": async (
        input: { tool: string; args?: Record<string, unknown> },
        output: { output?: string; [key: string]: unknown },
        sessionId: string,
      ) => {
        try {
          frameworkLogger.log(
            "codex-injector",
            "tool.execute.after hook triggered",
            "info",
            { tool: input.tool, sessionId },
          );

          // Skip codex enforcement during testing
          if (
            process.env.NODE_ENV === "test" ||
            process.env.STRRAY_TEST_MODE === "true"
          ) {
            frameworkLogger.log(
              "codex-injector",
              "skipping injection in test mode",
              "info",
            );
            return output;
          }
          if (
            !["read", "write", "edit", "multiedit", "batch"].includes(
              input.tool,
            )
          ) {
            frameworkLogger.log(
              "codex-injector",
              "non-critical tool - no injection",
              "info",
              { tool: input.tool },
            );
            return output;
          }

          console.log(
            `🔧 StringRay: Tool execution hook triggered for ${input.tool}`,
          );
          const codexContexts = await loadCodexContext(sessionId);
          console.log(
            `📚 StringRay: Loaded ${codexContexts.length} codex contexts`,
          );

          frameworkLogger.log(
            "codex-injector",
            "codex contexts loaded for injection",
            "success",
            {
              contextCount: codexContexts.length,
              tool: input.tool,
            },
          );

          if (codexContexts.length === 0) {
            return output;
          }

          const formattedCodex = formatCodexContext(codexContexts, sessionId);

          const injectedOutput = {
            ...output,
            output: `${formattedCodex}\n${output.output || ""}`,
          };

          frameworkLogger.log(
            "codex-injector",
            "codex context injected into output",
            "success",
            {
              tool: input.tool,
              outputLength: injectedOutput.output?.length,
            },
          );

          return injectedOutput;
        } catch (error) {
          frameworkLogger.log(
            "codex-injector",
            "tool.execute.after hook error",
            "error",
            {
              error: error instanceof Error ? error.message : String(error),
              tool: input.tool,
            },
          );
          console.error(`❌ StringRay: Error in tool.execute.after hook:`, error);
          // Return original output on error to not break the session
          return output;
        }
      },
    },
  };
}

/**
 * Get codex statistics for debugging
 */
export function getCodexStats(sessionId: string): {
  loaded: boolean;
  fileCount: number;
  totalTerms: number;
  version: string;
} {
  const contexts = codexCache.get(sessionId);

  if (!contexts || contexts.length === 0) {
    return {
      loaded: false,
      fileCount: 0,
      totalTerms: 0,
      version: "unknown",
    };
  }

  const totalTerms = contexts.reduce(
    (sum, ctx) => sum + ctx.metadata.termCount,
    0,
  );

  return {
    loaded: true,
    fileCount: contexts.length,
    totalTerms,
    version: contexts[0]!.metadata.version,
  };
}

/**
 * Clear codex cache (useful for testing or forced reload)
 */
export function clearCodexCache(sessionId?: string): void {
  if (sessionId) {
    codexCache.delete(sessionId);
  } else {
    codexCache.clear();
  }
}

/**
 * CodexInjector class for plugin compatibility
 */
export class CodexInjector {
  injectCodexRules(context: any, options: any) {
    // Implementation for plugin compatibility
    return context;
  }

  getCodexStats() {
    // Return aggregated stats for plugin
    const allContexts: CodexContextEntry[] = [];
    for (const contexts of Array.from(codexCache.values())) {
      allContexts.push(...contexts);
    }

    const totalTerms = allContexts.reduce(
      (sum, ctx) => sum + ctx.metadata.termCount,
      0,
    );

    return {
      loaded: allContexts.length > 0,
      fileCount: allContexts.length,
      totalTerms,
      version:
        allContexts.length > 0 ? allContexts[0]!.metadata.version : "unknown",
    };
  }

  /**
   * Permissive comment validation - recognizes that comments are beneficial
   * Only flags truly problematic patterns, provides guidance not requirements
   */
  validateCommentsPermissively(content: string): {
    guidance: string[];
    concerns: string[];
  } {
    const guidance: string[] = [];
    const concerns: string[] = [];

    const lines = content.split("\n");
    let commentLines = 0;
    let codeLines = 0;
    let todoCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Count code vs comments
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("*/")
      ) {
        commentLines++;
      } else {
        codeLines++;
      }

      // Check for problematic patterns
      if (
        trimmed.includes("TODO") ||
        trimmed.includes("FIXME") ||
        trimmed.includes("XXX")
      ) {
        todoCount++;
      }
    }

    // Provide helpful guidance (not requirements)
    const commentRatio = commentLines / (commentLines + codeLines);

    if (commentLines === 0 && codeLines > 30) {
      guidance.push(
        "💡 Consider adding comments for complex logic - they improve maintainability",
      );
    }

    if (commentRatio > 0.4) {
      guidance.push(
        "💡 High comment ratio detected - consider if code can be made more self-explanatory",
      );
    }

    if (todoCount > 3) {
      concerns.push(
        "⚠️ Multiple unresolved tasks detected - consider addressing or documenting timelines",
      );
    }

    // Recognize good commenting practices
    if (commentRatio > 0.1 && commentRatio < 0.3) {
      guidance.push("✅ Good balance of code and comments detected");
    }

    return { guidance, concerns };
  }
}
