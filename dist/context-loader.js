/**
 * StringRay Context Loader
 *
 * Loads Universal Development Codex v1.2.25 context for agent initialization.
 * Provides structured access to 30+ codex terms, interweaves, lenses, and anti-patterns.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
import * as fs from "fs";
import * as path from "path";
import { parseCodexContent, detectContentFormat, } from "./utils/codex-parser.js";
/**
 * Type guard for regex match results
 */
function isValidMatch(match, index) {
    return match !== null && match[index] !== undefined;
}
/**
 * StringRay Context Loader
 *
 * Loads and parses the Universal Development Codex v1.2.25 from codex.json
 */
export class StringRayContextLoader {
    static instance;
    cachedContext = null;
    codexFilePaths = [];
    constructor() {
        this.codexFilePaths = [".strray/codex.json", "codex.json"];
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!StringRayContextLoader.instance) {
            StringRayContextLoader.instance = new StringRayContextLoader();
        }
        return StringRayContextLoader.instance;
    }
    /**
     * Load codex context
     *
     * Attempts to load the Universal Development Codex from multiple possible locations.
     * Returns cached context if available and not expired.
     */
    async loadCodexContext(projectRoot) {
        const warnings = [];
        // Validate project root
        if (!projectRoot || projectRoot.trim() === "") {
            return {
                success: false,
                error: "Invalid project root path: path cannot be empty",
                warnings,
            };
        }
        if (this.cachedContext) {
            return {
                success: true,
                context: this.cachedContext,
                warnings,
            };
        }
        for (const relativePath of this.codexFilePaths) {
            const fullPath = path.join(projectRoot, relativePath);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    const context = this.parseCodexContent(content, fullPath);
                    this.cachedContext = context;
                    return {
                        success: true,
                        context,
                        warnings,
                    };
                }
                catch (error) {
                    const msg = `Failed to parse ${fullPath}: ${error instanceof Error ? error.message : String(error)}`;
                    warnings.push(msg);
                }
            }
        }
        return {
            success: false,
            error: "No valid codex file found. Checked: " + this.codexFilePaths.join(", "),
            warnings,
        };
    }
    /**
     * Parse codex content from JSON or Markdown
     *
     * Extracts all 30+ codex terms, interweaves, lenses, and principles from content.
     * Supports both JSON and Markdown formats with explicit format detection.
     */
    parseCodexContent(content, sourcePath) {
        // Validate inputs before format detection
        if (!content || content.trim() === "") {
            throw new Error("Invalid content provided");
        }
        if (!sourcePath || sourcePath.trim() === "") {
            throw new Error("Invalid source path provided");
        }
        // Detect format before parsing
        const formatResult = detectContentFormat(content);
        if (formatResult.format === "unknown") {
            throw new Error(`Unable to detect content format for ${sourcePath}. Content appears to be neither valid JSON nor Markdown.`);
        }
        // Log format detection for debugging
        console.log(`StringRay: Detected ${formatResult.format} format for ${sourcePath} (confidence: ${formatResult.confidence})`);
        const result = parseCodexContent(content, sourcePath);
        if (!result.success) {
            throw new Error(result.error || "Failed to parse codex content");
        }
        if (!result.context) {
            throw new Error("Parsing succeeded but no context was returned");
        }
        return result.context;
    }
    inferTermCategory(termNumber, termName) {
        if (termNumber <= 10) {
            return "core";
        }
        else if (termNumber <= 20) {
            return "extended";
        }
        else if (termNumber <= 30) {
            return "architecture";
        }
        else {
            return "advanced";
        }
    }
    /**
     * Get specific codex term by number
     */
    getTerm(context, termNumber) {
        return context.terms.get(termNumber);
    }
    /**
     * Get all core terms (1-10)
     */
    getCoreTerms(context) {
        return Array.from(context.terms.values())
            .filter((term) => term.category === "core")
            .sort((a, b) => a.number - b.number);
    }
    /**
     * Get zero-tolerance terms that require immediate blocking
     */
    getZeroToleranceTerms(context) {
        return Array.from(context.terms.values())
            .filter((term) => term.zeroTolerance || term.enforcementLevel === "blocking")
            .sort((a, b) => a.number - b.number);
    }
    /**
     * Validate action against codex
     *
     * Checks if an action complies with relevant codex terms.
     * Returns validation result with violations and recommendations.
     */
    validateAgainstCodex(context, action, actionDetails) {
        // Input validation
        if (!context || !context.terms) {
            throw new Error("Invalid codex context provided");
        }
        if (!action || action.trim() === "") {
            throw new Error("Invalid action provided");
        }
        const violations = [];
        const recommendations = [];
        if (actionDetails.includesAny) {
            const dangerousPatterns = ["any", "@ts-ignore", "@ts-expect-error"];
            if (dangerousPatterns.some((pattern) => action.includes(pattern))) {
                const term11 = context.terms.get(11);
                if (term11) {
                    violations.push({
                        term: term11,
                        reason: 'Type safety violation detected - using "any" or type suppression',
                        severity: term11.enforcementLevel || "high",
                    });
                }
            }
        }
        // Check for unresolved tasks in code
        const codeContent = typeof actionDetails.code === "string" ? actionDetails.code : "";
        if (codeContent.includes("TODO") ||
            codeContent.includes("FIXME") ||
            codeContent.includes("XXX") ||
            action.includes("TODO") ||
            action.includes("FIXME") ||
            action.includes("XXX")) {
            const term7 = context.terms.get(7);
            if (term7) {
                violations.push({
                    term: term7,
                    reason: "Unresolved tasks detected - violates Resolve All Errors principle",
                    severity: "blocking",
                });
            }
        }
        if (actionDetails.isOverEngineered) {
            const term3 = context.terms.get(3);
            if (term3) {
                violations.push({
                    term: term3,
                    reason: "Solution appears over-engineered - violates simplicity principle",
                    severity: term3.enforcementLevel || "medium",
                });
                recommendations.push("Simplify the solution by removing unnecessary abstractions");
            }
        }
        if (actionDetails.isInfiniteLoop ||
            action.includes("while(true)") ||
            action.includes("for(;;)")) {
            const term8 = context.terms.get(8);
            if (term8) {
                violations.push({
                    term: term8,
                    reason: "Infinite loop detected - violates termination principle",
                    severity: term8.enforcementLevel || "blocking",
                });
                recommendations.push("Add clear termination conditions to prevent infinite loops");
            }
        }
        return {
            compliant: violations.length === 0,
            violations,
            recommendations,
        };
    }
    /**
     * Clear cached context (useful for testing or forced reload)
     */
    clearCache() {
        this.cachedContext = null;
    }
    /**
     * Check if context is loaded and valid
     */
    isContextLoaded() {
        return this.cachedContext !== null;
    }
    /**
     * Get context statistics
     */
    getContextStats() {
        if (!this.cachedContext) {
            return {
                loaded: false,
                termCount: 0,
                categoryBreakdown: {},
                zeroToleranceCount: 0,
            };
        }
        const context = this.cachedContext;
        const terms = Array.from(context.terms.values());
        const categoryBreakdown = {};
        terms.forEach((term) => {
            categoryBreakdown[term.category] =
                (categoryBreakdown[term.category] || 0) + 1;
        });
        return {
            loaded: true,
            termCount: context.terms.size,
            categoryBreakdown,
            zeroToleranceCount: this.getZeroToleranceTerms(context).length,
        };
    }
}
/**
 * Export singleton instance
 */
export const strRayContextLoader = StringRayContextLoader.getInstance();
//# sourceMappingURL=context-loader.js.map