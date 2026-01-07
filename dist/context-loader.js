/**
 * StrRay Context Loader
 *
 * Loads Universal Development Codex v1.2.20 context for agent initialization.
 * Provides structured access to 30+ codex terms, interweaves, lenses, and anti-patterns.
 *
 * @version 1.0.0
 * @since 2026-01-06
 */
import * as fs from "fs";
import * as path from "path";
/**
 * StrRay Context Loader
 *
 * Loads and parses the Universal Development Codex v1.2.20 from agents_template.md
 */
export class StrRayContextLoader {
    static instance;
    cachedContext = null;
    codexFilePaths = [];
    constructor() {
        this.codexFilePaths = [".strray/agents_template.md", "AGENTS.md"];
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!StrRayContextLoader.instance) {
            StrRayContextLoader.instance = new StrRayContextLoader();
        }
        return StrRayContextLoader.instance;
    }
    /**
     * Load codex context
     *
     * Attempts to load the Universal Development Codex from multiple possible locations.
     * Returns cached context if available and not expired.
     */
    async loadCodexContext(projectRoot) {
        const warnings = [];
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
     * Parse codex content from markdown
     *
     * Extracts all 30+ codex terms, interweaves, lenses, and principles from markdown.
     */
    parseCodexContent(content, sourcePath) {
        const context = {
            version: "1.2.20",
            lastUpdated: new Date().toISOString(),
            terms: new Map(),
            interweaves: [],
            lenses: [],
            principles: [],
            antiPatterns: [],
            validationCriteria: {},
            frameworkAlignment: {},
            errorPreventionTarget: 0.996,
        };
        const lines = content.split("\n");
        let currentSection = null;
        let currentTerm = null;
        let termDescriptionLines = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("###") || line.startsWith("##")) {
                currentSection = line.replace(/#+\s*/, "").toLowerCase();
                const versionMatch = line.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    context.version = versionMatch[1];
                }
                const targetMatch = line.match(/Error Prevention Target:\s*([\d.]+)/);
                if (targetMatch) {
                    context.errorPreventionTarget = parseFloat(targetMatch[1]);
                }
                continue;
            }
            const termMatch = line.match(/^####\s*(\d+)\.\s*(.+)$/);
            if (termMatch) {
                if (currentTerm && currentTerm.number !== undefined) {
                    currentTerm.description = termDescriptionLines.join(" ").trim();
                    if (currentTerm.description) {
                        context.terms.set(currentTerm.number, currentTerm);
                    }
                }
                const termNum = parseInt(termMatch[1], 10);
                const termName = termMatch[2];
                currentTerm = {
                    number: termNum,
                    description: "",
                    category: this.inferTermCategory(termNum, termName),
                };
                if (line.includes("zero-tolerance") || line.includes("blocking")) {
                    currentTerm.violations = currentTerm.violations || [];
                    currentTerm.violations.push("zero-tolerance");
                }
                termDescriptionLines = [];
                termDescriptionLines = [];
                continue;
            }
            if (currentTerm && line && !line.startsWith("#") && !line.startsWith("```")) {
                termDescriptionLines.push(line);
            }
            if (line.toLowerCase().includes("lens")) {
                context.lenses.push(line);
            }
            if (line.toLowerCase().includes("principle") && !line.toLowerCase().includes("anti")) {
                context.principles.push(line);
            }
            if (line.toLowerCase().includes("anti-pattern")) {
                context.antiPatterns.push(line);
            }
            const checkboxMatch = line.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
            if (checkboxMatch) {
                context.validationCriteria[checkboxMatch[1].trim()] = false;
            }
        }
        // Add the last term if exists
        if (currentTerm && currentTerm.number !== undefined) {
            currentTerm.description = termDescriptionLines.join(" ").trim();
            if (currentTerm.description) {
                context.terms.set(currentTerm.number, currentTerm);
            }
        }
        return context;
        for (let i = 1; i <= 10; i++) {
            if (!context.terms.has(i)) {
                context.terms.set(i, {
                    number: i,
                    description: `Core Term ${i} - Not found in ${sourcePath}`,
                    category: "core",
                });
            }
        }
        context.frameworkAlignment = {
            "oh-my-opencode": "v2.12.0",
            "StrRay Framework": "v1.0.0",
            "Codex Version": context.version,
        };
        return context;
    }
    /**
     * Infer term category based on number and content
     */
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
                        severity: "high",
                    });
                }
            }
        }
        if (action.includes("TODO") || action.includes("FIXME") || action.includes("XXX")) {
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
                    severity: "medium",
                });
                recommendations.push("Simplify the solution by removing unnecessary abstractions");
            }
        }
        if (action.includes("while(true)") || action.includes("for(;;)")) {
            const term8 = context.terms.get(8);
            if (term8) {
                violations.push({
                    term: term8,
                    reason: "Potential infinite loop detected",
                    severity: "blocking",
                });
                recommendations.push("Add clear termination conditions to the loop");
            }
        }
        return {
            compliant: violations.filter((v) => v.severity === "blocking").length === 0,
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
        const terms = Array.from(this.cachedContext.terms.values());
        const categoryBreakdown = {};
        terms.forEach((term) => {
            categoryBreakdown[term.category] = (categoryBreakdown[term.category] || 0) + 1;
        });
        return {
            loaded: true,
            termCount: this.cachedContext.terms.size,
            categoryBreakdown,
            zeroToleranceCount: this.getZeroToleranceTerms(this.cachedContext).length,
        };
    }
}
/**
 * Export singleton instance
 */
export const strRayContextLoader = StrRayContextLoader.getInstance();
//# sourceMappingURL=context-loader.js.map