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
/**
 * Session cache for codex context
 */
const codexCache = new Map();
/**
 * Codex file locations to search
 */
const CODEX_FILE_LOCATIONS = [".strray/agents_template.md", "AGENTS.md"];
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
    }
    return null;
}
/**
 * Extract codex metadata from content
 */
function extractCodexMetadata(content) {
    const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : "1.2.20";
    const termMatches = content.match(/####\s*\d+\.\s/g);
    const termCount = termMatches ? termMatches.length : 0;
    return { version: version, termCount };
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
        const fullPath = path.join(process.cwd(), relativePath);
        const content = readFileContent(fullPath);
        if (content) {
            const entry = createCodexContextEntry(fullPath, content);
            codexContexts.push(entry);
            `✅ StrRay Codex loaded: ${fullPath} (${entry.metadata.termCount} terms)`,
                `📁 Sources: ${stats.fileCount} file(s)`,
                `🎯 Error Prevention Target: 90% runtime error prevention`,
                "═════════════════════════════════════════════════════════════",
                "",
            ;
            ;
        }
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
                    const stats = getCodexStats(sessionId);
                    if (stats.loaded) {
                    }
                },
                "tool.execute.after": (input, output, sessionId) => {
                    if (!["read", "write", "edit", "multiedit", "batch"].includes(input.tool)) {
                        return output;
                    }
                    const codexContexts = loadCodexContext(sessionId);
                    if (codexContexts.length === 0) {
                        return output;
                    }
                    const formattedCodex = formatCodexContext(codexContexts);
                    const injectedOutput = {
                        ...output,
                        output: `${formattedCodex}\n${output.output || ""}`,
                    };
                    return injectedOutput;
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
}
//# sourceMappingURL=codex-injector.js.map