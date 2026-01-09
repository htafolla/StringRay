/**
 * StrRay Codex Context Injector Hook
 *
 * Injects Universal Development Codex v1.2.20 context into agent operations.
 * Follows production-tested pattern from rules-injector.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
import * as fs from "fs";
import * as path from "path";
import { extractCodexMetadata } from "./utils/codex-parser.js";
/**
 * Session cache for codex context
 */
const codexCache = new Map();
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
function readFileContent(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, "utf-8");
        }
    }
    catch (error) {
        console.error(`StrRay Codex Hook Error:`, error);
    }
    return null;
}
/**
 * Create codex context entry
 */
function createCodexContextEntry(filePath, content) {
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
function loadCodexContext(sessionId) {
    if (codexCache.has(sessionId)) {
        return codexCache.get(sessionId);
    }
    const codexContexts = [];
    for (const relativePath of CODEX_FILE_LOCATIONS) {
        try {
            const fullPath = path.join(process.cwd(), relativePath);
            const content = readFileContent(fullPath);
            if (content) {
                const entry = createCodexContextEntry(fullPath, content);
                codexContexts.push(entry);
            }
        }
        catch (error) {
            console.error(`StrRay Codex Hook Error:`, error);
        }
    }
    codexCache.set(sessionId, codexContexts);
    return codexContexts;
}
/**
 * Format codex context for display
 */
function formatCodexContext(contexts, sessionId) {
    const parts = [
        "═════════════════════════════════════════════════════════════",
        "✨ StrRay Codex Context Loaded Successfully",
        "═════════════════════════════════════════════════════════════",
        "",
    ];
    for (const context of contexts) {
        parts.push(`✅ StrRay Codex loaded: ${context.source} (${context.metadata.termCount} terms)`);
    }
    const stats = getCodexStats(sessionId);
    parts.push(`📁 Sources: ${stats.fileCount} file(s)`, `🎯 Error Prevention Target: 90% runtime error prevention`, "═════════════════════════════════════════════════════════════", "");
    return parts.join("\n");
}
/**
 * Create strray-codex-injector hook
 *
 * This hook injects codex context into tool outputs and displays
 * a welcome message on agent startup, following the production-tested
 * pattern from oh-my-opencode's rules-injector.
 */
export function createStrRayCodexInjectorHook() {
    return {
        name: "strray-codex-injector",
        hooks: {
            "agent.start": (sessionId) => {
                try {
                    // Load codex context to ensure it's available for the session
                    loadCodexContext(sessionId);
                    const stats = getCodexStats(sessionId);
                    if (stats.loaded) {
                        console.log(`✅ StrRay Codex loaded: ${stats.totalTerms} terms, ${stats.fileCount} sources`);
                    }
                    else {
                        console.log("⚠️  No codex files found. Checked: .strray/codex.json, codex.json, src/codex.json, docs/agents/codex.json");
                    }
                }
                catch (error) {
                    console.error(`❌ StrRay: Error in agent.start hook:`, error);
                    throw error;
                }
            },
            "tool.execute.before": async (input, sessionId) => {
                try {
                    // Skip codex enforcement during testing
                    if (process.env.NODE_ENV === "test" ||
                        process.env.STRRAY_TEST_MODE === "true") {
                        return;
                    }
                    // Only enforce on critical tools that could violate codex terms
                    const criticalTools = ["write", "edit", "multiedit", "batch"];
                    if (!criticalTools.includes(input.tool)) {
                        return; // Allow non-critical tools
                    }
                    // Load codex context for validation
                    const codexContexts = loadCodexContext(sessionId);
                    if (codexContexts.length === 0) {
                        console.log("⚠️  No codex loaded - allowing action but enforcement disabled");
                        return;
                    }
                    // Use the exported context loader instance
                    const { strRayContextLoader } = await import("./context-loader");
                    const loadResult = await strRayContextLoader.loadCodexContext(sessionId);
                    if (!loadResult.success || !loadResult.context) {
                        console.log("⚠️  No codex context available - allowing action");
                        return;
                    }
                    // Validate action against codex
                    const actionDescription = `${input.tool} ${JSON.stringify(input.args || {})}`;
                    const validation = strRayContextLoader.validateAgainstCodex(loadResult.context, actionDescription, {
                        strictMode: true,
                        blockOnViolations: true,
                    });
                    if (!validation.compliant) {
                        // Check for blocking violations
                        const blockingViolations = validation.violations.filter((v) => v.severity === "blocking");
                        if (blockingViolations.length > 0) {
                            const errorMsg = `🚫 BLOCKED: Codex violation detected\n${blockingViolations.map((v) => `• ${v.reason}`).join("\n")}`;
                            console.error(errorMsg);
                            throw new Error(`Codex enforcement blocked action: ${blockingViolations[0]?.reason || "Unknown violation"}`);
                        }
                        // Log non-blocking violations but allow action
                        console.log(`⚠️  Codex warnings detected:`);
                        validation.violations.forEach((v) => {
                            console.log(`   • ${v.reason}`);
                        });
                        console.log(`💡 Recommendations: ${validation.recommendations.join(", ")}`);
                    }
                }
                catch (error) {
                    console.error(`❌ StrRay: Error in tool.execute.before hook:`, error);
                    // For blocking violations, re-throw to prevent action
                    if (error instanceof Error &&
                        error.message.includes("Codex enforcement blocked action")) {
                        throw error;
                    }
                    // For other errors, log but allow action to prevent breaking workflow
                }
            },
            "tool.execute.after": (input, output, sessionId) => {
                try {
                    // Skip codex enforcement during testing
                    if (process.env.NODE_ENV === "test" ||
                        process.env.STRRAY_TEST_MODE === "true") {
                        return output;
                    }
                    if (!["read", "write", "edit", "multiedit", "batch"].includes(input.tool)) {
                        return output;
                    }
                    console.log(`🔧 StrRay: Tool execution hook triggered for ${input.tool}`);
                    const codexContexts = loadCodexContext(sessionId);
                    console.log(`📚 StrRay: Loaded ${codexContexts.length} codex contexts`);
                    if (codexContexts.length === 0) {
                        return output;
                    }
                    const formattedCodex = formatCodexContext(codexContexts, sessionId);
                    const injectedOutput = {
                        ...output,
                        output: `${formattedCodex}\n${output.output || ""}`,
                    };
                    return injectedOutput;
                }
                catch (error) {
                    console.error(`❌ StrRay: Error in tool.execute.after hook:`, error);
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
export function getCodexStats(sessionId) {
    const contexts = codexCache.get(sessionId);
    if (!contexts || contexts.length === 0) {
        return {
            loaded: false,
            fileCount: 0,
            totalTerms: 0,
            version: "unknown",
        };
    }
    const totalTerms = contexts.reduce((sum, ctx) => sum + ctx.metadata.termCount, 0);
    return {
        loaded: true,
        fileCount: contexts.length,
        totalTerms,
        version: contexts[0].metadata.version,
    };
}
/**
 * Clear codex cache (useful for testing or forced reload)
 */
export function clearCodexCache(sessionId) {
    if (sessionId) {
        codexCache.delete(sessionId);
    }
    else {
        codexCache.clear();
    }
}
/**
 * CodexInjector class for plugin compatibility
 */
export class CodexInjector {
    injectCodexRules(context, options) {
        // Implementation for plugin compatibility
        return context;
    }
    getCodexStats() {
        // Return aggregated stats for plugin
        const allContexts = [];
        for (const contexts of Array.from(codexCache.values())) {
            allContexts.push(...contexts);
        }
        const totalTerms = allContexts.reduce((sum, ctx) => sum + ctx.metadata.termCount, 0);
        return {
            loaded: allContexts.length > 0,
            fileCount: allContexts.length,
            totalTerms,
            version: allContexts.length > 0 ? allContexts[0].metadata.version : "unknown",
        };
    }
    /**
     * Permissive comment validation - recognizes that comments are beneficial
     * Only flags truly problematic patterns, provides guidance not requirements
     */
    validateCommentsPermissively(content) {
        const guidance = [];
        const concerns = [];
        const lines = content.split("\n");
        let commentLines = 0;
        let codeLines = 0;
        let todoCount = 0;
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip empty lines
            if (!trimmed)
                continue;
            // Count code vs comments
            if (trimmed.startsWith("//") ||
                trimmed.startsWith("/*") ||
                trimmed.startsWith("*") ||
                trimmed.startsWith("*/")) {
                commentLines++;
            }
            else {
                codeLines++;
            }
            // Check for problematic patterns
            if (trimmed.includes("TODO") ||
                trimmed.includes("FIXME") ||
                trimmed.includes("XXX")) {
                todoCount++;
            }
        }
        // Provide helpful guidance (not requirements)
        const commentRatio = commentLines / (commentLines + codeLines);
        if (commentLines === 0 && codeLines > 30) {
            guidance.push("💡 Consider adding comments for complex logic - they improve maintainability");
        }
        if (commentRatio > 0.4) {
            guidance.push("💡 High comment ratio detected - consider if code can be made more self-explanatory");
        }
        if (todoCount > 3) {
            concerns.push("⚠️ Multiple unresolved tasks detected - consider addressing or documenting timelines");
        }
        // Recognize good commenting practices
        if (commentRatio > 0.1 && commentRatio < 0.3) {
            guidance.push("✅ Good balance of code and comments detected");
        }
        return { guidance, concerns };
    }
}
//# sourceMappingURL=codex-injector.js.map